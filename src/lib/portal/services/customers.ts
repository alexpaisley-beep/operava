import { assertOperavaActor } from "../authz";
import { diffFields, recordAudit } from "../audit";
import * as data from "../data";
import { PortalError } from "../errors";
import type { CompanyRow } from "../types";
import type { CreateCustomerInput, UpdateCustomerInput } from "../validation";
import type { ServiceCtx } from "./context";

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "customer";
}

export async function createCustomer(
  ctx: ServiceCtx,
  input: CreateCustomerInput,
): Promise<CompanyRow> {
  assertOperavaActor(ctx.actor);

  const base = slugify(input.name);
  let slug = base;
  for (let attempt = 2; await data.getCompanyBySlug(ctx.db, slug); attempt += 1) {
    if (attempt > 50)
      throw new PortalError("conflict", "Could not find a free slug for this name.");
    slug = `${base}-${attempt}`;
  }

  const company = await data.insertCompany(ctx.db, {
    name: input.name,
    slug,
    status: input.status,
    primary_contact_name: input.primaryContactName,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    internal_notes: input.internalNotes,
  });

  await recordAudit(ctx.db, ctx.actor, {
    action: "customer.created",
    description: `Customer ${company.name} created.`,
    companyId: company.id,
    entityType: "company",
    entityId: company.id,
    visibility: "internal",
    source: ctx.source,
  });

  return company;
}

const CUSTOMER_AUDIT_FIELDS = [
  "name",
  "status",
  "primary_contact_name",
  "contact_email",
  "contact_phone",
  "internal_notes",
] as const;

export async function updateCustomer(
  ctx: ServiceCtx,
  input: UpdateCustomerInput,
): Promise<CompanyRow> {
  assertOperavaActor(ctx.actor);

  const before = await data.getCompany(ctx.db, input.customerId);
  if (!before) throw new PortalError("not_found", "Customer not found.");

  const patch: Partial<CompanyRow> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.status !== undefined) patch.status = input.status;
  if (input.primaryContactName !== undefined)
    patch.primary_contact_name = input.primaryContactName;
  if (input.contactEmail !== undefined) patch.contact_email = input.contactEmail;
  if (input.contactPhone !== undefined) patch.contact_phone = input.contactPhone;
  if (input.internalNotes !== undefined) patch.internal_notes = input.internalNotes;

  const company = await data.updateCompany(ctx.db, before.id, patch);

  const diff = diffFields(before, company, CUSTOMER_AUDIT_FIELDS);
  await recordAudit(ctx.db, ctx.actor, {
    action: "customer.updated",
    description: `Customer ${company.name} updated (${diff.changed.join(", ") || "no changes"}).`,
    companyId: company.id,
    entityType: "company",
    entityId: company.id,
    visibility: "internal",
    before: diff.before,
    after: diff.after,
    source: ctx.source,
  });

  return company;
}
