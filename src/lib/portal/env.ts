/**
 * Portal configuration. Read lazily so `next build` succeeds without secrets;
 * a missing variable fails loudly at the point of first use instead.
 */

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example for portal configuration.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** Server-only. Bypasses RLS — must never reach a client bundle. */
export function supabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

/** Server-only. The shared secret that authenticates the Operava MCP. */
export function mcpKey(): string {
  return required("OPERAVA_MCP_KEY");
}

export function mcpConfigured(): boolean {
  return Boolean(process.env.OPERAVA_MCP_KEY?.trim());
}

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}
