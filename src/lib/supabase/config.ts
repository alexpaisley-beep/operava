/**
 * Portal configuration, in one place.
 *
 * The marketing site has always built and run with zero environment
 * configuration, and adding a portal must not change that. Every page under
 * `/portal` degrades to an honest "not configured yet" screen when these are
 * missing, and `next build` still succeeds — which matters, because a preview
 * deploy without secrets should render the public site rather than 500.
 */

function read(name: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : "";
}

/**
 * Both of these are inlined into the browser bundle, which is correct: the
 * anon key is a public identifier and every table it can reach is behind RLS.
 *
 * They are read as literal `process.env.X` rather than through `read()` because
 * Next.js only substitutes NEXT_PUBLIC_* values it can see statically — a
 * dynamic lookup silently yields undefined in client components.
 */
export const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/** Server-only. Bypasses RLS entirely, so it must never be prefixed NEXT_PUBLIC_. */
export function serviceRoleKey(): string {
  return read("SUPABASE_SERVICE_ROLE_KEY");
}

/** Enough configuration for a client to sign in and read their project. */
export const isPortalConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

/**
 * Enough configuration for Operava staff to provision accounts. Checked at the
 * point of use rather than at import: the rest of the portal works fine without
 * it, and only the invite flow should break when it is absent.
 */
export function isAdminConfigured(): boolean {
  return isPortalConfigured && serviceRoleKey().length > 0;
}
