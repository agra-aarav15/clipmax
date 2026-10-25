import { AppError } from "@/lib/api/errors";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AppError("UNAUTHORIZED", "Sign in to continue.");
  }

  return { supabase, user: data.user };
}

export function requireAdminClient() {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new AppError(
      "CONFIGURATION_ERROR",
      "The server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return admin;
}
