import { assertOperavaActor } from "../authz";
import { diffFields, recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import type { BillingRecordRow } from "../types";
import type { UpsertBillingRecordInput } from "../validation";
import { loadProjectForActor, nowIso, type ServiceCtx } from "./context";

export async function upsertBillingRecord(
  ctx: ServiceCtx,
  input: UpsertBillingRecordInput,
): Promise<BillingRecordRow> {
  assertOperavaActor(ctx.actor);
  const project = await loadProjectForActor(ctx, input.projectId);

  const values = {
    label: input.label,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    due_date: input.dueDate ?? null,
    external_url: input.externalUrl,
    notes: input.notes,
  };

  let record: BillingRecordRow;
  let action: string;
  let auditDiff: { before?: Record<string, unknown>; after?: Record<string, unknown> } = {
    after: { label: input.label, amount: input.amount, status: input.status },
  };

  if (input.billingRecordId) {
    const before = await data.getBillingRecord(ctx.db, input.billingRecordId);
    if (!before || before.project_id !== project.id) {
      throw new PortalError("not_found", "Billing record not found.");
    }
    const paidAt =
      input.status === "paid"
        ? (before.paid_at ?? nowIso())
        : input.status === before.status
          ? before.paid_at
          : null;
    record = await data.updateBillingRecord(ctx.db, before.id, { ...values, paid_at: paidAt });
    const diff = diffFields(before, record, [
      "label",
      "amount",
      "currency",
      "status",
      "due_date",
    ]);
    auditDiff = { before: diff.before, after: diff.after };
    action = "billing.updated";
  } else {
    record = await data.insertBillingRecord(ctx.db, {
      ...values,
      project_id: project.id,
      paid_at: input.status === "paid" ? nowIso() : null,
    });
    action = "billing.created";
  }

  await recordAudit(ctx.db, ctx.actor, {
    action,
    description: `Billing: ${record.label} — ${record.status}.`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "billing_record",
    entityId: record.id,
    visibility: "customer",
    ...auditDiff,
    source: ctx.source,
  });

  return record;
}

export async function deleteBillingRecord(
  ctx: ServiceCtx,
  billingRecordId: string,
): Promise<void> {
  assertOperavaActor(ctx.actor);

  const record = await data.getBillingRecord(ctx.db, billingRecordId);
  if (!record) throw new PortalError("not_found", "Billing record not found.");
  const project = await loadProjectForActor(ctx, record.project_id);

  await data.deleteBillingRecord(ctx.db, record.id);

  await recordAudit(ctx.db, ctx.actor, {
    action: "billing.deleted",
    description: `Billing record removed: ${record.label}`,
    projectId: project.id,
    companyId: project.company_id,
    entityType: "billing_record",
    entityId: record.id,
    visibility: "internal",
    before: { label: record.label, amount: record.amount, status: record.status },
    source: ctx.source,
  });
}
