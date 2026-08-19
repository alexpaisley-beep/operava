import { RequestControls } from "@/components/portal/admin-forms";
import { RequestDetail } from "@/components/portal/request-detail";
import { Panel, PanelHeader } from "@/components/portal/ui";
import { getRequestOr404, listComments, listRequestFiles } from "@/lib/portal/data";
import { requireAdmin } from "@/lib/portal/session";

export const metadata = { title: "Request" };

export default async function AdminRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const request = await getRequestOr404(id);
  const [comments, files] = await Promise.all([listComments(id), listRequestFiles(id)]);

  return (
    <div className="flex flex-col gap-8">
      <Panel>
        <PanelHeader title="Workflow" />
        <div className="px-5 py-5 lg:px-6">
          <RequestControls
            requestId={request.id}
            projectId={request.project_id}
            status={request.status}
            priority={request.priority}
            estimatedCost={request.estimated_cost}
            timelineImpact={request.estimated_timeline_impact}
            approvalStatus={request.approval_status}
            isChangeRequest={request.type === "change_request"}
          />
        </div>
      </Panel>

      <RequestDetail
        request={request}
        comments={comments}
        files={files}
        canPostInternal
        backHref="/portal/admin/requests"
      />
    </div>
  );
}
