"use client";

import { useActionState } from "react";

import { ActionPanel } from "@/components/portal/action-panel";
import { EnumSelect, toOptions } from "@/components/portal/enum-select";
import { PendingSubmit } from "@/components/portal/pending-submit";
import { TextArea, TextInput } from "@/components/ui/field";
import { idleActionState } from "@/lib/portal/action-state";
import type { InternalCompany } from "@/lib/portal/serialize";
import {
  COMPANY_STATUSES,
  COMPANY_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS_INTERNAL,
} from "@/lib/portal/types";

import {
  createProjectAction,
  inviteCustomerUserAction,
  updateCustomerAction,
  type InviteState,
} from "../../actions";

export function EditCustomerForm({ company }: { company: InternalCompany }) {
  return (
    <ActionPanel action={updateCustomerAction} submitLabel="Save customer">
      <input type="hidden" name="customerId" value={company.id} />
      <TextInput
        id="ec-name"
        name="name"
        label="Company name"
        defaultValue={company.name}
        required
        maxLength={160}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          id="ec-contact"
          name="primaryContactName"
          label="Primary contact"
          defaultValue={company.primaryContactName}
          optional
          maxLength={160}
        />
        <TextInput
          id="ec-phone"
          name="contactPhone"
          label="Phone"
          defaultValue={company.contactPhone}
          optional
          maxLength={40}
        />
      </div>
      <TextInput
        id="ec-email"
        name="contactEmail"
        type="email"
        label="Contact email"
        defaultValue={company.contactEmail}
        optional
        maxLength={320}
      />
      <EnumSelect
        id="ec-status"
        name="status"
        label="Status"
        defaultValue={company.status}
        options={toOptions(COMPANY_STATUSES, COMPANY_STATUS_LABELS)}
      />
      <TextArea
        id="ec-notes"
        name="internalNotes"
        label="Internal notes"
        hint="Never shown to the customer."
        defaultValue={company.internalNotes}
        optional
        rows={4}
        maxLength={10000}
      />
    </ActionPanel>
  );
}

export function InviteUserForm({ companyId }: { companyId: string }) {
  const [state, action] = useActionState(
    inviteCustomerUserAction,
    idleActionState as InviteState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput id="iu-name" name="fullName" label="Name" optional maxLength={160} />
        <TextInput
          id="iu-email"
          name="email"
          type="email"
          label="Email"
          required
          maxLength={320}
        />
      </div>
      <div aria-live="polite" className="flex flex-col gap-2">
        {state.status === "error" ? (
          <p className="text-[0.8125rem] font-medium text-danger">{state.message}</p>
        ) : null}
        {state.status === "ok" ? (
          <>
            <p className="text-[0.8125rem] font-medium text-leaf-700">{state.message}</p>
            {state.inviteUrl ? (
              <p className="break-all rounded-md border border-line bg-muted px-3 py-2 font-mono text-[0.72rem] text-ink-2">
                {state.inviteUrl}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
      <div>
        <PendingSubmit pendingLabel="Inviting…">Invite portal user</PendingSubmit>
      </div>
    </form>
  );
}

export function NewProjectForm({ companyId }: { companyId: string }) {
  return (
    <ActionPanel action={createProjectAction} submitLabel="Create project">
      <input type="hidden" name="companyId" value={companyId} />
      <TextInput id="np-name" name="name" label="Project name" required maxLength={200} />
      <TextArea
        id="np-summary"
        name="summary"
        label="Customer-facing summary"
        hint="One paragraph the customer sees at the top of their project."
        optional
        rows={3}
        maxLength={1000}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <EnumSelect
          id="np-status"
          name="status"
          label="Status"
          defaultValue="planning"
          options={toOptions(PROJECT_STATUSES, PROJECT_STATUS_LABELS_INTERNAL)}
        />
        <TextInput id="np-start" name="startDate" type="date" label="Start" optional />
        <TextInput id="np-target" name="targetDate" type="date" label="Target" optional />
      </div>
    </ActionPanel>
  );
}
