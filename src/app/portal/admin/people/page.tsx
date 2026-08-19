import { InviteClientForm, ResendSetupLinkForm } from "@/components/portal/admin-forms";
import {
  Empty,
  List,
  PageHeading,
  Panel,
  PanelHeader,
  StatusPill,
} from "@/components/portal/ui";
import { listCompanies, listProfiles } from "@/lib/portal/data";
import { formatDate } from "@/lib/portal/format";
import { requireAdmin } from "@/lib/portal/session";
import { isAdminConfigured } from "@/lib/supabase/config";

export const metadata = { title: "People" };

export default async function AdminPeoplePage() {
  await requireAdmin();
  const [profiles, companies] = await Promise.all([listProfiles(), listCompanies()]);

  const byCompany = new Map(companies.map((company) => [company.id, company.name]));
  const staff = profiles.filter((profile) => profile.role === "admin");
  const clients = profiles.filter((profile) => profile.role === "client");
  const canProvision = isAdminConfigured();

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Admin"
        title="People."
        lead="Accounts are created here. There is no public signup, and no password is ever generated or emailed — everyone sets their own from a one-time link."
      />

      <Panel>
        <PanelHeader title="Create a client account" />
        <div className="px-5 py-5 lg:px-6">
          {!canProvision ? (
            <Empty
              title="SUPABASE_SERVICE_ROLE_KEY is not set"
              body="Creating auth users needs the service-role key on the server. Add it to this deployment's environment and reload."
            />
          ) : companies.length === 0 ? (
            <Empty title="Add a company first" body="Every client account belongs to one." />
          ) : (
            <InviteClientForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={`Client users (${clients.length})`} />
        {clients.length > 0 ? (
          <List>
            {clients.map((profile) => (
              <div key={profile.id} className="px-5 py-4 lg:px-6">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-medium text-ink">
                      {profile.full_name || "(no name)"}
                    </p>
                    <p className="t-mono-sm mt-1 truncate text-ink-3">{profile.email}</p>
                    <p className="t-mono-sm mt-1 text-ink-3">
                      {profile.company_id ? byCompany.get(profile.company_id) : "No company"} ·
                      added {formatDate(profile.created_at)}
                    </p>
                  </div>
                  <StatusPill label="Client" tone="neutral" />
                </div>
                {canProvision ? (
                  <div className="mt-3">
                    <ResendSetupLinkForm email={profile.email} fullName={profile.full_name} />
                  </div>
                ) : null}
              </div>
            ))}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty title="No client accounts yet" />
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title={`Operava staff (${staff.length})`} />
        <List>
          {staff.map((profile) => (
            <div
              key={profile.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-6"
            >
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-medium text-ink">
                  {profile.full_name || "(no name)"}
                </p>
                <p className="t-mono-sm mt-1 truncate text-ink-3">{profile.email}</p>
              </div>
              <StatusPill label="Admin" tone="progress" />
            </div>
          ))}
        </List>
        <p className="border-t border-line px-5 py-4 text-[0.8125rem] leading-relaxed text-ink-3 lg:px-6">
          Staff accounts are promoted deliberately rather than through this screen — see
          docs/PORTAL.md. Making someone an admin from the same form that creates customers is
          one misclick away from handing a client every other client&rsquo;s data.
        </p>
      </Panel>
    </div>
  );
}
