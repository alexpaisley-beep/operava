"use client";

import { useActionState, useState } from "react";

import { EnumSelect, toOptions } from "@/components/portal/enum-select";
import { PendingSubmit } from "@/components/portal/pending-submit";
import { TextArea, TextInput } from "@/components/ui/field";
import { idleActionState } from "@/lib/portal/action-state";
import { REQUEST_TYPE_LABELS, REQUEST_TYPES } from "@/lib/portal/types";

import {
  acknowledgeClientRequest,
  completeClientRequest,
  submitCustomerRequest,
} from "../../actions";

/** Acknowledge / complete buttons on an open action item. */
export function ActionItemControls({
  clientRequestId,
  status,
}: {
  clientRequestId: string;
  status: "open" | "acknowledged";
}) {
  const [ackState, ackAction] = useActionState(acknowledgeClientRequest, idleActionState);
  const [doneState, doneAction] = useActionState(completeClientRequest, idleActionState);
  const error = [ackState, doneState].find((s) => s.status === "error");

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap gap-2">
        {status === "open" ? (
          <form action={ackAction}>
            <input type="hidden" name="clientRequestId" value={clientRequestId} />
            <PendingSubmit variant="secondary" pendingLabel="Saving…">
              We&rsquo;re on it
            </PendingSubmit>
          </form>
        ) : null}
        <form action={doneAction}>
          <input type="hidden" name="clientRequestId" value={clientRequestId} />
          <PendingSubmit pendingLabel="Saving…">Mark as done</PendingSubmit>
        </form>
      </div>
      {error ? (
        <p className="text-[0.8125rem] font-medium text-danger" aria-live="polite">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

const REQUEST_TYPE_OPTIONS = toOptions(REQUEST_TYPES, REQUEST_TYPE_LABELS);

/** Collapsible "ask Operava for something" form. */
export function NewRequestForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(submitCustomerRequest, idleActionState);

  if (!open && state.status !== "ok") {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-line-2 bg-surface px-4 py-2.5 text-[0.875rem] font-medium text-navy-800 transition-colors hover:border-navy-600 hover:bg-navy-50"
      >
        Ask us for something
      </button>
    );
  }

  if (state.status === "ok") {
    return (
      <p className="rounded-md border border-leaf-500/30 bg-leaf-50 px-3.5 py-2.5 text-[0.85rem] font-medium text-leaf-700">
        {state.message}
      </p>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-lg border border-line bg-muted/60 p-4 sm:p-5"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <EnumSelect
        id="request-type"
        name="type"
        label="What kind of request is this?"
        options={REQUEST_TYPE_OPTIONS}
        required
      />
      <TextInput
        id="request-title"
        name="title"
        label="In one line"
        placeholder="e.g. Invoice totals look wrong on the weekly report"
        required
        maxLength={200}
      />
      <TextArea
        id="request-description"
        name="description"
        label="Details"
        hint="What happened, where, and what you expected."
        rows={4}
        maxLength={10000}
      />
      {state.status === "error" ? (
        <p className="text-[0.8125rem] font-medium text-danger" aria-live="polite">
          {state.message}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <PendingSubmit pendingLabel="Sending…">Send to Operava</PendingSubmit>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[0.8125rem] font-medium text-ink-3 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
