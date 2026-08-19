import Link from "next/link";

import { Byline } from "@/components/portal/blocks";
import { CommentForm } from "@/components/portal/comment-form";
import { FileRow } from "@/components/portal/file-row";
import { List, Panel, PanelHeader, Stat, StatusPill } from "@/components/portal/ui";
import type { CommentWithAuthor, RequestWithAuthor } from "@/lib/portal/data";
import { formatDateTime, formatMoney } from "@/lib/portal/format";
import {
  bugSeverity,
  requestPriority,
  requestStatus,
  requestTypeLabel,
} from "@/lib/portal/vocabulary";
import type { ProjectFile } from "@/lib/supabase/types";

/**
 * The request thread. Shared between the client view and the admin view — the
 * only difference is `canPostInternal` and whether internal comments are in the
 * list at all, and the second of those is decided by RLS, not by this file.
 */
export function RequestDetail({
  request,
  comments,
  files,
  canPostInternal,
  backHref,
}: {
  request: RequestWithAuthor;
  comments: CommentWithAuthor[];
  files: ProjectFile[];
  canPostInternal: boolean;
  backHref: string;
}) {
  const status = requestStatus[request.status];
  const priority = requestPriority[request.priority];
  const severity = request.severity ? bugSeverity[request.severity] : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href={backHref}
          className="group inline-flex items-center gap-1.5 text-[0.875rem] text-ink-3 transition-colors hover:text-navy-700"
        >
          <span
            aria-hidden="true"
            className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
          >
            &larr;
          </span>
          All requests
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="t-eyebrow text-ink-3">{requestTypeLabel[request.type]}</p>
            <h1 className="t-h2 mt-3 text-ink">{request.title}</h1>
          </div>
          <StatusPill label={status.label} tone={status.tone} className="text-[0.8125rem]" />
        </div>
      </div>

      <Panel>
        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          <Stat label="Priority" className="bg-surface p-5">
            <StatusPill label={priority.label} tone={priority.tone} />
          </Stat>
          <Stat label="Severity" className="bg-surface p-5">
            {severity ? (
              <StatusPill label={severity.label} tone={severity.tone} />
            ) : (
              <span className="font-normal text-ink-3">—</span>
            )}
          </Stat>
          <Stat label="Raised" className="bg-surface p-5">
            <span className="font-normal text-[0.875rem]">
              {formatDateTime(request.created_at)}
            </span>
          </Stat>
          <Stat label="Last updated" className="bg-surface p-5">
            <span className="font-normal text-[0.875rem]">
              {formatDateTime(request.updated_at)}
            </span>
          </Stat>
        </dl>
      </Panel>

      {/* --------------------------------------------------- Original report */}
      <Panel>
        <PanelHeader title="The request" />
        <div className="px-5 py-5 lg:px-6">
          <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink">
            {request.description}
          </p>

          {request.expected_result ? (
            <div className="mt-5">
              <h3 className="t-eyebrow text-ink-3">What you expected</h3>
              <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-2">
                {request.expected_result}
              </p>
            </div>
          ) : null}

          {request.steps_to_reproduce ? (
            <div className="mt-5">
              <h3 className="t-eyebrow text-ink-3">Steps to reproduce</h3>
              <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-2">
                {request.steps_to_reproduce}
              </p>
            </div>
          ) : null}

          <div className="mt-5 border-t border-line pt-4">
            <Byline name={request.author?.full_name} at={request.created_at} />
          </div>
        </div>
      </Panel>

      {/* -------------------------------------------------- Change-order data
          Only rendered once Operava has actually priced it. An empty
          "Estimated cost: —" panel on every question would be noise. */}
      {request.estimated_cost !== null || request.estimated_timeline_impact ? (
        <Panel>
          <PanelHeader title="Estimate" />
          <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
            <Stat label="Estimated cost" className="bg-surface p-5">
              {request.estimated_cost !== null
                ? formatMoney(request.estimated_cost)
                : "Not priced yet"}
            </Stat>
            <Stat label="Timeline impact" className="bg-surface p-5">
              {request.estimated_timeline_impact || "None given"}
            </Stat>
          </dl>
          {request.approval_status ? (
            <p className="border-t border-line px-5 py-4 text-[0.875rem] text-ink-2 lg:px-6">
              Approval status:{" "}
              <span className="font-medium text-ink">{request.approval_status}</span>
            </p>
          ) : null}
        </Panel>
      ) : null}

      {files.length > 0 ? (
        <Panel>
          <PanelHeader title={`Attachments (${files.length})`} />
          <List>
            {files.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </List>
        </Panel>
      ) : null}

      {/* --------------------------------------------------------- The thread */}
      <Panel>
        <PanelHeader
          title={`Conversation${comments.length > 0 ? ` (${comments.length})` : ""}`}
        />

        {comments.length > 0 ? (
          <List>
            {comments.map((comment) => {
              const internal = comment.visibility === "internal";
              return (
                <div
                  key={comment.id}
                  className={`px-5 py-5 lg:px-6 ${internal ? "bg-muted" : ""}`}
                >
                  {internal ? (
                    <p className="t-mono-sm mb-2 inline-flex items-center rounded border border-line-2 bg-surface px-2 py-1 text-ink-3">
                      Internal — not visible to the client
                    </p>
                  ) : null}
                  <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink">
                    {comment.body}
                  </p>
                  <div className="mt-3">
                    <Byline
                      name={
                        comment.author?.role === "admin"
                          ? `${comment.author.full_name || "Operava"} (Operava)`
                          : comment.author?.full_name
                      }
                      at={comment.created_at}
                    />
                  </div>
                </div>
              );
            })}
          </List>
        ) : (
          <p className="px-5 py-5 text-[0.9375rem] text-ink-3 lg:px-6">
            No replies yet. We read every request — you will hear back here.
          </p>
        )}

        <div className="border-t border-line px-5 py-5 lg:px-6">
          <CommentForm requestId={request.id} canPostInternal={canPostInternal} />
        </div>
      </Panel>
    </div>
  );
}
