-- ClipMax initial schema.
--
-- Design notes:
--   * Every user-owned table is protected by RLS. The browser reads its own rows; writes that
--     affect money or job state go through the Next.js service-role API routes.
--   * Credits are an append-only ledger plus a cached wallet balance. Both change in the same
--     transaction, and the ledger has a unique idempotency key so a webhook replay cannot double-grant.
--   * Jobs are claimed with FOR UPDATE SKIP LOCKED. No Redis, no separate queue process.
--   * Video bytes never enter Postgres. Only R2 object keys are stored.

create extension if not exists pgcrypto;

create type public.project_source_type as enum ('upload', 'public_url');
create type public.project_status as enum ('uploading', 'ready', 'processing', 'completed', 'failed');
create type public.job_type as enum ('transcribe', 'detect_highlights', 'render_clip');
create type public.job_status as enum ('queued', 'in_progress', 'completed', 'failed');
create type public.clip_render_status as enum ('draft', 'queued', 'rendering', 'rendered', 'failed');
create type public.plan_tier as enum ('free', 'starter', 'pro');
create type public.subscription_status as enum ('active', 'past_due', 'canceled');
create type public.credit_reason as enum (
  'grant_signup',
  'grant_monthly',
  'grant_purchase',
  'debit_project',
  'refund_project',
  'admin_adjustment'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  plan public.plan_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled source',
  source_type public.project_source_type not null,
  source_url text,
  storage_path text,
  original_filename text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes > 0),
  duration_seconds numeric(10, 3) check (duration_seconds is null or duration_seconds >= 0),
  status public.project_status not null default 'uploading',
  credits_reserved integer not null default 0 check (credits_reserved >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_source_check check (
    (source_type = 'upload' and storage_path is not null)
    or (source_type = 'public_url' and source_url is not null)
  )
);

create table public.credit_wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason public.credit_reason not null,
  project_id uuid references public.projects (id) on delete set null,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_type public.job_type not null,
  status public.job_status not null default 'queued',
  priority integer not null default 100,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts >= 1),
  locked_by text,
  locked_at timestamptz,
  lease_expires_at timestamptz,
  available_at timestamptz not null default now(),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transcripts (
  project_id uuid primary key references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  language text,
  text text not null,
  segments jsonb not null default '[]'::jsonb,
  words jsonb not null default '[]'::jsonb,
  provider text,
  created_at timestamptz not null default now()
);

create table public.clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  hook_text text,
  start_time numeric(10, 3) not null check (start_time >= 0),
  end_time numeric(10, 3) not null check (end_time > start_time),
  virality_score integer check (virality_score is null or virality_score between 0 and 100),
  reasoning text,
  render_status public.clip_render_status not null default 'draft',
  render_version integer not null default 0 check (render_version >= 0),
  caption_style jsonb not null default '{"preset":"beast_bold","font_size":24,"highlight_color":"#89CFF0"}'::jsonb,
  storage_path text,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text,
  plan public.plan_tier not null default 'starter',
  status public.subscription_status not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index projects_user_created_idx on public.projects (user_id, created_at desc);
create index projects_status_idx on public.projects (status);
create index processing_jobs_claim_idx on public.processing_jobs (status, available_at, priority, created_at);
create index processing_jobs_project_idx on public.processing_jobs (project_id);
create unique index processing_jobs_one_active_idx
  on public.processing_jobs (project_id, job_type)
  where status in ('queued', 'in_progress');
create index clips_project_created_idx on public.clips (project_id, created_at);
create index credit_ledger_user_created_idx on public.credit_ledger (user_id, created_at desc);
create index transcripts_user_idx on public.transcripts (user_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger credit_wallets_set_updated_at before update on public.credit_wallets
for each row execute function public.set_updated_at();
create trigger processing_jobs_set_updated_at before update on public.processing_jobs
for each row execute function public.set_updated_at();
create trigger clips_set_updated_at before update on public.clips
for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile + wallet + 30 free credits
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.credit_wallets (user_id, balance)
  values (new.id, 30)
  on conflict (user_id) do nothing;

  insert into public.credit_ledger (user_id, delta, reason, idempotency_key, metadata)
  values (
    new.id,
    30,
    'grant_signup',
    'signup:' || new.id::text,
    jsonb_build_object('source', 'signup')
  )
  on conflict (idempotency_key) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Credits
-- ---------------------------------------------------------------------------

create or replace function public.grant_credits(
  p_user_id uuid,
  p_credits integer,
  p_reason public.credit_reason,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer;
begin
  if p_credits <= 0 then
    raise exception 'credits must be positive';
  end if;

  insert into public.credit_ledger (user_id, delta, reason, idempotency_key, metadata)
  values (p_user_id, p_credits, p_reason, p_idempotency_key, p_metadata)
  on conflict (idempotency_key) do nothing;

  get diagnostics inserted = row_count;
  if inserted = 0 then
    return false;
  end if;

  update public.credit_wallets
  set balance = balance + p_credits
  where user_id = p_user_id;

  if not found then
    raise exception 'credit wallet missing for user %', p_user_id;
  end if;

  return true;
end;
$$;

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

  update public.projects
  set credits_reserved = credits_reserved + p_credits
  where id = p_project_id and user_id = p_user_id;

  if not found then
    raise exception 'project % does not belong to user %', p_project_id, p_user_id;
  end if;

  return true;
end;
$$;

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

  -- The worker can retry after a lost response. Settling an already-settled project is a no-op.
  if p_actual_credits = project_row.credits_reserved then
    return 0;
  end if;

  inserted := 0;
  refund := project_row.credits_reserved - p_actual_credits;

  if refund > 0 then
    insert into public.credit_ledger (
      user_id, delta, reason, project_id, idempotency_key, metadata
    )
    values (
      project_row.user_id, refund, 'refund_project', p_project_id,
      'settle:' || p_project_id::text,
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

create or replace function public.refund_project_credits(p_project_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row public.projects%rowtype;
  inserted integer;
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

  insert into public.credit_ledger (
    user_id, delta, reason, project_id, idempotency_key, metadata
  )
  values (
    project_row.user_id, project_row.credits_reserved, 'refund_project', p_project_id,
    'refund:' || p_project_id::text,
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

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------

create or replace function public.enqueue_job(
  p_project_id uuid,
  p_job_type public.job_type,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  project_row public.projects%rowtype;
  job_id uuid;
begin
  select * into project_row from public.projects where id = p_project_id;
  if not found then
    raise exception 'project % not found', p_project_id;
  end if;

  insert into public.processing_jobs (project_id, user_id, job_type, payload)
  values (p_project_id, project_row.user_id, p_job_type, p_payload)
  on conflict (project_id, job_type) where status in ('queued', 'in_progress') do update
    set payload = excluded.payload,
        status = 'queued',
        available_at = now(),
        locked_by = null,
        locked_at = null,
        lease_expires_at = null,
        error_message = null,
        progress_percent = 0,
        updated_at = now()
  returning id into job_id;

  if job_id is null then
    select id into job_id
    from public.processing_jobs
    where project_id = p_project_id
      and job_type = p_job_type
      and status in ('queued', 'in_progress')
    order by created_at desc
    limit 1;
  end if;

  return job_id;
end;
$$;

create or replace function public.claim_next_job(
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns setof public.processing_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.processing_jobs;
begin
  update public.processing_jobs
  set status = 'queued',
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      available_at = now()
  where status = 'in_progress'
    and lease_expires_at is not null
    and lease_expires_at < now();

  select * into job
  from public.processing_jobs
  where status = 'queued'
    and available_at <= now()
  order by priority asc, created_at asc
  for update skip locked
  limit 1;

  if job.id is null then
    return;
  end if;

  update public.processing_jobs
  set status = 'in_progress',
      locked_by = p_worker_id,
      locked_at = now(),
      lease_expires_at = now() + make_interval(secs => greatest(p_lease_seconds, 30)),
      attempts = attempts + 1
  where id = job.id
  returning * into job;

  return next job;
end;
$$;

create or replace function public.fail_job(
  p_job_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.processing_jobs;
begin
  select * into job from public.processing_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % not found', p_job_id;
  end if;

  update public.processing_jobs
  set status = case when attempts >= max_attempts then 'failed'::public.job_status else 'queued'::public.job_status end,
      error_message = left(p_error, 2000),
      available_at = case when attempts >= max_attempts then available_at else now() + make_interval(secs => least(300, 30 * attempts)) end,
      locked_by = null,
      locked_at = null,
      lease_expires_at = null,
      progress_percent = case when attempts >= max_attempts then progress_percent else 0 end
  where id = p_job_id;

  if job.attempts >= job.max_attempts then
    perform public.refund_project_credits(job.project_id);
    update public.projects
    set status = 'failed', error_message = left(p_error, 2000)
    where id = job.project_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.transcripts enable row level security;
alter table public.clips enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using (id = auth.uid());

create policy projects_select_own on public.projects
for select to authenticated using (user_id = auth.uid());

create policy credit_wallets_select_own on public.credit_wallets
for select to authenticated using (user_id = auth.uid());

create policy credit_ledger_select_own on public.credit_ledger
for select to authenticated using (user_id = auth.uid());

create policy processing_jobs_select_own on public.processing_jobs
for select to authenticated using (user_id = auth.uid());

create policy transcripts_select_own on public.transcripts
for select to authenticated using (user_id = auth.uid());

create policy clips_select_own on public.clips
for select to authenticated using (user_id = auth.uid());

create policy subscriptions_select_own on public.subscriptions
for select to authenticated using (user_id = auth.uid());

-- No anon access. No client writes to money or job state.
revoke all on public.webhook_events from anon, authenticated;

grant select on public.profiles, public.projects, public.credit_wallets, public.credit_ledger,
  public.processing_jobs, public.transcripts, public.clips, public.subscriptions
to authenticated;

-- ---------------------------------------------------------------------------
-- Function permissions: service role only for money and queue mutation
-- ---------------------------------------------------------------------------

revoke all on function public.grant_credits(uuid, integer, public.credit_reason, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.reserve_credits(uuid, uuid, integer, text)
  from public, anon, authenticated;
revoke all on function public.settle_project_credits(uuid, integer)
  from public, anon, authenticated;
revoke all on function public.refund_project_credits(uuid)
  from public, anon, authenticated;
revoke all on function public.enqueue_job(uuid, public.job_type, jsonb)
  from public, anon, authenticated;
revoke all on function public.claim_next_job(text, integer)
  from public, anon, authenticated;
revoke all on function public.fail_job(uuid, text)
  from public, anon, authenticated;

grant execute on function public.grant_credits(uuid, integer, public.credit_reason, text, jsonb)
  to service_role;
grant execute on function public.reserve_credits(uuid, uuid, integer, text)
  to service_role;
grant execute on function public.settle_project_credits(uuid, integer)
  to service_role;
grant execute on function public.refund_project_credits(uuid)
  to service_role;
grant execute on function public.enqueue_job(uuid, public.job_type, jsonb)
  to service_role;
grant execute on function public.claim_next_job(text, integer)
  to service_role;
grant execute on function public.fail_job(uuid, text)
  to service_role;

grant all on public.profiles, public.projects, public.credit_wallets, public.credit_ledger,
  public.processing_jobs, public.transcripts, public.clips, public.subscriptions, public.webhook_events
  to service_role;
