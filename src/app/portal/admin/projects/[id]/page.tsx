import Link from "next/link";

import { BlockerItem, MilestoneTimeline, UpdateItem } from "@/components/portal/blocks";
import {
  BillingForm,
  BlockerForm,
  EditProjectForm,
  MilestoneForm,
  PostUpdateForm,
  UploadFileForm,
} from "@/components/portal/admin-forms";
import { FileRow } from "@/components/portal/file-row";
import {
  Empty,
  List,
  PageHeading,
  Panel,
  PanelHeader,
  StatusPill,
} from "@/components/portal/ui";
import { deleteFile, deleteMilestone, resolveBlocker } from "@/lib/portal/admin-actions";
import {
  getProjectOr404,
  listActivity,
  listAllBlockers,
  listBilling,
  listFiles,
  listMilestones,
  listUpdates,
} from "@/lib/portal/data";
import { formatDate, formatMoney } from "@/lib/portal/format";
import { requireAdmin } from "@/lib/portal/session";
import { billingStatus, projectStatus } from "@/lib/portal/vocabulary";

export const metadata = { title: "Manage project" };

/** Small inline destructive button used by the delete/resolve forms below. */
function InlineAction({ label, tone = "muted" }: { label: string; tone?: "muted" | "danger" }) {
  return (
    <button
      type="submit"
      className={`text-[0.8125rem] underline underline-offset-4 transition-colors ${
        tone === "danger" ? "text-ink-3 hover:text-danger" : "text-navy-700 hover:text-navy-800"
      }`}
    >
      {label}
    </button>
  );
}

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const project = await getProjectOr404(id);
  const [milestones, updates, blockers, billing, files, activity] = await Promise.all([
    listMilestones(id),
    listUpdates(id),
    listAllBlockers(id),
    listBilling(id),
    listFiles(id),
    listActivity(id, 15),
  ]);

  const status = projectStatus[project.status];
  const openBlockers = blockers.filter((blocker) => blocker.status === "open");
  const nextSort = milestones.reduce((max, m) => Math.max(max, m.sort_order), -1) + 1;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/portal/admin/projects"
          className="group inline-flex items-center gap-1.5 text-[0.875rem] text-ink-3 transition-colors hover:text-navy-700"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
          >
            &larr;
          </span>
          All projects
        </Link>
        <div className="mt-4">
          <PageHeading
            eyebrow={project.company?.name ?? "Project"}
            title={project.name}
            action={
              <div className="flex flex-col items-end gap-2">
                <StatusPill label={status.label} tone={status.tone} />
                <Link
                  href={`/portal?project=${project.id}`}
                  className="text-[0.8125rem] text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
                >
                  View as client
                </Link>
              </div>
            }
          />
        </div>
      </div>

      {/* ---------------------------------------------------------- Project */}
      <Panel>
        <PanelHeader title="Project detail" />
        <div className="px-5 py-5 lg:px-6">
          <EditProjectForm project={project} />
        </div>
      </Panel>

      {/* ---------------------------------------------------------- Updates */}
      <Panel>
        <PanelHeader title="Post an update" />
        <div className="px-5 py-5 lg:px-6">
          <PostUpdateForm projectId={project.id} />
        </div>
      </Panel>

      {updates.length > 0 ? (
        <Panel>
          <PanelHeader title={`Updates (${updates.length})`} />
          <List>
            {updates.map((update) => (
              <div
                key={update.id}
                className={update.visibility === "internal" ? "bg-muted" : ""}
              >
                {update.visibility === "internal" ? (
                  <p className="t-mono-sm px-5 pt-4 text-ink-3 lg:px-6">Internal only</p>
                ) : null}
                <UpdateItem update={update} />
              </div>
            ))}
          </List>
        </Panel>
      ) : null}

      {/* ------------------------------------------------------- Milestones */}
      <Panel>
        <PanelHeader title={`Milestones (${milestones.length})`} />
        {milestones.length > 0 ? (
          <div className="border-b border-line px-5 py-4 lg:px-6">
            <MilestoneTimeline milestones={milestones} />
          </div>
        ) : null}

        <div className="divide-y divide-line">
          {milestones.map((milestone) => (
            <details key={milestone.id} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 text-[0.9375rem] text-ink hover:bg-paper lg:px-6 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1 truncate">{milestone.name}</span>
                <span className="t-mono-sm shrink-0 text-ink-3 group-open:hidden">Edit</span>
                <span className="t-mono-sm hidden shrink-0 text-ink-3 group-open:inline">
                  Close
                </span>
              </summary>
              <div className="border-t border-line bg-paper px-5 py-5 lg:px-6">
                <MilestoneForm projectId={project.id} milestone={milestone} />
                <form action={deleteMilestone} className="mt-4 border-t border-line pt-4">
                  <input type="hidden" name="milestoneId" value={milestone.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <InlineAction label="Delete this milestone" tone="danger" />
                </form>
              </div>
            </details>
          ))}
        </div>

        <div className="border-t border-line px-5 py-5 lg:px-6">
          <h3 className="t-eyebrow mb-4 text-ink-3">Add a milestone</h3>
          <MilestoneForm projectId={project.id} nextSort={nextSort} />
        </div>
      </Panel>

      {/* --------------------------------------------------------- Blockers */}
      <Panel>
        <PanelHeader title={`Open items (${openBlockers.length})`} />
        {openBlockers.length > 0 ? (
          <List>
            {openBlockers.map((blocker) => (
              <div key={blocker.id}>
                <BlockerItem blocker={blocker} />
                <form action={resolveBlocker} className="px-5 pb-4 lg:px-6">
                  <input type="hidden" name="blockerId" value={blocker.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <InlineAction label="Mark resolved" />
                </form>
              </div>
            ))}
          </List>
        ) : (
          <p className="px-5 py-4 text-[0.9375rem] text-ink-3 lg:px-6">Nothing open.</p>
        )}
        <div className="border-t border-line px-5 py-5 lg:px-6">
          <h3 className="t-eyebrow mb-4 text-ink-3">Add an item</h3>
          <BlockerForm projectId={project.id} />
        </div>
      </Panel>

      {/* ---------------------------------------------------------- Billing */}
      <Panel>
        <PanelHeader title={`Billing (${billing.length})`} />
        {billing.length > 0 ? (
          <div className="divide-y divide-line">
            {billing.map((record) => {
              const meta = billingStatus[record.status];
              return (
                <details key={record.id} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 hover:bg-paper lg:px-6 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-ink">
                      {record.label}
                    </span>
                    <span className="shrink-0 text-[0.9375rem] tabular-nums text-ink-2">
                      {formatMoney(Number(record.amount), record.currency)}
                    </span>
                    <StatusPill label={meta.label} tone={meta.tone} />
                  </summary>
                  <div className="border-t border-line bg-paper px-5 py-5 lg:px-6">
                    <BillingForm projectId={project.id} record={record} />
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-4 text-[0.9375rem] text-ink-3 lg:px-6">No records yet.</p>
        )}
        <div className="border-t border-line px-5 py-5 lg:px-6">
          <h3 className="t-eyebrow mb-4 text-ink-3">Add a record</h3>
          <BillingForm projectId={project.id} />
        </div>
      </Panel>

      {/* ------------------------------------------------------------ Files */}
      <Panel>
        <PanelHeader title={`Files (${files.length})`} />
        {files.length > 0 ? (
          <List>
            {files.map((file) => (
              <div key={file.id}>
                <FileRow file={file} uploaderName={file.uploader?.full_name} />
                <form action={deleteFile} className="px-5 pb-3 lg:px-6">
                  <input type="hidden" name="fileId" value={file.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <InlineAction label="Delete" tone="danger" />
                </form>
              </div>
            ))}
          </List>
        ) : (
          <p className="px-5 py-4 text-[0.9375rem] text-ink-3 lg:px-6">No files yet.</p>
        )}
        <div className="border-t border-line px-5 py-5 lg:px-6">
          <h3 className="t-eyebrow mb-4 text-ink-3">Upload a file</h3>
          <UploadFileForm projectId={project.id} />
        </div>
      </Panel>

      {/* --------------------------------------------------------- Activity */}
      <Panel>
        <PanelHeader title="Recent activity" />
        {activity.length > 0 ? (
          <List>
            {activity.map((entry) => (
              <div key={entry.id} className="px-5 py-3 lg:px-6">
                <p className="text-[0.875rem] text-ink-2">
                  {entry.description}
                  {entry.visibility === "internal" ? (
                    <span className="t-mono-sm ml-2 text-ink-3">(internal)</span>
                  ) : null}
                </p>
                <p className="t-mono-sm mt-1 text-ink-3">{formatDate(entry.created_at)}</p>
              </div>
            ))}
          </List>
        ) : (
          <div className="p-5 lg:p-6">
            <Empty title="Nothing logged yet" />
          </div>
        )}
      </Panel>
    </div>
  );
}
