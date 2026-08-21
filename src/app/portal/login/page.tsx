import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { supabaseConfigured } from "@/lib/portal/env";
import { getViewer } from "@/lib/portal/viewer";

import { LoginForm } from "./login-form";

// Session-aware: signed-in visitors are bounced to their dashboard.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client portal — Operava",
  description: "Sign in to see your Operava project.",
  robots: { index: false },
};

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (supabaseConfigured()) {
    const viewer = await getViewer();
    if (viewer) redirect(viewer.role === "admin" ? "/admin" : "/portal");
  }
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen bg-paper lg:grid-cols-[1fr_minmax(24rem,32rem)]">
      <div className="on-dark relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 lg:flex">
        <div aria-hidden="true" className="grid-lines absolute inset-0 opacity-40" />
        <Link href="/" className="relative text-white">
          <Logo markClassName="h-8 w-8" wordClassName="text-[1.3rem] text-white" />
        </Link>
        <div className="relative max-w-md">
          <p className="t-eyebrow text-navy-200">Client portal</p>
          <h1 className="t-h2 mt-4 text-white">
            Your project, its status, and what happens next.
          </h1>
          <p className="t-lead mt-4 text-navy-100">
            Milestones, updates, deliverables and anything we need from you — one place, always
            current.
          </p>
        </div>
        <p className="relative text-[0.78rem] text-navy-200">Operava LLC</p>
      </div>

      <div className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Logo markClassName="h-7 w-7" wordClassName="text-[1.15rem]" />
          </Link>
          <p className="t-eyebrow text-ink-3">Client portal</p>
          <h2 className="t-h3 mt-3 text-ink">Sign in</h2>
          <p className="mt-2 text-[0.9rem] text-ink-3">
            Access is by invitation. If you&rsquo;re working with Operava and don&rsquo;t have a
            login yet, ask us for one.
          </p>
          {error === "link" ? (
            <p className="mt-4 rounded-md border border-danger-line bg-danger-bg px-3.5 py-2.5 text-[0.85rem] font-medium text-danger">
              That sign-in link is invalid or has expired. Sign in below or ask for a fresh
              link.
            </p>
          ) : null}
          {!supabaseConfigured() ? (
            <p className="mt-6 rounded-md border border-line bg-muted px-3.5 py-2.5 text-[0.85rem] text-ink-2">
              The portal is not configured on this deployment yet.
            </p>
          ) : (
            <div className="mt-8">
              <LoginForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
