import {
  MAX_SOURCE_DURATION_SECONDS,
  creditsForDurationSeconds,
  linkProjectRequestSchema,
  type InitiateProcessingResponse,
} from "@clipmax/shared";
import { randomUUID } from "node:crypto";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CREDITS = creditsForDurationSeconds(MAX_SOURCE_DURATION_SECONDS);

function titleFromUrl(value: string): string {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return `${host} source`.slice(0, 120);
  } catch {
    return "Linked source";
  }
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();
    await enforceRateLimit(admin, RATE_LIMITS.link, user.id);

    const body = await request.json().catch(() => null);
    const parsed = linkProjectRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(
        "UNSUPPORTED_SOURCE",
        parsed.error.issues[0]?.message ?? "Unsupported link.",
        {
          details: parsed.error.issues,
        },
      );
    }

    const projectId = randomUUID();

    const { error: insertError } = await admin.from("projects").insert({
      id: projectId,
      user_id: user.id,
      title: titleFromUrl(parsed.data.url),
      source_type: "public_url",
      source_url: parsed.data.url,
      status: "ready",
    });

    if (insertError) {
      throw new AppError("INTERNAL_ERROR", "Could not create the project.", {
        details: insertError.message,
      });
    }

    const { data: reserved, error: reserveError } = await admin.rpc("reserve_credits", {
      p_user_id: user.id,
      p_project_id: projectId,
      p_credits: MAX_CREDITS,
      p_idempotency_key: `reserve:${projectId}`,
    });

    if (reserveError) {
      await admin.from("projects").delete().eq("id", projectId);
      throw new AppError("INTERNAL_ERROR", "Could not reserve credits.", {
        details: reserveError.message,
      });
    }

    if (reserved !== true) {
      await admin.from("projects").delete().eq("id", projectId);
      throw new AppError(
        "INSUFFICIENT_CREDITS",
        `This source can use up to ${MAX_CREDITS} credits. Add credits or choose a shorter source.`,
      );
    }

    const { data: jobId, error: jobError } = await admin.rpc("enqueue_job", {
      p_project_id: projectId,
      p_job_type: "transcribe",
      p_payload: { source_url: parsed.data.url },
    });

    if (jobError) {
      await admin.rpc("refund_project_credits", { p_project_id: projectId });
      await admin
        .from("projects")
        .update({ status: "failed", error_message: jobError.message })
        .eq("id", projectId);
      throw new AppError("INTERNAL_ERROR", "Could not queue the link.", {
        details: jobError.message,
      });
    }

    const response: InitiateProcessingResponse = {
      projectId,
      status: "ready",
      jobId: typeof jobId === "string" ? jobId : null,
    };

    return jsonOk(response);
  });
}
