import { notFound } from "next/navigation";

import { NewRequestForm } from "@/components/portal/request-form";
import { PageHeading, Panel } from "@/components/portal/ui";
import { listProjects, resolveProject } from "@/lib/portal/data";
import { requireViewer } from "@/lib/portal/session";
import type { RequestType } from "@/lib/supabase/types";

export const metadata = { title: "New Request" };

const TYPES: RequestType[] = ["bug", "change_request", "question", "support", "feature_idea"];

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; type?: string }>;
}) {
  await requireViewer();
  const params = await searchParams;

  const projects = await listProjects();
  const project = await resolveProject(params.project, projects);

  // No project means nothing to raise a request against. 404 rather than
  // rendering a form whose submit could never succeed.
  if (!project) notFound();

  const defaultType = (TYPES as string[]).includes(params.type ?? "")
    ? (params.type as RequestType)
    : "support";

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow={project.name}
        title="Tell us what you need."
        lead="Anything from a broken screen to a change of plan. We read every one of these and reply in the thread."
      />
      <Panel className="p-5 lg:p-7">
        <NewRequestForm projectId={project.id} defaultType={defaultType} />
      </Panel>
    </div>
  );
}
