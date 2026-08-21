/**
 * View models. The customer serializers are the only path from a row to
 * customer-visible JSON, and they enumerate fields — there is deliberately no
 * `...row` spread anywhere here, so a new internal column never leaks by
 * default.
 */

import type {
  ActivityRow,
  BillingRecordRow,
  ClientRequestRow,
  CompanyRow,
  MilestoneRow,
  ProjectFileRow,
  ProjectLinkRow,
  ProjectRow,
  ProjectUpdateRow,
  RequestCommentRow,
  RequestRow,
} from "./types";

/* ---------------------------------------------------------------------------
   Customer views — safe to render in the portal or return to a customer.
--------------------------------------------------------------------------- */

export function toCustomerCompany(row: CompanyRow) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
  };
}

export function toCustomerProject(row: ProjectRow, ownerName?: string | null) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    summary: row.summary,
    status: row.status,
    health: row.health,
    phase: row.phase,
    currentWork: row.current_work,
    progressPercent: row.progress_percent,
    startDate: row.start_date,
    targetDate: row.target_date,
    actualCompletionDate: row.actual_completion_date,
    ownerName: ownerName ?? null,
    updatedAt: row.updated_at,
  };
}
export type CustomerProject = ReturnType<typeof toCustomerProject>;

export function toCustomerMilestone(row: MilestoneRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
  };
}
export type CustomerMilestone = ReturnType<typeof toCustomerMilestone>;

export function toCustomerUpdate(row: ProjectUpdateRow, authorName?: string | null) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    updateType: row.category,
    milestoneId: row.milestone_id,
    authorName: authorName ?? null,
    createdAt: row.created_at,
  };
}
export type CustomerUpdate = ReturnType<typeof toCustomerUpdate>;

export function toCustomerClientRequest(row: ClientRequestRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    acknowledgedAt: row.acknowledged_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
export type CustomerClientRequest = ReturnType<typeof toCustomerClientRequest>;

export function toCustomerRequest(row: RequestRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    estimatedCost: row.estimated_cost,
    estimatedTimelineImpact: row.estimated_timeline_impact,
    approvalStatus: row.approval_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export type CustomerRequest = ReturnType<typeof toCustomerRequest>;

export function toCustomerRequestComment(row: RequestCommentRow, authorName?: string | null) {
  return {
    id: row.id,
    body: row.body,
    authorName: authorName ?? null,
    createdAt: row.created_at,
  };
}

export function toCustomerLink(row: ProjectLinkRow) {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    kind: row.kind,
    sortOrder: row.sort_order,
  };
}
export type CustomerLink = ReturnType<typeof toCustomerLink>;

export function toCustomerFile(row: ProjectFileRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sizeBytes: row.size_bytes,
    mimeType: row.mime_type,
    createdAt: row.created_at,
  };
}
export type CustomerFile = ReturnType<typeof toCustomerFile>;

/** Accepts the notes-free row shape the customer column grants can actually read. */
export function toCustomerBillingRecord(row: Omit<BillingRecordRow, "notes">) {
  return {
    id: row.id,
    label: row.label,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    externalUrl: row.external_url || null,
    sortOrder: row.sort_order,
  };
}
export type CustomerBillingRecord = ReturnType<typeof toCustomerBillingRecord>;

/* ---------------------------------------------------------------------------
   Internal views — Operava staff and the MCP. Include internal fields, still
   enumerated (never spread), so audit `data` and secrets infrastructure never
   ride along by accident.
--------------------------------------------------------------------------- */

export function toInternalCompany(row: CompanyRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    primaryContactName: row.primary_contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export type InternalCompany = ReturnType<typeof toInternalCompany>;

export function toInternalProject(row: ProjectRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    summary: row.summary,
    status: row.status,
    health: row.health,
    phase: row.phase,
    currentWork: row.current_work,
    progressPercent: row.progress_percent,
    startDate: row.start_date,
    targetDate: row.target_date,
    actualCompletionDate: row.actual_completion_date,
    ownerProfileId: row.owner_profile_id,
    internalNotes: row.internal_notes,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export type InternalProject = ReturnType<typeof toInternalProject>;

export function toInternalMilestone(row: MilestoneRow) {
  return {
    ...toCustomerMilestone(row),
    projectId: row.project_id,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export type InternalMilestone = ReturnType<typeof toInternalMilestone>;

export function toInternalUpdate(row: ProjectUpdateRow, authorName?: string | null) {
  return {
    ...toCustomerUpdate(row, authorName),
    projectId: row.project_id,
    visibility: row.visibility,
  };
}
export type InternalUpdate = ReturnType<typeof toInternalUpdate>;

export function toInternalClientRequest(row: ClientRequestRow) {
  return {
    ...toCustomerClientRequest(row),
    cancelledAt: row.cancelled_at,
    updatedAt: row.updated_at,
  };
}
export type InternalClientRequest = ReturnType<typeof toInternalClientRequest>;

export function toInternalLink(row: ProjectLinkRow) {
  return {
    ...toCustomerLink(row),
    projectId: row.project_id,
    visibility: row.visibility,
  };
}
export type InternalLink = ReturnType<typeof toInternalLink>;

export function toInternalFile(row: ProjectFileRow) {
  return {
    ...toCustomerFile(row),
    projectId: row.project_id,
    visibility: row.visibility,
    path: row.path,
  };
}
export type InternalFile = ReturnType<typeof toInternalFile>;

export function toInternalBillingRecord(row: BillingRecordRow) {
  return {
    ...toCustomerBillingRecord(row),
    projectId: row.project_id,
    notes: row.notes,
  };
}
export type InternalBillingRecord = ReturnType<typeof toInternalBillingRecord>;

export function toInternalActivity(row: ActivityRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    companyId: row.company_id,
    actorType: row.actor_type,
    actorLabel: row.actor_label,
    action: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    description: row.description,
    visibility: row.visibility,
    data: row.data,
    createdAt: row.created_at,
  };
}
export type InternalActivity = ReturnType<typeof toInternalActivity>;
