// Exercises the migrations against an in-process PostgreSQL without Docker, a local Supabase stack,
// or hosted credentials. Supabase provides the auth schema, roles, and `auth.uid()`; this file
// reproduces the minimum those migrations reference, then proves the money and tenancy behaviour.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

const db = new PGlite({ extensions: { pgcrypto } });
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`PASS  ${name}`);
  } else {
    failures.push(name);
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function one(sql, params) {
  const result = await db.query(sql, params);
  return result.rows[0];
}

async function expectError(name, sql, params, pattern) {
  try {
    await db.query(sql, params);
    check(name, false, "expected an error");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    check(name, pattern.test(message), message);
  }
}

// Supabase provides these roles and the auth schema. Reproduce the minimum the migrations touch.
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );

  create or replace function auth.uid()
  returns uuid
  language sql
  stable
  as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
`);

const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  const sql = await readFile(path.join(migrationsDir, file), "utf8");
  try {
    await db.exec(sql);
    console.log(`APPLIED ${file}`);
  } catch (error) {
    console.error(`MIGRATION FAILED ${file}`);
    throw error;
  }
}

// Signup trigger: profile, wallet, and the real 30-credit grant.
const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const userC = "33333333-3333-4333-8333-333333333333";

await db.query("insert into auth.users (id, email) values ($1, $2), ($3, $4), ($5, $6)", [
  userA,
  "a@example.com",
  userB,
  "b@example.com",
  userC,
  "c@example.com",
]);

const signupWallet = await one("select balance from public.credit_wallets where user_id = $1", [
  userA,
]);
check("signup grant credits the wallet with 30", signupWallet.balance === 30, signupWallet.balance);

const signupLedger = await one(
  "select count(*)::int as n from public.credit_ledger where user_id = $1 and reason = 'grant_signup'",
  [userA],
);
check("signup ledger row exists exactly once", signupLedger.n === 1, signupLedger.n);

// Renewal: only free accounts created before the current month.
await db.query(
  "update public.profiles set created_at = (date_trunc('month', now() at time zone 'utc') - interval '2 days') at time zone 'utc' where id = $1",
  [userA],
);
await db.query(
  "update public.profiles set plan = 'starter', created_at = (date_trunc('month', now() at time zone 'utc') - interval '2 days') at time zone 'utc' where id = $1",
  [userC],
);

const firstRenewal = await one("select public.renew_free_plan_credits() as granted");
check(
  "first renewal grants only the eligible old free account",
  firstRenewal.granted === 1,
  firstRenewal.granted,
);

const renewalWallet = await one("select balance from public.credit_wallets where user_id = $1", [
  userA,
]);
check("renewal adds 30 credits", renewalWallet.balance === 60, renewalWallet.balance);

const newAccountWallet = await one("select balance from public.credit_wallets where user_id = $1", [
  userB,
]);
check(
  "signup-month account is not renewed twice",
  newAccountWallet.balance === 30,
  newAccountWallet.balance,
);

const starterWallet = await one("select balance from public.credit_wallets where user_id = $1", [
  userC,
]);
check(
  "starter account is not renewed by the free-plan job",
  starterWallet.balance === 30,
  starterWallet.balance,
);

const secondRenewal = await one("select public.renew_free_plan_credits() as granted");
check(
  "second renewal in the same month is a no-op",
  secondRenewal.granted === 0,
  secondRenewal.granted,
);

const monthlyRows = await one(
  "select count(*)::int as n from public.credit_ledger where user_id = $1 and reason = 'grant_monthly'",
  [userA],
);
check("renewal writes exactly one monthly ledger row", monthlyRows.n === 1, monthlyRows.n);

// Rate limiter: two allowed, third blocked in the same window.
const rule = ["pgtest:user", 2, 60];
const firstHit = await one("select public.consume_rate_limit($1, $2, $3) as d", rule);
const secondHit = await one("select public.consume_rate_limit($1, $2, $3) as d", rule);
const thirdHit = await one("select public.consume_rate_limit($1, $2, $3) as d", rule);

check("first request is allowed", firstHit.d.allowed === true, firstHit.d);
check(
  "second request is allowed and reports zero remaining",
  secondHit.d.allowed === true && secondHit.d.remaining === 0,
  secondHit.d,
);
check("third request is blocked", thirdHit.d.allowed === false, thirdHit.d);
check(
  "blocked response carries a bounded retry delay",
  thirdHit.d.retryAfterSeconds >= 1 && thirdHit.d.retryAfterSeconds <= 60,
  thirdHit.d,
);
check("window counter is shared across calls", thirdHit.d.limit === 2, thirdHit.d);

// RLS: an authenticated user sees only their own project rows.
await db.query(
  "insert into public.projects (id, user_id, title, source_type, source_url, status) values (gen_random_uuid(), $1, 'A project', 'public_url', 'https://example.com/a', 'ready'), (gen_random_uuid(), $2, 'B project', 'public_url', 'https://example.com/b', 'ready')",
  [userA, userB],
);

await db.exec("set role authenticated");
await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userA]);
const visible = await one("select count(*)::int as n from public.projects");
const visibleTitles = await db.query("select title from public.projects order by title");
check("RLS hides the other tenant's project", visible.n === 1, visible.n);
check(
  "RLS returns the caller's project",
  visibleTitles.rows[0]?.title === "A project",
  visibleTitles.rows,
);
await db.exec("reset role");

// Credit reservation and refund still settle exactly once.
const projectA = await one("select id from public.projects where user_id = $1", [userA]);
const reserved = await one("select public.reserve_credits($1, $2, 15, 'reserve:pgtest') as ok", [
  userA,
  projectA.id,
]);
const afterReserve = await one("select balance from public.credit_wallets where user_id = $1", [
  userA,
]);
const refunded = await one("select public.refund_project_credits($1) as amount", [projectA.id]);
const refundAgain = await one("select public.refund_project_credits($1) as amount", [projectA.id]);
const afterRefund = await one("select balance from public.credit_wallets where user_id = $1", [
  userA,
]);

check("reservation succeeds with balance", reserved.ok === true, reserved);
check("reservation debits 15 credits", afterReserve.balance === 45, afterReserve.balance);
check("refund returns 15 credits", refunded.amount === 15, refunded);
check("second refund is idempotent", refundAgain.amount === 0, refundAgain);
check("refund restores the wallet", afterRefund.balance === 60, afterRefund.balance);

// ---------------------------------------------------------------------------
// Reservation replay and settlement
// ---------------------------------------------------------------------------

const replayReserved = await one(
  "select public.reserve_credits($1, $2, 15, 'reserve:pgtest:2') as ok",
  [userA, projectA.id],
);
const replaySameKey = await one(
  "select public.reserve_credits($1, $2, 15, 'reserve:pgtest:2') as ok",
  [userA, projectA.id],
);
const settled = await one("select public.settle_project_credits($1, 10) as refund", [projectA.id]);
const settledAgain = await one("select public.settle_project_credits($1, 10) as refund", [
  projectA.id,
]);
const afterSettle = await one("select balance from public.credit_wallets where user_id = $1", [
  userA,
]);

check(
  "a second reservation on the same project succeeds after a refund",
  replayReserved.ok === true,
  replayReserved,
);
check("replaying a held reservation returns true", replaySameKey.ok === true, replaySameKey);
check("settlement refunds the unused reservation", settled.refund === 5, settled);
check("replaying settlement is a no-op", settledAgain.refund === 0, settledAgain);
check(
  "settlement leaves the actual charge debited",
  afterSettle.balance === 50,
  afterSettle.balance,
);

await expectError(
  "replaying a settled reservation raises instead of claiming a new hold",
  "select public.reserve_credits($1, $2, 15, 'reserve:pgtest:2')",
  [userA, projectA.id],
  /already been settled or refunded/,
);

const settledRefund = await one("select public.refund_project_credits($1) as amount", [
  projectA.id,
]);
const afterSettledRefund = await one(
  "select balance from public.credit_wallets where user_id = $1",
  [userA],
);
check(
  "a failure after settlement refunds the actual charge",
  settledRefund.amount === 10,
  settledRefund,
);
check(
  "the post-settlement refund restores the wallet",
  afterSettledRefund.balance === 60,
  afterSettledRefund.balance,
);

// ---------------------------------------------------------------------------
// Project creation, processing, and retry
// ---------------------------------------------------------------------------

const userD = "44444444-4444-4444-8444-444444444444";
await db.query("insert into auth.users (id, email) values ($1, $2)", [userD, "d@example.com"]);

const linkProjectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const link = await one(
  "select public.create_link_project($1, $2, 'Linked source', 'https://example.com/video', 12, 'reserve:link:1') as result",
  [userD, linkProjectId],
);
const linkProject = await one(
  "select status, credits_reserved, credit_reservation_key from public.projects where id = $1",
  [linkProjectId],
);
const linkWallet = await one("select balance from public.credit_wallets where user_id = $1", [
  userD,
]);
const linkJobs = await one(
  "select count(*)::int as n from public.processing_jobs where project_id = $1 and job_type = 'transcribe' and status = 'queued'",
  [linkProjectId],
);

check("create_link_project reserves and queues in one call", link.result.ok === true, link.result);
check("the linked project is ready", linkProject.status === "ready", linkProject);
check("the linked project holds its reservation", linkProject.credits_reserved === 12, linkProject);
check(
  "the linked project records its reservation key",
  linkProject.credit_reservation_key === "reserve:link:1",
  linkProject,
);
check("the linked project debits the wallet", linkWallet.balance === 18, linkWallet.balance);
check("the linked project queues exactly one transcribe job", linkJobs.n === 1, linkJobs.n);

const poorProjectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const poorLink = await one(
  "select public.create_link_project($1, $2, 'Too expensive', 'https://example.com/long', 1000, 'reserve:link:poor') as result",
  [userD, poorProjectId],
);
const poorProject = await one("select count(*)::int as n from public.projects where id = $1", [
  poorProjectId,
]);
const poorWallet = await one("select balance from public.credit_wallets where user_id = $1", [
  userD,
]);
check(
  "an unaffordable link is reported honestly",
  poorLink.result.ok === false && poorLink.result.code === "insufficient_credits",
  poorLink.result,
);
check("an unaffordable link leaves no project row", poorProject.n === 0, poorProject.n);
check(
  "an unaffordable link leaves the wallet untouched",
  poorWallet.balance === 18,
  poorWallet.balance,
);

const uploadProjectId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
await one(
  "select public.create_upload_project($1, $2, 'Uploaded source', 'sources/d/source.mp4', 'source.mp4', 'video/mp4', 1048576)",
  [userD, uploadProjectId],
);
const beforeUploadStart = await one("select status from public.projects where id = $1", [
  uploadProjectId,
]);
const uploadStart = await one(
  "select public.begin_upload_processing($1, $2, 10, 1048576) as result",
  [userD, uploadProjectId],
);
const uploadProject = await one(
  "select status, credits_reserved, size_bytes from public.projects where id = $1",
  [uploadProjectId],
);
const uploadWallet = await one("select balance from public.credit_wallets where user_id = $1", [
  userD,
]);
const uploadAgain = await one(
  "select public.begin_upload_processing($1, $2, 10, 1048576) as result",
  [userD, uploadProjectId],
);

check(
  "a presigned upload starts in uploading state",
  beforeUploadStart.status === "uploading",
  beforeUploadStart,
);
check(
  "begin_upload_processing reserves and queues",
  uploadStart.result.ok === true,
  uploadStart.result,
);
check(
  "begin_upload_processing moves the project to ready",
  uploadProject.status === "ready",
  uploadProject,
);
check(
  "begin_upload_processing records the reservation",
  uploadProject.credits_reserved === 10,
  uploadProject,
);
check(
  "begin_upload_processing records the probed size",
  Number(uploadProject.size_bytes) === 1048576,
  uploadProject.size_bytes,
);
check(
  "begin_upload_processing debits the wallet",
  uploadWallet.balance === 8,
  uploadWallet.balance,
);
check(
  "a repeated begin_upload_processing is rejected, not charged twice",
  uploadAgain.result.ok === false && uploadAgain.result.code === "not_ready",
  uploadAgain.result,
);

// A failed run has already refunded its hold. Retry must take a fresh reservation key so the
// second refund is not swallowed by the first one's ledger entry.
await db.query("select public.refund_project_credits($1)", [uploadProjectId]);
await db.query(
  "update public.projects set status = 'failed', error_message = 'simulated' where id = $1",
  [uploadProjectId],
);
const retry = await one("select public.retry_project($1, $2, 10) as result", [
  userD,
  uploadProjectId,
]);
const retriedProject = await one(
  "select status, credits_reserved, credit_reservation_key from public.projects where id = $1",
  [uploadProjectId],
);
const retriedWallet = await one("select balance from public.credit_wallets where user_id = $1", [
  userD,
]);
const retriedJobs = await one(
  "select count(*)::int as n from public.processing_jobs where project_id = $1 and job_type = 'transcribe' and status = 'queued'",
  [uploadProjectId],
);
const retryAgain = await one("select public.retry_project($1, $2, 10) as result", [
  userD,
  uploadProjectId,
]);

check("retry_project re-queues a failed project", retry.result.ok === true, retry.result);
check("retry_project restores ready state", retriedProject.status === "ready", retriedProject);
check(
  "retry_project takes a fresh reservation",
  retriedProject.credits_reserved === 10,
  retriedProject,
);
check(
  "retry_project uses a new reservation key",
  retriedProject.credit_reservation_key.startsWith("reserve:") &&
    retriedProject.credit_reservation_key.includes(":retry:"),
  retriedProject.credit_reservation_key,
);
check(
  "retry_project debits the new reservation",
  retriedWallet.balance === 8,
  retriedWallet.balance,
);
check("retry_project reuses the queued transcribe job", retriedJobs.n === 1, retriedJobs.n);
check(
  "retry_project refuses a project that is already ready",
  retryAgain.result.ok === false && retryAgain.result.code === "not_ready",
  retryAgain.result,
);

// ---------------------------------------------------------------------------
// Checkout serialization
// ---------------------------------------------------------------------------

const userE = "55555555-5555-4555-8555-555555555555";
await db.query("insert into auth.users (id, email) values ($1, $2)", [userE, "e@example.com"]);

const checkoutOne = await one("select public.begin_checkout($1, 600) as result", [userE]);
const checkoutInProgress = await one("select public.begin_checkout($1, 600) as result", [userE]);
const attached = await one(
  "select public.attach_checkout_subscription($1, $2, 'sub_live', 'cust_live') as ok",
  [userE, checkoutOne.result.attemptId],
);
const checkoutReuse = await one("select public.begin_checkout($1, 600) as result", [userE]);
const pendingRow = await one(
  "select status, provider_subscription_id, checkout_attempt_id from public.subscriptions where user_id = $1",
  [userE],
);

check(
  "the first checkout creates a pending attempt",
  checkoutOne.result.action === "create",
  checkoutOne.result,
);
check(
  "a second checkout while the first is being created reports in_progress",
  checkoutInProgress.result.action === "in_progress" &&
    checkoutInProgress.result.attemptId === checkoutOne.result.attemptId,
  checkoutInProgress.result,
);
check("the current attempt attaches the provider subscription", attached.ok === true, attached);
check(
  "a checkout inside the cooldown reuses the attached subscription",
  checkoutReuse.result.action === "reuse" &&
    checkoutReuse.result.subscriptionId === "sub_live" &&
    checkoutReuse.result.attemptId === checkoutOne.result.attemptId,
  checkoutReuse.result,
);
check(
  "the pending subscription stores the live provider id",
  pendingRow.status === "pending" && pendingRow.provider_subscription_id === "sub_live",
  pendingRow,
);

// A stale pending checkout must be reported, not cleared. The route fetches the remote state first.
await db.query(
  "update public.subscriptions set checkout_started_at = now() - interval '20 minutes' where user_id = $1",
  [userE],
);
const staleCheckout = await one("select public.begin_checkout($1, 600) as result", [userE]);
const stalePendingRow = await one(
  "select status, provider_subscription_id, checkout_attempt_id from public.subscriptions where user_id = $1",
  [userE],
);
check(
  "a stale pending checkout returns the remote id instead of clearing it",
  staleCheckout.result.action === "stale" &&
    staleCheckout.result.subscriptionId === "sub_live" &&
    staleCheckout.result.attemptId === checkoutOne.result.attemptId,
  staleCheckout.result,
);
check(
  "begin_checkout leaves a stale provider id in place",
  stalePendingRow.status === "pending" &&
    stalePendingRow.provider_subscription_id === "sub_live" &&
    stalePendingRow.checkout_attempt_id === checkoutOne.result.attemptId,
  stalePendingRow,
);

const clearMismatch = await one(
  "select public.clear_stale_checkout($1, $2, 'sub_other') as result",
  [userE, checkoutOne.result.attemptId],
);
check(
  "clearing a stale checkout refuses a mismatched provider id",
  clearMismatch.result.ok === false && clearMismatch.result.reason === "mismatch",
  clearMismatch.result,
);

const clearedStale = await one("select public.clear_stale_checkout($1, $2, 'sub_live') as result", [
  userE,
  checkoutOne.result.attemptId,
]);
const clearedRow = await one(
  "select status, provider_subscription_id, checkout_attempt_id from public.subscriptions where user_id = $1",
  [userE],
);
check(
  "clearing a verified stale checkout returns a fresh attempt",
  clearedStale.result.ok === true &&
    clearedStale.result.action === "create" &&
    clearedStale.result.attemptId !== checkoutOne.result.attemptId,
  clearedStale.result,
);
check(
  "clearing a stale checkout removes the old provider id",
  clearedRow.status === "pending" &&
    clearedRow.provider_subscription_id === null &&
    clearedRow.checkout_attempt_id === clearedStale.result.attemptId,
  clearedRow,
);

const reattached = await one(
  "select public.attach_checkout_subscription($1, $2, 'sub_live_2', 'cust_live_2') as ok",
  [userE, clearedStale.result.attemptId],
);
check(
  "the fresh attempt can attach a new provider subscription",
  reattached.ok === true,
  reattached,
);

const pendingCancel = await one(
  "select public.mark_subscription_cancellation($1, 'sub_live_2', false) as result",
  [userE],
);
const afterPendingCancel = await one(
  "select status, cancel_at_period_end, checkout_attempt_id from public.subscriptions where user_id = $1",
  [userE],
);
check(
  "cancelling an unpaid pending checkout ends it immediately",
  pendingCancel.result.updated === true && pendingCancel.result.status === "canceled",
  pendingCancel.result,
);
check(
  "the pending cancellation clears the attempt",
  afterPendingCancel.status === "canceled" && afterPendingCancel.checkout_attempt_id === null,
  afterPendingCancel,
);

// Re-subscribe and activate through the webhook path.
const checkoutThree = await one("select public.begin_checkout($1, 600) as result", [userE]);
await one("select public.attach_checkout_subscription($1, $2, 'sub_active', 'cust_active') as ok", [
  userE,
  checkoutThree.result.attemptId,
]);
const activeEvent = await one(
  "select public.apply_subscription_event($1, 'sub_active', 'cust_active', 'active', now() + interval '30 days', false, now(), 'evt_active') as result",
  [userE],
);
const afterActive = await one("select status, plan from public.subscriptions where user_id = $1", [
  userE,
]);
const activeProfile = await one("select plan from public.profiles where id = $1", [userE]);
const manage = await one("select public.begin_checkout($1, 600) as result", [userE]);
const staleEvent = await one(
  "select public.apply_subscription_event($1, 'sub_active', 'cust_active', 'past_due', null, false, now() - interval '1 hour', 'evt_old') as result",
  [userE],
);

check(
  "an active subscription event is applied",
  activeEvent.result.applied === true,
  activeEvent.result,
);
check("the active subscription is stored", afterActive.status === "active", afterActive);
check("the active subscription upgrades the plan", activeProfile.plan === "starter", activeProfile);
check(
  "a second checkout for an active subscriber becomes manage",
  manage.result.action === "manage" && manage.result.status === "active",
  manage.result,
);
check(
  "an out-of-order event is rejected as stale",
  staleEvent.result.applied === false && staleEvent.result.reason === "stale",
  staleEvent.result,
);

const scheduledCancel = await one(
  "select public.mark_subscription_cancellation($1, 'sub_active', true) as result",
  [userE],
);
const cancelAfterEvent = await one(
  "select public.apply_subscription_event($1, 'sub_active', 'cust_active', 'active', now() + interval '30 days', false, now(), 'evt_active_2') as result",
  [userE],
);
const scheduledRow = await one(
  "select cancel_at_period_end, status from public.subscriptions where user_id = $1",
  [userE],
);

check(
  "a local cancellation is scheduled at period end",
  scheduledCancel.result.updated === true && scheduledCancel.result.cancelAtPeriodEnd === true,
  scheduledCancel.result,
);
check(
  "a later active event does not silently clear the scheduled cancellation",
  cancelAfterEvent.result.applied === true &&
    cancelAfterEvent.result.cancelAtPeriodEnd === true &&
    scheduledRow.cancel_at_period_end === true,
  { event: cancelAfterEvent.result, row: scheduledRow },
);

const terminalEvent = await one(
  "select public.apply_subscription_event($1, 'sub_active', 'cust_active', 'canceled', null, false, now() + interval '1 minute', 'evt_canceled') as result",
  [userE],
);
const terminalProfile = await one("select plan from public.profiles where id = $1", [userE]);
const afterTerminal = await one(
  "select status, cancel_at_period_end from public.subscriptions where user_id = $1",
  [userE],
);
check(
  "a terminal event cancels the subscription",
  terminalEvent.result.applied === true,
  terminalEvent.result,
);
check(
  "a terminal event returns the account to free",
  terminalProfile.plan === "free",
  terminalProfile,
);
check(
  "a terminal event clears the scheduled flag",
  afterTerminal.status === "canceled" && afterTerminal.cancel_at_period_end === false,
  afterTerminal,
);

// Releasing an attempt that never reached Razorpay.
const checkoutFour = await one("select public.begin_checkout($1, 600) as result", [userE]);
const released = await one("select public.release_checkout_attempt($1, $2) as ok", [
  userE,
  checkoutFour.result.attemptId,
]);
const releaseAgain = await one("select public.release_checkout_attempt($1, $2) as ok", [
  userE,
  checkoutFour.result.attemptId,
]);
check("a failed checkout attempt can be released", released.ok === true, released);
check("releasing a failed attempt twice is a no-op", releaseAgain.ok === false, releaseAgain);

// A paid remote subscription with a delayed webhook is reconciled, never cancelled.
const userG = "77777777-7777-4777-8777-777777777777";
await db.query("insert into auth.users (id, email) values ($1, $2)", [userG, "g@example.com"]);

const paidCheckout = await one("select public.begin_checkout($1, 600) as result", [userG]);
await one("select public.attach_checkout_subscription($1, $2, 'sub_paid', 'cust_paid') as ok", [
  userG,
  paidCheckout.result.attemptId,
]);
await db.query(
  "update public.subscriptions set checkout_started_at = now() - interval '20 minutes' where user_id = $1",
  [userG],
);
const paidStale = await one("select public.begin_checkout($1, 600) as result", [userG]);
const confirmMismatch = await one(
  "select public.confirm_paid_checkout($1, 'sub_other', 'cust_paid', now() + interval '30 days') as result",
  [userG],
);
const confirmPaid = await one(
  "select public.confirm_paid_checkout($1, 'sub_paid', 'cust_paid', now() + interval '30 days') as result",
  [userG],
);
const paidRow = await one(
  "select status, provider_subscription_id, checkout_attempt_id, current_period_end from public.subscriptions where user_id = $1",
  [userG],
);
const paidProfile = await one("select plan from public.profiles where id = $1", [userG]);
const paidManage = await one("select public.begin_checkout($1, 600) as result", [userG]);

check(
  "a stale paid checkout is reported as stale before reconciliation",
  paidStale.result.action === "stale" && paidStale.result.subscriptionId === "sub_paid",
  paidStale.result,
);
check(
  "reconciliation refuses a mismatched provider id",
  confirmMismatch.result.reconciled === false && confirmMismatch.result.reason === "mismatch",
  confirmMismatch.result,
);
check(
  "reconciliation records an already-paid checkout as active",
  confirmPaid.result.reconciled === true && confirmPaid.result.status === "active",
  confirmPaid.result,
);
check(
  "reconciliation keeps the paid provider id and clears the attempt",
  paidRow.status === "active" &&
    paidRow.provider_subscription_id === "sub_paid" &&
    paidRow.checkout_attempt_id === null &&
    paidRow.current_period_end !== null,
  paidRow,
);
check(
  "reconciliation upgrades the profile to starter",
  paidProfile.plan === "starter",
  paidProfile,
);
check(
  "a reconciled subscriber is sent to manage instead of a second checkout",
  paidManage.result.action === "manage" && paidManage.result.status === "active",
  paidManage.result,
);

// ---------------------------------------------------------------------------
// Webhook event claim / complete / fail
// ---------------------------------------------------------------------------

const claimFirst = await one(
  "select public.claim_webhook_event('razorpay', 'evt_claim_1', '{\"event\":\"subscription.activated\"}'::jsonb) as result",
);
const claimInFlight = await one(
  "select public.claim_webhook_event('razorpay', 'evt_claim_1', '{\"event\":\"subscription.activated\"}'::jsonb) as result",
);
const completedEvent = await one(
  "select public.complete_webhook_event('razorpay', 'evt_claim_1', '{\"event\":\"subscription.activated\",\"ok\":true}'::jsonb) as ok",
);
const claimAfterComplete = await one(
  "select public.claim_webhook_event('razorpay', 'evt_claim_1', '{\"event\":\"subscription.activated\"}'::jsonb) as result",
);
const storedEvent = await one(
  "select processed_at, payload from public.webhook_events where provider = 'razorpay' and event_id = 'evt_claim_1'",
);

check(
  "the first webhook delivery claims the event",
  claimFirst.result.claimed === true,
  claimFirst.result,
);
check(
  "a concurrent delivery is told the event is in flight",
  claimInFlight.result.claimed === false && claimInFlight.result.inProgress === true,
  claimInFlight.result,
);
check("completing the event marks it processed", completedEvent.ok === true, completedEvent);
check(
  "a delivery after completion is acknowledged without reprocessing",
  claimAfterComplete.result.claimed === false && claimAfterComplete.result.processed === true,
  claimAfterComplete.result,
);
check(
  "the completed event keeps the final payload",
  storedEvent.processed_at !== null && storedEvent.payload.ok === true,
  storedEvent,
);

const claimRetry = await one(
  "select public.claim_webhook_event('razorpay', 'evt_fail_1', '{}'::jsonb) as result",
);
const failedEvent = await one(
  "select public.fail_webhook_event('razorpay', 'evt_fail_1', 'simulated failure') as ok",
);
const claimTooSoon = await one(
  "select public.claim_webhook_event('razorpay', 'evt_fail_1', '{}'::jsonb) as result",
);
await db.query(
  "update public.webhook_events set next_attempt_at = now() - interval '1 second', last_attempt_at = now() - interval '3 minutes' where provider = 'razorpay' and event_id = 'evt_fail_1'",
);
const claimRetryAgain = await one(
  "select public.claim_webhook_event('razorpay', 'evt_fail_1', '{}'::jsonb) as result",
);

check("a failed event starts claimed", claimRetry.result.claimed === true, claimRetry.result);
check("failing the event records the error", failedEvent.ok === true, failedEvent);
check(
  "an immediate retry is told to wait",
  claimTooSoon.result.claimed === false && claimTooSoon.result.inProgress === true,
  claimTooSoon.result,
);
check(
  "a retry after the backoff is claimed again",
  claimRetryAgain.result.claimed === true && claimRetryAgain.result.attempts === 2,
  claimRetryAgain.result,
);

// ---------------------------------------------------------------------------
// Worker ownership
// ---------------------------------------------------------------------------

const userF = "66666666-6666-4666-8666-666666666666";
await db.query("insert into auth.users (id, email) values ($1, $2)", [userF, "f@example.com"]);

// Earlier tests leave queued jobs behind. Finish them so claim_next_job is deterministic here.
await db.query(
  "update public.processing_jobs set status = 'completed' where status in ('queued', 'in_progress')",
);

const workerProject1 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
await one(
  "select public.create_link_project($1, $2, 'Worker failure', 'https://example.com/w1', 10, 'reserve:worker:1')",
  [userF, workerProject1],
);
await db.query(
  "insert into public.clips (project_id, user_id, title, start_time, end_time, render_status, storage_path, thumbnail_path) values ($1, $2, 'Partial render', 0, 30, 'rendered', 'renders/partial/clip.mp4', 'renders/partial/thumb.jpg')",
  [workerProject1, userF],
);
const claimed1 = await one("select * from public.claim_next_job('worker-a', 300)");
check(
  "claim_next_job leases the queued job",
  claimed1.locked_by === "worker-a" && claimed1.status === "in_progress" && claimed1.attempts === 1,
  { locked_by: claimed1.locked_by, status: claimed1.status, attempts: claimed1.attempts },
);
check(
  "the wrong worker cannot heartbeat the lease",
  (await one("select public.heartbeat_job($1, 'worker-b', 300) as ok", [claimed1.id])).ok === false,
);
check(
  "the owning worker can heartbeat the lease",
  (await one("select public.heartbeat_job($1, 'worker-a', 300) as ok", [claimed1.id])).ok === true,
);
check(
  "the wrong worker cannot report progress",
  (await one("select public.update_job_progress($1, 'worker-b', 50) as ok", [claimed1.id])).ok ===
    false,
);
check(
  "the owning worker can report progress",
  (await one("select public.update_job_progress($1, 'worker-a', 150) as ok", [claimed1.id])).ok ===
    true,
);
const clampedProgress = await one(
  "select progress_percent from public.processing_jobs where id = $1",
  [claimed1.id],
);
check("progress is clamped to 100", clampedProgress.progress_percent === 100, clampedProgress);
check(
  "the wrong worker cannot complete the job",
  (await one("select public.complete_job($1, 'worker-b') as ok", [claimed1.id])).ok === false,
);
check(
  "the wrong worker cannot fail the job",
  (await one("select public.fail_job($1, 'worker-b', 'stolen', true) as ok", [claimed1.id])).ok ===
    false,
);
check(
  "the owning worker can fail the job permanently",
  (
    await one("select public.fail_job($1, 'worker-a', 'simulated permanent failure', true) as ok", [
      claimed1.id,
    ])
  ).ok === true,
);
const failedJob = await one("select status, locked_by from public.processing_jobs where id = $1", [
  claimed1.id,
]);
const failedProject = await one(
  "select status, credits_reserved from public.projects where id = $1",
  [workerProject1],
);
const workerWalletAfterFail = await one(
  "select balance from public.credit_wallets where user_id = $1",
  [userF],
);
check(
  "a permanent failure clears the lease and marks the job failed",
  failedJob.status === "failed" && failedJob.locked_by === null,
  failedJob,
);
check(
  "a permanent failure marks the project failed and refunds it",
  failedProject.status === "failed" && failedProject.credits_reserved === 0,
  failedProject,
);
check(
  "the failed reservation returns to the wallet",
  workerWalletAfterFail.balance === 30,
  workerWalletAfterFail.balance,
);
const failedClip = await one(
  "select render_status, storage_path, thumbnail_path from public.clips where project_id = $1",
  [workerProject1],
);
check(
  "a terminal failure clears rendered clip paths",
  failedClip.render_status === "failed" &&
    failedClip.storage_path === null &&
    failedClip.thumbnail_path === null,
  failedClip,
);
check(
  "a second failure report from the old lease is ignored",
  (await one("select public.fail_job($1, 'worker-a', 'again', true) as ok", [claimed1.id])).ok ===
    false,
);

const workerProject2 = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
await one(
  "select public.create_link_project($1, $2, 'Worker completion', 'https://example.com/w2', 5, 'reserve:worker:2')",
  [userF, workerProject2],
);
const claimed2 = await one("select * from public.claim_next_job('worker-a', 300)");
check(
  "the next queued job is leased",
  claimed2.project_id === workerProject2 && claimed2.locked_by === "worker-a",
  claimed2,
);
check(
  "the owning worker can complete the job",
  (await one("select public.complete_job($1, 'worker-a') as ok", [claimed2.id])).ok === true,
);
const completedJob = await one(
  "select status, progress_percent, locked_by from public.processing_jobs where id = $1",
  [claimed2.id],
);
check(
  "completion records 100 percent and clears the lease",
  completedJob.status === "completed" &&
    completedJob.progress_percent === 100 &&
    completedJob.locked_by === null,
  completedJob,
);

const workerProject3 = "ffffffff-ffff-4fff-8fff-ffffffffffff";
await one(
  "select public.create_link_project($1, $2, 'Render completion', 'https://example.com/w3', 5, 'reserve:worker:3')",
  [userF, workerProject3],
);
const claimed3 = await one("select * from public.claim_next_job('worker-a', 300)");
await db.query("update public.projects set status = 'processing' where id = $1", [workerProject3]);
check(
  "the wrong worker cannot finish a render job",
  (await one("select public.finish_render_job($1, 'worker-b') as ok", [claimed3.id])).ok === false,
);
check(
  "the owning worker can finish a render job",
  (await one("select public.finish_render_job($1, 'worker-a') as ok", [claimed3.id])).ok === true,
);
const renderedProject = await one("select status from public.projects where id = $1", [
  workerProject3,
]);
check(
  "finishing the render completes the project",
  renderedProject.status === "completed",
  renderedProject,
);

// Expired leases are reclaimed by another worker.
const workerProject4 = "11111111-2222-4333-8444-555555555555";
await one(
  "select public.create_link_project($1, $2, 'Expired lease', 'https://example.com/w4', 5, 'reserve:worker:4')",
  [userF, workerProject4],
);
const claimed4 = await one("select * from public.claim_next_job('worker-a', 300)");
await db.query(
  "update public.processing_jobs set lease_expires_at = now() - interval '1 minute' where id = $1",
  [claimed4.id],
);
const reclaimed = await one("select * from public.claim_next_job('worker-b', 300)");
check(
  "an expired lease is reclaimed by another worker",
  reclaimed.id === claimed4.id && reclaimed.locked_by === "worker-b" && reclaimed.attempts === 2,
  { id: reclaimed.id, locked_by: reclaimed.locked_by, attempts: reclaimed.attempts },
);

// A job that crashes the worker on every attempt must be failed and refunded, not requeued forever.
const workerProject5 = "22222222-3333-4444-8555-666666666666";
await one(
  "select public.create_link_project($1, $2, 'Final attempt crash', 'https://example.com/w5', 5, 'reserve:worker:5')",
  [userF, workerProject5],
);
await db.query(
  "insert into public.clips (project_id, user_id, title, start_time, end_time, render_status, storage_path, thumbnail_path) values ($1, $2, 'Rendered before crash', 0, 30, 'rendered', 'renders/crash/clip.mp4', 'renders/crash/thumb.jpg')",
  [workerProject5, userF],
);

const claim5a = await one("select * from public.claim_next_job('worker-a', 300)");
await db.query(
  "update public.processing_jobs set lease_expires_at = now() - interval '1 minute' where id = $1",
  [claim5a.id],
);
const claim5b = await one("select * from public.claim_next_job('worker-b', 300)");
await db.query(
  "update public.processing_jobs set lease_expires_at = now() - interval '1 minute' where id = $1",
  [claim5b.id],
);
const claim5c = await one("select * from public.claim_next_job('worker-c', 300)");
await db.query(
  "update public.processing_jobs set lease_expires_at = now() - interval '1 minute' where id = $1",
  [claim5c.id],
);

const crashBalanceBefore = await one(
  "select balance from public.credit_wallets where user_id = $1",
  [userF],
);
const afterReaper = await one("select * from public.claim_next_job('worker-d', 300)");
const reapedJob = await one(
  "select status, attempts, max_attempts, locked_by from public.processing_jobs where id = $1",
  [claim5c.id],
);
const reapedProject = await one(
  "select status, credits_reserved from public.projects where id = $1",
  [workerProject5],
);
const reapedClip = await one(
  "select render_status, storage_path, thumbnail_path from public.clips where project_id = $1",
  [workerProject5],
);
const crashBalanceAfter = await one(
  "select balance from public.credit_wallets where user_id = $1",
  [userF],
);

check(
  "a job at max_attempts is not reclaimed after its lease expires",
  !afterReaper || afterReaper.id !== claim5c.id,
  afterReaper,
);
check(
  "the final expired attempt is failed with its lease cleared",
  reapedJob.status === "failed" &&
    reapedJob.attempts === 3 &&
    reapedJob.max_attempts === 3 &&
    reapedJob.locked_by === null,
  reapedJob,
);
check(
  "the reaper fails the project and releases its reservation",
  reapedProject.status === "failed" && reapedProject.credits_reserved === 0,
  reapedProject,
);
check(
  "the reaper clears rendered clip paths before refunding",
  reapedClip.render_status === "failed" &&
    reapedClip.storage_path === null &&
    reapedClip.thumbnail_path === null,
  reapedClip,
);
check(
  "the final-attempt refund returns to the wallet",
  crashBalanceAfter.balance === crashBalanceBefore.balance + 5,
  { before: crashBalanceBefore.balance, after: crashBalanceAfter.balance },
);

// ---------------------------------------------------------------------------
// Permissions and defaults
// ---------------------------------------------------------------------------

const authenticatedCheckout = await one(
  "select has_function_privilege('authenticated', 'public.begin_checkout(uuid, integer)', 'execute') as can",
);
const serviceCheckout = await one(
  "select has_function_privilege('service_role', 'public.begin_checkout(uuid, integer)', 'execute') as can",
);
const authenticatedWebhook = await one(
  "select has_function_privilege('authenticated', 'public.claim_webhook_event(text, text, jsonb)', 'execute') as can",
);
const serviceWebhook = await one(
  "select has_function_privilege('service_role', 'public.claim_webhook_event(text, text, jsonb)', 'execute') as can",
);
const captionDefault = await one(
  "select column_default from information_schema.columns where table_schema = 'public' and table_name = 'clips' and column_name = 'caption_style'",
);

check(
  "authenticated users cannot start checkouts directly",
  authenticatedCheckout.can === false,
  authenticatedCheckout,
);
check("the service role can start checkouts", serviceCheckout.can === true, serviceCheckout);
check(
  "authenticated users cannot claim webhooks",
  authenticatedWebhook.can === false,
  authenticatedWebhook,
);
check("the service role can claim webhooks", serviceWebhook.can === true, serviceWebhook);
check(
  "the caption default uses the current ice colour",
  typeof captionDefault.column_default === "string" &&
    captionDefault.column_default.includes("#9BE7FF"),
  captionDefault.column_default,
);

await db.close();

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\nAll SQL checks passed.");
