import { z } from "zod";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { deleteObjects, isR2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  confirmation: z.literal("DELETE"),
});

type StorageRow = {
  storage_path: string | null;
  thumbnail_path?: string | null;
};

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

    const [{ data: projects, error: projectsError }, { data: clips, error: clipsError }] =
      await Promise.all([
        admin
          .from("projects")
          .select("storage_path")
          .eq("user_id", user.id)
          .returns<StorageRow[]>(),
        admin
          .from("clips")
          .select("storage_path, thumbnail_path")
          .eq("user_id", user.id)
          .returns<StorageRow[]>(),
      ]);

    if (projectsError || clipsError) {
      throw new AppError("INTERNAL_ERROR", "Could not list stored objects before deletion.", {
        details: projectsError?.message ?? clipsError?.message,
      });
    }

    const keys = [
      ...(projects ?? []).map((row) => row.storage_path),
      ...(clips ?? []).flatMap((row) => [row.storage_path, row.thumbnail_path]),
    ].filter((key): key is string => typeof key === "string" && key.length > 0);

    if (keys.length > 0 && !isR2Configured()) {
      throw new AppError(
        "CONFIGURATION_ERROR",
        "Stored video objects exist, but object storage is not configured in this process. Deletion is paused so the files are not orphaned. Contact support.",
      );
    }

    let deletedObjects = 0;
    if (keys.length > 0) {
      try {
        deletedObjects = await deleteObjects(keys);
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
