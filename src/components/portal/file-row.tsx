import { formatBytes, formatRelative } from "@/lib/portal/format";
import type { ProjectFile } from "@/lib/supabase/types";

/**
 * One file in a list.
 *
 * The href goes to our own download route, never to Storage. Rendering a signed
 * URL directly into the page would bake a working link into the HTML, which
 * then survives in caches, screenshots and browser history long after the
 * viewer's session ends.
 */
export function FileRow({
  file,
  uploaderName,
}: {
  file: Pick<ProjectFile, "id" | "name" | "size_bytes" | "created_at" | "mime_type">;
  uploaderName?: string | null;
}) {
  return (
    <a
      href={`/portal/files/download/${file.id}`}
      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper lg:px-6"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-line-2 bg-paper text-ink-3"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
          <path
            d="M9 1.5H4.5A1.5 1.5 0 0 0 3 3v10a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V5.5L9 1.5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M9 1.5V5.5H13"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-medium text-ink group-hover:text-navy-800">
          {file.name}
        </span>
        <span className="t-mono-sm mt-1 block text-ink-3">
          {formatBytes(file.size_bytes)} · {formatRelative(file.created_at)}
          {uploaderName ? ` · ${uploaderName}` : ""}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="shrink-0 text-ink-3 transition-transform duration-200 ease-out group-hover:translate-y-0.5"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
          <path
            d="M8 2.5v8m0 0L4.5 7M8 10.5 11.5 7M2.5 13.5h11"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </a>
  );
}
