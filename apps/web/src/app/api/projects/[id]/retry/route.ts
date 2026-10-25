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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CREDITS = creditsForDurationSeconds(MAX_SOURCE_DURATION_SECONDS);

type ProjectRow = {
  id: string;
  status: string;
  source_type: string;
  storage_path: string | null;
  source_url: string | null;
  credits_reserved: number;
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { supabase, user } = await requireUser();
    const admin = requireAdminClient();
    const { id: projectId } = await params;

    await enforceRateLimit(admin, RATE_LIMITS.retry, user.id);

    if (!isUuid(projectId)) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, status, source_type, storage_path, source_url, credits_reserved")
      .eq("id", projectId)
      .maybeSingle<ProjectRow>();

    if (projectError) {
      throw new AppError("INTERNAL_ERROR", "Could not load the project.", {
        details: projectError.message,
      });
    }

    if (!project) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    if (project.status !== "failed") {
      throw new AppError("PROJECT_NOT_READY", "Only a failed project can be retried.");
    }

    if (!project.storage_path && !project.source_url) {
      throw new AppError(
        "PROJECT_NOT_READY",
        "This project has no stored source. Create a new project instead.",
      );
    }

    // A retry is only offered after a terminal failure. Refund any hold that survived a crash
    // before taking the new reservation; the refund function is idempotent per reservation.
    if (project.credits_reserved > 0) {
      const { error: refundError } = await admin.rpc("refund_project_credits", {
        p_project_id: projectId,
      });
      if (refundError) {
        throw new AppError("INTERNAL_ERROR", "Could not release the previous credit hold.", {
          details: refundError.message,
        });
      }
    }

    const { data: lastJob, error: lastJobError } = await supabase
      .from("processing_jobs")
      .select("id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (lastJobError) {
      throw new AppError("INTERNAL_ERROR", "Could not read the previous job.", {
        details: lastJobError.message,
      });
    }

    // A new key per retry so the second reservation is not confused with the failed one.
    const reservationKey = `reserve:${projectId}:retry:${lastJob?.id ?? "first"}`;

    const { data: reserved, error: reserveError } = await admin.rpc("reserve_credits", {
      p_user_id: user.id,
      p_project_id: projectId,
      p_credits: MAX_CREDITS,
      p_idempotency_key: reservationKey,
    });

    if (reserveError) {
      throw new AppError("INTERNAL_ERROR", "Could not reserve credits for the retry.", {
        details: reserveError.message,
      });
    }

    if (reserved !== true) {
      throw new AppError(
        "INSUFFICIENT_CREDITS",
        `A retry can use up to ${MAX_CREDITS} credits. Add credits or choose a shorter source.`,
      );
    }

    // A retry starts from a clean slate: draft and partial renders would otherwise be skipped or
    // mixed with the new highlights.
    const { error: clearError } = await admin
      .from("clips")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", user.id);

    if (clearError) {
      await admin.rpc("refund_project_credits", { p_project_id: projectId });
      throw new AppError("INTERNAL_ERROR", "Could not reset the previous clips.", {
        details: clearError.message,
      });
    }

    const { error: updateError } = await admin
      .from("projects")
      .update({ status: "ready", error_message: null })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (updateError) {
      await admin.rpc("refund_project_credits", { p_project_id: projectId });
      throw new AppError("INTERNAL_ERROR", "Could not re-queue the project.", {
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
        .update({ status: "failed", error_message: jobError.message })
        .eq("id", projectId);
      throw new AppError("INTERNAL_ERROR", "Could not queue the retry.", {
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
