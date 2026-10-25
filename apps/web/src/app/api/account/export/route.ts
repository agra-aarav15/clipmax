import { NextResponse } from "next/server";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
const MAX_ROWS = 20_000;

async function fetchAll<T>(
  table: string,
  select: string,
  userId: string,
  orderColumn = "created_at",
): Promise<T[]> {
  const admin = requireAdminClient();
  const rows: T[] = [];

  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from(table)
      .select(select)
      .eq("user_id", userId)
      .order(orderColumn, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new AppError("INTERNAL_ERROR", `Could not export ${table}.`, {
        details: error.message,
      });
    }

    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function GET() {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();

    const [{ data: profile, error: profileError }, { data: wallet, error: walletError }, { data: subscription, error: subscriptionError }] =
      await Promise.all([
        admin
          .from("profiles")
          .select("id, email, display_name, avatar_url, plan, created_at, updated_at")
          .eq("id", user.id)
          .maybeSingle(),
        admin
          .from("credit_wallets")
          .select("balance, updated_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        admin
          .from("subscriptions")
          .select(
            "provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end, cancel_at_period_end, created_at, updated_at",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    if (profileError) {
      throw new AppError("INTERNAL_ERROR", "Could not export the profile.", {
        details: profileError.message,
      });
    }
    if (walletError) {
      throw new AppError("INTERNAL_ERROR", "Could not export the wallet.", {
        details: walletError.message,
      });
    }
    if (subscriptionError) {
      throw new AppError("INTERNAL_ERROR", "Could not export the subscription.", {
        details: subscriptionError.message,
      });
    }

    const [projects, jobs, clips, transcripts, ledger] = await Promise.all([
      fetchAll("projects", "*", user.id),
      fetchAll("processing_jobs", "*", user.id),
      fetchAll("clips", "*", user.id),
      fetchAll("transcripts", "*", user.id),
      fetchAll("credit_ledger", "*", user.id),
    ]);

    const exportedAt = new Date().toISOString();
    const payload = {
      export: {
        product: "ClipMax",
        format_version: 1,
        exported_at: exportedAt,
        note: "This archive contains the rows the ClipMax service holds for your account. Card data is never stored by ClipMax; payment identifiers come from Razorpay.",
      },
      account: {
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
        providers: user.app_metadata?.providers ?? null,
      },
      profile: profile ?? null,
      wallet: wallet ?? null,
      subscription: subscription ?? null,
      counts: {
        projects: projects.length,
        processing_jobs: jobs.length,
        clips: clips.length,
        transcripts: transcripts.length,
        credit_ledger: ledger.length,
      },
      projects,
      processing_jobs: jobs,
      clips,
      transcripts,
      credit_ledger: ledger,
    };

    const date = exportedAt.slice(0, 10);
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="clipmax-export-${date}.json"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  });
}
