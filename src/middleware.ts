import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isPortalConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Routes under /portal that an unauthenticated visitor is allowed to reach.
 * Everything else in the portal redirects to the login page.
 */
const PUBLIC_PORTAL_PATHS = new Set([
  "/portal/login",
  "/portal/forgot-password",
  // Reached with a session already established by the auth link, but listed
  // here because the redirect from /portal/auth/confirm must not be bounced
  // back to login if the session cookie has not settled yet.
  "/portal/set-password",
  "/portal/auth/confirm",
  "/portal/unavailable",
]);

function isPublicPortalPath(pathname: string): boolean {
  return PUBLIC_PORTAL_PATHS.has(pathname);
}

/**
 * Refreshes the Supabase session on every portal request and turns away
 * anonymous visitors before a page renders.
 *
 * This is a first gate, not the security boundary. Middleware runs on the edge
 * and only checks that *a* valid user exists — every page and action re-checks
 * identity server-side, and RLS decides what that identity can actually see.
 * Treating a middleware check as sufficient is how portals leak.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Without configuration there is no portal to protect. Say so on a real page
  // rather than crashing, so the marketing site is unaffected.
  if (!isPortalConfigured) {
    if (pathname === "/portal/unavailable") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/portal/unavailable";
    url.search = "";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser(), never getSession(): getSession reads the cookie and trusts it,
  // while getUser revalidates the token with the auth server. On the edge, in
  // front of every private page, the difference matters.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPortalPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/login";
    // Preserve where they were going so the login can hand them back to it.
    url.search = pathname === "/portal" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // A signed-in user has no business on the login screen.
  if (user && (pathname === "/portal/login" || pathname === "/portal/forgot-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*"],
};
