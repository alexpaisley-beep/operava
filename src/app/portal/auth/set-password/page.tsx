import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { createUserClient } from "@/lib/portal/supabase/server";

import { SetPasswordForm } from "./set-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set your password — Operava",
  robots: { index: false },
};

export default async function SetPasswordPage() {
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login?error=link");

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-14">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 inline-block">
          <Logo markClassName="h-7 w-7" wordClassName="text-[1.15rem]" />
        </Link>
        <p className="t-eyebrow text-ink-3">Client portal</p>
        <h1 className="t-h3 mt-3 text-ink">Choose a password</h1>
        <p className="mt-2 text-[0.9rem] text-ink-3">
          You&rsquo;re signed in as <strong className="text-ink">{user.email}</strong>. Set a
          password so you can sign in directly next time.
        </p>
        <div className="mt-8">
          <SetPasswordForm />
        </div>
        <p className="mt-6 text-[0.8125rem] text-ink-3">
          <Link href="/portal" className="underline decoration-line-2 hover:text-navy-700">
            Skip for now
          </Link>{" "}
          — you can always request a sign-in link by email.
        </p>
      </div>
    </div>
  );
}
