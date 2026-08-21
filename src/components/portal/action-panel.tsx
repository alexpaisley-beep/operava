"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";

import { idleActionState, type ActionState } from "@/lib/portal/action-state";

import { PendingSubmit } from "./pending-submit";

/**
 * Generic mutation form: server-rendered fields as children, one submit, and
 * inline success/error feedback from the action's ActionState.
 */
export function ActionPanel({
  action,
  children,
  submitLabel,
  variant = "primary",
  className = "",
  row = false,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children?: ReactNode;
  submitLabel: string;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  className?: string;
  /** Lay fields and button on one wrapping row (for quick actions). */
  row?: boolean;
}) {
  const [state, formAction] = useActionState(action, idleActionState);

  return (
    <form action={formAction} className={className}>
      <div className={row ? "flex flex-wrap items-end gap-3" : "flex flex-col gap-4"}>
        {children}
        <div className={row ? "" : "pt-1"}>
          <PendingSubmit variant={variant}>{submitLabel}</PendingSubmit>
        </div>
      </div>
      <div aria-live="polite">
        {state.status === "error" ? (
          <p className="mt-2 text-[0.8125rem] font-medium text-danger">{state.message}</p>
        ) : null}
        {state.status === "ok" ? (
          <p className="mt-2 text-[0.8125rem] font-medium text-leaf-700">{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
