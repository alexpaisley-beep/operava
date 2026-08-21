import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Badge,
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
  Panel,
  PanelHeader,
  ProgressBar,
} from "@/components/portal/bits";
import { requireAdminDb } from "@/lib/portal/admin-guard";
import { getProjectDetail, listAdminProfiles } from "@/lib/portal/reads/internal";
import {
  FILE_CATEGORY_LABELS,
  LINK_KIND_LABELS,
  REQUEST_TYPE_LABELS,
  UPDATE_TYPE_LABELS,
  type UpdateType,
} from "@/lib/portal/types";
import { uuid } from "@/lib/portal/validation";

import { deleteBillingAction, deleteFileAction, deleteLinkAction } from "../../actions";
import {
  ArchiveToggle,
  BillingForm,
  ClientRequestControls,
  CustomerCopyForm,
  DeleteRowButton,
  MilestoneRowControls,
  NewClientRequestForm,
  NewLinkForm,
  NewMilestoneForm,
  PostUpdateForm,
  ProjectDetailsForm,
  QuickProgressForm,
  QuickStatusForm,
  RequestTriage,
  UploadFileForm,
} from "./forms";

export const metadata: Metadata = { title: "Project — Operava admin" };

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  if (!uuid.safeParse(projectId).success) notFound();

  const { db } = await requireAdminDb();
  const [detail, admins] = await Promise.all([
    getProjectDetail(db, projectId),
    listAdminProfiles(db),
  ]);
  if (!detail) notFound();

  const {
    project,
    company,
    ownerName,
    milestones,
    updates,
    clientRequests,
    links,
    files,
    billing,
    requests,
    activity,
  } = detail;

  const openClientRequests = clientRequests.filter(
    (r) => r.status === "open" || r.status === "acknowledged",
  );
  const closedClientRequests = clientRequests.filter(
    (r) => r.status === "completed" || r.status === "cancelled",
  );
  const openRequests = requests.filter((r) => r.status !== "done" && r.status !== "declined");

  return (
    <div className="flex flex-col gap-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-[0.8125rem] text-ink-3"
      >
        <Link href="/admin" className="font-medium transition-colors hover:text-navy-700">
          Projects
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/admin/customers/${company.id}`}
          className="font-medium transition-colors hover:text-navy-700"
        >
          {company.name}
        </Link>
      </nav>

      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="t-h2 text-ink">{project.name}</h1>
          <span className="flex items-center gap-2">
            {project.health !== "on_track" && project.status !== "complete" ? (
              <HealthBadge health={project.health} />
            ) : null}
            <ProjectStatusBadge status={project.status} audience="internal" />
            {project.isArchived ? <Badge tone="slate">Archived</Badge> : null}
          </span>
        </div>
        <div className="max-w-2xl">
          <ProgressBar percent={project.progressPercent} />
        </div>
        <p className="text-[0.8125rem] text-ink-3">
          {project.phase ? `${project.phase} · ` : ""}
          {ownerName ? `Owner ${ownerName} · ` : ""}
          {project.startDate ? `started ${formatDate(project.startDate)} · ` : ""}
          {project.targetDate ? `target ${formatDate(project.targetDate)}` : "no target date"}
          {project.actualCompletionDate
            ? ` · completed ${formatDate(project.actualCompletionDate)}`
            : ""}
          {" · "}
          <Link
            href={`/portal/projects/${project.id}`}
            className="font-medium text-navy-700 underline decoration-line-2 underline-offset-2"
          >
            view as customer
          </Link>
        </p>
      </header>

      {/* --------------------------- quick actions --------------------------- */}
      <Panel as="section" aria-label="Quick update">
        <PanelHeader title="Quick update" />
        <div className="flex flex-col gap-6 px-5 py-4 sm:px-6">
          <QuickStatusForm project={project} />
          <QuickProgressForm project={project} />
        </div>
      </Panel>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex flex-col gap-8">
          <Panel as="section" aria-label="Post an update">
            <PanelHeader title="Post an update" />
            <div className="px-5 py-4 sm:px-6">
              <PostUpdateForm projectId={project.id} milestones={milestones} />
            </div>
          </Panel>

          <Panel as="section" aria-label="Timeline">
            <PanelHeader title="Timeline" />
            {updates.length === 0 ? (
              <EmptyState>No updates yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {updates.map((update) => (
                  <li key={update.id} className="px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <p className="text-[0.9rem] font-semibold text-ink">{update.title}</p>
                      <time className="t-mono-sm text-ink-3">
                        {formatDateTime(update.createdAt)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[0.75rem] text-ink-3">
                      {update.updateType in UPDATE_TYPE_LABELS
                        ? UPDATE_TYPE_LABELS[update.updateType as UpdateType]
                        : "Update"}
                      {update.visibility === "internal"
                        ? " · internal only"
                        : " · customer-visible"}
                      {update.authorName ? ` · ${update.authorName}` : ""}
                    </p>
                    {update.body ? (
                      <p className="mt-1.5 whitespace-pre-wrap text-[0.85rem] leading-relaxed text-ink-2">
                        {update.body}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel as="section" aria-label="Client action items">
            <PanelHeader
              title="Waiting on the customer"
              aside={
                closedClientRequests.length > 0 ? (
                  <span className="text-[0.78rem] text-ink-3">
                    {closedClientRequests.length} resolved
                  </span>
                ) : undefined
              }
            />
            {openClientRequests.length === 0 ? (
              <EmptyState>Nothing outstanding.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {openClientRequests.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9rem] font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-[0.78rem] text-ink-3">
                        {item.dueDate ? `Needed by ${formatDate(item.dueDate)} · ` : ""}
                        opened {formatDate(item.createdAt)}
                      </p>
                      <span className="mt-1.5 inline-block">
                        <ClientRequestBadge status={item.status} />
                      </span>
                    </div>
                    <ClientRequestControls clientRequestId={item.id} status={item.status} />
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <NewClientRequestForm projectId={project.id} />
            </div>
          </Panel>

          <Panel as="section" aria-label="Customer requests">
            <PanelHeader
              title="Customer requests"
              aside={
                <span className="text-[0.78rem] text-ink-3">{openRequests.length} open</span>
              }
            />
            {requests.length === 0 ? (
              <EmptyState>The customer hasn&rsquo;t sent any requests.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {requests.map((request) => (
                  <li key={request.id} className="flex flex-col gap-3 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <div className="min-w-0">
                        <p className="text-[0.9rem] font-semibold text-ink">{request.title}</p>
                        <p className="mt-0.5 text-[0.78rem] text-ink-3">
                          {REQUEST_TYPE_LABELS[request.type]} · {formatDate(request.created_at)}
                        </p>
                        {request.description ? (
                          <p className="mt-1.5 max-w-2xl whitespace-pre-wrap text-[0.85rem] leading-relaxed text-ink-2">
                            {request.description}
                          </p>
                        ) : null}
                      </div>
                      <RequestBadge status={request.status} />
                    </div>
                    <RequestTriage requestId={request.id} status={request.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-8">
          <Panel as="section" aria-label="Milestones">
            <PanelHeader title="Milestones" />
            {milestones.length === 0 ? (
              <EmptyState>No milestones yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {milestones.map((milestone) => (
                  <li
                    key={milestone.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="text-[0.9rem] font-medium text-ink">
                        {milestone.name}
                        {milestone.visibility === "internal" ? (
                          <span className="ml-2 text-[0.7rem] uppercase tracking-wide text-ink-3">
                            internal
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[0.75rem] text-ink-3">
                        {milestone.dueDate ? `Due ${formatDate(milestone.dueDate)} · ` : ""}
                        <MilestoneBadge status={milestone.status} />
                      </p>
                    </div>
                    <MilestoneRowControls milestone={milestone} />
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <NewMilestoneForm projectId={project.id} />
            </div>
          </Panel>

          <Panel as="section" aria-label="Links">
            <PanelHeader title="Links" />
            {links.length === 0 ? (
              <EmptyState>No links yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {links.map((link) => (
                  <li
                    key={link.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6"
                  >
                    <div className="min-w-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block truncate text-[0.875rem] font-medium text-navy-700 hover:text-navy-800"
                      >
                        {link.label} ↗
                      </a>
                      <p className="text-[0.72rem] text-ink-3">
                        {LINK_KIND_LABELS[link.kind]}
                        {link.visibility === "internal" ? " · internal" : ""}
                      </p>
                    </div>
                    <DeleteRowButton
                      action={deleteLinkAction}
                      hidden={{ linkId: link.id, projectId: project.id }}
                    />
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <NewLinkForm projectId={project.id} />
            </div>
          </Panel>

          <Panel as="section" aria-label="Files">
            <PanelHeader title="Files" />
            {files.length === 0 ? (
              <EmptyState>No files yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6"
                  >
                    <div className="min-w-0">
                      <a
                        href={`/portal/files/${file.id}`}
                        className="block truncate text-[0.875rem] font-medium text-ink hover:text-navy-700"
                      >
                        {file.name}
                      </a>
                      <p className="text-[0.72rem] text-ink-3">
                        {FILE_CATEGORY_LABELS[file.category]}
                        {file.visibility === "internal" ? " · internal" : ""}
                      </p>
                    </div>
                    <DeleteRowButton
                      action={deleteFileAction}
                      hidden={{ fileId: file.id, projectId: project.id }}
                    />
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <UploadFileForm projectId={project.id} />
            </div>
          </Panel>

          <Panel as="section" aria-label="Billing">
            <PanelHeader title="Billing" />
            {billing.length === 0 ? (
              <EmptyState>No billing lines yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {billing.map((record) => (
                  <li key={record.id} className="flex flex-col gap-3 px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.875rem] font-medium text-ink">
                        {record.label} · {formatMoney(record.amount, record.currency)}
                      </p>
                      <DeleteRowButton
                        action={deleteBillingAction}
                        hidden={{ billingRecordId: record.id, projectId: project.id }}
                      />
                    </div>
                    <BillingForm projectId={project.id} record={record} />
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <BillingForm projectId={project.id} />
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid items-start gap-8 xl:grid-cols-2">
        <Panel as="section" aria-label="Customer-facing copy">
          <PanelHeader title="Customer-facing copy" />
          <div className="px-5 py-4 sm:px-6">
            <CustomerCopyForm project={project} />
          </div>
        </Panel>

        <Panel as="section" aria-label="Project details and internal notes">
          <PanelHeader title="Details & internal notes" />
          <div className="flex flex-col gap-6 px-5 py-4 sm:px-6">
            <ProjectDetailsForm project={project} admins={admins} />
            <div className="border-t border-line pt-4">
              <ArchiveToggle project={project} />
            </div>
          </div>
        </Panel>
      </div>

      <Panel as="section" aria-label="Activity">
        <PanelHeader title="Activity" />
        {activity.length === 0 ? (
          <EmptyState>No activity recorded yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {activity.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="text-[0.85rem] text-ink-2">{entry.description}</p>
                  <p className="mt-0.5 text-[0.72rem] text-ink-3">
                    {entry.actorLabel || entry.actorType}
                    {entry.actorType === "mcp" ? " (AI)" : ""} · {entry.action}
                    {entry.visibility === "internal" ? " · internal" : ""}
                  </p>
                </div>
                <time className="t-mono-sm text-ink-3">{formatDateTime(entry.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
