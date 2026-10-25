-- Per-reservation credit idempotency.
--
-- The first schema keyed settlements and refunds by project id alone. That is correct for a
-- single attempt, but a retried project creates a second reservation and would silently skip the
-- second refund/settlement because the ledger key already existed. Store the reservation key on
-- the project and derive settle/refund keys from it.

alter table public.projects
  add column if not exists credit_reservation_key text;

-- ---------------------------------------------------------------------------
-- reserve_credits
-- ---------------------------------------------------------------------------

create or replace function public.reserve_credits(
  p_user_id uuid,
  p_project_id uuid,
  p_credits integer,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
  inserted integer;
begin
  if p_credits <= 0 then
    raise exception 'credits must be positive';
  end if;

  select balance into current_balance
  from public.credit_wallets
  where user_id = p_user_id
  for update;

  if current_balance is null then
    raise exception 'credit wallet missing for user %', p_user_id;
  end if;

  if current_balance < p_credits then
    return false;
  end if;

  insert into public.credit_ledger (
    user_id, delta, reason, project_id, idempotency_key, metadata
  )
  values (
    p_user_id, -p_credits, 'debit_project', p_project_id, p_idempotency_key,
    jsonb_build_object('stage', 'reserve')
  )
  on conflict (idempotency_key) do nothing;

  get diagnostics inserted = row_count;
  if inserted = 0 then
    return true;
  end if;

  update public.credit_wallets
  set balance = balance - p_credits
  where user_id = p_user_id;

  -- A project can hold at most one active reservation. A retry is allowed only after the previous
  -- reservation was refunded (credits_reserved = 0). Raising here rolls back the ledger and wallet.
  update public.projects
  set credits_reserved = credits_reserved + p_credits,
      credit_reservation_key = p_idempotency_key
  where id = p_project_id
    and user_id = p_user_id
    and (credits_reserved = 0 or credit_reservation_key = p_idempotency_key);

  if not found then
    raise exception 'project % already has an active reservation', p_project_id;
  end if;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- settle_project_credits
-- ---------------------------------------------------------------------------

create or replace function public.settle_project_credits(
  p_project_id uuid,
  p_actual_credits integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row public.projects%rowtype;
  refund integer;
  inserted integer;
  settle_key text;
begin
  if p_actual_credits < 0 then
    raise exception 'actual credits cannot be negative';
  end if;

  select * into project_row
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project % not found', p_project_id;
  end if;

  if p_actual_credits > project_row.credits_reserved then
    raise exception 'actual credits % exceed reserved %', p_actual_credits, project_row.credits_reserved;
  end if;

  -- The worker can retry after a lost response. Settling an already-settled reservation is a no-op.
  if p_actual_credits = project_row.credits_reserved then
    return 0;
  end if;

  settle_key := 'settle:' || coalesce(project_row.credit_reservation_key, p_project_id::text);
  refund := project_row.credits_reserved - p_actual_credits;
  inserted := 0;

  if refund > 0 then
    insert into public.credit_ledger (
      user_id, delta, reason, project_id, idempotency_key, metadata
    )
    values (
      project_row.user_id, refund, 'refund_project', p_project_id,
      settle_key,
      jsonb_build_object('stage', 'settle', 'actual_credits', p_actual_credits)
    )
    on conflict (idempotency_key) do nothing;

    get diagnostics inserted = row_count;
    if inserted = 1 then
      update public.credit_wallets
      set balance = balance + refund
      where user_id = project_row.user_id;
    end if;
  end if;

  update public.projects
  set credits_reserved = p_actual_credits
  where id = p_project_id;

  if refund > 0 and inserted = 1 then
    return refund;
  end if;
  return 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- refund_project_credits
-- ---------------------------------------------------------------------------

create or replace function public.refund_project_credits(p_project_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row public.projects%rowtype;
  inserted integer;
  ledger_key text;
begin
  select * into project_row
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'project % not found', p_project_id;
  end if;

  if project_row.credits_reserved <= 0 then
    return 0;
  end if;

  ledger_key := 'refund:' || coalesce(project_row.credit_reservation_key, p_project_id::text);

  insert into public.credit_ledger (
    user_id, delta, reason, project_id, idempotency_key, metadata
  )
  values (
    project_row.user_id, project_row.credits_reserved, 'refund_project', p_project_id,
    ledger_key,
    jsonb_build_object('stage', 'refund')
  )
  on conflict (idempotency_key) do nothing;

  get diagnostics inserted = row_count;
  if inserted = 1 then
    update public.credit_wallets
    set balance = balance + project_row.credits_reserved
    where user_id = project_row.user_id;
  end if;

  update public.projects
  set credits_reserved = 0
  where id = p_project_id;

  return case when inserted = 1 then project_row.credits_reserved else 0 end;
end;
$$;

revoke all on function public.reserve_credits(uuid, uuid, integer, text) from public, anon, authenticated;
revoke all on function public.settle_project_credits(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_project_credits(uuid) from public, anon, authenticated;

grant execute on function public.reserve_credits(uuid, uuid, integer, text) to service_role;
grant execute on function public.settle_project_credits(uuid, integer) to service_role;
grant execute on function public.refund_project_credits(uuid) to service_role;
