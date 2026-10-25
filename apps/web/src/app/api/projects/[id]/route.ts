import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { isUuid } from "@/lib/ids";
import { deleteObject, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  user_id: string;
  status: string;
  storage_path: string | null;
};

type ClipRow = {
  storage_path: string | null;
  thumbnail_path: string | null;
};

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { supabase, user } = await requireUser();
    const admin = requireAdminClient();
    const { id: projectId } = await params;

    if (!isUuid(projectId)) {
      throw new AppError("NOT_FOUND", "Project not found.");
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, status, storage_path")
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

    if (project.status === "processing" || project.status === "ready") {
      throw new AppError(
        "PROJECT_NOT_READY",
        "This project is still in the queue. Delete it after the current job finishes or fails.",
      );
    }

    const { data: activeJobs, error: activeJobsError } = await supabase
      .from("processing_jobs")
      .select("id")
      .eq("project_id", projectId)
      .in("status", ["queued", "in_progress"])
      .limit(1)
      .returns<{ id: string }[]>();

    if (activeJobsError) {
      throw new AppError("INTERNAL_ERROR", "Could not check for active jobs.", {
        details: activeJobsError.message,
      });
    }

    if ((activeJobs ?? []).length > 0) {
      throw new AppError(
        "PROJECT_NOT_READY",
        "A worker job is still queued for this project. Delete it after that job finishes or fails.",
      );
    }

    if (!isR2Configured()) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        "Cloudflare R2 is not configured, so the stored source cannot be deleted. Nothing was removed.",
      );
    }

    const { data: clips, error: clipsError } = await supabase
      .from("clips")
      .select("storage_path, thumbnail_path")
      .eq("project_id", projectId)
      .returns<ClipRow[]>();

    if (clipsError) {
      throw new AppError("INTERNAL_ERROR", "Could not load the project's clips.", {
        details: clipsError.message,
      });
    }

    const keys = new Set<string>();
    if (project.storage_path) keys.add(project.storage_path);
    for (const clip of clips ?? []) {
      if (clip.storage_path) keys.add(clip.storage_path);
      if (clip.thumbnail_path) keys.add(clip.thumbnail_path);
    }

    try {
      await Promise.all([...keys].map((key) => deleteObject(key)));
    } catch (cause) {
      throw new AppError(
        "INTERNAL_ERROR",
        "Could not remove the stored objects, so the project was not deleted. Try again.",
        { cause },
      );
    }

    const { error: deleteError } = await admin
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (deleteError) {
      throw new AppError("INTERNAL_ERROR", "Could not delete the project row.", {
        details: deleteError.message,
      });
    }

    return jsonOk({ ok: true });
  });
}
