import { z } from "zod";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { deleteObjects, deletePrefixes, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  confirmation: z.literal("DELETE"),
});

type StorageRow = {
  id: string;
  storage_path: string | null;
  thumbnail_path?: string | null;
};

type AdminClient = ReturnType<typeof requireAdminClient>;

const PAGE_SIZE = 1000;

/** PostgREST caps a page at 1000 rows, so a single select can silently miss objects. */
async function listAllStorageRows(
  admin: AdminClient,
  table: "projects" | "clips",
  columns: string,
  userId: string,
): Promise<StorageRow[]> {
  const rows: StorageRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from(table)
      .select(columns)
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as unknown as StorageRow[];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { supabase, user } = await requireUser();
    const admin = requireAdminClient();

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Type DELETE exactly to confirm account deletion.", {
        details: parsed.error.issues,
      });
    }

    const { data: subscription, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("status, provider_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle<{ status: string; provider_subscription_id: string | null }>();

    if (subscriptionError) {
      throw new AppError("INTERNAL_ERROR", "Could not check the subscription before deletion.", {
        details: subscriptionError.message,
      });
    }

    if (subscription && !["canceled", "completed"].includes(subscription.status)) {
      throw new AppError(
        "PROJECT_NOT_READY",
        "Cancel the subscription in Billing before deleting the account. Razorpay could otherwise keep charging a closed account.",
      );
    }

    // A worker can upload a render after the row sweep. Refuse deletion while any project or job is
    // still moving, so the account cannot disappear underneath an active worker.
    const [
      { data: activeProjects, error: activeProjectsError },
      { data: activeJobs, error: activeJobsError },
    ] = await Promise.all([
      admin
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["uploading", "ready", "processing"])
        .limit(1),
      admin
        .from("processing_jobs")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["queued", "in_progress"])
        .limit(1),
    ]);

    if (activeProjectsError || activeJobsError) {
      throw new AppError("INTERNAL_ERROR", "Could not check active work before deletion.", {
        details: activeProjectsError?.message ?? activeJobsError?.message,
      });
    }

    if ((activeProjects?.length ?? 0) > 0 || (activeJobs?.length ?? 0) > 0) {
      throw new AppError(
        "PROJECT_NOT_READY",
        "A project is still uploading or processing. Wait for it to finish, or delete it, before deleting the account.",
      );
    }

    const [projects, clips] = await Promise.all([
      listAllStorageRows(admin, "projects", "id, storage_path", user.id),
      listAllStorageRows(admin, "clips", "id, storage_path, thumbnail_path", user.id),
    ]).catch((error: unknown) => {
      throw new AppError("INTERNAL_ERROR", "Could not list stored objects before deletion.", {
        details: error instanceof Error ? error.message : undefined,
      });
    });

    const keys = [
      ...projects.map((row) => row.storage_path),
      ...clips.flatMap((row) => [row.storage_path, row.thumbnail_path]),
    ].filter((key): key is string => typeof key === "string" && key.length > 0);

    if (keys.length > 0 && !isR2Configured()) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        "Stored video objects exist, but object storage is not configured in this process. Deletion is paused so the files are not orphaned. Contact support.",
      );
    }

    let deletedObjects = 0;
    if (isR2Configured()) {
      try {
        deletedObjects += await deleteObjects(keys);
        // Defense in depth: remove objects left by an old retry or a crashed worker even when their
        // rows are already gone. Both key prefixes are owned by this user.
        deletedObjects += await deletePrefixes([`sources/${user.id}/`, `renders/${user.id}/`]);
      } catch (error) {
        throw new AppError(
          "INTERNAL_ERROR",
          "Object storage could not delete the files, so the account was not removed. Try again, or contact support.",
          { cause: error },
        );
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      throw new AppError("INTERNAL_ERROR", "Could not delete the account record.", {
        details: deleteError.message,
      });
    }

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // The auth user is already gone; a stale cookie is harmless and will fail verification.
    }

    return jsonOk({ deleted: true, deletedObjects });
  });
}
