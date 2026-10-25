import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { AppError } from "@/lib/api/errors";
import { getServerEnv } from "@/lib/env";

const DEFAULT_PUT_TTL_SECONDS = 15 * 60;
const DEFAULT_GET_TTL_SECONDS = 60 * 60;

export function isR2Configured(): boolean {
  try {
    const env = getServerEnv();
    return Boolean(
      (env.R2_ENDPOINT || env.R2_ACCOUNT_ID) &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET,
    );
  } catch {
    return false;
  }
}

function r2Config() {
  const env = getServerEnv();
  const endpoint =
    env.R2_ENDPOINT ??
    (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null);

  if (!endpoint || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "Cloudflare R2 is not configured. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.",
    );
  }

  return {
    bucket: env.R2_BUCKET,
    endpoint,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    putTtl: env.R2_PRESIGN_PUT_TTL_SECONDS ?? DEFAULT_PUT_TTL_SECONDS,
    getTtl: env.R2_SIGNED_GET_TTL_SECONDS ?? DEFAULT_GET_TTL_SECONDS,
  };
}

function client() {
  const config = r2Config();
  return {
    config,
    client: new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  };
}

export async function presignPut(input: {
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn?: number;
}) {
  const { client: s3, config } = client();
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: input.expiresIn ?? config.putTtl,
  });

  return {
    uploadUrl,
    expiresIn: input.expiresIn ?? config.putTtl,
    headers: {
      "Content-Type": input.contentType,
      "Content-Length": String(input.contentLength),
    },
  };
}

export async function headObject(key: string) {
  const { client: s3, config } = client();

  try {
    return await s3.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}

export async function deleteObject(key: string) {
  const { client: s3, config } = client();
  await s3.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
}

/**
 * Deletes up to 1000 keys per request. Used by account deletion, where leaving orphaned video
 * objects behind would break the promise made on the privacy page.
 */
export async function deleteObjects(keys: string[]) {
  const unique = [...new Set(keys.filter((key) => key.trim().length > 0))];
  if (unique.length === 0) return 0;

  const { client: s3, config } = client();
  let deleted = 0;

  for (let index = 0; index < unique.length; index += 1000) {
    const batch = unique.slice(index, index + 1000);
    const result = await s3.send(
      new DeleteObjectsCommand({
        Bucket: config.bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );

    if (result.Errors && result.Errors.length > 0) {
      const first = result.Errors[0];
      throw new Error(
        `R2 refused ${result.Errors.length} object ${result.Errors.length === 1 ? "deletion" : "deletions"}${
          first?.Key ? ` (first key: ${first.Key})` : ""
        }.`,
      );
    }

    deleted += batch.length;
  }

  return deleted;
}

export async function presignGet(key: string, expiresIn?: number) {
  const { client: s3, config } = client();
  const command = new GetObjectCommand({ Bucket: config.bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresIn ?? config.getTtl });
}

/** A GET URL that forces a download with a safe, ASCII-only filename. */
export async function presignDownload(key: string, fileName: string, expiresIn?: number) {
  const { client: s3, config } = client();
  const safeName =
    fileName
      .replace(/[^\w\-. ]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 96) || "clip.mp4";

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  });

  return getSignedUrl(s3, command, { expiresIn: expiresIn ?? config.getTtl });
}
