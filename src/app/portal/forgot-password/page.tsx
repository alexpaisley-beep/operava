import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/portal/auth-shell";
import { ForgotPasswordForm } from "@/components/portal/auth-forms";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;

  // Deliberately the same screen whether or not the address exists. The
  // confirmation says what we DID, not what we found.
  if (params.sent === "1") {
    return (
      <AuthShell
        eyebrow="Client portal"
        title="Check your email."
        lead="If that address has a portal account, a link to set a new password is on its way. It expires in an hour."
        footer={
          <p>
            Nothing arrived? Check spam, then{" "}
            <Link
              href="/portal/forgot-password"
              className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
            >
              try again
            </Link>
            .
          </p>
        }
      >
        <p className="text-[0.9375rem] leading-relaxed text-ink-2">
          Open the link on this device if you can. Once you have set a password you will land
          straight in your project.
        </p>
        <div className="mt-6 border-t border-line pt-5">
          <Link
            href="/portal/login"
            className="text-[0.875rem] text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-600"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Client portal"
      title="Reset your password."
      lead="Enter the email address Operava set your account up with and we will send a link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
