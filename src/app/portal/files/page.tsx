import { FileRow } from "@/components/portal/file-row";
import { Empty, List, PageHeading, Panel, PanelHeader } from "@/components/portal/ui";
import { listFiles, listProjects, resolveProject } from "@/lib/portal/data";
import { requireViewer } from "@/lib/portal/session";
import { fileCategory, fileCategoryOrder } from "@/lib/portal/vocabulary";

export const metadata = { title: "Files" };

export default async function PortalFilesPage({
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
        <PageHeading eyebrow="Files" title="No files yet." />
        <div className="mt-8">
          <Empty
            title="No project set up"
            body="Contracts, specifications and deliverables will appear here once your project is running."
          />
        </div>
      </>
    );
  }

  const files = await listFiles(project.id);

  // Grouped by category in a fixed order, so the page does not reshuffle as
  // files are added.
  const grouped = fileCategoryOrder
    .map((category) => ({
      category,
      items: files.filter((file) => file.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeading
        eyebrow="Files"
        title="Everything in one place."
        lead="Contracts, specifications, deliverables and anything else worth keeping. Links are private and expire — they only work while you are signed in."
      />

      {grouped.length === 0 ? (
        <Empty
          title="Nothing here yet"
          body="Files Operava shares with you, and anything you attach to a request, will show up here."
        />
      ) : (
        grouped.map((group) => (
          <Panel key={group.category}>
            <PanelHeader title={`${fileCategory[group.category]} (${group.items.length})`} />
            <List>
              {group.items.map((file) => (
                <FileRow key={file.id} file={file} uploaderName={file.uploader?.full_name} />
              ))}
            </List>
          </Panel>
        ))
      )}
    </div>
  );
}
