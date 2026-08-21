import type { Metadata } from "next";
import Link from "next/link";

import { HealthBadge, ProjectStatusBadge } from "@/components/portal/badges";
import {
  EmptyState,
  formatDate,
  formatDateTime,
  Panel,
  PanelHeader,
  ProgressBar,
} from "@/components/portal/bits";
import { adminOverview } from "@/lib/portal/reads/internal";
import { createServiceClient } from "@/lib/portal/supabase/server";

export const metadata: Metadata = { title: "Projects — Operava admin" };

export default async function AdminOverviewPage() {
  const db = createServiceClient();
  const { projects, openClientRequests, recentActivity, customerCount } =
    await adminOverview(db);

  const waiting = projects.filter(
    (p) => p.status === "waiting_on_client" || p.status === "blocked",
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="t-eyebrow text-ink-3">Operava</p>
          <h1 className="t-h2 mt-2 text-ink">Projects</h1>
        </div>
        <dl className="flex gap-8 text-right">
          <div>
            <dt className="t-eyebrow text-ink-3">Active</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {projects.filter((p) => p.status !== "complete").length}
            </dd>
          </div>
          <div>
            <dt className="t-eyebrow text-ink-3">Blocked / waiting</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {waiting.length}
            </dd>
          </div>
          <div>
            <dt className="t-eyebrow text-ink-3">Customers</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {customerCount}
            </dd>
          </div>
        </dl>
      </header>

      <Panel as="section" aria-label="All projects">
        {projects.length === 0 ? (
          <EmptyState>
            No projects yet.{" "}
            <Link href="/admin/customers" className="font-medium text-navy-700 underline">
              Create a customer
            </Link>{" "}
            to start one.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="group grid gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-center sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.95rem] font-semibold text-ink group-hover:text-navy-700">
                      {project.name}
                    </p>
                    <p className="mt-0.5 text-[0.8125rem] text-ink-3">
                      {project.companyName}
                      {project.phase ? ` · ${project.phase}` : ""}
                      {project.targetDate ? ` · target ${formatDate(project.targetDate)}` : ""}
                    </p>
                  </div>
                  <ProgressBar percent={project.progressPercent} className="max-sm:max-w-xs" />
                  <span className="flex items-center gap-2 sm:justify-end">
                    {project.health !== "on_track" && project.status !== "complete" ? (
                      <HealthBadge health={project.health} />
                    ) : null}
                    <ProjectStatusBadge status={project.status} audience="internal" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <Panel as="section" aria-label="Open client action items">
          <PanelHeader title="Waiting on customers" />
          {openClientRequests.length === 0 ? (
            <EmptyState>No open action items.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {openClientRequests.map((item) => (
                <li key={item.id} className="px-5 py-3.5 sm:px-6">
                  <p className="text-[0.9rem] font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[0.78rem] text-ink-3">
                    {item.projectName}
                    {item.dueDate ? ` · due ${formatDate(item.dueDate)}` : ""} · opened{" "}
                    {formatDate(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel as="section" aria-label="Recent activity">
          <PanelHeader title="Recent activity" />
          {recentActivity.length === 0 ? (
            <EmptyState>Activity will collect here as the system is used.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {recentActivity.map((entry) => (
                <li key={entry.id} className="px-5 py-3 sm:px-6">
                  <p className="text-[0.85rem] text-ink-2">{entry.description}</p>
                  <p className="mt-0.5 text-[0.72rem] text-ink-3">
                    {entry.projectName ? `${entry.projectName} · ` : ""}
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
    </div>
  );
}
