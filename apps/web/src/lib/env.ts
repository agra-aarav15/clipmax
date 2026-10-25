import { z } from "zod";

/**
 * Server-side environment.
 *
 * Variables are optional during local scaffolding, but every integration var listed
 * in REQUIRED_IN_PRODUCTION must exist before a production boot. `assertServerEnv`
 * is called from `src/instrumentation.ts` so a misconfigured deploy fails at startup
 * instead of at the first user request.
 */

/** `.env` files commonly leave optional keys as `KEY=`. Treat that as unset. */
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (minLength = 1) =>
  z.preprocess(emptyToUndefined, z.string().min(minLength).optional());

const optionalUrl = () => z.preprocess(emptyToUndefined, z.url().optional());

const optionalInt = (minimum: number, maximum: number, fallback: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(minimum).max(maximum).default(fallback),
  );

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: optionalText(),

  // Cloudflare R2
  R2_ACCOUNT_ID: optionalText(),
  R2_ACCESS_KEY_ID: optionalText(),
  R2_SECRET_ACCESS_KEY: optionalText(),
  R2_BUCKET: optionalText(),
  R2_ENDPOINT: optionalUrl(),
  R2_PRESIGN_PUT_TTL_SECONDS: optionalInt(60, 3600, 900),
  R2_SIGNED_GET_TTL_SECONDS: optionalInt(60, 86_400, 3600),

  // Razorpay
  RAZORPAY_KEY_ID: optionalText(),
  RAZORPAY_KEY_SECRET: optionalText(),
  RAZORPAY_WEBHOOK_SECRET: optionalText(),
  RAZORPAY_PLAN_STARTER_MONTHLY: optionalText(),

  // Ops
  CRON_SECRET: optionalText(16),
});

export type ServerEnv = z.infer<typeof serverSchema>;

export const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "CRON_SECRET",
] as const;

let cached: ServerEnv | null = null;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment — ${formatIssues(parsed.error)}`);
  }

  cached = parsed.data;
  return cached;
}

/**
 * Validates server env at boot.
 * - invalid values throw in production (a malformed URL or TTL is a deploy bug)
 * - missing integration variables are logged, not fatal: the studio pages render a specific
 *   configuration state instead of a generic host error
 * - development warns once, so the scaffold runs without credentials
 * - SKIP_ENV_VALIDATION=1: no-op (used by CI builds that have no secrets)
 */
export function assertServerEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === "1") return;

  try {
    const env = getServerEnv();
    const missing: string[] = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
    if (!process.env.R2_ENDPOINT && !process.env.R2_ACCOUNT_ID) {
      missing.push("R2_ENDPOINT or R2_ACCOUNT_ID");
    }

    if (missing.length > 0) {
      const message = `[env] Missing integration variables: ${missing.join(", ")}`;
      if (env.NODE_ENV === "production") console.error(message);
      else console.warn(message);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn(`[env] ${error instanceof Error ? error.message : String(error)}`);
  }
}
