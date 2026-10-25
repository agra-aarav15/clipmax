import { z } from "zod";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(60, "Keep the display name under 60 characters.")
    .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Remove control characters."),
});

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "That display name is not valid.", {
        details: parsed.error.issues,
      });
    }

    const { data, error } = await admin
      .from("profiles")
      .update({ display_name: parsed.data.displayName })
      .eq("id", user.id)
      .select("display_name")
      .maybeSingle<{ display_name: string | null }>();

    if (error) {
      throw new AppError("INTERNAL_ERROR", "Could not save the display name.", {
        details: error.message,
      });
    }

    if (!data) {
      throw new AppError("NOT_FOUND", "The profile row is missing for this account.");
    }

    return jsonOk({ displayName: data.display_name });
  });
}
