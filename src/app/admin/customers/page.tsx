import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/portal/badges";
import { EmptyState, Panel, PanelHeader } from "@/components/portal/bits";
import { listCustomers } from "@/lib/portal/reads/internal";
import { createServiceClient } from "@/lib/portal/supabase/server";
import { COMPANY_STATUS_LABELS } from "@/lib/portal/types";

import { NewCustomerForm } from "./new-customer-form";

export const metadata: Metadata = { title: "Customers — Operava admin" };

const STATUS_TONES = {
  prospect: "slate",
  active: "green",
  paused: "amber",
  archived: "slate",
} as const;

export default async function AdminCustomersPage() {
  const db = createServiceClient();
  const customers = await listCustomers(db);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="t-eyebrow text-ink-3">Operava</p>
        <h1 className="t-h2 mt-2 text-ink">Customers</h1>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <Panel as="section" aria-label="Customer list">
          {customers.length === 0 ? (
            <EmptyState>No customers yet — create the first one.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 sm:px-6"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.95rem] font-semibold text-ink group-hover:text-navy-700">
                        {customer.name}
                      </span>
                      <span className="text-[0.8125rem] text-ink-3">
                        {customer.primaryContactName || "No contact"}
                        {customer.contactEmail ? ` · ${customer.contactEmail}` : ""}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="t-mono-sm text-ink-3">
                        {customer.projectCount} project{customer.projectCount === 1 ? "" : "s"}
                      </span>
                      <Badge tone={STATUS_TONES[customer.status]}>
                        {COMPANY_STATUS_LABELS[customer.status]}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel as="section" aria-label="New customer">
          <PanelHeader title="New customer" />
          <div className="px-5 py-4 sm:px-6">
            <NewCustomerForm />
          </div>
        </Panel>
      </div>
    </div>
  );
}
