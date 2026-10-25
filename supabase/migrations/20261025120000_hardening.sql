-- Production hardening: atomic money/queue transitions, checkout serialization, and webhook
-- idempotency.
--
-- Every function here is service-role only. The browser still has select-only RLS on its own rows;
-- no money, job, or subscription mutation is callable with an authenticated JWT.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

-- A settlement is a distinct event from a refund. Without this marker, a second settle call with a
-- lower duration could refund again against the same reservation.
alter table public.projects
  add column if not exists credits_settled_at timestamptz;

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists last_event_at timestamptz,
  add column if not exists last_event_id text,
  add column if not exists checkout_attempt_id uuid,
  add column if not exists checkout_started_at timestamptz;

alter table public.webhook_events
  add column if not exists attempts integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists last_error text,
  add column if not exists next_attempt_at timestamptz;

create unique index if not exists subscriptions_checkout_attempt_uniq
  on public.subscriptions (checkout_attempt_id)
  where checkout_attempt_id is not null;

create index if not exists webhook_events_retry_idx
  on public.webhook_events (next_attempt_at)
  where processed_at is null;

-- The original caption default used the retired ice colour. Keep persisted styles readable against
-- the current UI and burned-in caption palette.
alter table public.clips
  alter column caption_style set default
    '{"preset":"beast_bold","font_size":24,"highlight_color":"#9BE7FF"}'::jsonb;

-- ---------------------------------------------------------------------------
-- reserve_credits
--
-- Idempotency is checked before the balance. A replay of the same reservation returns true only
-- while that reservation is still held. Once it has been refunded or settled, the caller must use a
-- new key; silently returning true would claim a hold that no longer exists.
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
  project_row public.projects%rowtype;
  existing public.credit_ledger%rowtype;
  current_balance integer;
  inserted integer;
begin
  if p_credits <= 0 then
    raise exception 'credits must be positive';
  end if;

  if p_idempotency_key is null or char_length(p_idempotency_key) = 0 then
    raise exception 'idempotency key is required';
  end if;

  select * into project_row
  from public.projects
  where id = p_project_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'project % does not belong to user %', p_project_id, p_user_id;
  end if;

  select * into existing
  from public.credit_ledger
  where idempotency_key = p_idempotency_key;

  if found then
    if existing.user_id <> p_user_id
       or existing.project_id is distinct from p_project_id
       or existing.delta <> -p_credits then
      raise exception 'idempotency key % belongs to a different reservation', p_idempotency_key;
    end if;

    if project_row.credit_reservation_key = p_idempotency_key
       and project_row.credits_reserved = p_credits then
      return true;
    end if;

    raise exception 'reservation % has already been settled or refunded', p_idempotency_key;
  end if;

  if project_row.credits_reserved > 0 then
    raise exception 'project % already has an active reservation', p_project_id;
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
    -- A concurrent transaction wrote the same key. It must be the same reservation; the project
    -- row lock above serializes normal callers, so this is a defensive check.
    raise exception 'reservation % was written concurrently', p_idempotency_key;
  end if;

  update public.credit_wallets
  set balance = balance - p_credits
  where user_id = p_user_id;

  update public.projects
  set credits_reserved = p_credits,
      credit_reservation_key = p_idempotency_key,
      credits_settled_at = null
  where id = p_project_id;

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

  -- A worker can retry after a lost response. Never refund twice for one reservation.
  if project_row.credits_settled_at is not null then
    return 0;
  end if;

  if p_actual_credits > project_row.credits_reserved then
    raise exception 'actual credits % exceed reserved %', p_actual_credits, project_row.credits_reserved;
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
  set credits_reserved = p_actual_credits,
      credits_settled_at = now()
  where id = p_project_id;

  return case when inserted = 1 then refund else 0 end;
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
  set credits_reserved = 0,
      credits_settled_at = null
  where id = p_project_id;

  return case when inserted = 1 then project_row.credits_reserved else 0 end;
end;
$$;

-- ---------------------------------------------------------------------------
-- Project creation and queueing
-- ---------------------------------------------------------------------------

create or replace function public.create_upload_project(
  p_user_id uuid,
  p_project_id uuid,
  p_title text,
  p_storage_path text,
  p_original_filename text,
  p_mime_type text,
  p_size_bytes bigint
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.projects (
    id, user_id, title, source_type, storage_path, original_filename, mime_type, size_bytes, status
  )
  values (
    p_project_id, p_user_id, left(coalesce(nullif(trim(p_title), ''), 'Untitled source'), 120),
    'upload', p_storage_path, left(p_original_filename, 255), p_mime_type, p_size_bytes, 'uploading'
  );

  return p_project_id;
end;
$$;

create or replace function public.create_link_project(
  p_user_id uuid,
  p_project_id uuid,
  p_title text,
  p_source_url text,
  p_credits integer,
  p_reservation_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  reserved boolean;
  job_id uuid;
begin
  insert into public.projects (
    id, user_id, title, source_type, source_url, status
  )
  values (
    p_project_id, p_user_id, left(coalesce(nullif(trim(p_title), ''), 'Linked source'), 120),
    'public_url', p_source_url, 'ready'
  );

  select public.reserve_credits(p_user_id, p_project_id, p_credits, p_reservation_key)
  into reserved;

  if not reserved then
    delete from public.projects where id = p_project_id;
    return jsonb_build_object('ok', false, 'code', 'insufficient_credits');
  end if;

  job_id := public.enqueue_job(
    p_project_id,
    'transcribe'::public.job_type,
    jsonb_build_object('source_url', p_source_url)
  );

  return jsonb_build_object('ok', true, 'jobId', job_id);
end;
$$;

create or replace function public.begin_upload_processing(
  p_user_id uuid,
  p_project_id uuid,
  p_credits integer,
  p_size_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row public.projects%rowtype;
  reserved boolean;
  job_id uuid;
begin
  select * into project_row
  from public.projects
  where id = p_project_id and user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if project_row.status <> 'uploading'
     or project_row.source_type <> 'upload'
     or project_row.storage_path is null then
    return jsonb_build_object('ok', false, 'code', 'not_ready');
  end if;

  select public.reserve_credits(p_user_id, p_project_id, p_credits, 'reserve:' || p_project_id::text)
  into reserved;

  if not reserved then
    return jsonb_build_object('ok', false, 'code', 'insufficient_credits');
  end if;

  update public.projects
  set status = 'ready',
      size_bytes = p_size_bytes,
      error_message = null
  where id = p_project_id;

  job_id := public.enqueue_job(
    p_project_id,
    'transcribe'::public.job_type,
    '{}'::jsonb
  );

  return jsonb_build_object('ok', true, 'jobId', job_id);
end;
$$;

create or replace function public.retry_project(
  p_user_id uuid,
  p_project_id uuid,
  p_credits integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row public.projects%rowtype;
  reserved boolean;
  job_id uuid;
  reservation_key text;
begin
  select * into project_row
  from public.projects
  where id = p_project_id and user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if project_row.status <> 'failed' then
    return jsonb_build_object('ok', false, 'code', 'not_ready');
  end if;

  if project_row.storage_path is null and project_row.source_url is null then
    return jsonb_build_object('ok', false, 'code', 'no_source');
  end if;

  -- Release any hold left by a crash before taking the retry reservation. The row lock serializes
  -- concurrent retry requests; the second one sees status ready and stops.
  perform public.refund_project_credits(p_project_id);

  reservation_key := 'reserve:' || p_project_id::text || ':retry:' || gen_random_uuid()::text;

  select public.reserve_credits(p_user_id, p_project_id, p_credits, reservation_key)
  into reserved;

  if not reserved then
    return jsonb_build_object('ok', false, 'code', 'insufficient_credits');
  end if;

  delete from public.clips
  where project_id = p_project_id and user_id = p_user_id;

  update public.projects
  set status = 'ready',
      error_message = null
  where id = p_project_id;

  job_id := public.enqueue_job(
    p_project_id,
    'transcribe'::public.job_type,
    '{}'::jsonb
  );

  return jsonb_build_object('ok', true, 'jobId', job_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Worker lease and ownership checks
-- ---------------------------------------------------------------------------

drop function if exists public.fail_job(uuid, text);

create or replace function public.heartbeat_job(
  p_job_id uuid,
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.processing_jobs
  set lease_expires_at = now() + make_interval(secs => greatest(p_lease_seconds, 30))
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'in_progress';

  return found;
end;
$$;

create or replace function public.update_job_progress(
  p_job_id uuid,
  p_worker_id text,
  p_percent integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.processing_jobs
  set progress_percent = greatest(0, least(100, p_percent))
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'in_progress';

  return found;
end;
$$;

create or replace function public.complete_job(
  p_job_id uuid,
  p_worker_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.processing_jobs
  set status = 'completed',
      progress_percent = 100,
      error_message = null,
      locked_by = null,
      locked_at = null,
      lease_expires_at = null
  where id = p_job_id
    and locked_by = p_worker_id
    and status = 'in_progress';

  return found;
end;
$$;

create or replace function public.finish_render_job(
  p_job_id uuid,
  p_worker_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.processing_jobs%rowtype;
begin
  select * into job
  from public.processing_jobs
  where id = p_job_id
  for update;

  if not found
     or job.locked_by is distinct from p_worker_id
     or job.status <> 'in_progress' then
    return false;
  end if;

  update public.processing_jobs
  set status = 'completed',
      progress_percent = 100,
      error_message = null,
      locked_by = null,
      locked_at = null,
      lease_expires_at = null
  where id = p_job_id;

  update public.projects
  set status = 'completed',
      error_message = null
  where id = job.project_id
    and status = 'processing';

  return true;
end;
$$;

create or replace function public.fail_job(
  p_job_id uuid,
  p_worker_id text,
  p_error text,
  p_permanent boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.processing_jobs%rowtype;
  terminal boolean;
begin
  select * into job
  from public.processing_jobs
  where id = p_job_id
  for update;

  if not found
     or job.locked_by is distinct from p_worker_id
     or job.status <> 'in_progress' then
    return false;
  end if;

  terminal := p_permanent or job.attempts >= job.max_attempts;

  if terminal then
    update public.processing_jobs
    set status = 'failed',
        error_message = left(p_error, 2000),
        locked_by = null,
        locked_at = null,
        lease_expires_at = null
    where id = p_job_id;

    update public.clips
    set render_status = 'failed'
    where project_id = job.project_id
      and render_status in ('queued', 'rendering');

    perform public.refund_project_credits(job.project_id);

    update public.projects
    set status = 'failed',
        error_message = left(p_error, 2000)
    where id = job.project_id;
  else
    update public.processing_jobs
    set status = 'queued',
        error_message = left(p_error, 2000),
        available_at = now() + make_interval(secs => least(300, 30 * job.attempts)),
        locked_by = null,
        locked_at = null,
        lease_expires_at = null,
        progress_percent = 0
    where id = p_job_id;
  end if;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Checkout serialization
-- ---------------------------------------------------------------------------

create or replace function public.begin_checkout(
  p_user_id uuid,
  p_cooldown_seconds integer default 600
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions%rowtype;
  new_attempt uuid := gen_random_uuid();
  cooldown integer := greatest(60, least(coalesce(p_cooldown_seconds, 600), 3600));
  orphan text := null;
begin
  select * into sub
  from public.subscriptions
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.subscriptions (
      user_id, provider, plan, status, checkout_attempt_id, checkout_started_at
    )
    values (p_user_id, 'razorpay', 'starter', 'pending', new_attempt, now());

    return jsonb_build_object('action', 'create', 'attemptId', new_attempt);
  end if;

  if sub.status in ('active', 'past_due', 'paused') then
    return jsonb_build_object(
      'action', 'manage',
      'status', sub.status,
      'cancelAtPeriodEnd', sub.cancel_at_period_end,
      'periodEnd', sub.current_period_end
    );
  end if;

  if sub.status = 'pending'
     and sub.provider_subscription_id is not null
     and sub.checkout_attempt_id is not null
     and sub.checkout_started_at is not null
     and sub.checkout_started_at > now() - make_interval(secs => cooldown) then
    return jsonb_build_object(
      'action', 'reuse',
      'attemptId', sub.checkout_attempt_id,
      'subscriptionId', sub.provider_subscription_id
    );
  end if;

  -- A stale pending checkout is superseded. Keep its remote id in the response so the route can
  -- cancel it; it was never paid, and leaving it alive would allow a later charge on an orphan.
  if sub.status = 'pending' then
    orphan := sub.provider_subscription_id;
  end if;

  update public.subscriptions
  set provider = 'razorpay',
      provider_customer_id = null,
      provider_subscription_id = null,
      plan = 'starter',
      status = 'pending',
      current_period_end = null,
      cancel_at_period_end = false,
      last_event_at = null,
      last_event_id = null,
      checkout_attempt_id = new_attempt,
      checkout_started_at = now()
  where user_id = p_user_id;

  return jsonb_build_object(
    'action', 'create',
    'attemptId', new_attempt,
    'orphanSubscriptionId', orphan
  );
end;
$$;

create or replace function public.attach_checkout_subscription(
  p_user_id uuid,
  p_attempt_id uuid,
  p_subscription_id text,
  p_customer_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscriptions
  set provider_subscription_id = p_subscription_id,
      provider_customer_id = p_customer_id
  where user_id = p_user_id
    and checkout_attempt_id = p_attempt_id
    and status = 'pending'
    and (provider_subscription_id is null or provider_subscription_id = p_subscription_id);

  return found;
end;
$$;

create or replace function public.release_checkout_attempt(
  p_user_id uuid,
  p_attempt_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscriptions
  set checkout_attempt_id = null,
      checkout_started_at = null,
      status = 'canceled',
      cancel_at_period_end = false
  where user_id = p_user_id
    and checkout_attempt_id = p_attempt_id
    and provider_subscription_id is null
    and status = 'pending';

  return found;
end;
$$;

create or replace function public.mark_subscription_cancellation(
  p_user_id uuid,
  p_provider_subscription_id text,
  p_at_cycle_end boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions%rowtype;
begin
  select * into sub
  from public.subscriptions
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('updated', false, 'reason', 'not_found');
  end if;

  if sub.status in ('canceled', 'completed') then
    return jsonb_build_object('updated', false, 'reason', 'terminal', 'status', sub.status);
  end if;

  if p_provider_subscription_id is not null
     and sub.provider_subscription_id is distinct from p_provider_subscription_id then
    return jsonb_build_object('updated', false, 'reason', 'mismatch');
  end if;

  if sub.status = 'pending' and sub.provider_subscription_id is null then
    update public.subscriptions
    set status = 'canceled',
        cancel_at_period_end = false,
        checkout_attempt_id = null,
        checkout_started_at = null
    where user_id = p_user_id;

    update public.profiles set plan = 'free' where id = p_user_id;

    return jsonb_build_object(
      'updated', true,
      'status', 'canceled',
      'cancelAtPeriodEnd', false,
      'periodEnd', null
    );
  end if;

  -- An unpaid pending checkout has no paid period to finish. Ending it immediately is the only
  -- honest outcome, even if the caller asked for a cycle-end cancellation.
  if p_at_cycle_end and sub.status <> 'pending' then
    update public.subscriptions
    set cancel_at_period_end = true
    where user_id = p_user_id;

    return jsonb_build_object(
      'updated', true,
      'status', sub.status,
      'cancelAtPeriodEnd', true,
      'periodEnd', sub.current_period_end
    );
  end if;

  update public.subscriptions
  set status = 'canceled',
      cancel_at_period_end = false,
      checkout_attempt_id = null,
      checkout_started_at = null
  where user_id = p_user_id;

  update public.profiles set plan = 'free' where id = p_user_id;

  return jsonb_build_object(
    'updated', true,
    'status', 'canceled',
    'cancelAtPeriodEnd', false,
    'periodEnd', null
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Ordered subscription events
-- ---------------------------------------------------------------------------

create or replace function public.apply_subscription_event(
  p_user_id uuid,
  p_provider_subscription_id text,
  p_customer_id text,
  p_status text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_event_at timestamptz,
  p_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions%rowtype;
  next_status public.subscription_status;
  next_plan public.plan_tier;
  event_time timestamptz := coalesce(p_event_at, now());
begin
  if p_status not in ('active', 'past_due', 'canceled', 'pending', 'paused', 'completed') then
    raise exception 'invalid subscription status %', p_status;
  end if;

  next_status := p_status::public.subscription_status;

  select * into sub
  from public.subscriptions
  where user_id = p_user_id
    and provider_subscription_id = p_provider_subscription_id
  for update;

  if not found then
    return jsonb_build_object('applied', false, 'reason', 'not_found');
  end if;

  if sub.last_event_at is not null and event_time < sub.last_event_at then
    return jsonb_build_object('applied', false, 'reason', 'stale', 'status', sub.status);
  end if;

  if sub.status in ('canceled', 'completed')
     and next_status not in ('canceled', 'completed') then
    return jsonb_build_object('applied', false, 'reason', 'terminal', 'status', sub.status);
  end if;

  if sub.status = 'completed' and next_status = 'canceled' then
    next_status := 'completed';
  end if;

  -- A local cancellation request must survive a later `subscription.updated` event that still says
  -- active. Only a terminal event clears the scheduled-cancellation flag.
  if sub.cancel_at_period_end
     and next_status in ('active', 'past_due', 'paused', 'pending')
     and not coalesce(p_cancel_at_period_end, false) then
    update public.subscriptions
    set provider_customer_id = coalesce(p_customer_id, provider_customer_id),
        current_period_end = coalesce(p_current_period_end, current_period_end),
        last_event_at = event_time,
        last_event_id = p_event_id
    where user_id = p_user_id;

    return jsonb_build_object(
      'applied', true,
      'status', sub.status,
      'cancelAtPeriodEnd', true,
      'plan', null
    );
  end if;

  update public.subscriptions
  set provider_customer_id = coalesce(p_customer_id, provider_customer_id),
      status = next_status,
      current_period_end = coalesce(p_current_period_end, current_period_end),
      cancel_at_period_end = case
        when next_status in ('canceled', 'completed') then false
        when coalesce(p_cancel_at_period_end, false) then true
        else cancel_at_period_end
      end,
      last_event_at = event_time,
      last_event_id = p_event_id
  where user_id = p_user_id;

  next_plan := case
    when next_status = 'active' then 'starter'::public.plan_tier
    when next_status in ('canceled', 'completed') then 'free'::public.plan_tier
    else null
  end;

  if next_plan is not null then
    update public.profiles set plan = next_plan where id = p_user_id;
  end if;

  return jsonb_build_object(
    'applied', true,
    'status', next_status,
    'cancelAtPeriodEnd', case when next_status in ('canceled', 'completed') then false else sub.cancel_at_period_end end,
    'plan', next_plan
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Webhook event claim / complete / fail
-- ---------------------------------------------------------------------------

create or replace function public.claim_webhook_event(
  p_provider text,
  p_event_id text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.webhook_events%rowtype;
  inserted integer;
  retry_after integer;
begin
  if p_event_id is null or char_length(p_event_id) = 0 or char_length(p_event_id) > 200 then
    raise exception 'webhook event id must be between 1 and 200 characters';
  end if;

  insert into public.webhook_events (
    provider, event_id, payload, attempts, last_attempt_at
  )
  values (p_provider, p_event_id, coalesce(p_payload, '{}'::jsonb), 1, now())
  on conflict (provider, event_id) do nothing;

  get diagnostics inserted = row_count;
  if inserted = 1 then
    return jsonb_build_object('claimed', true, 'processed', false, 'attempts', 1);
  end if;

  select * into event_row
  from public.webhook_events
  where provider = p_provider and event_id = p_event_id
  for update;

  if event_row.processed_at is not null then
    return jsonb_build_object('claimed', false, 'processed', true);
  end if;

  if event_row.next_attempt_at is not null and event_row.next_attempt_at > now() then
    retry_after := greatest(1, ceil(extract(epoch from (event_row.next_attempt_at - now())))::integer);
    return jsonb_build_object(
      'claimed', false,
      'processed', false,
      'inProgress', true,
      'retryAfterSeconds', retry_after
    );
  end if;

  if event_row.last_attempt_at is not null
     and event_row.last_attempt_at > now() - interval '2 minutes' then
    return jsonb_build_object(
      'claimed', false,
      'processed', false,
      'inProgress', true,
      'retryAfterSeconds', 120
    );
  end if;

  update public.webhook_events
  set attempts = attempts + 1,
      last_attempt_at = now(),
      last_error = null,
      next_attempt_at = null,
      payload = coalesce(p_payload, payload)
  where provider = p_provider and event_id = p_event_id;

  return jsonb_build_object(
    'claimed', true,
    'processed', false,
    'attempts', event_row.attempts + 1
  );
end;
$$;

create or replace function public.complete_webhook_event(
  p_provider text,
  p_event_id text,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.webhook_events
  set processed_at = now(),
      payload = coalesce(p_payload, payload),
      last_error = null,
      next_attempt_at = null
  where provider = p_provider and event_id = p_event_id;

  return found;
end;
$$;

create or replace function public.fail_webhook_event(
  p_provider text,
  p_event_id text,
  p_error text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.webhook_events
  set last_error = left(p_error, 2000),
      next_attempt_at = now() + interval '60 seconds'
  where provider = p_provider and event_id = p_event_id;

  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

revoke all on function public.reserve_credits(uuid, uuid, integer, text)
  from public, anon, authenticated;
revoke all on function public.settle_project_credits(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.refund_project_credits(uuid)
  from public, anon, authenticated;
revoke all on function public.create_upload_project(uuid, uuid, text, text, text, text, bigint)
  from public, anon, authenticated;
revoke all on function public.create_link_project(uuid, uuid, text, text, integer, text)
  from public, anon, authenticated;
revoke all on function public.begin_upload_processing(uuid, uuid, integer, bigint)
  from public, anon, authenticated;
revoke all on function public.retry_project(uuid, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.heartbeat_job(uuid, text, integer)
  from public, anon, authenticated;
revoke all on function public.update_job_progress(uuid, text, integer)
  from public, anon, authenticated;
revoke all on function public.complete_job(uuid, text)
  from public, anon, authenticated;
revoke all on function public.finish_render_job(uuid, text)
  from public, anon, authenticated;
revoke all on function public.fail_job(uuid, text, text, boolean)
  from public, anon, authenticated;
revoke all on function public.begin_checkout(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.attach_checkout_subscription(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.release_checkout_attempt(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.mark_subscription_cancellation(uuid, text, boolean)
  from public, anon, authenticated;
revoke all on function public.apply_subscription_event(uuid, text, text, text, timestamptz, boolean, timestamptz, text)
  from public, anon, authenticated;
revoke all on function public.claim_webhook_event(text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.complete_webhook_event(text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.fail_webhook_event(text, text, text)
  from public, anon, authenticated;

grant execute on function public.reserve_credits(uuid, uuid, integer, text) to service_role;
grant execute on function public.settle_project_credits(uuid, integer) to service_role;
grant execute on function public.refund_project_credits(uuid) to service_role;
grant execute on function public.create_upload_project(uuid, uuid, text, text, text, text, bigint) to service_role;
grant execute on function public.create_link_project(uuid, uuid, text, text, integer, text) to service_role;
grant execute on function public.begin_upload_processing(uuid, uuid, integer, bigint) to service_role;
grant execute on function public.retry_project(uuid, uuid, integer) to service_role;
grant execute on function public.heartbeat_job(uuid, text, integer) to service_role;
grant execute on function public.update_job_progress(uuid, text, integer) to service_role;
grant execute on function public.complete_job(uuid, text) to service_role;
grant execute on function public.finish_render_job(uuid, text) to service_role;
grant execute on function public.fail_job(uuid, text, text, boolean) to service_role;
grant execute on function public.begin_checkout(uuid, integer) to service_role;
grant execute on function public.attach_checkout_subscription(uuid, uuid, text, text) to service_role;
grant execute on function public.release_checkout_attempt(uuid, uuid) to service_role;
grant execute on function public.mark_subscription_cancellation(uuid, text, boolean) to service_role;
grant execute on function public.apply_subscription_event(uuid, text, text, text, timestamptz, boolean, timestamptz, text) to service_role;
grant execute on function public.claim_webhook_event(text, text, jsonb) to service_role;
grant execute on function public.complete_webhook_event(text, text, jsonb) to service_role;
grant execute on function public.fail_webhook_event(text, text, text) to service_role;
