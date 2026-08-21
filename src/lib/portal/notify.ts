/**
 * Customer notifications, event-driven and deliberately sparse: an invitation,
 * a customer-visible update, a new action item, a completed project. Nothing
 * else emails anyone.
 *
 * Uses the same Resend-over-HTTP pattern as lead delivery: no SDK, silently
 * disabled without configuration, and never allowed to fail the mutation that
 * triggered it.
 */

import { site } from "@/lib/site";

import type { Db } from "./supabase/server";

export type PortalNotification =
  | {
      type: "update_posted";
      companyId: string;
      projectId: string;
      projectName: string;
      title: string;
      body: string;
    }
  | {
      type: "client_request_created";
      companyId: string;
      projectId: string;
      projectName: string;
      title: string;
      description: string;
      dueDate: string | null;
    }
  | {
      type: "project_completed";
      companyId: string;
      projectId: string;
      projectName: string;
    }
  | {
      type: "user_invited";
      email: string;
      companyName: string;
      inviteUrl: string;
    };

function fromAddress(): string | null {
  return process.env.PORTAL_FROM_EMAIL?.trim() || process.env.LEAD_FROM_EMAIL?.trim() || null;
}

function resendKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function portalUrl(path: string): string {
  return `${site.url}${path}`;
}

function render(event: PortalNotification): { subject: string; text: string; html: string } {
  const open = (label: string, path: string) =>
    `<p style="margin:24px 0 0"><a href="${escapeHtml(portalUrl(path))}" style="display:inline-block;background:#1e3a66;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px">${escapeHtml(label)}</a></p>`;
  const wrap = (heading: string, bodyHtml: string) =>
    `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55;color:#101a2b;max-width:560px">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7789">Operava</p>
  <h2 style="margin:0 0 16px;font-size:18px;color:#1e3a66">${escapeHtml(heading)}</h2>
  ${bodyHtml}
  <p style="margin:28px 0 0;color:#6b7789;font-size:12px">You are receiving this because your company has a project with Operava.</p>
</div>`;

  switch (event.type) {
    case "update_posted": {
      const subject = `${event.projectName}: ${event.title}`;
      const snippet = event.body.slice(0, 600);
      return {
        subject,
        text: `${event.title}\n\n${snippet}\n\nSee the full timeline: ${portalUrl(`/portal/projects/${event.projectId}`)}`,
        html: wrap(
          event.title,
          `<p style="margin:0;color:#4a566b;white-space:pre-wrap">${escapeHtml(snippet)}</p>${open("Open your project", `/portal/projects/${event.projectId}`)}`,
        ),
      };
    }
    case "client_request_created": {
      const subject = `Action needed on ${event.projectName}: ${event.title}`;
      const due = event.dueDate ? `\n\nNeeded by: ${event.dueDate}` : "";
      return {
        subject,
        text: `Operava needs something from you to keep ${event.projectName} moving.\n\n${event.title}\n${event.description}${due}\n\nRespond here: ${portalUrl(`/portal/projects/${event.projectId}`)}`,
        html: wrap(
          `We need something from you`,
          `<p style="margin:0 0 8px"><strong>${escapeHtml(event.title)}</strong></p>
  <p style="margin:0;color:#4a566b;white-space:pre-wrap">${escapeHtml(event.description.slice(0, 600))}</p>
  ${event.dueDate ? `<p style="margin:12px 0 0;color:#4a566b">Needed by <strong>${escapeHtml(event.dueDate)}</strong></p>` : ""}
  ${open("Review and respond", `/portal/projects/${event.projectId}`)}`,
        ),
      };
    }
    case "project_completed": {
      return {
        subject: `${event.projectName} is complete`,
        text: `${event.projectName} is complete. Deliverables, links and the full history stay available in your portal: ${portalUrl(`/portal/projects/${event.projectId}`)}`,
        html: wrap(
          `${event.projectName} is complete`,
          `<p style="margin:0;color:#4a566b">Deliverables, links and the full project history stay available in your portal.</p>${open("Open your project", `/portal/projects/${event.projectId}`)}`,
        ),
      };
    }
    case "user_invited": {
      return {
        subject: `Your Operava project portal for ${event.companyName}`,
        text: `Operava set up portal access for ${event.companyName}. Follow this link to choose a password and sign in:\n\n${event.inviteUrl}\n\nThe link is single-use.`,
        html: wrap(
          `Your project portal is ready`,
          `<p style="margin:0;color:#4a566b">Operava set up portal access for ${escapeHtml(event.companyName)}. The link below is single-use and lets you choose a password.</p>
  <p style="margin:24px 0 0"><a href="${escapeHtml(event.inviteUrl)}" style="display:inline-block;background:#1e3a66;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px">Set up your access</a></p>`,
        ),
      };
    }
  }
}

async function recipientEmails(db: Db, companyId: string): Promise<string[]> {
  const { data, error } = await db
    .from("profiles")
    .select("email")
    .eq("company_id", companyId)
    .eq("role", "client");
  if (error) {
    console.error("portal.notify.recipients_failed", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.email).filter((email) => email.includes("@"));
}

async function sendEmail(
  to: string[],
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  const key = resendKey();
  const from = fromAddress();
  if (!key || !from || to.length === 0) return;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`portal.notify.send_failed status=${response.status}`);
    }
  } catch {
    console.error("portal.notify.send_failed network");
  }
}

/**
 * Deliver a notification. Never throws; always logs the event so nothing is
 * silently swallowed when email is unconfigured.
 */
export async function notify(db: Db, event: PortalNotification): Promise<void> {
  try {
    console.log(
      `portal.notify ${JSON.stringify({ type: event.type, ...(("projectId" in event && { projectId: event.projectId }) || {}) })}`,
    );
    const { subject, text, html } = render(event);
    if (event.type === "user_invited") {
      await sendEmail([event.email], subject, text, html);
      return;
    }
    const to = await recipientEmails(db, event.companyId);
    await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error("portal.notify.failed", error);
  }
}
