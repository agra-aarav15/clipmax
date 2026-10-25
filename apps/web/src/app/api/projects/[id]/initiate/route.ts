import {
  MAX_SOURCE_BYTES,
  MAX_SOURCE_DURATION_SECONDS,
  creditsForDurationSeconds,
  type InitiateProcessingResponse,
} from "@clipmax/shared";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { headObject } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CREDITS = creditsForDurationSeconds(MAX_SOURCE_DURATION_SECONDS);

type ProjectRow = {
  id: string;
  user_id: string;
  status: string;
  source_type: string;
  storage_path: string | null;
  size_bytes: number | null;
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();
    const { id: projectId } = await params;

    await enforceRateLimit(admin, RATE_LIMITS.initiate, user.id);

    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, user_id, status, source_type, storage_path, size_bytes")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<ProjectRow>();

    if (projectError) {
      throw new AppError("INTERNAL_ERROR", "Could not load the project.", {
        details: projectError.message,
      });
    }

    if (!project) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    if (
      project.status !== "uploading" ||
      project.source_type !== "upload" ||
      !project.storage_path
    ) {
      throw new AppError("PROJECT_NOT_READY", "This project cannot be initiated.");
    }

    const object = await headObject(project.storage_path);
    if (!object) {
      throw new AppError(
        "UPLOAD_NOT_FOUND",
        "The upload did not reach storage. Try the upload again.",
      );
    }

    const actualSize = object.ContentLength ?? 0;
    if (actualSize <= 0) {
      throw new AppError("UPLOAD_NOT_FOUND", "The uploaded file is empty.");
    }
    if (actualSize > MAX_SOURCE_BYTES) {
      throw new AppError("UPLOAD_TOO_LARGE", "The uploaded file is larger than the 500 MB limit.");
    }

    const reserveKey = `reserve:${projectId}`;
    const { data: reserved, error: reserveError } = await admin.rpc("reserve_credits", {
      p_user_id: user.id,
      p_project_id: projectId,
      p_credits: MAX_CREDITS,
      p_idempotency_key: reserveKey,
    });

    if (reserveError) {
      throw new AppError("INTERNAL_ERROR", "Could not reserve credits.", {
        details: reserveError.message,
      });
    }

    if (reserved !== true) {
      throw new AppError(
        "INSUFFICIENT_CREDITS",
        `This source can use up to ${MAX_CREDITS} credits. Add credits or choose a shorter source.`,
      );
    }

    const { error: updateError } = await admin
      .from("projects")
      .update({ status: "ready", size_bytes: actualSize })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (updateError) {
      await admin.rpc("refund_project_credits", { p_project_id: projectId });
      throw new AppError("INTERNAL_ERROR", "Could not start processing.", {
        details: updateError.message,
      });
    }

    const { data: jobId, error: jobError } = await admin.rpc("enqueue_job", {
      p_project_id: projectId,
      p_job_type: "transcribe",
      p_payload: {},
    });

    if (jobError) {
      await admin.rpc("refund_project_credits", { p_project_id: projectId });
      await admin
        .from("projects")
        .update({ status: "uploading", error_message: jobError.message })
        .eq("id", projectId);
      throw new AppError("INTERNAL_ERROR", "Could not queue the job.", {
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
