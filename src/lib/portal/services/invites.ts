import { site } from "@/lib/site";

import { assertOperavaActor } from "../authz";
import { recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import { notify } from "../notify";
import type { ProfileRow } from "../types";
import type { InviteCustomerUserInput } from "../validation";
import type { ServiceCtx } from "./context";

export type InviteResult = {
  profile: ProfileRow;
  /**
   * Single-use sign-in link, handled by /portal/auth/confirm. Always returned
   * so the admin can deliver it by hand; also emailed when Resend is
   * configured.
   */
  inviteUrl: string;
  emailAttempted: boolean;
};

/**
 * Provision (or re-invite) a customer portal user. We generate the auth link
 * ourselves via the admin API and deliver it through our own email path, so
 * the flow works identically whether or not Supabase SMTP is configured.
 */
export async function inviteCustomerUser(
  ctx: ServiceCtx,
  input: InviteCustomerUserInput,
): Promise<InviteResult> {
  assertOperavaActor(ctx.actor);

  const company = await data.getCompany(ctx.db, input.companyId);
  if (!company) throw new PortalError("not_found", "Customer not found.");

  const email = input.email.toLowerCase();
  const existingProfile = await data.getProfileByEmail(ctx.db, email);
  if (existingProfile) {
    if (existingProfile.role === "admin") {
      throw new PortalError("conflict", "That email belongs to an Operava staff account.");
    }
    if (existingProfile.company_id !== company.id) {
      throw new PortalError(
        "conflict",
        "That email is already registered to a different customer.",
      );
    }
  }

  // `invite` creates the auth user; for an existing user it fails, and a
  // magic link serves the same purpose (single-use sign-in).
  let linkResult = await ctx.db.auth.admin.generateLink({ type: "invite", email });
  if (linkResult.error) {
    linkResult = await ctx.db.auth.admin.generateLink({ type: "magiclink", email });
  }
  if (linkResult.error || !linkResult.data.properties?.hashed_token || !linkResult.data.user) {
    console.error("portal.invite.link_failed", linkResult.error?.message);
    throw new PortalError("internal", "Could not generate an invite link.");
  }

  const { hashed_token, verification_type } = linkResult.data.properties;
  const next = encodeURIComponent("/portal/auth/set-password");
  const inviteUrl = `${site.url}/portal/auth/confirm?token_hash=${hashed_token}&type=${verification_type}&next=${next}`;

  let profile =
    existingProfile ?? (await data.getProfileByAuthUserId(ctx.db, linkResult.data.user.id));
  if (!profile) {
    profile = await data.insertProfile(ctx.db, {
      auth_user_id: linkResult.data.user.id,
      company_id: company.id,
      email,
      full_name: input.fullName,
      role: "client",
    });
  }

  await recordAudit(ctx.db, ctx.actor, {
    action: existingProfile ? "customer_user.reinvited" : "customer_user.invited",
    description: `${email} invited to the ${company.name} portal.`,
    companyId: company.id,
    entityType: "profile",
    entityId: profile.id,
    visibility: "internal",
    source: ctx.source,
  });

  const emailAttempted = Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      (process.env.PORTAL_FROM_EMAIL?.trim() || process.env.LEAD_FROM_EMAIL?.trim()),
  );
  await notify(ctx.db, {
    type: "user_invited",
    email,
    companyName: company.name,
    inviteUrl,
  });

  return { profile, inviteUrl, emailAttempted };
}
