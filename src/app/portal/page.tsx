import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivityList, SeeAll, UpdateItem } from "@/components/portal/blocks";
import {
  Callout,
  Empty,
  List,
  Panel,
  PanelHeader,
  PageHeading,
  ProgressBar,
  Stat,
  StatusPill,
} from "@/components/portal/ui";
import { Cta } from "@/components/ui/button";
import {
  getOverview,
  listProjects,
  nextMilestone,
  openRequests,
  outstandingBilling,
  resolveProject,
} from "@/lib/portal/data";
import { daysUntil, formatDate, formatMoney, formatRelative } from "@/lib/portal/format";
import { requireViewer } from "@/lib/portal/session";
import { billingStatus, milestoneStatus, projectStatus } from "@/lib/portal/vocabulary";
import { site } from "@/lib/site";

export const metadata = { title: "Overview" };

export default async function PortalOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;

  // Staff land on their own dashboard. Reaching the client view is deliberate
  // (the "Client view" nav item, or a ?project= link), never accidental.
  if (viewer.isAdmin && !params.project) redirect("/portal/admin");

  const projects = await listProjects();
  const project = await resolveProject(params.project, projects);

  if (!project) {
    return (
      <>
        <PageHeading
          eyebrow="Overview"
          title={`Welcome, ${viewer.profile.full_name.split(" ")[0] || "there"}.`}
          lead="Your project has not been set up in the portal yet. As soon as it is, this is where you will see status, updates and everything we are waiting on."
        />
        <div className="mt-8">
          <Empty
            title="No project here yet"
            body="Nothing has gone wrong. If you were expecting to see a project, tell us and we will sort it out."
            action={
              <a
                href={`mailto:${site.contactEmail}`}
                className="inline-flex items-center rounded-md border border-line-2 bg-surface px-5 py-3 text-[0.9375rem] font-medium text-navy-800 transition-colors hover:border-navy-600 hover:bg-navy-50"
              >
                {site.contactEmail}
              </a>
            }
          />
        </div>
      </>
    );
  }

  const { milestones, blockers, updates, requests, activity, billing } =
    await getOverview(project);

  const status = projectStatus[project.status];
  const clientBlockers = blockers.filter((blocker) => blocker.waiting_on === "client");
  const next = nextMilestone(milestones);
  const open = openRequests(requests);
  const outstanding = outstandingBilling(billing);
  const latest = updates[0];
  const targetDays = daysUntil(project.target_date);
  const suffix = project.id === projects[0]?.id ? "" : `?project=${project.id}`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow={project.company?.name ?? "Project"}
        title={project.name}
        lead={project.description || undefined}
        action={
          <StatusPill label={status.label} tone={status.tone} className="text-[0.8125rem]" />
        }
      />

      {/* -------------------------------------------------- Waiting on you
          First, loud, and impossible to scroll past. A customer should never
          have to work out whether we are blocked on them. */}
      {clientBlockers.length > 0 ? (
        <Callout
          title={
            clientBlockers.length === 1
              ? "We're waiting on you"
              : "We're waiting on you for a few things"
          }
        >
          <ul className="flex flex-col gap-4">
            {clientBlockers.map((blocker) => (
              <li key={blocker.id}>
                <p className="text-[0.9375rem] font-medium leading-snug text-ink">
                  {blocker.title}
                </p>
                {blocker.description ? (
                  <p className="mt-1.5 whitespace-pre-line text-[0.875rem] leading-relaxed text-ink-2">
                    {blocker.description}
                  </p>
                ) : null}
                <p className="t-mono-sm mt-1.5 text-alert-700">
                  Raised {formatRelative(blocker.created_at)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[0.875rem] leading-relaxed text-ink-2">
            Got what we need, or need a hand?{" "}
            <Link
              href={`/portal/requests/new${suffix ? `${suffix}&` : "?"}type=support`}
              className="font-medium text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
            >
              Send it through here
            </Link>
            .
          </p>
        </Callout>
      ) : null}

      {/* ------------------------------------------------------- Status facts */}
      <Panel>
        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          <Stat label="Phase" className="bg-surface p-5">
            {project.phase || "Not set"}
          </Stat>
          <Stat label="Open requests" className="bg-surface p-5">
            {open.length === 0 ? "None" : `${open.length}`}
          </Stat>
          <Stat label="Target date" className="bg-surface p-5">
            {project.target_date ? (
              <>
                {formatDate(project.target_date)}
                {targetDays !== null && project.status !== "complete" ? (
                  <span className="mt-1 block text-[0.8125rem] font-normal text-ink-3">
                    {targetDays < 0
                      ? `${Math.abs(targetDays)} days past`
                      : targetDays === 0
                        ? "Today"
                        : `in ${targetDays} days`}
                  </span>
                ) : null}
              </>
            ) : (
              "To be set"
            )}
          </Stat>
          <Stat label="Started" className="bg-surface p-5">
            {project.start_date ? formatDate(project.start_date) : "Not started"}
          </Stat>
        </dl>

        <div className="border-t border-line px-5 py-5 lg:px-6">
          <p className="t-eyebrow text-ink-3">Progress</p>
          <div className="mt-3">
            <ProgressBar percent={project.progress_percent} />
          </div>
        </div>
      </Panel>

      {/* ---------------------------------------------------- Currently on */}
      {project.current_work ? (
        <Panel>
          <PanelHeader title="Currently working on" />
          <p className="whitespace-pre-line px-5 py-5 text-[1.0625rem] leading-relaxed text-ink lg:px-6">
            {project.current_work}
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-5">
        {/* --------------------------------------------------- Latest update */}
        <div className="flex flex-col gap-8 lg:col-span-3">
          <Panel>
            <PanelHeader
              title="Latest update"
              action={
                updates.length > 0 ? (
                  <SeeAll href={`/portal/project${suffix}#updates`}>All updates</SeeAll>
                ) : null
              }
            />
            {latest ? (
              <UpdateItem update={latest} />
            ) : (
              <div className="p-5 lg:p-6">
                <Empty
                  title="No updates yet"
                  body="Operava posts here as work lands. You will see it without having to ask."
                />
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Recent activity"
              action={<SeeAll href={`/portal/project${suffix}`}>Project detail</SeeAll>}
            />
            {activity.length > 0 ? (
              <ActivityList entries={activity} />
            ) : (
              <div className="p-5 lg:p-6">
                <Empty title="Nothing logged yet" />
              </div>
            )}
          </Panel>
        </div>

        {/* ------------------------------------------------------- Side rail */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          <Panel>
            <PanelHeader title="Next milestone" />
            {next ? (
              <div className="px-5 py-5 lg:px-6">
                <StatusPill
                  label={milestoneStatus[next.status].label}
                  tone={milestoneStatus[next.status].tone}
                />
                <h3 className="mt-3 text-[1rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
                  {next.name}
                </h3>
                {next.description ? (
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">
                    {next.description}
                  </p>
                ) : null}
                <p className="t-mono-sm mt-3 text-ink-3">
                  {next.due_date ? `Due ${formatDate(next.due_date)}` : "No date set"}
                </p>
                <div className="mt-4">
                  <SeeAll href={`/portal/project${suffix}#timeline`}>Full timeline</SeeAll>
                </div>
              </div>
            ) : (
              <div className="p-5 lg:p-6">
                <Empty title="No milestones set" />
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Requests"
              action={<SeeAll href={`/portal/requests${suffix}`}>View all</SeeAll>}
            />
            <div className="px-5 py-5 lg:px-6">
              <p className="text-[0.9375rem] leading-relaxed text-ink-2">
                {open.length === 0
                  ? "Nothing open. Found a bug or need something changed?"
                  : `${open.length} open ${open.length === 1 ? "request" : "requests"}.`}
              </p>
              <div className="mt-4">
                <Cta
                  href={`/portal/requests/new${suffix}`}
                  size="sm"
                  location="portal-overview"
                >
                  Raise a request
                </Cta>
              </div>
            </div>
          </Panel>

          {outstanding.length > 0 ? (
            <Panel>
              <PanelHeader
                title="Billing"
                action={<SeeAll href={`/portal/billing${suffix}`}>View all</SeeAll>}
              />
              <List>
                {outstanding.map((record) => {
                  const meta = billingStatus[record.status];
                  return (
                    <div key={record.id} className="px-5 py-4 lg:px-6">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[0.9375rem] font-medium leading-snug text-ink">
                          {record.label}
                        </p>
                        <StatusPill label={meta.label} tone={meta.tone} />
                      </div>
                      <p className="mt-1.5 text-[0.9375rem] tabular-nums text-ink-2">
                        {formatMoney(record.amount, record.currency)}
                        {record.due_date ? (
                          <span className="text-ink-3">
                            {" "}
                            · due {formatDate(record.due_date)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  );
                })}
              </List>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
