import Link from "next/link";

import { CreateCompanyForm } from "@/components/portal/admin-forms";
import { Empty, List, PageHeading, Panel, PanelHeader, RowLink } from "@/components/portal/ui";
import { listCompanies } from "@/lib/portal/data";
import { formatDate } from "@/lib/portal/format";
import { requireAdmin } from "@/lib/portal/session";

export const metadata = { title: "Companies" };

export default async function AdminCompaniesPage() {
  await requireAdmin();
  const companies = await listCompanies();

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Admin"
        title="Companies."
        lead="Each client company owns its projects, people and files."
      />

      <Panel>
        <PanelHeader title={`All companies (${companies.length})`} />
        {companies.length > 0 ? (
          <List>
            {companies.map((company) => (
              <RowLink key={company.id} href={`/portal/admin/companies/${company.id}`}>
                <p className="text-[0.9375rem] font-semibold text-ink">{company.name}</p>
                <p className="t-mono-sm mt-1 text-ink-3">
                  {company.projects.length}{" "}
                  {company.projects.length === 1 ? "project" : "projects"} · added{" "}
                  {formatDate(company.created_at)}
                </p>
              </RowLink>
            ))}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty title="No companies yet" body="Add one below to get started." />
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Add a company" />
        <div className="px-5 py-5 lg:px-6">
          <CreateCompanyForm />
        </div>
      </Panel>

      <p className="text-[0.875rem] text-ink-3">
        People are invited from{" "}
        <Link
          href="/portal/admin/people"
          className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
        >
          People
        </Link>
        .
      </p>
    </div>
  );
}
