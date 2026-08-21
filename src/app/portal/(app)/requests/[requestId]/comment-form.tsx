"use client";

import { useActionState } from "react";

import { PendingSubmit } from "@/components/portal/pending-submit";
import { TextArea } from "@/components/ui/field";
import { idleActionState } from "@/lib/portal/action-state";

import { addCustomerRequestComment } from "../../actions";

export function CommentForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState(addCustomerRequestComment, idleActionState);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <TextArea
        id="comment-body"
        name="body"
        label="Add a reply"
        rows={3}
        maxLength={10000}
        required
      />
      <div aria-live="polite">
        {state.status === "error" ? (
          <p className="text-[0.8125rem] font-medium text-danger">{state.message}</p>
        ) : null}
      </div>
      <div>
        <PendingSubmit variant="secondary" pendingLabel="Sending…">
          Reply
        </PendingSubmit>
      </div>
    </form>
  );
}
