import { RequestRow } from "@/components/portal/blocks";
import { Empty, List, PageHeading, Panel, PanelHeader } from "@/components/portal/ui";
import { Cta } from "@/components/ui/button";
import { listProjects, listRequests, openRequests, resolveProject } from "@/lib/portal/data";
import { requireViewer } from "@/lib/portal/session";

export const metadata = { title: "Requests" };

export default async function PortalRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requireViewer();
  const params = await searchParams;

  const projects = await listProjects();
  const project = await resolveProject(params.project, projects);

  if (!project) {
    return (
      <>
        <PageHeading eyebrow="Requests" title="Nothing to raise against yet." />
        <div className="mt-8">
          <Empty
            title="No project set up"
            body="Once your project is in the portal you can raise bugs, questions and change requests here."
          />
        </div>
      </>
    );
  }

  const suffix = project.id === projects[0]?.id ? "" : `?project=${project.id}`;
  const requests = await listRequests(project.id);
  const open = openRequests(requests);
  const closed = requests.filter((request) => !open.includes(request));

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Requests"
        title="Bugs, questions and changes."
        lead="Everything you send us lives here with its current status, so nothing depends on remembering which email it was in."
        action={
          <Cta href={`/portal/requests/new${suffix}`} location="portal-requests">
            Raise a request
          </Cta>
        }
      />

      <Panel>
        <PanelHeader title={`Open (${open.length})`} />
        {open.length > 0 ? (
          <List>
            {open.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                href={`/portal/requests/${request.id}`}
              />
            ))}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty
              title="Nothing open"
              body="When something breaks or needs changing, this is the fastest way to tell us."
              action={
                <Cta
                  href={`/portal/requests/new${suffix}`}
                  variant="secondary"
                  size="sm"
                  location="portal-requests-empty"
                >
                  Raise a request
                </Cta>
              }
            />
          </div>
        )}
      </Panel>

      {closed.length > 0 ? (
        <Panel>
          <PanelHeader title={`Closed (${closed.length})`} />
          <List>
            {closed.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                href={`/portal/requests/${request.id}`}
              />
            ))}
          </List>
        </Panel>
      ) : null}
    </div>
  );
}
