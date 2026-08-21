"use client";

import { useActionState, useState } from "react";

import { ActionPanel } from "@/components/portal/action-panel";
import { EnumSelect, toOptions } from "@/components/portal/enum-select";
import { PendingSubmit } from "@/components/portal/pending-submit";
import { TextArea, TextInput } from "@/components/ui/field";
import { idleActionState, type ActionState } from "@/lib/portal/action-state";
import type {
  InternalBillingRecord,
  InternalMilestone,
  InternalProject,
} from "@/lib/portal/serialize";
import {
  BILLING_STATUSES,
  BILLING_STATUS_LABELS,
  CLIENT_REQUEST_STATUSES,
  FILE_CATEGORIES,
  FILE_CATEGORY_LABELS,
  LINK_KINDS,
  LINK_KIND_LABELS,
  MILESTONE_STATUSES,
  MILESTONE_STATUS_LABELS,
  PROJECT_HEALTHS,
  PROJECT_HEALTH_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS_INTERNAL,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  UPDATE_TYPES,
  UPDATE_TYPE_LABELS,
  type RequestStatus,
} from "@/lib/portal/types";

import {
  addLinkAction,
  addRequestCommentAction,
  createClientRequestAction,
  createMilestoneAction,
  deleteMilestoneAction,
  postUpdateAction,
  setRequestStatusAction,
  transitionClientRequestAction,
  updateMilestoneAction,
  updateProjectDetailsAction,
  updateProjectProgressAction,
  updateProjectStatusAction,
  updateProjectSummaryAction,
  upsertBillingAction,
  uploadFileAction,
} from "../../actions";

const VISIBILITY_OPTIONS = [
  { value: "customer", label: "Customer-visible" },
  { value: "internal", label: "Internal only" },
];

/* ------------------------- quick status / progress ------------------------ */

export function QuickStatusForm({ project }: { project: InternalProject }) {
  return (
    <ActionPanel action={updateProjectStatusAction} submitLabel="Set status" row>
      <input type="hidden" name="projectId" value={project.id} />
      <EnumSelect
        id="qs-status"
        name="status"
        label="Status"
        defaultValue={project.status}
        options={toOptions(PROJECT_STATUSES, PROJECT_STATUS_LABELS_INTERNAL)}
        className="w-52"
      />
      <TextInput
        id="qs-note"
        name="note"
        label="Note (audit trail)"
        optional
        maxLength={500}
        className="min-w-56 flex-1"
      />
    </ActionPanel>
  );
}

export function QuickProgressForm({ project }: { project: InternalProject }) {
  return (
    <ActionPanel action={updateProjectProgressAction} submitLabel="Save progress" row>
      <input type="hidden" name="projectId" value={project.id} />
      <TextInput
        id="qp-percent"
        name="progressPercent"
        label="Progress %"
        type="number"
        min={0}
        max={100}
        defaultValue={project.progressPercent}
        className="w-28"
      />
      <TextInput
        id="qp-phase"
        name="phase"
        label="Current phase"
        defaultValue={project.phase}
        maxLength={120}
        className="w-56"
      />
      <EnumSelect
        id="qp-health"
        name="health"
        label="Health"
        defaultValue={project.health}
        options={toOptions(PROJECT_HEALTHS, PROJECT_HEALTH_LABELS)}
        className="w-40"
      />
      <TextInput
        id="qp-current"
        name="currentWork"
        label="Working on right now"
        defaultValue={project.currentWork}
        optional
        maxLength={500}
        className="min-w-64 flex-1"
      />
    </ActionPanel>
  );
}

/* -------------------------------- updates -------------------------------- */

export function PostUpdateForm({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: InternalMilestone[];
}) {
  return (
    <ActionPanel action={postUpdateAction} submitLabel="Post update">
      <input type="hidden" name="projectId" value={projectId} />
      <TextInput
        id="pu-title"
        name="title"
        label="Headline"
        placeholder="Stripe billing integration completed"
        required
        maxLength={200}
      />
      <TextArea
        id="pu-body"
        name="body"
        label="Detail"
        hint="Write it for the customer: what got done, what it means, what's next."
        optional
        rows={4}
        maxLength={10000}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <EnumSelect
          id="pu-type"
          name="updateType"
          label="Type"
          defaultValue="progress"
          options={toOptions(UPDATE_TYPES, UPDATE_TYPE_LABELS)}
        />
        <EnumSelect
          id="pu-visibility"
          name="visibility"
          label="Visibility"
          defaultValue="customer"
          options={VISIBILITY_OPTIONS}
        />
        <EnumSelect
          id="pu-milestone"
          name="milestoneId"
          label="Milestone"
          allowEmpty="None"
          options={milestones.map((m) => ({ value: m.id, label: m.name }))}
        />
      </div>
    </ActionPanel>
  );
}

/* ------------------------------- milestones ------------------------------- */

export function MilestoneRowControls({ milestone }: { milestone: InternalMilestone }) {
  const [updateState, updateAction] = useActionState(updateMilestoneAction, idleActionState);
  const [deleteState, deleteAction] = useActionState(deleteMilestoneAction, idleActionState);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const error = [updateState, deleteState].find((s) => s.status === "error");

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <form action={updateAction} className="flex items-center gap-2">
          <input type="hidden" name="milestoneId" value={milestone.id} />
          <label className="sr-only" htmlFor={`ms-status-${milestone.id}`}>
            Status for {milestone.name}
          </label>
          <select
            id={`ms-status-${milestone.id}`}
            name="status"
            defaultValue={milestone.status}
            className="rounded-md border border-line-2 bg-surface px-2.5 py-1.5 text-[0.8125rem] text-ink"
          >
            {MILESTONE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {MILESTONE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <PendingSubmit variant="quiet" pendingLabel="…">
            Save
          </PendingSubmit>
        </form>
        {confirmingDelete ? (
          <form action={deleteAction} className="flex items-center gap-1.5">
            <input type="hidden" name="milestoneId" value={milestone.id} />
            <input type="hidden" name="projectId" value={milestone.projectId} />
            <PendingSubmit
              variant="danger"
              pendingLabel="Removing…"
              className="!px-2.5 !py-1.5 text-[0.8125rem]"
            >
              Really remove
            </PendingSubmit>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-[0.78rem] text-ink-3 hover:text-ink"
            >
              Keep
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md px-2 py-1.5 text-[0.78rem] font-medium text-ink-3 hover:bg-danger-bg hover:text-danger"
          >
            Remove
          </button>
        )}
      </div>
      {error ? <p className="text-[0.78rem] font-medium text-danger">{error.message}</p> : null}
    </div>
  );
}

export function NewMilestoneForm({ projectId }: { projectId: string }) {
  return (
    <ActionPanel action={createMilestoneAction} submitLabel="Add milestone" row>
      <input type="hidden" name="projectId" value={projectId} />
      <TextInput
        id="nm-name"
        name="name"
        label="Milestone"
        required
        maxLength={200}
        className="min-w-56 flex-1"
      />
      <TextInput id="nm-due" name="dueDate" label="Due" type="date" optional className="w-40" />
      <EnumSelect
        id="nm-visibility"
        name="visibility"
        label="Visibility"
        defaultValue="customer"
        options={VISIBILITY_OPTIONS}
        className="w-44"
      />
    </ActionPanel>
  );
}

/* ----------------------------- client requests ---------------------------- */

export function ClientRequestControls({
  clientRequestId,
  status,
}: {
  clientRequestId: string;
  status: (typeof CLIENT_REQUEST_STATUSES)[number];
}) {
  const [state, action] = useActionState(transitionClientRequestAction, idleActionState);
  const targets: { to: string; label: string; variant: "secondary" | "danger" }[] = [];
  if (status === "open" || status === "acknowledged") {
    targets.push({ to: "completed", label: "Mark completed", variant: "secondary" });
    targets.push({ to: "cancelled", label: "Cancel", variant: "danger" });
  } else {
    targets.push({ to: "open", label: "Reopen", variant: "secondary" });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        {targets.map((target) => (
          <form key={target.to} action={action}>
            <input type="hidden" name="clientRequestId" value={clientRequestId} />
            <input type="hidden" name="status" value={target.to} />
            <PendingSubmit
              variant={target.variant}
              pendingLabel="…"
              className="!px-2.5 !py-1.5 text-[0.8125rem]"
            >
              {target.label}
            </PendingSubmit>
          </form>
        ))}
      </div>
      {state.status === "error" ? (
        <p className="text-[0.78rem] font-medium text-danger">{state.message}</p>
      ) : null}
    </div>
  );
}

export function NewClientRequestForm({ projectId }: { projectId: string }) {
  return (
    <ActionPanel action={createClientRequestAction} submitLabel="Ask the customer">
      <input type="hidden" name="projectId" value={projectId} />
      <TextInput
        id="ncr-title"
        name="title"
        label="What do you need from them?"
        placeholder="Connect your Stripe account"
        required
        maxLength={200}
      />
      <TextArea
        id="ncr-desc"
        name="description"
        label="Details / instructions"
        optional
        rows={3}
        maxLength={10000}
      />
      <TextInput
        id="ncr-due"
        name="dueDate"
        label="Needed by"
        type="date"
        optional
        className="w-44"
      />
    </ActionPanel>
  );
}

/* --------------------------------- links ---------------------------------- */

export function NewLinkForm({ projectId }: { projectId: string }) {
  return (
    <ActionPanel action={addLinkAction} submitLabel="Add link" row>
      <input type="hidden" name="projectId" value={projectId} />
      <TextInput
        id="nl-label"
        name="label"
        label="Label"
        required
        maxLength={120}
        className="w-48"
      />
      <TextInput
        id="nl-url"
        name="url"
        label="URL"
        type="url"
        placeholder="https://…"
        required
        className="min-w-64 flex-1"
      />
      <EnumSelect
        id="nl-kind"
        name="kind"
        label="Kind"
        defaultValue="other"
        options={toOptions(LINK_KINDS, LINK_KIND_LABELS)}
        className="w-40"
      />
      <EnumSelect
        id="nl-visibility"
        name="visibility"
        label="Visibility"
        defaultValue="customer"
        options={VISIBILITY_OPTIONS}
        className="w-44"
      />
    </ActionPanel>
  );
}

export function DeleteRowButton({
  action,
  hidden,
  label = "Remove",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  label?: string;
}) {
  const [state, formAction] = useActionState(action, idleActionState);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md px-2 py-1 text-[0.78rem] font-medium text-ink-3 hover:bg-danger-bg hover:text-danger"
      >
        {label}
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      <form action={formAction}>
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <PendingSubmit variant="danger" pendingLabel="…" className="!px-2 !py-1 text-[0.78rem]">
          Confirm
        </PendingSubmit>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-[0.78rem] text-ink-3 hover:text-ink"
      >
        Keep
      </button>
      {state.status === "error" ? (
        <span className="text-[0.78rem] font-medium text-danger">{state.message}</span>
      ) : null}
    </span>
  );
}

/* --------------------------------- files ---------------------------------- */

export function UploadFileForm({ projectId }: { projectId: string }) {
  return (
    <ActionPanel action={uploadFileAction} submitLabel="Upload" row>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex min-w-64 flex-1 flex-col gap-1.5">
        <label htmlFor="uf-file" className="text-[0.875rem] font-medium text-ink">
          File
        </label>
        <input
          id="uf-file"
          name="file"
          type="file"
          required
          className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-[0.85rem] text-ink-2 file:mr-3 file:rounded file:border-0 file:bg-navy-50 file:px-3 file:py-1.5 file:text-[0.8125rem] file:font-medium file:text-navy-800"
        />
      </div>
      <EnumSelect
        id="uf-category"
        name="category"
        label="Category"
        defaultValue="deliverable"
        options={toOptions(FILE_CATEGORIES, FILE_CATEGORY_LABELS)}
        className="w-44"
      />
      <EnumSelect
        id="uf-visibility"
        name="visibility"
        label="Visibility"
        defaultValue="customer"
        options={VISIBILITY_OPTIONS}
        className="w-44"
      />
    </ActionPanel>
  );
}

/* -------------------------------- billing ---------------------------------- */

export function BillingForm({
  projectId,
  record,
}: {
  projectId: string;
  record?: InternalBillingRecord;
}) {
  return (
    <ActionPanel
      action={upsertBillingAction}
      submitLabel={record ? "Save" : "Add billing line"}
      row
    >
      <input type="hidden" name="projectId" value={projectId} />
      {record ? <input type="hidden" name="billingRecordId" value={record.id} /> : null}
      <TextInput
        id={`bf-label-${record?.id ?? "new"}`}
        name="label"
        label="Label"
        defaultValue={record?.label}
        required
        maxLength={200}
        className="min-w-48 flex-1"
      />
      <TextInput
        id={`bf-amount-${record?.id ?? "new"}`}
        name="amount"
        label="Amount"
        type="number"
        step="0.01"
        min={0}
        defaultValue={record?.amount}
        required
        className="w-32"
      />
      <EnumSelect
        id={`bf-status-${record?.id ?? "new"}`}
        name="status"
        label="Status"
        defaultValue={record?.status ?? "pending"}
        options={toOptions(BILLING_STATUSES, BILLING_STATUS_LABELS)}
        className="w-36"
      />
      <TextInput
        id={`bf-due-${record?.id ?? "new"}`}
        name="dueDate"
        label="Due"
        type="date"
        defaultValue={record?.dueDate ?? undefined}
        optional
        className="w-40"
      />
      <TextInput
        id={`bf-url-${record?.id ?? "new"}`}
        name="externalUrl"
        label="Invoice URL"
        type="url"
        defaultValue={record?.externalUrl ?? undefined}
        optional
        className="min-w-56 flex-1"
      />
    </ActionPanel>
  );
}

/* ---------------------------- customer requests ---------------------------- */

export function RequestTriage({
  requestId,
  status,
}: {
  requestId: string;
  status: RequestStatus;
}) {
  const [statusState, statusAction] = useActionState(setRequestStatusAction, idleActionState);
  const [commentState, commentAction] = useActionState(
    addRequestCommentAction,
    idleActionState,
  );

  return (
    <div className="flex flex-col gap-3">
      <form action={statusAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <label className="sr-only" htmlFor={`rq-status-${requestId}`}>
          Request status
        </label>
        <select
          id={`rq-status-${requestId}`}
          name="status"
          defaultValue={status}
          className="rounded-md border border-line-2 bg-surface px-2.5 py-1.5 text-[0.8125rem] text-ink"
        >
          {REQUEST_STATUSES.map((value) => (
            <option key={value} value={value}>
              {REQUEST_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <PendingSubmit variant="quiet" pendingLabel="…">
          Set status
        </PendingSubmit>
        {statusState.status === "error" ? (
          <span className="text-[0.78rem] font-medium text-danger">{statusState.message}</span>
        ) : null}
      </form>
      <form action={commentAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <div className="min-w-56 flex-1">
          <label className="sr-only" htmlFor={`rq-comment-${requestId}`}>
            Reply
          </label>
          <textarea
            id={`rq-comment-${requestId}`}
            name="body"
            rows={2}
            placeholder="Reply to the customer…"
            className="w-full rounded-md border border-line-2 bg-surface px-3 py-2 text-[0.85rem] text-ink"
          />
        </div>
        <EnumSelect
          id={`rq-vis-${requestId}`}
          name="visibility"
          label="Visibility"
          defaultValue="customer"
          options={VISIBILITY_OPTIONS}
          className="w-44"
        />
        <PendingSubmit variant="secondary" pendingLabel="Sending…">
          Reply
        </PendingSubmit>
        {commentState.status !== "idle" ? (
          <span
            className={`text-[0.78rem] font-medium ${commentState.status === "ok" ? "text-leaf-700" : "text-danger"}`}
          >
            {commentState.message}
          </span>
        ) : null}
      </form>
    </div>
  );
}

/* ------------------------- customer copy & details ------------------------- */

export function CustomerCopyForm({ project }: { project: InternalProject }) {
  return (
    <ActionPanel action={updateProjectSummaryAction} submitLabel="Save customer copy">
      <input type="hidden" name="projectId" value={project.id} />
      <TextArea
        id="cc-summary"
        name="summary"
        label="Customer-facing summary"
        hint="Shown at the top of their project page."
        defaultValue={project.summary}
        optional
        rows={3}
        maxLength={1000}
      />
      <TextArea
        id="cc-description"
        name="description"
        label="Longer description"
        defaultValue={project.description}
        optional
        rows={4}
        maxLength={10000}
      />
    </ActionPanel>
  );
}

export function ProjectDetailsForm({
  project,
  admins,
}: {
  project: InternalProject;
  admins: { id: string; fullName: string; email: string }[];
}) {
  return (
    <ActionPanel action={updateProjectDetailsAction} submitLabel="Save details">
      <input type="hidden" name="projectId" value={project.id} />
      <TextInput
        id="pd-name"
        name="name"
        label="Project name"
        defaultValue={project.name}
        required
        maxLength={200}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          id="pd-start"
          name="startDate"
          label="Start"
          type="date"
          defaultValue={project.startDate ?? undefined}
          optional
        />
        <TextInput
          id="pd-target"
          name="targetDate"
          label="Target completion"
          type="date"
          defaultValue={project.targetDate ?? undefined}
          optional
        />
        <EnumSelect
          id="pd-owner"
          name="ownerProfileId"
          label="Owner"
          allowEmpty="Unassigned"
          defaultValue={project.ownerProfileId ?? ""}
          options={admins.map((admin) => ({
            value: admin.id,
            label: admin.fullName || admin.email,
          }))}
        />
      </div>
      <TextArea
        id="pd-notes"
        name="internalNotes"
        label="Internal notes"
        hint="Operava-only. Never rendered in the customer portal, never selectable through the customer API role."
        defaultValue={project.internalNotes}
        optional
        rows={5}
        maxLength={50000}
      />
      <input type="hidden" name="isArchived" value={String(project.isArchived)} />
    </ActionPanel>
  );
}

export function ArchiveToggle({ project }: { project: InternalProject }) {
  const [state, action] = useActionState(updateProjectDetailsAction, idleActionState);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="projectId" value={project.id} />
      <input type="hidden" name="isArchived" value={String(!project.isArchived)} />
      <PendingSubmit variant={project.isArchived ? "secondary" : "danger"} pendingLabel="…">
        {project.isArchived ? "Unarchive project" : "Archive project"}
      </PendingSubmit>
      {state.status === "error" ? (
        <span className="text-[0.78rem] font-medium text-danger">{state.message}</span>
      ) : null}
    </form>
  );
}
