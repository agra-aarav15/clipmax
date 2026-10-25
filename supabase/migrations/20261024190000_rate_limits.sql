-- Server-side rate limiting for expensive or abusable API routes.
--
-- The web app is deployed as ordinary Next.js handlers, so an in-process counter would reset on
-- every cold start and would not be shared between instances. Postgres is already the source of
-- truth for credits and jobs, so the limiter lives beside them: one atomic upsert per request,
-- fixed windows, no Redis and no extra service.
--
-- The table is service-role only. Buckets are derived from the authenticated user id, not from a
-- client-supplied value, so one account cannot reset another account's counter.

create table if not exists public.rate_limit_windows (
  bucket text not null check (char_length(bucket) between 1 and 200),
  window_start timestamptz not null,
  hits integer not null default 0 check (hits >= 0),
  primary key (bucket, window_start)
);

create index if not exists rate_limit_windows_start_idx
  on public.rate_limit_windows (window_start);

alter table public.rate_limit_windows enable row level security;

revoke all on public.rate_limit_windows from anon, authenticated;
grant all on public.rate_limit_windows to service_role;

-- ---------------------------------------------------------------------------
-- consume_rate_limit
--
-- Returns the decision for this request and increments the window atomically. The route still
-- decides what to do with `allowed = false`; the database never rejects the caller by itself.
-- ---------------------------------------------------------------------------

create or replace function public.consume_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_window timestamptz;
  current_hits integer;
  window_end timestamptz;
begin
  if p_limit <= 0 then
    raise exception 'rate limit must be positive';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 86_400 then
    raise exception 'rate limit window must be between 1 second and 1 day';
  end if;

  if p_bucket is null or char_length(p_bucket) = 0 or char_length(p_bucket) > 200 then
    raise exception 'rate limit bucket must be between 1 and 200 characters';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );
  window_end := current_window + make_interval(secs => p_window_seconds);

  insert into public.rate_limit_windows (bucket, window_start, hits)
  values (p_bucket, current_window, 1)
  on conflict (bucket, window_start) do update
    set hits = public.rate_limit_windows.hits + 1
  returning hits into current_hits;

  -- Keep the table bounded without a second scheduler. Old windows are useless; a 1% chance per
  -- call deletes a small batch long before the table matters.
  if random() < 0.01 then
    delete from public.rate_limit_windows
    where window_start < now() - interval '2 days';
  end if;

  return jsonb_build_object(
    'allowed', current_hits <= p_limit,
    'limit', p_limit,
    'remaining', greatest(0, p_limit - current_hits),
    'retryAfterSeconds', greatest(
      1,
      ceil(extract(epoch from (window_end - clock_timestamp())))
    )::integer
  );
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;
