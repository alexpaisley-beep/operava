import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { RequestBadge } from "@/components/portal/badges";
import { formatDateTime, formatMoney, Panel, PanelHeader } from "@/components/portal/bits";
import { customerRequestDetail } from "@/lib/portal/reads/customer";
import { createUserClient } from "@/lib/portal/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/portal/types";
import { getViewer } from "@/lib/portal/viewer";

import { CommentForm } from "./comment-form";

export const metadata: Metadata = { title: "Request — Operava" };

export default async function CustomerRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");

  const { requestId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) notFound();

  const db = await createUserClient();
  const detail = await customerRequestDetail(db, requestId);
  if (!detail) notFound();

  const { request, projectName, comments } = detail;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <nav aria-label="Breadcrumb">
        <Link
          href={`/portal/projects/${request.projectId}`}
          className="text-[0.8125rem] font-medium text-ink-3 transition-colors hover:text-navy-700"
        >
          ← {projectName || "Back to project"}
        </Link>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="t-h3 text-ink">{request.title}</h1>
          <RequestBadge status={request.status} />
        </div>
        <p className="text-[0.8125rem] text-ink-3">
          {REQUEST_TYPE_LABELS[request.type]} · sent {formatDateTime(request.createdAt)}
        </p>
        {request.description ? (
          <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink-2">
            {request.description}
          </p>
        ) : null}
        {request.estimatedCost !== null || request.estimatedTimelineImpact ? (
          <div className="rounded-lg border border-line bg-muted/70 px-4 py-3.5 text-[0.875rem] text-ink-2">
            <p className="t-eyebrow text-ink-3">Operava&rsquo;s estimate</p>
            <p className="mt-1.5">
              {request.estimatedCost !== null
                ? `Cost: ${formatMoney(request.estimatedCost, "USD")}`
                : null}
              {request.estimatedCost !== null && request.estimatedTimelineImpact ? " · " : null}
              {request.estimatedTimelineImpact
                ? `Timeline: ${request.estimatedTimelineImpact}`
                : null}
            </p>
          </div>
        ) : null}
      </header>

      <Panel as="section" aria-label="Conversation">
        <PanelHeader title="Conversation" />
        {comments.length === 0 ? (
          <p className="px-5 py-5 text-[0.875rem] text-ink-3 sm:px-6">
            No replies yet — we&rsquo;ll respond here.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {comments.map((comment) => (
              <li key={comment.id} className="px-5 py-4 sm:px-6">
                <p className="text-[0.78rem] text-ink-3">
                  <span className="font-semibold text-ink-2">
                    {comment.authorName || "Operava"}
                  </span>{" "}
                  · {formatDateTime(comment.createdAt)}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-ink-2">
                  {comment.body}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <CommentForm requestId={request.id} />
        </div>
      </Panel>
    </div>
  );
}
