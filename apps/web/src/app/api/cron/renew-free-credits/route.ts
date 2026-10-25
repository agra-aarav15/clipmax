import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Monthly free-plan renewal.
 *
 * The SQL function is idempotent per account per UTC month, so a retried or duplicated cron call
 * cannot grant twice. Callers must present `Authorization: Bearer $CRON_SECRET`; Vercel Cron sends
 * this header automatically when CRON_SECRET is set.
 */
function isAuthorized(request: Request, secret: string): boolean {
  const provided = request.headers.get("authorization");
  if (!provided) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(provided);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "CRON_SECRET is not set, so scheduled renewals cannot be authenticated.",
        },
      },
      { status: 503 },
    );
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized." } },
      { status: 401 },
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "Supabase service-role credentials are missing.",
        },
      },
      { status: 503 },
    );
  }

  const { data, error } = await admin.rpc("renew_free_plan_credits");
  if (error) {
    console.error("[cron] free-plan renewal failed", { code: error.code, message: error.message });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "The renewal function failed." } },
      { status: 500 },
    );
  }

  const granted = typeof data === "number" ? data : 0;
  console.info("[cron] free-plan renewal complete", { granted });

  return NextResponse.json({
    ok: true,
    granted,
    cycle: new Date().toISOString().slice(0, 7),
  });
}
