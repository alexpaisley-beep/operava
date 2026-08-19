import Link from "next/link";

import { RequestRow } from "@/components/portal/blocks";
import { Empty, List, PageHeading, Panel, PanelHeader } from "@/components/portal/ui";
import { Cta } from "@/components/ui/button";
import { listProjects, listRequests, openRequests, resolveProject } from "@/lib/portal/data";
import { requireViewer } from "@/lib/portal/session";
import { requestTypes } from "@/lib/portal/vocabulary";
import { site } from "@/lib/site";

export const metadata = { title: "Support" };

/**
 * Support is the front door; Requests is the record.
 *
 * The brief warned against shipping both if they end up redundant, and two
 * parallel ticket systems would be exactly that. So this page holds no list of
 * its own beyond what is currently open — it is how you start something and how
 * you reach a person, and everything filed lands in Requests.
 */
export default async function PortalSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requireViewer();
  const params = await searchParams;

  const projects = await listProjects();
  const project = await resolveProject(params.project, projects);
  const suffix = project && project.id !== projects[0]?.id ? `?project=${project.id}` : "";

  const requests = project ? await listRequests(project.id) : [];
  const open = openRequests(requests);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Support"
        title="Need something? Start here."
        lead="Anything you send from this page becomes a tracked thread you can follow, so nothing depends on whether an email got seen."
      />

      {/* --------------------------------------------------------- Start one */}
      <Panel>
        <PanelHeader title="What do you need?" />
        <div className="grid gap-px bg-line sm:grid-cols-2">
          {requestTypes.map((option) => (
            <Link
              key={option.value}
              href={
                project
                  ? `/portal/requests/new${suffix ? `${suffix}&` : "?"}type=${option.value}`
                  : "/portal/support"
              }
              className="group flex flex-col gap-1.5 bg-surface p-5 transition-colors hover:bg-paper"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[0.9375rem] font-semibold tracking-[-0.015em] text-ink group-hover:text-navy-800">
                  {option.label}
                </span>
                <span
                  aria-hidden="true"
                  className="text-ink-3 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                >
                  &rarr;
                </span>
              </span>
              <span className="text-[0.875rem] leading-snug text-ink-3">{option.blurb}</span>
            </Link>
          ))}
        </div>
      </Panel>

      {/* ------------------------------------------------------- Open threads */}
      <Panel>
        <PanelHeader
          title={`Your open threads (${open.length})`}
          action={
            open.length > 0 ? (
              <Cta
                href={`/portal/requests${suffix}`}
                variant="secondary"
                size="sm"
                arrow={false}
                location="portal-support"
              >
                All requests
              </Cta>
            ) : null
          }
        />
        {open.length > 0 ? (
          <List>
            {open.slice(0, 5).map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                href={`/portal/requests/${request.id}`}
              />
            ))}
          </List>
        ) : (
          <p className="px-5 py-5 text-[0.9375rem] text-ink-3 lg:px-6">
            Nothing open right now.
          </p>
        )}
      </Panel>

      {/* --------------------------------------------------------- Reach us */}
      <Panel>
        <PanelHeader title="Reach a person" />
        <div className="grid gap-px bg-line sm:grid-cols-2">
          <div className="bg-surface p-5">
            <h3 className="text-[0.9375rem] font-semibold text-ink">Email</h3>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">
              For anything that does not fit a request, or if you cannot get into the portal.
            </p>
            <a
              href={`mailto:${site.contactEmail}`}
              className="mt-3 inline-block text-[0.875rem] text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
            >
              {site.contactEmail}
            </a>
          </div>

          <div className="bg-surface p-5">
            <h3 className="text-[0.9375rem] font-semibold text-ink">
              Something is badly broken
            </h3>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">
              Raise it as a bug and mark the severity critical. That is the one that gets looked
              at before anything else.
            </p>
            {project ? (
              <Link
                href={`/portal/requests/new${suffix ? `${suffix}&` : "?"}type=bug`}
                className="mt-3 inline-block text-[0.875rem] text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
              >
                Report a bug
              </Link>
            ) : null}
          </div>
        </div>
      </Panel>

      {!project ? (
        <Empty
          title="No project set up yet"
          body="You can still email us. Once your project is in the portal you will be able to raise tracked requests here."
        />
      ) : null}
    </div>
  );
}
