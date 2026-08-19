import Link from "next/link";

import { InviteClientForm } from "@/components/portal/admin-forms";
import {
  Empty,
  List,
  PageHeading,
  Panel,
  PanelHeader,
  RowLink,
  StatusPill,
} from "@/components/portal/ui";
import { getCompanyOr404, listProfiles, listProjects } from "@/lib/portal/data";
import { formatDate } from "@/lib/portal/format";
import { requireAdmin } from "@/lib/portal/session";
import { projectStatus } from "@/lib/portal/vocabulary";
import { isAdminConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Company" };

export default async function AdminCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const company = await getCompanyOr404(id);
  const [people, allProjects] = await Promise.all([listProfiles(id), listProjects()]);
  const projects = allProjects.filter((project) => project.company_id === id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/portal/admin/companies"
          className="group inline-flex items-center gap-1.5 text-[0.875rem] text-ink-3 transition-colors hover:text-navy-700"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
          >
            &larr;
          </span>
          All companies
        </Link>
        <div className="mt-4">
          <PageHeading eyebrow="Company" title={company.name} lead={`Slug: ${company.slug}`} />
        </div>
      </div>

      <Panel>
        <PanelHeader title={`Projects (${projects.length})`} />
        {projects.length > 0 ? (
          <List>
            {projects.map((project) => {
              const status = projectStatus[project.status];
              return (
                <RowLink key={project.id} href={`/portal/admin/projects/${project.id}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[0.9375rem] font-semibold text-ink">{project.name}</p>
                    <StatusPill label={status.label} tone={status.tone} />
                  </div>
                </RowLink>
              );
            })}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty
              title="No projects yet"
              body="Create one from the Projects screen and assign it to this company."
            />
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title={`People (${people.length})`} />
        {people.length > 0 ? (
          <List>
            {people.map((profile) => (
              <div key={profile.id} className="px-5 py-4 lg:px-6">
                <p className="text-[0.9375rem] font-medium text-ink">
                  {profile.full_name || "(no name)"}
                </p>
                <p className="t-mono-sm mt-1 text-ink-3">
                  {profile.email} · added {formatDate(profile.created_at)}
                </p>
              </div>
            ))}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty title="Nobody from this company has an account yet" />
          </div>
        )}
      </Panel>

      {isAdminConfigured() ? (
        <Panel>
          <PanelHeader title="Add someone from this company" />
          <div className="px-5 py-5 lg:px-6">
            <InviteClientForm
              companies={[{ id: company.id, name: company.name }]}
              defaultCompanyId={company.id}
            />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
