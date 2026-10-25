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

await db.close();

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\nAll SQL checks passed.");
