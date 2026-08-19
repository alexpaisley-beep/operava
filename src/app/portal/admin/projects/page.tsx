import { CreateProjectForm } from "@/components/portal/admin-forms";
import {
  Empty,
  List,
  PageHeading,
  Panel,
  PanelHeader,
  RowLink,
  StatusPill,
} from "@/components/portal/ui";
import { listCompanies, listProjects } from "@/lib/portal/data";
import { formatDate } from "@/lib/portal/format";
import { requireAdmin } from "@/lib/portal/session";
import { projectStatus } from "@/lib/portal/vocabulary";

export const metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  await requireAdmin();
  const [projects, companies] = await Promise.all([listProjects(), listCompanies()]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Admin"
        title="Projects."
        lead="Status, phase, progress and current work all feed the client's overview."
      />

      <Panel>
        <PanelHeader title={`All projects (${projects.length})`} />
        {projects.length > 0 ? (
          <List>
            {projects.map((project) => {
              const status = projectStatus[project.status];
              return (
                <RowLink key={project.id} href={`/portal/admin/projects/${project.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className="t-mono-sm text-ink-3">{project.company?.name ?? "—"}</p>
                      <p className="mt-1 text-[0.9375rem] font-semibold text-ink">
                        {project.name}
                        {project.is_archived ? (
                          <span className="ml-2 font-normal text-ink-3">(archived)</span>
                        ) : null}
                      </p>
                      <p className="t-mono-sm mt-1 text-ink-3">
                        {project.progress_percent}%
                        {project.target_date
                          ? ` · target ${formatDate(project.target_date)}`
                          : ""}
                      </p>
                    </div>
                    <StatusPill label={status.label} tone={status.tone} />
                  </div>
                </RowLink>
              );
            })}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty title="No projects yet" />
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Create a project" />
        <div className="px-5 py-5 lg:px-6">
          {companies.length > 0 ? (
            <CreateProjectForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
          ) : (
            <Empty title="Add a company first" body="A project has to belong to one." />
          )}
        </div>
      </Panel>
    </div>
  );
}
