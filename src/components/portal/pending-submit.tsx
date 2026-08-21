"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

const styles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-md bg-navy-700 px-4 py-2.5 text-[0.875rem] font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-md border border-line-2 bg-surface px-4 py-2.5 text-[0.875rem] font-medium text-navy-800 transition-colors hover:border-navy-600 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-60",
  quiet:
    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium text-navy-700 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-md border border-danger-line bg-surface px-4 py-2.5 text-[0.875rem] font-medium text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-60",
} as const;

/** Submit button that reflects the surrounding form's pending state. */
export function PendingSubmit({
  children,
  variant = "primary",
  pendingLabel = "Working…",
  className = "",
}: {
  children: ReactNode;
  variant?: keyof typeof styles;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${styles[variant]} ${className}`}>
      {pending ? pendingLabel : children}
    </button>
  );
}
