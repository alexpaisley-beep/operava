import { RequestDetail } from "@/components/portal/request-detail";
import { getRequestOr404, listComments, listRequestFiles } from "@/lib/portal/data";
import { requireViewer } from "@/lib/portal/session";

export const metadata = { title: "Request" };

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer();
  const { id } = await params;

  // RLS decides visibility. A client from another company gets no row here and
  // therefore a 404 — the id in the URL is not an access grant.
  const request = await getRequestOr404(id);
  const [comments, files] = await Promise.all([listComments(id), listRequestFiles(id)]);

  return (
    <RequestDetail
      request={request}
      comments={comments}
      files={files}
      canPostInternal={viewer.isAdmin}
      backHref="/portal/requests"
    />
  );
}
