import { NextResponse } from "next/server";

import { deliverLead, LEAD_SOURCES, type Lead, type LeadSource } from "@/lib/leads";
import { clean, normalizeUrl } from "@/lib/validation";

/**
 * Plain HTTP seam for lead capture.
 *
 * The site's own forms use server actions, but this endpoint accepts the same
 * lead shape over JSON so an embedded form, a landing page test, or a partner
 * can post into the identical delivery pipeline.
 *
 * Optional shared-secret gate: set LEAD_API_TOKEN and send it as
 * `Authorization: Bearer <token>`. Left unset, the endpoint stays open — fine
 * for a marketing site, but set it before pointing anything real at it.
 */

export const runtime = "nodejs";

function str(input: unknown, cap = 2000): string {
  return typeof input === "string" ? clean(input, cap) : "";
}

export async function POST(request: Request) {
  const token = process.env.LEAD_API_TOKEN;
  if (token) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = str(body.email, 200);
  const name = str(body.name, 120);
  if (!email || !name) {
    return NextResponse.json({ error: "name_and_email_required" }, { status: 422 });
  }

  const requestedSource = str(body.source, 40) as LeadSource;
  const source: LeadSource = LEAD_SOURCES.includes(requestedSource)
    ? requestedSource
    : "software_request";

  const lead: Lead = {
    id: crypto.randomUUID(),
    source,
    page: str(body.page, 200) || "/api/leads",
    cta: str(body.cta, 120) || "api",
    submittedAt: new Date().toISOString(),
    name,
    business: str(body.business, 160),
    email,
    phone: str(body.phone, 40),
    website: normalizeUrl(str(body.website, 300)),
    companySize: str(body.companySize, 60),
    crewCount: str(body.crewCount, 60),
    currentSoftware: str(body.currentSoftware, 800),
    integrations: str(body.integrations, 800),
    painPoints: str(body.painPoints),
    desiredSystem: str(body.desiredSystem),
    budget: str(body.budget, 60),
    timeline: str(body.timeline, 60),
    preferredContact: str(body.preferredContact, 60),
    notes: str(body.notes),
    meta: {
      referrer: request.headers.get("referer") ?? "",
      userAgent: (request.headers.get("user-agent") ?? "").slice(0, 300),
      flags: ["via_api"],
    },
  };

  const delivery = await deliverLead(lead);

  return NextResponse.json({ id: lead.id, delivered: delivery.delivered }, { status: 202 });
}
