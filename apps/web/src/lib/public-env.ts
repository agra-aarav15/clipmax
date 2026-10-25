/**
 * Browser-safe environment. Only NEXT_PUBLIC_* values.
 *
 * Each property is read with a static `process.env.NEXT_PUBLIC_*` expression so
 * Next.js can inline it at build time. Do not refactor into dynamic lookups.
 */

export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;

export function isSupabaseConfigured(): boolean {
  return publicEnv.supabaseUrl.length > 0 && publicEnv.supabaseAnonKey.length > 0;
}
