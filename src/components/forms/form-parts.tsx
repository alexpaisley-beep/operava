"use client";

import { useEffect, useRef } from "react";

import type { FieldErrors } from "@/lib/validation";

/**
 * Error summary. Focused on appearance so a keyboard or screen-reader user is
 * told what went wrong instead of having to hunt for red text.
 */
export function ErrorSummary({
  errors,
  formError,
  labels,
  onJump,
}: {
  errors: FieldErrors;
  formError?: string;
  labels: Record<string, string>;
  onJump: (field: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const keys = Object.keys(errors);

  useEffect(() => {
    if (formError || keys.length > 0) ref.current?.focus();
    // Re-announce on every failed submission.
  }, [formError, keys.length]);

  if (!formError && keys.length === 0) return null;

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-md border border-danger-line bg-danger-bg p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
    >
      <p className="text-[0.9375rem] font-semibold text-danger">
        {formError ?? "Please check the highlighted fields."}
      </p>
      {keys.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {keys.map((field) => (
            <li key={field}>
              <button
                type="button"
                onClick={() => onJump(field)}
                className="text-left text-[0.875rem] text-danger underline decoration-danger/40 underline-offset-4 hover:decoration-danger"
              >
                {labels[field] ?? field}: {errors[field]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Moves keyboard focus to a field by id, falling back to its name. */
export function focusField(field: string) {
  const target =
    document.getElementById(field) ?? document.querySelector<HTMLElement>(`[name="${field}"]`);
  if (!target) return;
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  target.focus({ preventScroll: true });
}

/**
 * Records when the form was first rendered on the client. Submissions that
 * arrive impossibly fast after that are treated as automated.
 */
export function DwellTimer({ name = "form_started_at" }: { name?: string }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.value = String(Date.now());
  }, []);

  return <input ref={ref} type="hidden" name={name} defaultValue="" />;
}
