"use client";

import { createBrowserClient } from "@supabase/ssr";

import { isSupabaseConfigured, publicEnv } from "@/lib/public-env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a browser Supabase client, or null when the local build has not been
 * given project credentials. Callers must handle null with a visible error
 * state instead of pretending an email was sent.
 */
export function getSupabaseBrowserClient(): ReturnType<typeof createBrowserClient> | null {
  if (!isSupabaseConfigured()) return null;

  browserClient ??= createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return browserClient;
}
