import {
  MAX_SOURCE_BYTES,
  MAX_SOURCE_DURATION_SECONDS,
  MIME_TO_EXTENSION,
  creditsForDurationSeconds,
  presignRequestSchema,
  type PresignResponse,
} from "@clipmax/shared";
import { randomUUID } from "node:crypto";

import { requireAdminClient, requireUser } from "@/lib/api/auth";
import { AppError } from "@/lib/api/errors";
import { handleRoute, jsonOk } from "@/lib/api/response";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { presignPut } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function titleFromFilename(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (base || "Untitled source").slice(0, 120);
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const { user } = await requireUser();
    const admin = requireAdminClient();
    await enforceRateLimit(admin, RATE_LIMITS.presign, user.id);

    const body = await request.json().catch(() => null);
    const parsed = presignRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Choose an MP4, MOV, or WebM video.", {
        details: parsed.error.issues,
      });
    }

    if (parsed.data.fileSize > MAX_SOURCE_BYTES) {
      throw new AppError("UPLOAD_TOO_LARGE", "The file is larger than the 500 MB limit.");
    }

    const projectId = randomUUID();
    const extension = MIME_TO_EXTENSION[parsed.data.fileType];
    const storagePath = `sources/${user.id}/${projectId}/source.${extension}`;
    const title = titleFromFilename(parsed.data.fileName);

    const { error: insertError } = await admin.from("projects").insert({
      id: projectId,
      user_id: user.id,
      title,
      source_type: "upload",
      storage_path: storagePath,
      original_filename: parsed.data.fileName,
      mime_type: parsed.data.fileType,
      size_bytes: parsed.data.fileSize,
      status: "uploading",
    });

    if (insertError) {
      throw new AppError("INTERNAL_ERROR", "Could not create the project.", {
        details: insertError.message,
      });
    }

    try {
      const signed = await presignPut({
        key: storagePath,
        contentType: parsed.data.fileType,
        contentLength: parsed.data.fileSize,
      });

      const response: PresignResponse = {
        projectId,
        storagePath,
        uploadUrl: signed.uploadUrl,
        method: "PUT",
        headers: signed.headers,
        expiresAt: new Date(Date.now() + signed.expiresIn * 1000).toISOString(),
        maxCredits: creditsForDurationSeconds(MAX_SOURCE_DURATION_SECONDS),
      };

      return jsonOk(response);
    } catch (error) {
      // Do not leave an unuploadable project behind when R2 is misconfigured.
      await admin.from("projects").delete().eq("id", projectId);
      throw error;
    }
  });
}
