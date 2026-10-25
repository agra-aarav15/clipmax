/**
 * Return-path handling for auth.
 *
 * Only same-origin, absolute paths are accepted. Backslashes, protocol-relative values, encoded
 * separators, and control characters are rejected: browsers normalise `\` to `/`, so `/\evil.com`
 * would otherwise become a cross-origin redirect after sign-in.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (value.length > 2048) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;

  const pathOnly = value.split(/[?#]/, 1)[0] ?? "";
  if (/%5c|%2f|%00/i.test(pathOnly)) return fallback;

  try {
    const parsed = new URL(value, "https://clipmax.invalid");
    if (parsed.origin !== "https://clipmax.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/** Build the studio URL a visitor intended before signing in. */
export function dashboardNextPath({
  source,
  intent,
  next,
}: {
  source?: string | null;
  intent?: string | null;
  next?: string | null;
}): string {
  if (next) return safeNextPath(next);

  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (intent === "upload") params.set("intent", "upload");
  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}
