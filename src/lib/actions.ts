"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { FormState } from "./form-state";
import {
  BUDGET_RANGES,
  COMPANY_SIZES,
  CONTACT_METHODS,
  CREW_COUNTS,
  TIMELINES,
  deliverLead,
  type Lead,
  type LeadSource,
} from "./leads";
import { clean, normalizeUrl, validate, type Schema } from "./validation";

/* -------------------------------------------------------------------------
   Anti-spam
   Three cheap layers, none of which inconveniences a real prospect:
   a honeypot field, a dwell-time floor, and a best-effort IP throttle.
------------------------------------------------------------------------- */

const HONEYPOT = "contact_fax";

/**
 * Dwell floor. Kept deliberately low: losing one real enquiry is far more
 * expensive than receiving one piece of spam, so this only has to be short
 * enough that no human — even one using browser autofill — can beat it.
 */
const MIN_DWELL_MS = 1200;
const RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };

/**
 * Per-instance throttle. On serverless this is not global, which is fine —
 * it is a speed bump for scripted floods, not an access-control boundary.
 */
const recentSubmissions = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT.windowMs;
  const hits = (recentSubmissions.get(ip) ?? []).filter((time) => time > cutoff);
  hits.push(now);
  recentSubmissions.set(ip, hits);

  if (recentSubmissions.size > 5000) recentSubmissions.clear();
  return hits.length > RATE_LIMIT.max;
}

/** Submitted impossibly fast? Only checked when the client could set the clock. */
function tooFast(formData: FormData): boolean {
  const started = Number(clean(formData.get("form_started_at"), 20));
  if (!Number.isFinite(started) || started <= 0) return false;
  const elapsed = Date.now() - started;
  return elapsed >= 0 && elapsed < MIN_DWELL_MS;
}

async function requestMeta() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for") ?? "";
  const ip = (forwarded.split(",")[0] ?? "").trim() || headerList.get("x-real-ip") || "unknown";
  return {
    ip,
    referrer: headerList.get("referer") ?? "",
    userAgent: (headerList.get("user-agent") ?? "").slice(0, 300),
  };
}

/* -------------------------------------------------------------------------
   Shared submit pipeline
------------------------------------------------------------------------- */

function readFields(formData: FormData, fields: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field] = clean(formData.get(field), field === "website" ? 300 : 2000);
  }
  return values;
}

type SubmitOptions = {
  source: LeadSource;
  schema: Schema;
  fields: readonly string[];
  successPath: string;
};

async function handleSubmit(
  formData: FormData,
  { source, schema, fields, successPath }: SubmitOptions,
): Promise<{ redirectTo: string } | FormState> {
  const values = readFields(formData, fields);

  // Layer 1: a hidden field no human ever sees, so a filled one is unambiguous.
  // This is the only check that drops a submission outright, and the bot is
  // shown the success page so it does not retry.
  if (clean(formData.get(HONEYPOT), 100)) {
    return { redirectTo: successPath };
  }

  const meta = await requestMeta();

  // Layer 2: throttle.
  if (throttled(meta.ip)) {
    return {
      errors: {},
      values,
      formError:
        "That is a lot of submissions from one place in a short window. Email us directly and we will pick it up from there.",
    };
  }

  // Validation runs before the remaining heuristic so a real person always
  // gets real field errors rather than a silent, fake success.
  const result = validate(values, schema);
  if (!result.ok) {
    return {
      errors: result.errors,
      values,
      formError: "A few details still need fixing before we can send this.",
    };
  }

  // Layer 3: dwell time. Flagged rather than dropped — a suspicious lead still
  // reaches the inbox, marked, instead of vanishing on a heuristic.
  const flags: string[] = [];
  if (tooFast(formData)) flags.push("fast_submit");

  const lead: Lead = {
    id: crypto.randomUUID(),
    source,
    page: clean(formData.get("page"), 200) || successPath,
    cta: clean(formData.get("cta"), 120) || source,
    submittedAt: new Date().toISOString(),

    name: values.name ?? "",
    business: values.business ?? "",
    email: values.email ?? "",
    phone: values.phone ?? "",
    website: normalizeUrl(values.website ?? ""),

    companySize: values.companySize ?? "",
    crewCount: values.crewCount ?? "",

    currentSoftware: values.currentSoftware ?? "",
    integrations: values.integrations ?? "",

    painPoints: values.painPoints ?? "",
    desiredSystem: values.desiredSystem ?? "",

    budget: values.budget ?? "",
    timeline: values.timeline ?? "",
    preferredContact: values.preferredContact ?? "",

    notes: values.notes ?? "",

    meta: { referrer: meta.referrer, userAgent: meta.userAgent, flags },
  };

  await deliverLead(lead);

  return { redirectTo: `${successPath}?ref=${lead.id.slice(0, 8)}` };
}

/* -------------------------------------------------------------------------
   Discovery call
------------------------------------------------------------------------- */

const BOOKING_FIELDS = [
  "name",
  "business",
  "email",
  "phone",
  "website",
  "companySize",
  "crewCount",
  "currentSoftware",
  "painPoints",
  "desiredSystem",
  "budget",
  "timeline",
  "preferredContact",
  "notes",
] as const;

const BOOKING_SCHEMA: Schema = {
  name: { label: "Your name", required: true, min: 2, max: 120 },
  business: { label: "Company name", required: true, min: 2, max: 160 },
  email: { label: "Email", required: true, kind: "email", max: 200 },
  phone: { label: "Phone", required: true, kind: "phone", max: 40 },
  website: { label: "Company website", kind: "url", max: 300 },
  companySize: { label: "Company size", required: true, oneOf: COMPANY_SIZES },
  crewCount: { label: "Number of crews", required: true, oneOf: CREW_COUNTS },
  currentSoftware: { label: "Current software", required: true, min: 2, max: 800 },
  painPoints: { label: "Biggest frustration", required: true, min: 10, max: 2000 },
  desiredSystem: { label: "What you wish it could do", max: 2000 },
  budget: { label: "Budget range", oneOf: BUDGET_RANGES },
  timeline: { label: "Timeline", oneOf: TIMELINES },
  preferredContact: {
    label: "Preferred contact method",
    required: true,
    oneOf: CONTACT_METHODS,
  },
  notes: { label: "Anything else", max: 2000 },
};

export async function submitDiscoveryCall(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const outcome = await handleSubmit(formData, {
    source: "discovery_call",
    schema: BOOKING_SCHEMA,
    fields: BOOKING_FIELDS,
    successPath: "/book/confirmed",
  });

  if ("redirectTo" in outcome) redirect(outcome.redirectTo);
  return outcome;
}

/* -------------------------------------------------------------------------
   Custom software request
------------------------------------------------------------------------- */

const REQUEST_FIELDS = [
  "name",
  "business",
  "email",
  "phone",
  "website",
  "crewCount",
  "currentSoftware",
  "integrations",
  "painPoints",
  "desiredSystem",
  "budget",
  "timeline",
  "notes",
] as const;

const REQUEST_SCHEMA: Schema = {
  name: { label: "Your name", required: true, min: 2, max: 120 },
  business: { label: "Business name", required: true, min: 2, max: 160 },
  email: { label: "Email", required: true, kind: "email", max: 200 },
  phone: { label: "Phone", kind: "phone", max: 40 },
  website: { label: "Company website", kind: "url", max: 300 },
  crewCount: { label: "Team size", oneOf: CREW_COUNTS },
  currentSoftware: { label: "Current software", required: true, min: 2, max: 800 },
  integrations: { label: "Integrations you depend on", max: 800 },
  painPoints: { label: "What is not working", required: true, min: 10, max: 2000 },
  desiredSystem: { label: "What you wish existed", max: 2000 },
  budget: { label: "Budget range", oneOf: BUDGET_RANGES },
  timeline: { label: "Timeline", oneOf: TIMELINES },
  notes: { label: "Anything else", max: 2000 },
};

export async function submitSoftwareRequest(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const outcome = await handleSubmit(formData, {
    source: "software_request",
    schema: REQUEST_SCHEMA,
    fields: REQUEST_FIELDS,
    successPath: "/request-software/received",
  });

  if ("redirectTo" in outcome) redirect(outcome.redirectTo);
  return outcome;
}
