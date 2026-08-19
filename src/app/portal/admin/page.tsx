import Link from "next/link";

import { RequestRow } from "@/components/portal/blocks";
import {
  Empty,
  List,
  PageHeading,
  Panel,
  PanelHeader,
  Stat,
  StatusPill,
} from "@/components/portal/ui";
import { listAllRequests, listCompanies, listProjects, openRequests } from "@/lib/portal/data";
import { formatDate, formatRelative } from "@/lib/portal/format";
import { requireAdmin } from "@/lib/portal/session";
import { projectStatus } from "@/lib/portal/vocabulary";

export const metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [companies, projects, requests] = await Promise.all([
    listCompanies(),
    listProjects(),
    listAllRequests(),
  ]);

  const open = openRequests(requests);
  const active = projects.filter((project) => !project.is_archived);
  // Anything the client is expected to move on. Surfaced because a project
  // sitting in "waiting on client" for three weeks is usually a nudge nobody
  // sent, not a customer ignoring us.
  const waiting = active.filter((project) => project.status === "waiting_on_client");

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Operava staff"
        title="Portal admin."
        lead="Everything clients see comes from here. Keep status, current work and blockers current and the portal answers the questions instead of you."
      />

      <Panel>
        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          <Stat label="Companies" className="bg-surface p-5">
            {companies.length}
          </Stat>
          <Stat label="Active projects" className="bg-surface p-5">
            {active.length}
          </Stat>
          <Stat label="Open requests" className="bg-surface p-5">
            {open.length}
          </Stat>
          <Stat label="Waiting on client" className="bg-surface p-5">
            {waiting.length}
          </Stat>
        </dl>
      </Panel>

      <Panel>
        <PanelHeader
          title="Active projects"
          action={
            <Link
              href="/portal/admin/projects"
              className="text-[0.875rem] text-navy-700 hover:text-navy-800"
            >
              Manage
            </Link>
          }
        />
        {active.length > 0 ? (
          <List>
            {active.map((project) => {
              const status = projectStatus[project.status];
              return (
                <Link
                  key={project.id}
                  href={`/portal/admin/projects/${project.id}`}
                  className="group flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-paper lg:px-6"
                >
                  <div className="min-w-0">
                    <p className="t-mono-sm text-ink-3">{project.company?.name ?? "—"}</p>
                    <p className="mt-1 text-[0.9375rem] font-semibold text-ink group-hover:text-navy-800">
                      {project.name}
                    </p>
                    <p className="t-mono-sm mt-1 text-ink-3">
                      {project.phase || "No phase"} · {project.progress_percent}%
                      {project.target_date
                        ? ` · target ${formatDate(project.target_date)}`
                        : ""}
                    </p>
                  </div>
                  <StatusPill label={status.label} tone={status.tone} />
                </Link>
              );
            })}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty title="No projects yet" body="Create a company, then a project." />
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title={`Open requests (${open.length})`}
          action={
            <Link
              href="/portal/admin/requests"
              className="text-[0.875rem] text-navy-700 hover:text-navy-800"
            >
              Full queue
            </Link>
          }
        />
        {open.length > 0 ? (
          <List>
            {open.slice(0, 8).map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                href={`/portal/admin/requests/${request.id}`}
                projectName={request.project?.name}
              />
            ))}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty title="Queue is clear" />
          </div>
        )}
      </Panel>

      {waiting.length > 0 ? (
        <Panel>
          <PanelHeader title="Waiting on the client" />
          <List>
            {waiting.map((project) => (
              <div key={project.id} className="px-5 py-4 lg:px-6">
                <p className="text-[0.9375rem] font-medium text-ink">{project.name}</p>
                <p className="t-mono-sm mt-1 text-ink-3">
                  {project.company?.name} · since {formatRelative(project.updated_at)}
                </p>
              </div>
            ))}
          </List>
        </Panel>
      ) : null}
    </div>
  );
}
