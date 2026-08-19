import { NextResponse, type NextRequest } from "next/server";

import { isPortalConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Landing point for every emailed auth link — invites and password resets alike.
 *
 * Two exchange mechanisms exist and both are handled, because which one arrives
 * depends on who triggered the email:
 *
 *   `token_hash`  Verifier-free. Required for anything Operava initiates: when
 *                 staff provision an account, the PKCE code verifier would be
 *                 written to the STAFF member's browser, so the customer could
 *                 never complete an exchange that depends on it.
 *
 *   `code`        PKCE. Produced when the customer requests their own reset, in
 *                 which case the verifier cookie is already in their browser.
 *
 * On success the session cookie is set and the visitor continues to `next`.
 * On failure they get the login page with a plain explanation rather than a
 * stack trace — an expired link is the single most common way to arrive here.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const type = url.searchParams.get("type");
  const rawNext = url.searchParams.get("next") ?? "/portal";

  // Same open-redirect guard as the login form: only portal-internal paths.
  const next = rawNext.startsWith("/portal") && !rawNext.startsWith("//") ? rawNext : "/portal";

  const failure = new URL("/portal/login", url.origin);
  failure.searchParams.set("error", "link");

  if (!isPortalConfigured) return NextResponse.redirect(failure);

  const supabase = await createSupabaseServerClient();

  if (tokenHash) {
    // `recovery` covers both a reset and a first-time setup link. `invite`,
    // `signup` and `email_change` are accepted so a link generated straight from
    // the Supabase dashboard also works.
    const otpType =
      type === "invite" || type === "signup" || type === "email_change" ? type : "recovery";

    const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
    if (error) return NextResponse.redirect(failure);
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(failure);
    return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(failure);
}
