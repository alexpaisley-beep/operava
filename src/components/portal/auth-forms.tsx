"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import { ErrorSummary, focusField } from "@/components/forms/form-parts";
import { SubmitButton } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { requestPasswordReset, setPassword, signIn } from "@/lib/portal/auth-actions";
import { initialFormState } from "@/lib/form-state";

/**
 * Attaches focus-on-error to any of the portal auth forms. The marketing forms
 * do the same thing; this is the same behaviour without their multi-step
 * machinery, which none of these three screens needs.
 */
function useErrorFocus(errors: Record<string, string>, formError?: string) {
  useEffect(() => {
    const first = Object.keys(errors)[0];
    if (!first) return;
    const id = window.setTimeout(() => focusField(first), 60);
    return () => window.clearTimeout(id);
    // `formError` is in the deps so a repeated failure re-announces itself.
  }, [errors, formError]);
}

/* -------------------------------------------------------------------------
   Sign in
------------------------------------------------------------------------- */

const LOGIN_LABELS = { email: "Email", password: "Password" };

export function LoginForm({ next, linkError }: { next: string; linkError?: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, initialFormState);
  useErrorFocus(state.errors, state.formError);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />

      {linkError ? (
        <p
          role="status"
          className="rounded-md border border-alert-500/40 bg-alert-50 p-4 text-[0.875rem] leading-relaxed text-alert-700"
        >
          That sign-in link has expired or was already used. Request a new one below.
        </p>
      ) : null}

      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={LOGIN_LABELS}
        onJump={focusField}
      />

      <TextInput
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        required
        maxLength={320}
        defaultValue={state.values.email ?? ""}
        error={state.errors.email}
        placeholder="you@yourcompany.com"
      />

      <TextInput
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        maxLength={200}
        error={state.errors.password}
      />

      <div className="flex flex-col gap-4 pt-1">
        <SubmitButton pending={pending} className="w-full">
          Sign in
        </SubmitButton>
        <Link
          href="/portal/forgot-password"
          className="text-center text-[0.875rem] text-navy-700 underline decoration-navy-200 underline-offset-4 transition-colors hover:decoration-navy-600"
        >
          Forgot your password?
        </Link>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Forgot password
------------------------------------------------------------------------- */

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialFormState);
  useErrorFocus(state.errors, state.formError);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={{ email: "Email" }}
        onJump={focusField}
      />

      <TextInput
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        required
        maxLength={320}
        defaultValue={state.values.email ?? ""}
        error={state.errors.email}
        placeholder="you@yourcompany.com"
      />

      <div className="flex flex-col gap-4 pt-1">
        <SubmitButton pending={pending} className="w-full">
          Email me a link
        </SubmitButton>
        <Link
          href="/portal/login"
          className="text-center text-[0.875rem] text-navy-700 underline decoration-navy-200 underline-offset-4 transition-colors hover:decoration-navy-600"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------
   Set password — first-time setup and reset use the same screen
------------------------------------------------------------------------- */

const PASSWORD_LABELS = { password: "Password", confirmPassword: "Confirm password" };

export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState(setPassword, initialFormState);
  useErrorFocus(state.errors, state.formError);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={PASSWORD_LABELS}
        onJump={focusField}
      />

      <TextInput
        id="password"
        name="password"
        type="password"
        label="New password"
        hint="At least 12 characters. A short phrase you will remember beats a scrambled word you will not."
        autoComplete="new-password"
        required
        minLength={12}
        maxLength={200}
        error={state.errors.password}
      />

      <TextInput
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Confirm password"
        autoComplete="new-password"
        required
        maxLength={200}
        error={state.errors.confirmPassword}
      />

      <div className="pt-1">
        <SubmitButton pending={pending} className="w-full">
          Save and continue
        </SubmitButton>
      </div>
    </form>
  );
}
