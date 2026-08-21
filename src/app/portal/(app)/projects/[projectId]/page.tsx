import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  BillingBadge,
  ClientRequestBadge,
  HealthBadge,
  MilestoneBadge,
  ProjectStatusBadge,
  RequestBadge,
} from "@/components/portal/badges";
import {
  EmptyState,
  formatDate,
  formatDateTime,
  formatMoney,
  Meta,
  Panel,
  PanelHeader,
  ProgressBar,
} from "@/components/portal/bits";
import { customerProject } from "@/lib/portal/reads/customer";
import { createUserClient } from "@/lib/portal/supabase/server";
import {
  FILE_CATEGORY_LABELS,
  LINK_KIND_LABELS,
  REQUEST_TYPE_LABELS,
  UPDATE_TYPE_LABELS,
  type UpdateType,
} from "@/lib/portal/types";
import { getViewer } from "@/lib/portal/viewer";

import { ActionItemControls, NewRequestForm } from "./interactive";

export const metadata: Metadata = { title: "Project — Operava" };

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default async function CustomerProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");

  const { projectId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();

  const db = await createUserClient();
  // RLS scopes this to the viewer's company; anything else reads as missing.
  const detail = await customerProject(db, projectId);
  if (!detail) notFound();

  const { project, milestones, updates, clientRequests, links, files, billing, requests } =
    detail;

  const openItems = clientRequests.filter(
    (r) => r.status === "open" || r.status === "acknowledged",
  );
  const closedItems = clientRequests.filter(
    (r) => r.status === "completed" || r.status === "cancelled",
  );
  const nextMilestone = milestones.find((m) => m.status !== "complete");
  const latestUpdate = updates[0];

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb">
        <Link
          href="/portal"
          className="text-[0.8125rem] font-medium text-ink-3 transition-colors hover:text-navy-700"
        >
          ← All projects
        </Link>
      </nav>

      {/* ------------------------------ hero ------------------------------ */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="t-h2 text-ink">{project.name}</h1>
          <span className="flex items-center gap-2">
            {project.health !== "on_track" && project.status !== "complete" ? (
              <HealthBadge health={project.health} />
            ) : null}
            <ProjectStatusBadge status={project.status} />
          </span>
        </div>
        {project.summary ? (
          <p className="t-lead max-w-3xl text-ink-2">{project.summary}</p>
        ) : null}
        <div className="max-w-2xl">
          <ProgressBar percent={project.progressPercent} />
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-5 sm:grid-cols-4">
          <Meta label="Current phase">{project.phase || "—"}</Meta>
          <Meta label="Next milestone">{nextMilestone ? nextMilestone.name : "—"}</Meta>
          <Meta label="Target date">{formatDate(project.targetDate)}</Meta>
          {project.actualCompletionDate ? (
            <Meta label="Completed">{formatDate(project.actualCompletionDate)}</Meta>
          ) : (
            <Meta label="Started">{formatDate(project.startDate)}</Meta>
          )}
        </dl>
        {project.currentWork ? (
          <p className="text-[0.9rem] text-ink-2">
            <span className="font-semibold text-ink">Right now:</span> {project.currentWork}
          </p>
        ) : null}
        {latestUpdate ? (
          <div className="rounded-lg border border-line bg-muted/70 px-4 py-3.5">
            <p className="t-eyebrow text-ink-3">
              Latest update · {formatDateTime(latestUpdate.createdAt)}
            </p>
            <p className="mt-1.5 text-[0.95rem] font-medium text-ink">{latestUpdate.title}</p>
          </div>
        ) : null}
      </header>

      {/* --------------------------- action items -------------------------- */}
      <Panel as="section" id="action-items" aria-label="Things we need from you">
        <PanelHeader
          title="Things we need from you"
          aside={
            closedItems.length > 0 ? (
              <span className="text-[0.78rem] text-ink-3">{closedItems.length} resolved</span>
            ) : undefined
          }
        />
        {openItems.length === 0 ? (
          <EmptyState>Nothing right now — we have everything we need.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {openItems.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-[0.95rem] font-semibold text-ink">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 max-w-2xl whitespace-pre-wrap text-[0.875rem] leading-relaxed text-ink-2">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[0.78rem] text-ink-3">
                      {item.dueDate ? `Needed by ${formatDate(item.dueDate)} · ` : ""}
                      Requested {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <ClientRequestBadge status={item.status} />
                </div>
                <ActionItemControls
                  clientRequestId={item.id}
                  status={item.status as "open" | "acknowledged"}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* ----------------------------- timeline --------------------------- */}
        <Panel as="section" id="timeline" aria-label="Project timeline">
          <PanelHeader title="Timeline" />
          {updates.length === 0 ? (
            <EmptyState>Updates will appear here as work happens.</EmptyState>
          ) : (
            <ol className="flex flex-col px-5 py-2 sm:px-6">
              {updates.map((update, index) => (
                <li key={update.id} className="relative flex gap-4 pb-2">
                  <div className="flex flex-col items-center pt-2">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${index === 0 ? "bg-leaf-500" : "bg-navy-200"}`}
                    />
                    {index < updates.length - 1 ? (
                      <span aria-hidden="true" className="mt-1 w-px flex-1 bg-line" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-5 pt-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <h3 className="text-[0.95rem] font-semibold text-ink">{update.title}</h3>
                      <time className="t-mono-sm text-ink-3">
                        {formatDateTime(update.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[0.78rem] text-ink-3">
                      {update.updateType in UPDATE_TYPE_LABELS
                        ? UPDATE_TYPE_LABELS[update.updateType as UpdateType]
                        : "Update"}
                      {update.authorName ? ` · ${update.authorName}` : ""}
                    </p>
                    {update.body ? (
                      <p className="mt-2 whitespace-pre-wrap text-[0.875rem] leading-relaxed text-ink-2">
                        {update.body}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <div className="flex flex-col gap-8">
          {/* ---------------------------- milestones ------------------------ */}
          <Panel as="section" aria-label="Milestones">
            <PanelHeader title="Plan" />
            {milestones.length === 0 ? (
              <EmptyState>The milestone plan is being drawn up.</EmptyState>
            ) : (
              <ol className="divide-y divide-line">
                {milestones.map((milestone) => (
                  <li
                    key={milestone.id}
                    className="flex items-start justify-between gap-4 px-5 py-3.5 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p
                        className={`text-[0.9rem] font-medium ${milestone.status === "complete" ? "text-ink-3" : "text-ink"}`}
                      >
                        {milestone.name}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-ink-3">
                        {milestone.status === "complete" && milestone.completedAt
                          ? `Done ${formatDate(milestone.completedAt)}`
                          : milestone.dueDate
                            ? `Due ${formatDate(milestone.dueDate)}`
                            : ""}
                      </p>
                    </div>
                    <MilestoneBadge status={milestone.status} />
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {/* ------------------------ links & files ------------------------- */}
          <Panel as="section" aria-label="Links and deliverables">
            <PanelHeader title="Links & deliverables" />
            {links.length === 0 && files.length === 0 ? (
              <EmptyState>Staging links and deliverables will collect here.</EmptyState>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {links.length > 0 ? (
                  <ul className="flex flex-col gap-1 px-3 py-3">
                    {links.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="group flex items-baseline justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-navy-50"
                        >
                          <span className="truncate text-[0.875rem] font-medium text-navy-700 group-hover:text-navy-800">
                            {link.label} ↗
                          </span>
                          <span className="shrink-0 text-[0.72rem] uppercase tracking-wide text-ink-3">
                            {LINK_KIND_LABELS[link.kind]}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {files.length > 0 ? (
                  <ul className="flex flex-col gap-1 px-3 py-3">
                    {files.map((file) => (
                      <li key={file.id}>
                        <a
                          href={`/portal/files/${file.id}`}
                          className="group flex items-baseline justify-between gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-navy-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[0.875rem] font-medium text-ink group-hover:text-navy-800">
                              {file.name}
                            </span>
                            <span className="text-[0.72rem] text-ink-3">
                              {FILE_CATEGORY_LABELS[file.category]} ·{" "}
                              {formatBytes(file.sizeBytes)}
                            </span>
                          </span>
                          <span className="shrink-0 text-[0.75rem] font-medium text-navy-700">
                            Download
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </Panel>

          {/* ----------------------------- billing -------------------------- */}
          {billing.length > 0 ? (
            <Panel as="section" aria-label="Billing">
              <PanelHeader title="Billing" />
              <ul className="divide-y divide-line">
                {billing.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.9rem] font-medium text-ink">
                        {record.label}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-ink-3">
                        {formatMoney(record.amount, record.currency)}
                        {record.dueDate ? ` · due ${formatDate(record.dueDate)}` : ""}
                        {record.paidAt ? ` · paid ${formatDate(record.paidAt)}` : ""}
                      </p>
                      {record.externalUrl ? (
                        <a
                          href={record.externalUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-0.5 inline-block text-[0.78rem] font-medium text-navy-700 underline decoration-line-2 underline-offset-2 hover:text-navy-800"
                        >
                          View invoice ↗
                        </a>
                      ) : null}
                    </div>
                    <BillingBadge status={record.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>

      {/* --------------------------- your requests -------------------------- */}
      <Panel as="section" aria-label="Your requests">
        <PanelHeader title="Your requests to Operava" />
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6">
          {requests.length === 0 ? (
            <p className="text-[0.875rem] text-ink-3">
              Spotted a bug, want a change, or have a question? Send it here instead of digging
              for an email thread — everything gets tracked with a status.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-line rounded-md border border-line">
              {requests.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/portal/requests/${request.id}`}
                    className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.9rem] font-medium text-ink group-hover:text-navy-800">
                        {request.title}
                      </span>
                      <span className="text-[0.75rem] text-ink-3">
                        {REQUEST_TYPE_LABELS[request.type]} · {formatDate(request.createdAt)}
                      </span>
                    </span>
                    <RequestBadge status={request.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <NewRequestForm projectId={project.id} />
        </div>
      </Panel>
    </div>
  );
}
