import { RequestRow } from "@/components/portal/blocks";
import { Empty, List, PageHeading, Panel, PanelHeader } from "@/components/portal/ui";
import { listAllRequests, openRequests } from "@/lib/portal/data";
import { requireAdmin } from "@/lib/portal/session";

export const metadata = { title: "Request queue" };

export default async function AdminRequestsPage() {
  await requireAdmin();
  const requests = await listAllRequests();

  const open = openRequests(requests);
  const closed = requests.filter((request) => !open.includes(request));

  // Urgent and high first inside the open list. Everything else keeps its
  // newest-first order, so the queue reads as a work list rather than a log.
  const rank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
  const sorted = [...open].sort((a, b) => rank[a.priority] - rank[b.priority]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Admin"
        title="Request queue."
        lead="Every bug, question and change request across every client, most urgent first."
      />

      <Panel>
        <PanelHeader title={`Open (${open.length})`} />
        {sorted.length > 0 ? (
          <List>
            {sorted.map((request) => (
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

      {closed.length > 0 ? (
        <Panel>
          <PanelHeader title={`Closed (${closed.length})`} />
          <List>
            {closed.slice(0, 30).map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                href={`/portal/admin/requests/${request.id}`}
                projectName={request.project?.name}
              />
            ))}
          </List>
        </Panel>
      ) : null}
    </div>
  );
}
