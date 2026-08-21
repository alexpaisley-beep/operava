"use client";

import { useActionState } from "react";

import { PendingSubmit } from "@/components/portal/pending-submit";
import { TextInput } from "@/components/ui/field";
import { idleActionState } from "@/lib/portal/action-state";
import { setPassword } from "@/lib/portal/auth-actions";

export function SetPasswordForm() {
  const [state, action] = useActionState(setPassword, idleActionState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <TextInput
        id="password"
        name="password"
        type="password"
        label="New password"
        hint="At least 10 characters."
        autoComplete="new-password"
        required
        minLength={10}
      />
      <TextInput
        id="confirm"
        name="confirm"
        type="password"
        label="Repeat it"
        autoComplete="new-password"
        required
      />
      <div aria-live="polite">
        {state.status === "error" ? (
          <p className="text-[0.8125rem] font-medium text-danger">{state.message}</p>
        ) : null}
      </div>
      <PendingSubmit pendingLabel="Saving…">Save password and continue</PendingSubmit>
    </form>
  );
}
