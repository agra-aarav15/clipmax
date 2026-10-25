import {
  MAX_SOURCE_BYTES,
  MAX_SOURCE_DURATION_SECONDS,
  creditsForDurationSeconds,
  type InitiateProcessingResponse,
} from "@clipmax/shared";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { isUuid } from "@/lib/ids";
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

type BeginProcessingResult = {
  ok: boolean;
  code?: string;
  jobId?: string;
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();
    const { id: projectId } = await params;

    if (!isUuid(projectId)) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    await enforceRateLimit(admin, RATE_LIMITS.initiate, user.id);

    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("id, user_id, status, source_type, storage_path, size_bytes")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle<ProjectRow>();

    if (projectError) {
      console.error("[projects] could not load project for initiation", {
        code: projectError.code,
        message: projectError.message,
      });
      throw new AppError("INTERNAL_ERROR", "Could not load the project. Try again.");
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

    // One transaction reserves the credits, records the verified size, marks the project ready,
    // and queues the transcribe job. There is no compensation chain left to drift out of sync.
    const { data, error } = await admin.rpc("begin_upload_processing", {
      p_user_id: user.id,
      p_project_id: projectId,
      p_credits: MAX_CREDITS,
      p_size_bytes: actualSize,
    });

    if (error) {
      console.error("[projects] begin_upload_processing failed", {
        code: error.code,
        message: error.message,
      });
      throw new AppError("INTERNAL_ERROR", "Could not start processing. No credits were used.");
    }

    const result = data as BeginProcessingResult | null;

    if (!result || typeof result.ok !== "boolean") {
      console.error("[projects] begin_upload_processing returned an unexpected result", data);
      throw new AppError("INTERNAL_ERROR", "Could not start processing. No credits were used.");
    }

    if (!result.ok) {
      if (result.code === "insufficient_credits") {
        throw new AppError(
          "INSUFFICIENT_CREDITS",
          `This source can use up to ${MAX_CREDITS} credits. Add credits or choose a shorter source.`,
        );
      }
      if (result.code === "not_found") {
        throw new AppError("NOT_FOUND", "Project not found.");
      }
      if (result.code === "not_ready") {
        throw new AppError("PROJECT_NOT_READY", "This project cannot be initiated.");
      }
      throw new AppError("INTERNAL_ERROR", "Could not start processing. No credits were used.");
    }

    const response: InitiateProcessingResponse = {
      projectId,
      status: "ready",
      jobId: typeof result.jobId === "string" ? result.jobId : null,
    };

    return jsonOk(response);
  });
}
