/**
 * Input contracts for every mutation, shared verbatim by the admin UI's
 * server actions and the MCP tools — one definition of "valid" for both.
 */

import { z } from "zod";

import {
  CLIENT_REQUEST_STATUSES,
  COMPANY_STATUSES,
  FILE_CATEGORIES,
  LINK_KINDS,
  MILESTONE_STATUSES,
  PROJECT_HEALTHS,
  PROJECT_STATUSES,
  REQUEST_STATUSES,
  REQUEST_TYPES,
  UPDATE_TYPES,
  BILLING_STATUSES,
} from "./types";

export const uuid = z.uuid({ error: "Expected a UUID." });

/** Calendar date, no time component — matches Postgres `date`. */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date like 2026-03-31.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Not a real date.");

const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).default("");

export const visibilityInput = z.enum(["customer", "internal"]).default("customer");

/** Client-supplied duplicate-suppression key for MCP mutations. */
export const idempotencyKey = z.string().trim().min(1).max(200).optional();

/* --- Customers ---------------------------------------------------------- */

export const createCustomerInput = z.object({
  name: shortText(160),
  primaryContactName: optionalText(160),
  contactEmail: z
    .union([z.string().trim().pipe(z.email()).pipe(z.string().max(320)), z.literal("")])
    .default(""),
  contactPhone: optionalText(40),
  status: z.enum(COMPANY_STATUSES).default("active"),
  internalNotes: z.string().max(10000).default(""),
});
export type CreateCustomerInput = z.infer<typeof createCustomerInput>;

export const updateCustomerInput = z
  .object({
    customerId: uuid,
    name: shortText(160).optional(),
    primaryContactName: z.string().trim().max(160).optional(),
    contactEmail: z
      .union([z.string().trim().pipe(z.email()).pipe(z.string().max(320)), z.literal("")])
      .optional(),
    contactPhone: z.string().trim().max(40).optional(),
    status: z.enum(COMPANY_STATUSES).optional(),
    internalNotes: z.string().max(10000).optional(),
  })
  .refine(
    (v) =>
      Object.entries(v).some(([key, value]) => key !== "customerId" && value !== undefined),
    "Provide at least one field to change.",
  );
export type UpdateCustomerInput = z.infer<typeof updateCustomerInput>;

export const inviteCustomerUserInput = z.object({
  companyId: uuid,
  email: z.string().trim().pipe(z.email()).pipe(z.string().max(320)),
  fullName: optionalText(160),
});
export type InviteCustomerUserInput = z.infer<typeof inviteCustomerUserInput>;

/* --- Projects ----------------------------------------------------------- */

export const createProjectInput = z.object({
  companyId: uuid,
  name: shortText(200),
  description: z.string().max(10000).default(""),
  summary: z.string().max(1000).default(""),
  status: z.enum(PROJECT_STATUSES).default("planning"),
  phase: optionalText(120),
  startDate: isoDate.optional(),
  targetDate: isoDate.optional(),
  ownerProfileId: uuid.optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectInput>;

export const updateProjectStatusInput = z.object({
  projectId: uuid,
  status: z.enum(PROJECT_STATUSES),
  /** Optional short explanation, recorded in the audit trail. */
  note: z.string().trim().max(500).default(""),
});
export type UpdateProjectStatusInput = z.infer<typeof updateProjectStatusInput>;

export const updateProjectProgressInput = z
  .object({
    projectId: uuid,
    progressPercent: z.number().int().min(0).max(100).optional(),
    phase: z.string().trim().max(120).optional(),
    currentWork: z.string().trim().max(500).optional(),
    health: z.enum(PROJECT_HEALTHS).optional(),
  })
  .refine(
    (v) =>
      v.progressPercent !== undefined ||
      v.phase !== undefined ||
      v.currentWork !== undefined ||
      v.health !== undefined,
    "Provide progressPercent, phase, currentWork or health.",
  );
export type UpdateProjectProgressInput = z.infer<typeof updateProjectProgressInput>;

export const updateProjectSummaryInput = z
  .object({
    projectId: uuid,
    summary: z.string().max(1000).optional(),
    description: z.string().max(10000).optional(),
  })
  .refine((v) => v.summary !== undefined || v.description !== undefined, {
    error: "Provide summary or description.",
  });
export type UpdateProjectSummaryInput = z.infer<typeof updateProjectSummaryInput>;

export const updateProjectDetailsInput = z
  .object({
    projectId: uuid,
    name: shortText(200).optional(),
    startDate: isoDate.nullable().optional(),
    targetDate: isoDate.nullable().optional(),
    ownerProfileId: uuid.nullable().optional(),
    internalNotes: z.string().max(50000).optional(),
    isArchived: z.boolean().optional(),
  })
  .refine(
    (v) => Object.entries(v).some(([key, value]) => key !== "projectId" && value !== undefined),
    "Provide at least one field to change.",
  );
export type UpdateProjectDetailsInput = z.infer<typeof updateProjectDetailsInput>;

/* --- Updates ------------------------------------------------------------ */

export const createProjectUpdateInput = z.object({
  projectId: uuid,
  title: shortText(200),
  body: z.string().max(10000).default(""),
  updateType: z.enum(UPDATE_TYPES).default("general"),
  visibility: visibilityInput,
  milestoneId: uuid.optional(),
});
export type CreateProjectUpdateInput = z.infer<typeof createProjectUpdateInput>;

/* --- Milestones --------------------------------------------------------- */

export const createMilestoneInput = z.object({
  projectId: uuid,
  name: shortText(200),
  description: z.string().max(10000).default(""),
  status: z.enum(MILESTONE_STATUSES).default("upcoming"),
  dueDate: isoDate.optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  visibility: visibilityInput,
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneInput>;

export const updateMilestoneInput = z
  .object({
    milestoneId: uuid,
    name: shortText(200).optional(),
    description: z.string().max(10000).optional(),
    status: z.enum(MILESTONE_STATUSES).optional(),
    dueDate: isoDate.nullable().optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    visibility: z.enum(["customer", "internal"]).optional(),
  })
  .refine(
    (v) =>
      Object.entries(v).some(([key, value]) => key !== "milestoneId" && value !== undefined),
    "Provide at least one field to change.",
  );
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneInput>;

/* --- Client requests (Operava → customer) ------------------------------- */

export const createClientRequestInput = z.object({
  projectId: uuid,
  title: shortText(200),
  description: z.string().max(10000).default(""),
  dueDate: isoDate.optional(),
});
export type CreateClientRequestInput = z.infer<typeof createClientRequestInput>;

export const clientRequestTransitionInput = z.object({
  clientRequestId: uuid,
  status: z.enum(CLIENT_REQUEST_STATUSES),
});
export type ClientRequestTransitionInput = z.infer<typeof clientRequestTransitionInput>;

/* --- Customer requests (customer → Operava) ------------------------------ */

export const submitRequestInput = z.object({
  projectId: uuid,
  type: z.enum(REQUEST_TYPES),
  title: shortText(200),
  description: z.string().max(10000).default(""),
  stepsToReproduce: z.string().max(10000).default(""),
  expectedResult: z.string().max(10000).default(""),
});
export type SubmitRequestInput = z.infer<typeof submitRequestInput>;

export const setRequestStatusInput = z.object({
  requestId: uuid,
  status: z.enum(REQUEST_STATUSES),
});
export type SetRequestStatusInput = z.infer<typeof setRequestStatusInput>;

export const addRequestCommentInput = z.object({
  requestId: uuid,
  body: shortText(10000),
  visibility: visibilityInput,
});
export type AddRequestCommentInput = z.infer<typeof addRequestCommentInput>;

/* --- Links --------------------------------------------------------------- */

export const addProjectLinkInput = z.object({
  projectId: uuid,
  label: shortText(120),
  url: z.url({ protocol: /^https$/, error: "Links must be https:// URLs." }).max(2048),
  kind: z.enum(LINK_KINDS).default("other"),
  visibility: visibilityInput,
  sortOrder: z.number().int().min(0).max(100000).optional(),
});
export type AddProjectLinkInput = z.infer<typeof addProjectLinkInput>;

export const deleteProjectLinkInput = z.object({ linkId: uuid });

/* --- Files --------------------------------------------------------------- */

export const registerFileInput = z.object({
  projectId: uuid,
  name: shortText(255),
  category: z.enum(FILE_CATEGORIES).default("other"),
  visibility: visibilityInput,
});
export type RegisterFileInput = z.infer<typeof registerFileInput>;

/* --- Billing ------------------------------------------------------------- */

export const upsertBillingRecordInput = z.object({
  billingRecordId: uuid.optional(),
  projectId: uuid,
  label: shortText(200),
  amount: z.number().min(0).max(100000000),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase())
    .default("USD"),
  status: z.enum(BILLING_STATUSES).default("pending"),
  dueDate: isoDate.nullable().optional(),
  externalUrl: z.union([z.url({ protocol: /^https$/ }).max(2048), z.literal("")]).default(""),
  notes: z.string().max(10000).default(""),
});
export type UpsertBillingRecordInput = z.infer<typeof upsertBillingRecordInput>;
