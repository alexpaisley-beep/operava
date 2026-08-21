import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectStatusBadge } from "@/components/portal/badges";
import {
  EmptyState,
  formatDate,
  formatDateTime,
  Panel,
  PanelHeader,
} from "@/components/portal/bits";
import { requireAdminDb } from "@/lib/portal/admin-guard";
import { getCustomerDetail } from "@/lib/portal/reads/internal";
import { uuid } from "@/lib/portal/validation";

import { EditCustomerForm, InviteUserForm, NewProjectForm } from "./forms";

export const metadata: Metadata = { title: "Customer — Operava admin" };

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  if (!uuid.safeParse(customerId).success) notFound();

  const { db } = await requireAdminDb();
  const detail = await getCustomerDetail(db, customerId);
  if (!detail) notFound();

  const { company, users, projects, activity } = detail;

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Breadcrumb">
        <Link
          href="/admin/customers"
          className="text-[0.8125rem] font-medium text-ink-3 transition-colors hover:text-navy-700"
        >
          ← Customers
        </Link>
      </nav>

      <header>
        <p className="t-eyebrow text-ink-3">Customer</p>
        <h1 className="t-h2 mt-2 text-ink">{company.name}</h1>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex flex-col gap-8">
          <Panel as="section" aria-label="Projects">
            <PanelHeader title="Projects" />
            {projects.length === 0 ? (
              <EmptyState>No projects yet for {company.name}.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 sm:px-6"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[0.95rem] font-semibold text-ink group-hover:text-navy-700">
                          {project.name}
                          {project.isArchived ? (
                            <span className="ml-2 text-[0.72rem] font-normal uppercase tracking-wide text-ink-3">
                              archived
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[0.8125rem] text-ink-3">
                          {project.progressPercent}% ·{" "}
                          {project.targetDate
                            ? `target ${formatDate(project.targetDate)}`
                            : "no target date"}
                          {project.openClientRequests > 0
                            ? ` · ${project.openClientRequests} open action item${project.openClientRequests === 1 ? "" : "s"}`
                            : ""}
                        </span>
                      </span>
                      <ProjectStatusBadge status={project.status} audience="internal" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel as="section" aria-label="New project">
            <PanelHeader title="New project" />
            <div className="px-5 py-4 sm:px-6">
              <NewProjectForm companyId={company.id} />
            </div>
          </Panel>

          <Panel as="section" aria-label="Company activity">
            <PanelHeader title="Recent activity" />
            {activity.length === 0 ? (
              <EmptyState>Nothing recorded yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {activity.map((entry) => (
                  <li key={entry.id} className="px-5 py-3 sm:px-6">
                    <p className="text-[0.85rem] text-ink-2">{entry.description}</p>
                    <p className="mt-0.5 text-[0.72rem] text-ink-3">
                      {entry.actorLabel || entry.actorType}
                      {entry.actorType === "mcp" ? " (AI)" : ""} ·{" "}
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-8">
          <Panel as="section" aria-label="Portal users">
            <PanelHeader title="Portal users" />
            {users.length === 0 ? (
              <EmptyState>No portal users yet — invite the first one below.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {users.map((user) => (
                  <li key={user.id} className="px-5 py-3 sm:px-6">
                    <p className="text-[0.9rem] font-medium text-ink">
                      {user.fullName || user.email}
                    </p>
                    <p className="text-[0.78rem] text-ink-3">
                      {user.email} · added {formatDate(user.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <InviteUserForm companyId={company.id} />
            </div>
          </Panel>

          <Panel as="section" aria-label="Customer details">
            <PanelHeader title="Details" />
            <div className="px-5 py-4 sm:px-6">
              <EditCustomerForm company={company} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
