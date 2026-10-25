import { NextResponse } from "next/server";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LedgerRow = {
  created_at: string;
  reason: string;
  delta: number;
  project_id: string | null;
  idempotency_key: string;
  metadata: Record<string, unknown> | null;
};

function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export async function GET() {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();

    const { data, error } = await admin
      .from("credit_ledger")
      .select("created_at, reason, delta, project_id, idempotency_key, metadata")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(10_000)
      .returns<LedgerRow[]>();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Could not export the credit ledger.", {
        details: error.message,
      });
    }

    const header = [
      "created_at",
      "reason",
      "delta",
      "project_id",
      "idempotency_key",
      "stage",
      "actual_credits",
    ];

    const lines = [
      header.join(","),
      ...(data ?? []).map((row) =>
        [
          cell(row.created_at),
          cell(row.reason),
          cell(row.delta),
          cell(row.project_id),
          cell(row.idempotency_key),
          cell(row.metadata?.stage),
          cell(row.metadata?.actual_credits),
        ].join(","),
      ),
    ];

    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(`\uFEFF${lines.join("\r\n")}\r\n`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="clipmax-credit-ledger-${date}.csv"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  });
}
