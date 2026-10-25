-- Billing states that the Razorpay webhook can report honestly.
--
-- The first schema only had active/past_due/canceled. A checkout that has not been paid is
-- `pending`, a paused subscription is `paused`, and a finished subscription is `completed`.
-- Keeping these distinct means the billing page never has to mislabel a real state.

alter type public.subscription_status add value if not exists 'pending';
alter type public.subscription_status add value if not exists 'paused';
alter type public.subscription_status add value if not exists 'completed';

create unique index if not exists subscriptions_provider_sub_uniq
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
