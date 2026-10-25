import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness and readiness for the web app.
 *
 * `ready` covers the integrations required by the core flow (sign in, upload, process, play,
 * download). Billing is reported separately because the studio still works without it. No secret
 * value is ever returned — only whether the group is configured.
 */
function has(...names: string[]): boolean {
  return names.every((name) => {
    const value = process.env[name];
    return typeof value === "string" && value.trim() !== "";
  });
}

export function GET() {
  const checks = {
    supabase:
      has("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
      has("SUPABASE_SERVICE_ROLE_KEY"),
    r2:
      (has("R2_ENDPOINT") || has("R2_ACCOUNT_ID")) &&
      has("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"),
    billing:
      has("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET") &&
      has("RAZORPAY_PLAN_STARTER_MONTHLY"),
    cron: has("CRON_SECRET"),
  };

  const ready = checks.supabase && checks.r2;

  return NextResponse.json(
    {
      status: ready ? "ok" : "degraded",
      ready,
      service: "clipmax-web",
      checks,
      commit: process.env.GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown",
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
