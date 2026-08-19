import Link from "next/link";

import { List, RowLink, StatusPill } from "@/components/portal/ui";
import { formatDate, formatRelative, initials } from "@/lib/portal/format";
import {
  milestoneStatus,
  requestPriority,
  requestStatus,
  requestTypeLabel,
  toneDot,
  waitingOn,
} from "@/lib/portal/vocabulary";
import type {
  ActivityEntry,
  Milestone,
  ProjectBlocker,
  RequestPriority,
  RequestStatus,
} from "@/lib/supabase/types";
import type { RequestWithAuthor, UpdateWithAuthor } from "@/lib/portal/data";

/* -------------------------------------------------------------------------
   Authorship
------------------------------------------------------------------------- */

export function Byline({ name, at }: { name: string | null | undefined; at: string }) {
  const display = name?.trim() || "Operava";
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[0.625rem] font-semibold text-navy-800"
      >
        {initials(display, "OP")}
      </span>
      <span className="text-[0.8125rem] text-ink-3">
        {display} &middot; <time dateTime={at}>{formatRelative(at)}</time>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Updates
------------------------------------------------------------------------- */

export function UpdateItem({ update }: { update: UpdateWithAuthor }) {
  return (
    <article className="px-5 py-5 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="text-[1rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
          {update.title}
        </h3>
        {update.category ? (
          <span className="t-mono-sm shrink-0 rounded border border-line-2 px-2 py-1 text-ink-3">
            {update.category}
          </span>
        ) : null}
      </div>

      {update.body ? (
        // `whitespace-pre-line` so paragraph breaks an admin typed survive
        // without needing a markdown renderer nobody asked for.
        <p className="mt-2.5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-2">
          {update.body}
        </p>
      ) : null}

      <div className="mt-4">
        <Byline name={update.author?.full_name} at={update.created_at} />
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------
   Milestones
------------------------------------------------------------------------- */

/**
 * Timeline. A vertical rail with a node per milestone — legible at 320px,
 * which a Gantt chart is not, and this is a handful of dated steps rather than
 * a dependency graph.
 */
export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="relative flex flex-col">
      <span
        aria-hidden="true"
        className="absolute bottom-3 left-[5px] top-3 w-px bg-line"
        // Purely decorative rail behind the nodes.
      />
      {milestones.map((milestone) => {
        const meta = milestoneStatus[milestone.status];
        const done = milestone.status === "complete";
        return (
          <li key={milestone.id} className="relative flex gap-4 py-4 pl-6">
            <span
              aria-hidden="true"
              className={`absolute left-0 top-[1.35rem] h-[11px] w-[11px] rounded-full border-2 border-surface ring-1 ${
                done ? "bg-leaf-500 ring-leaf-500/40" : `${toneDot[meta.tone]} ring-line-2`
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <h3
                  className={`text-[0.9375rem] font-semibold leading-snug tracking-[-0.015em] ${
                    done ? "text-ink-2" : "text-ink"
                  }`}
                >
                  {milestone.name}
                </h3>
                <StatusPill label={meta.label} tone={meta.tone} />
              </div>

              {milestone.description ? (
                <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">
                  {milestone.description}
                </p>
              ) : null}

              <p className="t-mono-sm mt-2 text-ink-3">
                {milestone.completed_at
                  ? `Completed ${formatDate(milestone.completed_at)}`
                  : milestone.due_date
                    ? `Due ${formatDate(milestone.due_date)}`
                    : "No date set"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------------
   Blockers
------------------------------------------------------------------------- */

export function BlockerItem({ blocker }: { blocker: ProjectBlocker }) {
  const meta = waitingOn[blocker.waiting_on];
  return (
    <div className="px-5 py-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
          {blocker.title}
        </h3>
        <StatusPill
          label={blocker.status === "resolved" ? "Resolved" : meta.label}
          tone={blocker.status === "resolved" ? "positive" : meta.tone}
        />
      </div>
      {blocker.description ? (
        <p className="mt-2 whitespace-pre-line text-[0.875rem] leading-relaxed text-ink-2">
          {blocker.description}
        </p>
      ) : null}
      <p className="t-mono-sm mt-2 text-ink-3">
        Raised {formatRelative(blocker.created_at)}
        {blocker.resolved_at ? ` · resolved ${formatRelative(blocker.resolved_at)}` : ""}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Requests
------------------------------------------------------------------------- */

export function RequestRow({
  request,
  href,
  projectName,
}: {
  request: {
    id: string;
    type: keyof typeof requestTypeLabel;
    title: string;
    status: RequestStatus;
    priority: RequestPriority;
    created_at: string;
    updated_at: string;
  } & Partial<Pick<RequestWithAuthor, "author">>;
  href: string;
  projectName?: string;
}) {
  const status = requestStatus[request.status];
  const priority = requestPriority[request.priority];

  return (
    <RowLink href={href}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="t-mono-sm text-ink-3">{requestTypeLabel[request.type]}</span>
        {projectName ? (
          <>
            <span aria-hidden="true" className="text-ink-3">
              &middot;
            </span>
            <span className="t-mono-sm truncate text-ink-3">{projectName}</span>
          </>
        ) : null}
      </div>

      <h3 className="mt-1.5 text-[0.9375rem] font-semibold leading-snug tracking-[-0.015em] text-ink">
        {request.title}
      </h3>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <StatusPill label={status.label} tone={status.tone} />
        {request.priority !== "normal" && request.priority !== "low" ? (
          <StatusPill label={priority.label} tone={priority.tone} />
        ) : null}
        <span className="t-mono-sm text-ink-3">
          Updated {formatRelative(request.updated_at)}
        </span>
      </div>
    </RowLink>
  );
}

/* -------------------------------------------------------------------------
   Activity
------------------------------------------------------------------------- */

export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  return (
    <List>
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-3 px-5 py-3.5 lg:px-6">
          <span
            aria-hidden="true"
            className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-line-2"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[0.875rem] leading-snug text-ink-2">{entry.description}</p>
            <p className="t-mono-sm mt-1 text-ink-3">
              <time dateTime={entry.created_at}>{formatRelative(entry.created_at)}</time>
            </p>
          </div>
        </div>
      ))}
    </List>
  );
}

/* -------------------------------------------------------------------------
   Section link
------------------------------------------------------------------------- */

export function SeeAll({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-[0.875rem] text-navy-700 transition-colors hover:text-navy-800"
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
      >
        &rarr;
      </span>
    </Link>
  );
}
