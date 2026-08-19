// Hard guarantee this module can never be pulled into a client bundle. The
// `next/headers` import below would already fail such a build, but this file
// also exports the service-role client, and "it happens to fail today" is not
// the assurance that deserves.
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { isPortalConfigured, serviceRoleKey, supabaseAnonKey, supabaseUrl } from "./config";
import type { Database } from "./types";

/**
 * Request-scoped client carrying the signed-in user's session.
 *
 * Everything a client can reach goes through this, so every query it makes is
 * evaluated against RLS as that user. Reaching for the service-role client
 * because a query "isn't returning anything" is almost always the wrong fix —
 * it usually means a policy is missing.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components cannot set cookies. That is fine and expected:
        // middleware refreshes the session on every request, so the write here
        // is only ever a redundant echo of what middleware already persisted.
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Rendering a Server Component — middleware owns the refresh.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS completely.
 *
 * Two legitimate uses, both server-only:
 *
 *   1. Provisioning — creating an auth user for a customer, which the anon key
 *      cannot do because public signup is disabled by design.
 *   2. Resolving display names for authorship (`profiles` is self-read only for
 *      clients, so "posted by Alex" has to be looked up with elevated rights).
 *
 * Anything else should use the request-scoped client above. Every call site is
 * responsible for its own authorisation check, because the database will not
 * make one for it.
 */
export function createSupabaseAdminClient() {
  const key = serviceRoleKey();
  if (!isPortalConfigured || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
