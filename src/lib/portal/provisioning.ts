"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { isAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { clean, validate, type Schema } from "@/lib/validation";
import type { FormState } from "@/lib/form-state";
import { requireAdmin } from "./session";

/**
 * Account provisioning.
 *
 * There is no public signup anywhere in this application. Operava creates the
 * account, and the person sets their own password from an emailed link.
 *
 * The rule that shapes everything here: no plaintext password is ever
 * generated, stored, displayed or emailed. The auth user is created with a
 * random secret nobody records, and the only way in is a one-time link. That
 * costs one extra step and removes a whole category of incident.
 *
 * Why `generateLink` rather than `inviteUserByEmail` or `resetPasswordForEmail`:
 * both of those would have to be triggered from the STAFF member's browser,
 * where the PKCE code verifier cookie would be written — the customer could
 * then never complete the exchange. `generateLink` returns a verifier-free
 * `token_hash` that works in any browser, which is what /portal/auth/confirm
 * consumes.
 */

const INVITE_SCHEMA: Schema = {
  email: { label: "Email", required: true, kind: "email", max: 320 },
  fullName: { label: "Full name", required: true, min: 2, max: 160 },
};

export type InviteResult = FormState & {
  /** Setup link, returned so staff can send it by hand if email is not wired up. */
  setupLink?: string;
  emailed?: boolean;
};

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
}

/**
 * Sends the setup email via Resend when it is configured.
 *
 * Resend is already how this codebase delivers lead notifications, so this
 * reuses existing configuration rather than introducing a notification system.
 * Best-effort: a failure here never fails provisioning, because the link is
 * also shown in the admin UI.
 */
async function sendSetupEmail(to: string, fullName: string, link: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!key || !from) return false;

  const firstName = fullName.trim().split(/\s+/)[0] ?? "there";
  const text = [
    `Hi ${firstName},`,
    "",
    "Operava has set up your client portal account. Use the link below to choose a password — it expires in 24 hours.",
    "",
    link,
    "",
    "Once you are in, you will see your project status, what we are working on, anything we need from you, and a place to raise questions or report problems.",
    "",
    "— Operava",
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Your Operava client portal account",
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Creates a company user: auth user, profile row, and a setup link.
 *
 * Idempotent enough to be safe to retry — an existing auth user is reused
 * rather than erroring, because the common reason staff run this twice is that
 * the first email did not arrive.
 */
export async function inviteClient(
  _prev: InviteResult,
  formData: FormData,
): Promise<InviteResult> {
  await requireAdmin();

  const values = {
    email: clean(formData.get("email"), 320).toLowerCase(),
    fullName: clean(formData.get("fullName"), 160),
  };
  const companyId = clean(formData.get("companyId"), 60);

  const result = validate(values, INVITE_SCHEMA);
  if (!result.ok) return { errors: result.errors, values };
  if (!companyId) return { errors: {}, values, formError: "Pick a company." };

  if (!isAdminConfigured()) {
    return {
      errors: {},
      values,
      formError:
        "SUPABASE_SERVICE_ROLE_KEY is not set on this deployment, so accounts cannot be created here. Add it and try again.",
    };
  }

  const admin = createSupabaseAdminClient();
  const origin = await requestOrigin();

  // A password nobody will ever know or need. The account is unusable until the
  // setup link is followed, which is the point.
  const throwaway = `${crypto.randomUUID()}${crypto.randomUUID()}`;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: values.email,
    password: throwaway,
    email_confirm: true,
    user_metadata: { full_name: values.fullName },
  });

  let authUserId = created?.user?.id ?? "";

  if (createError) {
    // Already registered: find them and carry on to the profile step, so a
    // half-finished provisioning run can be completed by repeating it.
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = existing?.users.find((user) => user.email?.toLowerCase() === values.email);
    if (!match) {
      return {
        errors: {},
        values,
        formError: createError.message || "That account could not be created.",
      };
    }
    authUserId = match.id;
  }

  if (!authUserId) {
    return { errors: {}, values, formError: "That account could not be created." };
  }

  // Profile row via the request-scoped client, so the admin RLS policy applies
  // rather than the service role quietly bypassing it.
  const supabase = await createSupabaseServerClient();
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      auth_user_id: authUserId,
      company_id: companyId,
      full_name: values.fullName,
      email: values.email,
      role: "client",
    },
    { onConflict: "auth_user_id" },
  );

  if (profileError) {
    return {
      errors: {},
      values,
      formError: `The account exists but its profile could not be saved: ${profileError.message}`,
    };
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: values.email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    revalidatePath("/portal/admin/people");
    return {
      errors: {},
      values: {},
      formError:
        "The account was created, but a setup link could not be generated. Use “Resend setup link” to try again.",
    };
  }

  const setupLink = `${origin}/portal/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=recovery&next=%2Fportal%2Fset-password`;
  const emailed = await sendSetupEmail(values.email, values.fullName, setupLink);

  revalidatePath("/portal/admin/people");
  revalidatePath("/portal/admin/companies");
  return { errors: {}, values: {}, setupLink, emailed };
}

/** Generates a fresh setup link for an existing account. */
export async function resendSetupLink(
  _prev: InviteResult,
  formData: FormData,
): Promise<InviteResult> {
  await requireAdmin();

  const email = clean(formData.get("email"), 320).toLowerCase();
  const fullName = clean(formData.get("fullName"), 160);
  if (!email) return { errors: {}, values: {}, formError: "Missing email." };

  if (!isAdminConfigured()) {
    return {
      errors: {},
      values: {},
      formError: "SUPABASE_SERVICE_ROLE_KEY is not set on this deployment.",
    };
  }

  const admin = createSupabaseAdminClient();
  const origin = await requestOrigin();

  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (error || !data?.properties?.hashed_token) {
    return {
      errors: {},
      values: {},
      formError: "A link could not be generated for that address.",
    };
  }

  const setupLink = `${origin}/portal/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery&next=%2Fportal%2Fset-password`;
  const emailed = await sendSetupEmail(email, fullName || email, setupLink);

  return { errors: {}, values: {}, setupLink, emailed };
}
