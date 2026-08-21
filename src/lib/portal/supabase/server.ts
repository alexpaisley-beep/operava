import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "../database.types";
import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from "../env";

export type Db = SupabaseClient<Database>;

/**
 * Cookie-bound client for the signed-in person. Everything it does runs under
 * their JWT, so RLS is load-bearing: even buggy app code cannot read across
 * tenants with this client.
 */
export async function createUserClient(): Promise<Db> {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies; the proxy refreshes
          // sessions there, so swallowing this is correct.
        }
      },
    },
  });
}

let serviceClient: Db | null = null;

/**
 * Service-role client. Bypasses RLS — only the domain service layer may use
 * it, and only after an explicit authorization decision.
 */
export function createServiceClient(): Db {
  if (typeof window !== "undefined") {
    throw new Error("createServiceClient must never run in the browser.");
  }
  if (!serviceClient) {
    serviceClient = createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}
