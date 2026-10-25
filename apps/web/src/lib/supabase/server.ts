import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { isSupabaseConfigured, publicEnv } from "@/lib/public-env";

/**
 * Cookie-aware Supabase client for Server Components and Route Handlers.
 *
 * Returns null when the project has no Supabase credentials, so callers can show a visible
 * configuration state instead of crashing or pretending auth works.
 */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the session instead.
        }
      },
    },
  });
}

/**
 * Service-role client. Only import this from server-only code. It bypasses RLS by design and is
 * used for money, queue, and webhook writes that the browser must never perform.
 */
export function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL || publicEnv.supabaseUrl;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null } as const;

  const { data, error } = await supabase.auth.getUser();
  if (error) return { supabase, user: null } as const;

  return { supabase, user: data.user } as const;
}
