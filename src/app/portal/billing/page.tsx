import {
  Empty,
  List,
  PageHeading,
  Panel,
  PanelHeader,
  StatusPill,
} from "@/components/portal/ui";
import {
  listBilling,
  listProjects,
  outstandingBilling,
  resolveProject,
} from "@/lib/portal/data";
import { daysUntil, formatDate, formatMoney } from "@/lib/portal/format";
import { requireViewer } from "@/lib/portal/session";
import { billingStatus } from "@/lib/portal/vocabulary";
import { site } from "@/lib/site";

export const metadata = { title: "Billing" };

export default async function PortalBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requireViewer();
  const params = await searchParams;

  const projects = await listProjects();
  const project = await resolveProject(params.project, projects);

  if (!project) {
    return (
      <>
        <PageHeading eyebrow="Billing" title="Nothing billed yet." />
        <div className="mt-8">
          <Empty title="No project set up" />
        </div>
      </>
    );
  }

  const records = await listBilling(project.id);
  const outstanding = outstandingBilling(records);

  // Only sum what is genuinely owed. Adding cancelled or already-paid rows into
  // an "outstanding" figure would be a number the customer cannot reconcile.
  const owed = outstanding.reduce((total, record) => total + Number(record.amount), 0);
  const currency = outstanding[0]?.currency ?? records[0]?.currency ?? "USD";

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Billing"
        title="What has been invoiced, and what is outstanding."
        lead="A record of the project's payments. Invoices are issued and collected outside the portal — this is the ledger, not a checkout."
      />

      {outstanding.length > 0 ? (
        <Panel>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-5 py-5 lg:px-6">
            <div>
              <p className="t-eyebrow text-ink-3">Outstanding</p>
              <p className="mt-2 text-[1.5rem] font-semibold tabular-nums tracking-[-0.02em] text-ink">
                {formatMoney(owed, currency)}
              </p>
            </div>
            <p className="text-[0.875rem] text-ink-2">
              Across {outstanding.length} {outstanding.length === 1 ? "record" : "records"}
            </p>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title={`All records${records.length > 0 ? ` (${records.length})` : ""}`} />

        {records.length === 0 ? (
          <div className="p-5 lg:p-6">
            <Empty
              title="No billing records yet"
              body="Deposits, milestones and invoices appear here as they are raised."
            />
          </div>
        ) : (
          <List>
            {records.map((record) => {
              const meta = billingStatus[record.status];
              const due = daysUntil(record.due_date);
              const chasing =
                record.status === "overdue" ||
                (record.status === "due" && due !== null && due <= 7);

              return (
                <div key={record.id} className="px-5 py-4 lg:px-6">
                  {/* Stacked on a phone, split on wider screens. A four-column
                      table here would be unreadable at 320px. */}
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] font-medium leading-snug text-ink">
                        {record.label}
                      </p>
                      <p className="t-mono-sm mt-1.5 text-ink-3">
                        {record.due_date ? `Due ${formatDate(record.due_date)}` : "No due date"}
                        {record.paid_at ? ` · paid ${formatDate(record.paid_at)}` : ""}
                        {chasing && due !== null && !record.paid_at
                          ? due < 0
                            ? ` · ${Math.abs(due)} days past`
                            : due === 0
                              ? " · today"
                              : ` · in ${due} days`
                          : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-[1rem] font-semibold tabular-nums text-ink">
                        {formatMoney(Number(record.amount), record.currency)}
                      </span>
                      <StatusPill label={meta.label} tone={meta.tone} />
                    </div>
                  </div>

                  {record.notes ? (
                    <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">
                      {record.notes}
                    </p>
                  ) : null}

                  {record.external_url ? (
                    <a
                      href={record.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-[0.875rem] text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
                    >
                      View invoice
                    </a>
                  ) : null}
                </div>
              );
            })}
          </List>
        )}
      </Panel>

      <p className="text-[0.875rem] leading-relaxed text-ink-3">
        Questions about an invoice? Email{" "}
        <a
          href={`mailto:${site.contactEmail}`}
          className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
        >
          {site.contactEmail}
        </a>{" "}
        or raise a question in the portal — either reaches the same person.
      </p>
    </div>
  );
}
