"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "./config";
import type { Database } from "./types";

/**
 * Browser client.
 *
 * Used for exactly two things: exchanging a recovery link for a session on the
 * set-password page, and uploading a file straight to Storage so a 25 MiB
 * attachment never has to travel through a server action. Reads and mutations
 * belong on the server.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
