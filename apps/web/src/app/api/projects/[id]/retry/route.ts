import {
  MAX_SOURCE_DURATION_SECONDS,
  creditsForDurationSeconds,
  type InitiateProcessingResponse,
} from "@clipmax/shared";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { isUuid } from "@/lib/ids";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { deleteObjects, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CREDITS = creditsForDurationSeconds(MAX_SOURCE_DURATION_SECONDS);

type RetryResult = {
  ok: boolean;
  code?: string;
  jobId?: string;
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();
    const { id: projectId } = await params;

    await enforceRateLimit(admin, RATE_LIMITS.retry, user.id);

    if (!isUuid(projectId)) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    // Capture the old render keys before retry_project deletes the clip rows. The RPC is the source
    // of truth for credits and queueing, so the cleanup is best effort after it succeeds.
    const { data: staleClips, error: staleClipsError } = await admin
      .from("clips")
      .select("storage_path, thumbnail_path")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .returns<{ storage_path: string | null; thumbnail_path: string | null }[]>();

    if (staleClipsError) {
      console.error("[projects] could not list old clips before retry", {
        message: staleClipsError.message,
      });
    }

    // The RPC locks the project row, releases the old hold, takes a fresh reservation key, clears
    // stale clips, and queues a new transcribe job in one transaction.
    const { data, error } = await admin.rpc("retry_project", {
      p_user_id: user.id,
      p_project_id: projectId,
      p_credits: MAX_CREDITS,
    });

    if (error) {
      console.error("[projects] retry_project failed", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("INTERNAL_ERROR", "Could not retry the project. No credits were used.");
    }

    const result = data as RetryResult | null;

    if (!result || typeof result.ok !== "boolean") {
      console.error("[projects] retry_project returned an unexpected result", data);
      throw new AppError("INTERNAL_ERROR", "Could not retry the project. No credits were used.");
    }

    if (!result.ok) {
      if (result.code === "not_found") {
        throw new AppError("NOT_FOUND", "Project not found.");
      }
      if (result.code === "not_ready") {
        throw new AppError("PROJECT_NOT_READY", "Only a failed project can be retried.");
      }
      if (result.code === "no_source") {
        throw new AppError(
          "PROJECT_NOT_READY",
          "This project has no stored source. Create a new project instead.",
        );
      }
      if (result.code === "insufficient_credits") {
        throw new AppError(
          "INSUFFICIENT_CREDITS",
          `A retry can use up to ${MAX_CREDITS} credits. Add credits or choose a shorter source.`,
        );
      }
      throw new AppError("INTERNAL_ERROR", "Could not retry the project. No credits were used.");
    }

    const staleKeys = (staleClips ?? [])
      .flatMap((clip) => [clip.storage_path, clip.thumbnail_path])
      .filter((key): key is string => typeof key === "string" && key.length > 0);

    if (staleKeys.length > 0 && isR2Configured()) {
      try {
        await deleteObjects(staleKeys);
      } catch (cleanupError) {
        // The retry already succeeded and credits are reserved. Do not turn a storage cleanup
        // failure into a failed retry; account deletion sweeps the user's prefixes as a backstop.
        console.error("[projects] retry succeeded but old render cleanup failed", cleanupError);
      }
    }

    const response: InitiateProcessingResponse = {
      projectId,
      status: "ready",
      jobId: typeof result.jobId === "string" ? result.jobId : null,
    };

    return jsonOk(response);
  });
}
