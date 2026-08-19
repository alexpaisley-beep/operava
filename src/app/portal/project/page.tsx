import { BlockerItem, MilestoneTimeline, UpdateItem } from "@/components/portal/blocks";
import {
  Empty,
  List,
  PageHeading,
  Panel,
  PanelHeader,
  ProgressBar,
  Stat,
  StatusPill,
} from "@/components/portal/ui";
import {
  listAllBlockers,
  listMilestones,
  listProjects,
  listUpdates,
  resolveProject,
} from "@/lib/portal/data";
import { formatDate } from "@/lib/portal/format";
import { requireViewer } from "@/lib/portal/session";
import { projectStatus } from "@/lib/portal/vocabulary";

export const metadata = { title: "Project" };

export default async function PortalProjectPage({
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
        <PageHeading eyebrow="Project" title="Nothing to show yet." />
        <div className="mt-8">
          <Empty
            title="No project set up"
            body="Once your project is in the portal, its timeline, updates and open items live here."
          />
        </div>
      </>
    );
  }

  // Independent reads, so they go out together rather than one after another.
  const [milestones, updates, blockers] = await Promise.all([
    listMilestones(project.id),
    listUpdates(project.id),
    listAllBlockers(project.id),
  ]);

  const status = projectStatus[project.status];
  const openBlockers = blockers.filter((blocker) => blocker.status === "open");
  const resolvedBlockers = blockers.filter((blocker) => blocker.status === "resolved");
  const complete = milestones.filter((m) => m.status === "complete").length;

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

      <Panel>
        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          <Stat label="Phase" className="bg-surface p-5">
            {project.phase || "Not set"}
          </Stat>
          <Stat label="Milestones" className="bg-surface p-5">
            {milestones.length === 0 ? "None yet" : `${complete} of ${milestones.length} done`}
          </Stat>
          <Stat label="Started" className="bg-surface p-5">
            {project.start_date ? formatDate(project.start_date) : "Not started"}
          </Stat>
          <Stat label="Target" className="bg-surface p-5">
            {project.target_date ? formatDate(project.target_date) : "To be set"}
          </Stat>
        </dl>
        <div className="border-t border-line px-5 py-5 lg:px-6">
          <p className="t-eyebrow text-ink-3">Progress</p>
          <div className="mt-3">
            <ProgressBar percent={project.progress_percent} />
          </div>
        </div>
      </Panel>

      {project.current_work ? (
        <Panel>
          <PanelHeader title="Currently working on" />
          <p className="whitespace-pre-line px-5 py-5 text-[1.0625rem] leading-relaxed text-ink lg:px-6">
            {project.current_work}
          </p>
        </Panel>
      ) : null}

      {/* ------------------------------------------------------------ Blockers */}
      {openBlockers.length > 0 ? (
        <Panel id="blockers">
          <PanelHeader title={`Open items (${openBlockers.length})`} />
          <List>
            {openBlockers.map((blocker) => (
              <BlockerItem key={blocker.id} blocker={blocker} />
            ))}
          </List>
        </Panel>
      ) : null}

      {/* ------------------------------------------------------------ Timeline */}
      <section id="timeline" className="scroll-mt-8">
        <Panel>
          <PanelHeader title="Timeline" />
          <div className="px-5 py-4 lg:px-6">
            {milestones.length > 0 ? (
              <MilestoneTimeline milestones={milestones} />
            ) : (
              <Empty
                title="No milestones yet"
                body="Milestones are agreed during scoping and appear here once the plan is set."
                className="my-2"
              />
            )}
          </div>
        </Panel>
      </section>

      {/* ------------------------------------------------------------- Updates */}
      <section id="updates" className="scroll-mt-8">
        <Panel>
          <PanelHeader title={`Updates${updates.length > 0 ? ` (${updates.length})` : ""}`} />
          {updates.length > 0 ? (
            <List>
              {updates.map((update) => (
                <UpdateItem key={update.id} update={update} />
              ))}
            </List>
          ) : (
            <div className="p-5 lg:p-6">
              <Empty
                title="No updates posted yet"
                body="Operava posts here as work lands, so you do not have to ask where things stand."
              />
            </div>
          )}
        </Panel>
      </section>

      {/* -------------------------------------------------------- Resolved log */}
      {resolvedBlockers.length > 0 ? (
        <Panel>
          <PanelHeader title={`Resolved items (${resolvedBlockers.length})`} />
          <List>
            {resolvedBlockers.map((blocker) => (
              <BlockerItem key={blocker.id} blocker={blocker} />
            ))}
          </List>
        </Panel>
      ) : null}
    </div>
  );
}
