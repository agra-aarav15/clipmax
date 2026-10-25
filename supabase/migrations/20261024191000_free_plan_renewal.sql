-- Monthly renewal for the free plan.
--
-- The signup grant is real, but without a renewal a free account is empty after its first month.
-- This function grants the free allowance once per calendar month (UTC) to accounts that existed
-- before the month began, so the signup grant is never doubled in the signup month.
--
-- Starter accounts are skipped: their credits come from the Razorpay `subscription.charged`
-- webhook, which already uses a per-payment idempotency key. A canceled Starter account returns to
-- the free plan via the webhook and becomes eligible here on the next month boundary.
--
-- The amount must match PLAN_CATALOG.free.creditsPerMonth in packages/shared/src/credits.ts.

create or replace function public.renew_free_plan_credits()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_id uuid;
  cycle text;
  granted integer := 0;
begin
  cycle := to_char(now() at time zone 'utc', 'YYYY-MM');

  for profile_id in
    select p.id
    from public.profiles p
    where p.plan = 'free'
      and (p.created_at at time zone 'utc') < date_trunc('month', now() at time zone 'utc')
  loop
    if public.grant_credits(
      profile_id,
      30,
      'grant_monthly',
      'monthly:' || profile_id::text || ':' || cycle,
      jsonb_build_object('source', 'free_plan_renewal', 'cycle', cycle)
    ) then
      granted := granted + 1;
    end if;
  end loop;

  return granted;
end;
$$;

revoke all on function public.renew_free_plan_credits() from public, anon, authenticated;
grant execute on function public.renew_free_plan_credits() to service_role;
