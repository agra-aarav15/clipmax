-- ---------------------------------------------------------------------------
-- Backend hardening (26 October 2026)
--
-- Fixes found by the read-only audit:
--   1. An expired worker lease was requeued forever, ignoring max_attempts.
--   2. A terminal job failure refunded the project but left already-rendered clips downloadable.
--   3. A stale pending checkout could cancel a subscription the customer had already paid for.
--   4. A failed orphan cancellation lost the remote subscription id, allowing a second charge.
--   5. Concurrent first checkouts could hit the subscriptions primary key and return a 500.
--
-- The worker and checkout route are updated in the same commit. Apply this migration before
-- deploying the matching application code.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Worker lease reaper
--
-- A process killed by OOM/SIGKILL/host loss never calls fail_job. The old claim_next_job requeued
-- every expired lease, so a job that crashed the worker was retried forever. Expired leases are now
-- split: jobs with attempts left are requeued; jobs that used their final attempt are failed,
-- their clips are made un-downloadable, and the project is refunded exactly once.
-- ---------------------------------------------------------------------------

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
  expired public.processing_jobs%rowtype;
  reaper_message text := 'The worker stopped responding after the final attempt.';
begin
  for expired in
    select *
    from public.processing_jobs
    where status = 'in_progress'
      and lease_expires_at is not null
      and lease_expires_at < now()
    order by created_at asc
    for update skip locked
  loop
    if expired.attempts >= expired.max_attempts then
      update public.processing_jobs
      set status = 'failed',
          error_message = reaper_message,
          locked_by = null,
          locked_at = null,
          lease_expires_at = null
      where id = expired.id;

      -- Stop any sibling job for the same project. A failed project must not keep rendering.
      update public.processing_jobs
      set status = 'failed',
          error_message = 'Another job for this project failed; the project was stopped.',
          locked_by = null,
          locked_at = null,
          lease_expires_at = null
      where project_id = expired.project_id
        and id <> expired.id
        and status in ('queued', 'in_progress');

      -- Only fail and refund a project that is still active. A completed project keeps its clips
      -- and its settled charge even if a stale job row expires later.
      update public.projects
      set status = 'failed',
          error_message = reaper_message
      where id = expired.project_id
        and status in ('uploading', 'ready', 'processing');

      if found then
        -- The whole project is refunded, so no rendered clip may remain downloadable.
        update public.clips
        set render_status = 'failed',
            storage_path = null,
            thumbnail_path = null
        where project_id = expired.project_id;

        perform public.refund_project_credits(expired.project_id);
      end if;
    else
      update public.processing_jobs
      set status = 'queued',
          locked_by = null,
          locked_at = null,
          lease_expires_at = null,
          available_at = now()
      where id = expired.id;
    end if;
  end loop;

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

-- ---------------------------------------------------------------------------
-- Terminal failure cleanup
--
-- A terminal failure refunds the whole project. Every clip path is cleared so a partially rendered
-- project cannot be downloaded for free, and sibling jobs for the project are stopped.
-- ---------------------------------------------------------------------------

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

    update public.processing_jobs
    set status = 'failed',
        error_message = 'Another job for this project failed; the project was stopped.',
        locked_by = null,
        locked_at = null,
        lease_expires_at = null
    where project_id = job.project_id
      and id <> p_job_id
      and status in ('queued', 'in_progress');

    -- Guard against a late failure report for a project that already completed. Such a project must
    -- keep its clips and its settled charge.
    update public.projects
    set status = 'failed',
        error_message = left(p_error, 2000)
    where id = job.project_id
      and status in ('uploading', 'ready', 'processing');

    if found then
      update public.clips
      set render_status = 'failed',
          storage_path = null,
          thumbnail_path = null
      where project_id = job.project_id;

      perform public.refund_project_credits(job.project_id);
    end if;
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
--
-- begin_checkout no longer clears a provider subscription id before the route has proved what the
-- remote subscription is. A stale pending row returns `stale` and leaves the row untouched, so a
-- failed cancellation can be retried instead of losing the orphan id.
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
  retry_after integer;
begin
  -- A per-user transaction lock serializes first checkouts. Without it, two concurrent requests for
  -- a user with no subscription row both try to insert and one fails on the primary key.
  perform pg_advisory_xact_lock(hashtextextended('clipmax:checkout:' || p_user_id::text, 0));

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

  if sub.status = 'pending' then
    if sub.provider_subscription_id is not null then
      -- A remote subscription exists. Reuse it only inside the cooldown; otherwise the route must
      -- fetch its real status before deciding whether it is safe to cancel.
      if sub.checkout_attempt_id is not null
         and sub.checkout_started_at is not null
         and sub.checkout_started_at > now() - make_interval(secs => cooldown) then
        return jsonb_build_object(
          'action', 'reuse',
          'attemptId', sub.checkout_attempt_id,
          'subscriptionId', sub.provider_subscription_id
        );
      end if;

      return jsonb_build_object(
        'action', 'stale',
        'attemptId', sub.checkout_attempt_id,
        'subscriptionId', sub.provider_subscription_id,
        'checkoutStartedAt', sub.checkout_started_at
      );
    end if;

    -- A local attempt exists but no remote subscription was attached yet. The route may still be
    -- creating it, so do not supersede it inside the cooldown.
    if sub.checkout_attempt_id is not null
       and sub.checkout_started_at is not null
       and sub.checkout_started_at > now() - make_interval(secs => cooldown) then
      retry_after := greatest(
        1,
        ceil(extract(epoch from (sub.checkout_started_at + make_interval(secs => cooldown) - now())))::integer
      );

      return jsonb_build_object(
        'action', 'in_progress',
        'attemptId', sub.checkout_attempt_id,
        'retryAfterSeconds', retry_after
      );
    end if;
  end if;

  -- No remote subscription is attached, or the previous attempt is stale and provably local-only.
  -- Starting a fresh attempt is safe.
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

  return jsonb_build_object('action', 'create', 'attemptId', new_attempt);
end;
$$;

-- Called only after the route has proved the stale remote subscription is unpaid or already
-- terminal. It atomically verifies the row still belongs to that exact attempt and subscription,
-- clears it, and returns a fresh attempt id for the new checkout.
create or replace function public.clear_stale_checkout(
  p_user_id uuid,
  p_attempt_id uuid,
  p_subscription_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions%rowtype;
  new_attempt uuid := gen_random_uuid();
begin
  perform pg_advisory_xact_lock(hashtextextended('clipmax:checkout:' || p_user_id::text, 0));

  select * into sub
  from public.subscriptions
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if sub.status <> 'pending'
     or sub.provider_subscription_id is distinct from p_subscription_id
     or sub.checkout_attempt_id is distinct from p_attempt_id then
    return jsonb_build_object('ok', false, 'reason', 'mismatch', 'status', sub.status);
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

  return jsonb_build_object('ok', true, 'action', 'create', 'attemptId', new_attempt);
end;
$$;

-- Reconciliation for the race where the customer paid but the webhook is delayed. The checkout
-- route fetched the remote subscription and saw `active`, so it records the paid state locally
-- instead of cancelling it. Credits are deliberately not granted here: `subscription.charged`
-- remains the single grant path and keeps its payment-id idempotency key.
create or replace function public.confirm_paid_checkout(
  p_user_id uuid,
  p_provider_subscription_id text,
  p_customer_id text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('clipmax:checkout:' || p_user_id::text, 0));

  select * into sub
  from public.subscriptions
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('reconciled', false, 'reason', 'not_found');
  end if;

  if sub.provider_subscription_id is distinct from p_provider_subscription_id then
    return jsonb_build_object('reconciled', false, 'reason', 'mismatch', 'status', sub.status);
  end if;

  if sub.status in ('canceled', 'completed') then
    return jsonb_build_object('reconciled', false, 'reason', 'terminal', 'status', sub.status);
  end if;

  if sub.status in ('active', 'past_due', 'paused') then
    return jsonb_build_object('reconciled', true, 'already', true, 'status', sub.status);
  end if;

  update public.subscriptions
  set provider_customer_id = coalesce(p_customer_id, provider_customer_id),
      status = 'active',
      current_period_end = coalesce(p_current_period_end, current_period_end),
      cancel_at_period_end = coalesce(p_cancel_at_period_end, false),
      checkout_attempt_id = null,
      checkout_started_at = null
  where user_id = p_user_id;

  update public.profiles set plan = 'starter' where id = p_user_id;

  return jsonb_build_object('reconciled', true, 'status', 'active');
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

revoke all on function public.claim_next_job(text, integer) from public, anon, authenticated;
revoke all on function public.fail_job(uuid, text, text, boolean) from public, anon, authenticated;
revoke all on function public.begin_checkout(uuid, integer) from public, anon, authenticated;
revoke all on function public.clear_stale_checkout(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.confirm_paid_checkout(uuid, text, text, timestamptz, boolean)
  from public, anon, authenticated;

grant execute on function public.claim_next_job(text, integer) to service_role;
grant execute on function public.fail_job(uuid, text, text, boolean) to service_role;
grant execute on function public.begin_checkout(uuid, integer) to service_role;
grant execute on function public.clear_stale_checkout(uuid, uuid, text) to service_role;
grant execute on function public.confirm_paid_checkout(uuid, text, text, timestamptz, boolean)
  to service_role;
