import type { Metadata } from "next";

import { AuthShell } from "@/components/portal/auth-shell";
import { SetPasswordForm } from "@/components/portal/auth-forms";
import { getViewer } from "@/lib/portal/session";

export const metadata: Metadata = {
  title: "Set Password",
  robots: { index: false, follow: false },
};

/**
 * Reached from an emailed link, which has already been exchanged for a session
 * by /portal/auth/confirm. Serves both first-time setup and a reset — the two
 * are the same operation, so they are the same screen.
 */
export default async function SetPasswordPage() {
  const viewer = await getViewer();
  const isNewAccount = Boolean(viewer && viewer.profile.full_name.trim().length === 0);

  return (
    <AuthShell
      eyebrow="Client portal"
      title={isNewAccount ? "Set your password." : "Choose a new password."}
      lead={
        isNewAccount
          ? "One step and you are in. Operava never sees this password and never sends one by email."
          : "Pick something you have not used elsewhere."
      }
    >
      <SetPasswordForm />
    </AuthShell>
  );
}
