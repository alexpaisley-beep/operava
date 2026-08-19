"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clean, validate, type Schema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";

/* -------------------------------------------------------------------------
   Shared
------------------------------------------------------------------------- */

/**
 * Absolute origin for links we ask Supabase to email.
 *
 * Derived from the request rather than from NEXT_PUBLIC_SITE_URL so a preview
 * deploy emails a link back to itself. Supabase only honours redirect targets
 * on its own allow-list, so a spoofed Host header cannot redirect a recovery
 * link somewhere hostile — it just fails the allow-list check.
 */
async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
}

/**
 * Where to send someone after login.
 *
 * Only same-origin, portal-internal paths are honoured. Without this check a
 * crafted `?next=https://evil.example` turns the login form into an open
 * redirect that borrows Operava's domain for a phishing hop.
 */
function safeNext(raw: string): string {
  if (!raw.startsWith("/portal")) return "/portal";
  if (raw.startsWith("//")) return "/portal";
  return raw;
}

/* -------------------------------------------------------------------------
   Sign in
------------------------------------------------------------------------- */

const LOGIN_SCHEMA: Schema = {
  email: { label: "Email", required: true, kind: "email", max: 320 },
  password: { label: "Password", required: true, min: 1, max: 200 },
};

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = {
    email: clean(formData.get("email"), 320).toLowerCase(),
    // Not run through `clean()`: it strips control characters and trims, which
    // would silently alter a legitimate password and produce a failure nobody
    // can reproduce. Length is capped instead.
    password: String(formData.get("password") ?? "").slice(0, 200),
  };
  const next = safeNext(clean(formData.get("next"), 300));

  const result = validate(values, LOGIN_SCHEMA);
  if (!result.ok) {
    return { errors: result.errors, values: { email: values.email } };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  });

  if (error) {
    // One message for every failure mode. Distinguishing "no such account" from
    // "wrong password" turns the login form into a directory of who Operava's
    // customers are, which is worth more to an attacker than it is to a user
    // who mistyped.
    return {
      errors: {},
      values: { email: values.email },
      formError: "That email and password combination did not work.",
    };
  }

  redirect(next);
}

/* -------------------------------------------------------------------------
   Password reset — also the account-setup path
------------------------------------------------------------------------- */

const EMAIL_SCHEMA: Schema = {
  email: { label: "Email", required: true, kind: "email", max: 320 },
};

/**
 * Sends a recovery link.
 *
 * Always reports success, whether or not the address exists. The response is
 * the only signal an attacker gets, and making it uniform is what keeps this
 * endpoint from confirming which addresses have portal accounts.
 */
export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: clean(formData.get("email"), 320).toLowerCase() };

  const result = validate(values, EMAIL_SCHEMA);
  if (!result.ok) return { errors: result.errors, values };

  const supabase = await createSupabaseServerClient();
  const origin = await requestOrigin();

  await supabase.auth.resetPasswordForEmail(values.email, {
    redirectTo: `${origin}/portal/auth/confirm?next=/portal/set-password`,
  });

  redirect("/portal/forgot-password?sent=1");
}

const PASSWORD_SCHEMA: Schema = {
  // Length over composition rules. NIST has recommended exactly this since
  // 2017: a 12-character passphrase beats "Passw0rd!" and does not push people
  // towards a sticky note.
  password: { label: "Password", required: true, min: 12, max: 200 },
};

/**
 * Sets a password for the session created by a recovery link.
 *
 * This is also how a brand new customer sets their first password: Operava
 * provisions the account with no usable password and sends an invite, so there
 * is never a plaintext credential in an email or in a spreadsheet.
 */
export async function setPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const confirm = String(formData.get("confirmPassword") ?? "").slice(0, 200);

  const result = validate({ password }, PASSWORD_SCHEMA);
  if (!result.ok) return { errors: result.errors, values: {} };

  if (password !== confirm) {
    return { errors: { confirmPassword: "Both passwords need to match." }, values: {} };
  }

  const supabase = await createSupabaseServerClient();

  // The recovery link has already exchanged itself for a session by the time
  // this runs. No session means the link expired or was opened in a different
  // browser, which is worth saying plainly rather than failing as "unauthorised".
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      errors: {},
      values: {},
      formError:
        "This link has expired or was opened in a different browser. Request a new one and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      errors: {},
      values: {},
      formError: error.message || "That password could not be saved. Try a different one.",
    };
  }

  redirect("/portal");
}

/* -------------------------------------------------------------------------
   Sign out
------------------------------------------------------------------------- */

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}
