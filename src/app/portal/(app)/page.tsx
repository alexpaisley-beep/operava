import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { HealthBadge, ProjectStatusBadge } from "@/components/portal/badges";
import {
  EmptyState,
  formatDate,
  formatDateTime,
  Panel,
  PanelHeader,
  ProgressBar,
} from "@/components/portal/bits";
import { customerHome } from "@/lib/portal/reads/customer";
import { createUserClient } from "@/lib/portal/supabase/server";
import { UPDATE_TYPE_LABELS, type UpdateType } from "@/lib/portal/types";
import { getViewer } from "@/lib/portal/viewer";

export const metadata: Metadata = { title: "Your projects — Operava" };

export default async function PortalHomePage() {
  const viewer = await getViewer();
  if (!viewer?.companyId) redirect("/portal/login");

  const db = await createUserClient();
  const home = await customerHome(db, viewer.companyId);
  if (!home) redirect("/portal/login");

  const { company, projects, openRequests, recentUpdates } = home;
  const firstName = viewer.fullName.split(" ")[0] || null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="t-eyebrow text-ink-3">{company.name}</p>
        <h1 className="t-h2 mt-2 text-ink">
          {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
        </h1>
      </header>

      {openRequests.length > 0 ? (
        <Panel className="border-[#e8d5a8] bg-[#fdf6e7]">
          <div className="px-5 py-4 sm:px-6">
            <h2 className="text-[0.95rem] font-semibold text-[#8a5a00]">
              We need{" "}
              {openRequests.length === 1 ? "one thing" : `${openRequests.length} things`} from
              you
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {openRequests.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/portal/projects/${request.projectId}#action-items`}
                    className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-md bg-surface/70 px-3.5 py-2.5 transition-colors hover:bg-surface"
                  >
                    <span className="text-[0.9rem] font-medium text-ink group-hover:text-navy-800">
                      {request.title}
                    </span>
                    <span className="text-[0.78rem] text-ink-3">
                      {request.dueDate
                        ? `Needed by ${formatDate(request.dueDate)}`
                        : "No deadline"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      ) : null}

      <section aria-label="Projects" className="flex flex-col gap-4">
        {projects.length === 0 ? (
          <Panel>
            <EmptyState>
              No projects yet. When Operava kicks one off for {company.name}, it will appear
              here.
            </EmptyState>
          </Panel>
        ) : (
          projects.map((project) => (
            <Panel key={project.id} as="article">
              <Link
                href={`/portal/projects/${project.id}`}
                className="group block px-5 py-5 sm:px-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <h2 className="t-h3 text-ink transition-colors group-hover:text-navy-700">
                    {project.name}
                  </h2>
                  <span className="flex items-center gap-2">
                    {project.health !== "on_track" && project.status !== "complete" ? (
                      <HealthBadge health={project.health} />
                    ) : null}
                    <ProjectStatusBadge status={project.status} />
                  </span>
                </div>
                {project.summary ? (
                  <p className="mt-2 max-w-3xl text-[0.9rem] leading-relaxed text-ink-2">
                    {project.summary}
                  </p>
                ) : null}
                <div className="mt-4 max-w-xl">
                  <ProgressBar percent={project.progressPercent} />
                </div>
                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[0.8125rem] text-ink-3">
                  {project.phase ? (
                    <div>
                      <dt className="inline">Current phase: </dt>
                      <dd className="inline font-medium text-ink-2">{project.phase}</dd>
                    </div>
                  ) : null}
                  {project.targetDate ? (
                    <div>
                      <dt className="inline">Target: </dt>
                      <dd className="inline font-medium text-ink-2">
                        {formatDate(project.targetDate)}
                      </dd>
                    </div>
                  ) : null}
                  {project.actualCompletionDate ? (
                    <div>
                      <dt className="inline">Completed: </dt>
                      <dd className="inline font-medium text-ink-2">
                        {formatDate(project.actualCompletionDate)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </Link>
            </Panel>
          ))
        )}
      </section>

      <Panel as="section" aria-label="Recent updates">
        <PanelHeader title="Latest from Operava" />
        {recentUpdates.length === 0 ? (
          <EmptyState>
            No updates posted yet — they&rsquo;ll land here as work happens.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {recentUpdates.map((update) => (
              <li key={update.id}>
                <Link
                  href={`/portal/projects/${update.projectId}#timeline`}
                  className="group block px-5 py-4 sm:px-6"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-[0.9rem] font-medium text-ink group-hover:text-navy-800">
                      {update.title}
                    </p>
                    <p className="t-mono-sm text-ink-3">{formatDateTime(update.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-[0.8125rem] text-ink-3">
                    {update.projectName}
                    {update.updateType in UPDATE_TYPE_LABELS
                      ? ` · ${UPDATE_TYPE_LABELS[update.updateType as UpdateType]}`
                      : null}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
