"use client";

import { useActionState, useState } from "react";

import { PendingSubmit } from "@/components/portal/pending-submit";
import { TextInput } from "@/components/ui/field";
import { idleActionState } from "@/lib/portal/action-state";
import { requestMagicLink, signInWithPassword } from "@/lib/portal/auth-actions";

export function LoginForm() {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [passwordState, passwordAction] = useActionState(signInWithPassword, idleActionState);
  const [linkState, linkAction] = useActionState(requestMagicLink, idleActionState);

  const state = mode === "password" ? passwordState : linkState;

  return (
    <div className="flex flex-col gap-5">
      <form
        action={mode === "password" ? passwordAction : linkAction}
        className="flex flex-col gap-4"
      >
        <TextInput
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
        />
        {mode === "password" ? (
          <TextInput
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            required
          />
        ) : (
          <p className="text-[0.85rem] leading-relaxed text-ink-3">
            We&rsquo;ll email you a single-use sign-in link.
          </p>
        )}
        <div aria-live="polite">
          {state.status === "error" ? (
            <p className="text-[0.8125rem] font-medium text-danger">{state.message}</p>
          ) : null}
          {state.status === "ok" && mode === "link" ? (
            <p className="text-[0.8125rem] font-medium text-leaf-700">{state.message}</p>
          ) : null}
        </div>
        <PendingSubmit pendingLabel={mode === "password" ? "Signing in…" : "Sending…"}>
          {mode === "password" ? "Sign in" : "Email me a sign-in link"}
        </PendingSubmit>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "password" ? "link" : "password")}
        className="self-start text-[0.8125rem] font-medium text-navy-700 underline decoration-line-2 underline-offset-2 hover:text-navy-800"
      >
        {mode === "password" ? "Email me a sign-in link instead" : "Use a password instead"}
      </button>
    </div>
  );
}
