"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { ErrorSummary, focusField } from "@/components/forms/form-parts";
import { SubmitButton } from "@/components/ui/button";
import { Select, TextArea, TextInput } from "@/components/ui/field";
import { initialFormState } from "@/lib/form-state";
import {
  createCompany,
  createProject,
  postUpdate,
  saveBillingRecord,
  saveBlocker,
  saveMilestone,
  updateProject,
  updateRequest,
  registerFile,
} from "@/lib/portal/admin-actions";
import { inviteClient, resendSetupLink, type InviteResult } from "@/lib/portal/provisioning";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BillingRecord, Milestone, Project } from "@/lib/supabase/types";

/* -------------------------------------------------------------------------
   Shared
------------------------------------------------------------------------- */

function useErrorFocus(state: { errors: Record<string, string>; formError?: string }) {
  useEffect(() => {
    const first = Object.keys(state.errors)[0];
    if (!first) return;
    const id = window.setTimeout(() => focusField(first), 60);
    return () => window.clearTimeout(id);
  }, [state]);
}

/** Green confirmation line. Admin forms stay on the page, so they need one. */
function Saved({ show, children }: { show: boolean; children: string }) {
  if (!show) return null;
  return (
    <p
      role="status"
      className="rounded-md border border-leaf-500/40 bg-leaf-50 px-4 py-3 text-[0.875rem] font-medium text-leaf-700"
    >
      {children}
    </p>
  );
}

function useSaved(
  pending: boolean,
  state: { errors: Record<string, string>; formError?: string },
) {
  const [saved, setSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      const clean = Object.keys(state.errors).length === 0 && !state.formError;
      setSaved(clean);
      if (clean) {
        const id = window.setTimeout(() => setSaved(false), 4000);
        return () => window.clearTimeout(id);
      }
    }
    wasPending.current = pending;
  }, [pending, state]);

  return saved;
}

const STATUS_OPTIONS = [
  "planning",
  "in_progress",
  "testing",
  "waiting_on_client",
  "ready_for_review",
  "launching",
  "complete",
  "on_hold",
];

/* -------------------------------------------------------------------------
   Company
------------------------------------------------------------------------- */

export function CreateCompanyForm() {
  const [state, action, pending] = useActionState(createCompany, initialFormState);
  useErrorFocus(state);
  const saved = useSaved(pending, state);

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ name: "Company name" }}
        onJump={focusField}
      />
      <Saved show={saved}>Company created.</Saved>
      <TextInput
        id="name"
        name="name"
        label="Company name"
        hint="The URL slug is generated from this."
        required
        maxLength={160}
        defaultValue={state.values.name ?? ""}
        error={state.errors.name}
        placeholder="Northgate Mechanical"
      />
      <div>
        <SubmitButton pending={pending}>Create company</SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Projects
------------------------------------------------------------------------- */

export function CreateProjectForm({
  companies,
}: {
  companies: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createProject, initialFormState);
  useErrorFocus(state);

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ name: "Project name" }}
        onJump={focusField}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.875rem] font-medium text-ink">Company</span>
          <select
            name="companyId"
            required
            className="w-full rounded-md border border-line-2 bg-surface px-3.5 py-3 text-[0.95rem] text-ink hover:border-navy-200 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <TextInput
          id="name"
          name="name"
          label="Project name"
          required
          maxLength={200}
          defaultValue={state.values.name ?? ""}
          error={state.errors.name}
        />
      </div>
      <TextArea
        id="description"
        name="description"
        label="Description"
        optional
        rows={2}
        maxLength={2000}
        defaultValue={state.values.description ?? ""}
      />
      <div>
        <SubmitButton pending={pending}>Create project</SubmitButton>
      </div>
    </form>
  );
}

export function EditProjectForm({ project }: { project: Project }) {
  const [state, action, pending] = useActionState(updateProject, initialFormState);
  useErrorFocus(state);
  const saved = useSaved(pending, state);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="projectId" value={project.id} />
      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ name: "Project name" }}
        onJump={focusField}
      />
      <Saved show={saved}>Saved.</Saved>

      <TextInput
        id="name"
        name="name"
        label="Project name"
        required
        maxLength={200}
        defaultValue={project.name}
        error={state.errors.name}
      />

      <TextArea
        id="description"
        name="description"
        label="Description"
        optional
        rows={2}
        maxLength={2000}
        defaultValue={project.description}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          id="status"
          name="status"
          label="Status"
          options={STATUS_OPTIONS}
          defaultValue={project.status}
          placeholder="Planning"
        />
        <TextInput
          id="phase"
          name="phase"
          label="Phase"
          optional
          hint="Free text. What you would say on a call."
          maxLength={120}
          defaultValue={project.phase}
        />
      </div>

      <TextArea
        id="currentWork"
        name="currentWork"
        label="Currently working on"
        optional
        hint="Shown prominently on the client's overview. One or two sentences."
        rows={2}
        maxLength={500}
        defaultValue={project.current_work}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <TextInput
          id="progressPercent"
          name="progressPercent"
          type="number"
          min={0}
          max={100}
          label="Progress %"
          defaultValue={String(project.progress_percent)}
        />
        <TextInput
          id="startDate"
          name="startDate"
          type="date"
          label="Start date"
          optional
          defaultValue={project.start_date ?? ""}
        />
        <TextInput
          id="targetDate"
          name="targetDate"
          type="date"
          label="Target date"
          optional
          defaultValue={project.target_date ?? ""}
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isArchived"
          defaultChecked={project.is_archived}
          className="h-4 w-4 accent-navy-700"
        />
        <span className="text-[0.875rem] text-ink-2">
          Archived — hidden from the client&rsquo;s default project
        </span>
      </label>

      <div>
        <SubmitButton pending={pending}>Save project</SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Updates
------------------------------------------------------------------------- */

export function PostUpdateForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(postUpdate, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  useErrorFocus(state);
  const saved = useSaved(pending, state);

  useEffect(() => {
    if (saved) formRef.current?.reset();
  }, [saved]);

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ title: "Title" }}
        onJump={focusField}
      />
      <Saved show={saved}>Update posted.</Saved>

      <TextInput
        id="title"
        name="title"
        label="Title"
        required
        maxLength={200}
        defaultValue={state.values.title ?? ""}
        error={state.errors.title}
        placeholder="QuickBooks sync is live"
      />
      <TextArea
        id="body"
        name="body"
        label="Body"
        optional
        rows={4}
        maxLength={5000}
        defaultValue={state.values.body ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          id="category"
          name="category"
          label="Category"
          optional
          maxLength={60}
          placeholder="Integration"
        />
        <Select
          id="visibility"
          name="visibility"
          label="Visibility"
          options={["customer", "internal"]}
          defaultValue="customer"
          placeholder="customer"
          hint="Internal updates are never shown to the client."
        />
      </div>
      <div>
        <SubmitButton pending={pending}>Post update</SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Milestones
------------------------------------------------------------------------- */

export function MilestoneForm({
  projectId,
  milestone,
  nextSort,
}: {
  projectId: string;
  milestone?: Milestone;
  nextSort?: number;
}) {
  const [state, action, pending] = useActionState(saveMilestone, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  useErrorFocus(state);
  const saved = useSaved(pending, state);

  useEffect(() => {
    if (saved && !milestone) formRef.current?.reset();
  }, [saved, milestone]);

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      {milestone ? <input type="hidden" name="milestoneId" value={milestone.id} /> : null}

      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ name: "Name" }}
        onJump={focusField}
      />
      <Saved show={saved}>{milestone ? "Milestone saved." : "Milestone added."}</Saved>

      <TextInput
        id={`ms-name-${milestone?.id ?? "new"}`}
        name="name"
        label="Name"
        required
        maxLength={200}
        defaultValue={milestone?.name ?? ""}
        error={state.errors.name}
      />
      <TextArea
        id={`ms-desc-${milestone?.id ?? "new"}`}
        name="description"
        label="Description"
        optional
        rows={2}
        maxLength={1000}
        defaultValue={milestone?.description ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          id={`ms-status-${milestone?.id ?? "new"}`}
          name="status"
          label="Status"
          options={["upcoming", "in_progress", "blocked", "complete"]}
          defaultValue={milestone?.status ?? "upcoming"}
          placeholder="upcoming"
        />
        <TextInput
          id={`ms-due-${milestone?.id ?? "new"}`}
          name="dueDate"
          type="date"
          label="Due date"
          optional
          defaultValue={milestone?.due_date ?? ""}
        />
        <TextInput
          id={`ms-sort-${milestone?.id ?? "new"}`}
          name="sortOrder"
          type="number"
          label="Order"
          defaultValue={String(milestone?.sort_order ?? nextSort ?? 0)}
        />
      </div>
      <div>
        <SubmitButton pending={pending}>{milestone ? "Save" : "Add milestone"}</SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Blockers
------------------------------------------------------------------------- */

export function BlockerForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(saveBlocker, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  useErrorFocus(state);
  const saved = useSaved(pending, state);

  useEffect(() => {
    if (saved) formRef.current?.reset();
  }, [saved]);

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ title: "Title" }}
        onJump={focusField}
      />
      <Saved show={saved}>Item added.</Saved>

      <TextInput
        id="blocker-title"
        name="title"
        label="What is blocked"
        required
        maxLength={200}
        defaultValue={state.values.title ?? ""}
        error={state.errors.title}
        placeholder="QuickBooks API credentials"
      />
      <TextArea
        id="blocker-description"
        name="description"
        label="Detail"
        optional
        hint="If this is waiting on the client, say exactly what you need and where to send it."
        rows={3}
        maxLength={1000}
        defaultValue={state.values.description ?? ""}
      />
      <Select
        id="waitingOn"
        name="waitingOn"
        label="Waiting on"
        options={["client", "operava", "third_party"]}
        defaultValue="operava"
        placeholder="operava"
        hint="“client” surfaces this at the top of their overview."
      />
      <div>
        <SubmitButton pending={pending}>Add item</SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Request workflow
------------------------------------------------------------------------- */

export function RequestControls({
  requestId,
  projectId,
  status,
  priority,
  estimatedCost,
  timelineImpact,
  approvalStatus,
  isChangeRequest,
}: {
  requestId: string;
  projectId: string;
  status: string;
  priority: string;
  estimatedCost: number | null;
  timelineImpact: string;
  approvalStatus: string | null;
  isChangeRequest: boolean;
}) {
  const [state, action, pending] = useActionState(updateRequest, initialFormState);
  const saved = useSaved(pending, state);

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="projectId" value={projectId} />

      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{}}
        onJump={focusField}
      />
      <Saved show={saved}>Saved.</Saved>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="status"
          name="status"
          label="Status"
          options={[
            "submitted",
            "reviewing",
            "approved",
            "in_progress",
            "waiting_on_client",
            "done",
            "declined",
          ]}
          defaultValue={status}
          placeholder="submitted"
        />
        <Select
          id="priority"
          name="priority"
          label="Priority"
          options={["low", "normal", "high", "urgent"]}
          defaultValue={priority}
          placeholder="normal"
        />
      </div>

      {/* Estimate fields only for change requests. Every other type would show
          three permanently empty inputs. */}
      {isChangeRequest ? (
        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <TextInput
            id="estimatedCost"
            name="estimatedCost"
            label="Estimated cost"
            optional
            maxLength={20}
            defaultValue={estimatedCost !== null ? String(estimatedCost) : ""}
            placeholder="1500"
          />
          <TextInput
            id="timelineImpact"
            name="timelineImpact"
            label="Timeline impact"
            optional
            maxLength={300}
            defaultValue={timelineImpact}
            placeholder="+1 week"
          />
          <Select
            id="approvalStatus"
            name="approvalStatus"
            label="Approval"
            optional
            options={["pending", "approved", "declined"]}
            defaultValue={approvalStatus ?? ""}
            placeholder="Not sent"
          />
        </div>
      ) : null}

      <div>
        <SubmitButton pending={pending}>Save</SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Billing
------------------------------------------------------------------------- */

export function BillingForm({
  projectId,
  record,
}: {
  projectId: string;
  record?: BillingRecord;
}) {
  const [state, action, pending] = useActionState(saveBillingRecord, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);
  useErrorFocus(state);
  const saved = useSaved(pending, state);

  useEffect(() => {
    if (saved && !record) formRef.current?.reset();
  }, [saved, record]);

  const key = record?.id ?? "new";

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      {record ? <input type="hidden" name="recordId" value={record.id} /> : null}

      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ label: "Label", amount: "Amount", externalUrl: "Invoice link" }}
        onJump={focusField}
      />
      <Saved show={saved}>{record ? "Record saved." : "Record added."}</Saved>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          id={`bill-label-${key}`}
          name="label"
          label="Label"
          required
          maxLength={200}
          defaultValue={record?.label ?? ""}
          error={state.errors.label}
          placeholder="Deposit — 50%"
        />
        <TextInput
          id={`bill-amount-${key}`}
          name="amount"
          label="Amount"
          required
          maxLength={20}
          defaultValue={record ? String(record.amount) : ""}
          error={state.errors.amount}
          placeholder="3000"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          id={`bill-status-${key}`}
          name="status"
          label="Status"
          options={["pending", "due", "paid", "overdue", "cancelled"]}
          defaultValue={record?.status ?? "pending"}
          placeholder="pending"
        />
        <TextInput
          id={`bill-due-${key}`}
          name="dueDate"
          type="date"
          label="Due date"
          optional
          defaultValue={record?.due_date ?? ""}
        />
        <TextInput
          id={`bill-paid-${key}`}
          name="paidAt"
          type="date"
          label="Paid date"
          optional
          defaultValue={record?.paid_at ? record.paid_at.slice(0, 10) : ""}
        />
      </div>

      <TextInput
        id={`bill-url-${key}`}
        name="externalUrl"
        label="Invoice link"
        optional
        hint="Must start with https://"
        maxLength={500}
        defaultValue={record?.external_url ?? ""}
        error={state.errors.externalUrl}
      />

      <TextInput
        id={`bill-notes-${key}`}
        name="notes"
        label="Note"
        optional
        maxLength={500}
        defaultValue={record?.notes ?? ""}
      />

      <div>
        <SubmitButton pending={pending}>{record ? "Save" : "Add record"}</SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   File upload
------------------------------------------------------------------------- */

export function UploadFileForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(registerFile, initialFormState);
  const [file, setFile] = useState<{
    path: string;
    name: string;
    size: number;
    mime: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const saved = useSaved(pending, state);

  // Clear the staged file once the row is saved, adjusted during render rather
  // than in an effect. An effect here would paint the just-saved filename once
  // before wiping it, which reads as the upload having failed and reappeared.
  //
  // `resetToken` keys the file input so React remounts it empty. A file input's
  // value cannot be set from React, and reaching for the DOM node during render
  // is exactly what the refs rule is there to stop.
  const [resetToken, setResetToken] = useState(0);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (Object.keys(state.errors).length === 0 && !state.formError) {
      setFile(null);
      setResetToken((token) => token + 1);
    }
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (!picked) return;

    setError("");
    if (picked.size > 25 * 1024 * 1024) {
      setError("That file is over 25 MB.");
      return;
    }

    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const safe = picked.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
    const path = `${projectId}/${crypto.randomUUID()}-${safe}`;

    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(path, picked, { contentType: picked.type || "application/octet-stream" });

    setUploading(false);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    setFile({ path, name: picked.name.slice(0, 200), size: picked.size, mime: picked.type });
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="path" value={file?.path ?? ""} />
      <input type="hidden" name="name" value={file?.name ?? ""} />
      <input type="hidden" name="size" value={file ? String(file.size) : ""} />
      <input type="hidden" name="mime" value={file?.mime ?? ""} />

      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{}}
        onJump={focusField}
      />
      <Saved show={saved}>File added.</Saved>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.875rem] font-medium text-ink">Choose a file</span>
        <input
          key={resetToken}
          type="file"
          onChange={onPick}
          disabled={uploading}
          className="block w-full rounded-md border border-line-2 bg-surface px-3.5 py-3 text-[0.875rem] text-ink-2 file:mr-3 file:rounded file:border-0 file:bg-navy-50 file:px-3 file:py-1.5 file:text-[0.8125rem] file:font-medium file:text-navy-800 hover:border-navy-200"
        />
      </label>

      {uploading ? <p className="text-[0.8125rem] text-ink-3">Uploading…</p> : null}
      {error ? <p className="text-[0.8125rem] font-medium text-danger">{error}</p> : null}
      {file ? (
        <p className="text-[0.8125rem] text-ink-2">
          Ready: <span className="font-medium text-ink">{file.name}</span>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="category"
          name="category"
          label="Category"
          options={[
            "contract",
            "specification",
            "deliverable",
            "documentation",
            "screenshot",
            "other",
          ]}
          defaultValue="deliverable"
          placeholder="other"
        />
        <Select
          id="fileVisibility"
          name="visibility"
          label="Visibility"
          options={["customer", "internal"]}
          defaultValue="customer"
          placeholder="customer"
        />
      </div>

      <div>
        <SubmitButton pending={pending || uploading}>Add file</SubmitButton>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Provisioning
------------------------------------------------------------------------- */

const emptyInvite: InviteResult = { errors: {}, values: {} };

/**
 * Shows the setup link after a successful invite.
 *
 * Always displayed, even when the email sent. If Resend is not configured, or a
 * customer's mail server eats it, staff can still get someone in — and the link
 * is a one-time token, not a password, so showing it on screen is not the same
 * kind of risk.
 */
function SetupLink({ result }: { result: InviteResult }) {
  if (!result.setupLink) return null;
  return (
    <div className="rounded-md border border-navy-100 bg-navy-50 p-4">
      <p className="text-[0.875rem] font-medium text-ink">
        {result.emailed
          ? "Account created and the setup email has gone out."
          : "Account created. Email is not configured, so send this link yourself."}
      </p>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-2">
        One-time link, valid for 24 hours. It lets them set their own password.
      </p>
      <code className="mt-3 block overflow-x-auto rounded border border-line-2 bg-surface px-3 py-2 text-[0.75rem] text-ink-2">
        {result.setupLink}
      </code>
    </div>
  );
}

export function InviteClientForm({
  companies,
  defaultCompanyId,
}: {
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
}) {
  const [state, action, pending] = useActionState(inviteClient, emptyInvite);
  useErrorFocus(state);

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ email: "Email", fullName: "Full name" }}
        onJump={focusField}
      />
      <SetupLink result={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          id="fullName"
          name="fullName"
          label="Full name"
          required
          maxLength={160}
          defaultValue={state.values.fullName ?? ""}
          error={state.errors.fullName}
        />
        <TextInput
          id="email"
          name="email"
          type="email"
          label="Email"
          required
          maxLength={320}
          defaultValue={state.values.email ?? ""}
          error={state.errors.email}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.875rem] font-medium text-ink">Company</span>
        <select
          name="companyId"
          required
          defaultValue={defaultCompanyId ?? ""}
          className="w-full rounded-md border border-line-2 bg-surface px-3.5 py-3 text-[0.95rem] text-ink hover:border-navy-200 focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/20"
        >
          <option value="">Select one</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>

      <p className="text-[0.8125rem] leading-relaxed text-ink-3">
        No password is generated or emailed. They receive a one-time link and choose their own.
      </p>

      <div>
        <SubmitButton pending={pending}>Create account</SubmitButton>
      </div>
    </form>
  );
}

export function ResendSetupLinkForm({ email, fullName }: { email: string; fullName: string }) {
  const [state, action, pending] = useActionState(resendSetupLink, emptyInvite);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="fullName" value={fullName} />
      {state.formError ? (
        <p className="text-[0.8125rem] font-medium text-danger">{state.formError}</p>
      ) : null}
      <SetupLink result={state} />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md border border-line-2 px-3.5 py-2 text-[0.8125rem] font-medium text-ink-2 transition-colors hover:border-navy-200 hover:text-ink disabled:opacity-60"
      >
        {pending ? "Working…" : "Send setup link"}
      </button>
    </form>
  );
}
