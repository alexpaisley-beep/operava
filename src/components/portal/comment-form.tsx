"use client";

import { useActionState, useEffect, useRef } from "react";

import { ErrorSummary, focusField } from "@/components/forms/form-parts";
import { SubmitButton } from "@/components/ui/button";
import { TextArea } from "@/components/ui/field";
import { initialFormState } from "@/lib/form-state";
import { addComment } from "@/lib/portal/request-actions";

/**
 * Reply box on a request thread.
 *
 * Admins get a visibility toggle; clients do not — and the difference is
 * enforced by the RLS insert policy, not by this component being careful.
 */
export function CommentForm({
  requestId,
  canPostInternal,
}: {
  requestId: string;
  canPostInternal: boolean;
}) {
  const [state, formAction, pending] = useActionState(addComment, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box once a reply lands, so the next one starts empty rather than
  // tempting a double post.
  const posted = !pending && Object.keys(state.errors).length === 0 && !state.formError;
  useEffect(() => {
    if (posted && state.values.body === undefined) formRef.current?.reset();
  }, [posted, state.values.body]);

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="requestId" value={requestId} />

      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ body: "Reply" }}
        onJump={focusField}
      />

      <TextArea
        id="body"
        name="body"
        label="Add a reply"
        rows={4}
        required
        maxLength={10000}
        defaultValue={state.values.body ?? ""}
        error={state.errors.body}
        placeholder="Anything that helps — a screenshot description, when it happens, who it affects."
      />

      {canPostInternal ? (
        <label className="flex items-start gap-3 rounded-md border border-line-2 bg-muted p-3.5">
          <input
            type="checkbox"
            name="visibility"
            value="internal"
            className="mt-0.5 h-4 w-4 accent-navy-700"
          />
          <span className="text-[0.875rem] leading-snug text-ink-2">
            <span className="font-medium text-ink">Internal note</span> — visible to Operava
            staff only. The client will never see this.
          </span>
        </label>
      ) : null}

      <div>
        <SubmitButton pending={pending}>Post reply</SubmitButton>
      </div>
    </form>
  );
}
