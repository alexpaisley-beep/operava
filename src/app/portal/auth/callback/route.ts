import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createUserClient } from "@/lib/portal/supabase/server";

/** PKCE landing for magic links requested from the login page. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createUserClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/portal");
    console.error("portal.auth.callback_failed", error.message);
  }
  redirect("/portal/login?error=link");
}
