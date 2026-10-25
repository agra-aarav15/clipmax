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

type CreateLinkResult = {
  ok: boolean;
  code?: string;
  jobId?: string;
};

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

    // One transaction creates the project, takes the reservation, and queues the job. A failure
    // leaves no half-created project behind and cannot charge for a link that was never queued.
    const { data, error } = await admin.rpc("create_link_project", {
      p_user_id: user.id,
      p_project_id: projectId,
      p_title: titleFromUrl(parsed.data.url),
      p_source_url: parsed.data.url,
      p_credits: MAX_CREDITS,
      p_reservation_key: `reserve:${projectId}`,
    });

    if (error) {
      console.error("[projects] create_link_project failed", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("INTERNAL_ERROR", "Could not create the link. No credits were used.");
    }

    const result = data as CreateLinkResult | null;

    if (!result || typeof result.ok !== "boolean") {
      console.error("[projects] create_link_project returned an unexpected result", data);
      throw new AppError("INTERNAL_ERROR", "Could not create the link. No credits were used.");
    }

    if (!result.ok) {
      if (result.code === "insufficient_credits") {
        throw new AppError(
          "INSUFFICIENT_CREDITS",
          `This source can use up to ${MAX_CREDITS} credits. Add credits or choose a shorter source.`,
        );
      }

      throw new AppError("INTERNAL_ERROR", "Could not create the link. No credits were used.");
    }

    const response: InitiateProcessingResponse = {
      projectId,
      status: "ready",
      jobId: typeof result.jobId === "string" ? result.jobId : null,
    };

    return jsonOk(response);
  });
}
