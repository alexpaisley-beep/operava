"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { ErrorSummary, focusField } from "@/components/forms/form-parts";
import { SubmitButton } from "@/components/ui/button";
import { Select, TextArea, TextInput } from "@/components/ui/field";
import { initialFormState } from "@/lib/form-state";
import { createRequest } from "@/lib/portal/request-actions";
import { requestTypes } from "@/lib/portal/vocabulary";
import { formatBytes } from "@/lib/portal/format";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RequestType } from "@/lib/supabase/types";

const LABELS = {
  title: "Summary",
  description: "Details",
  expectedResult: "What you expected",
  stepsToReproduce: "Steps to reproduce",
  priority: "Priority",
  severity: "Severity",
};

const MAX_FILES = 5;
const MAX_BYTES = 25 * 1024 * 1024;

type Attachment = { path: string; name: string; size: number; mime: string };

/**
 * Raise a request.
 *
 * One form, five types. The type picker changes which fields appear, because a
 * question does not need steps to reproduce and asking for them anyway is how a
 * simple form turns into a ticket system nobody fills in.
 */
export function NewRequestForm({
  projectId,
  defaultType = "support",
}: {
  projectId: string;
  defaultType?: RequestType;
}) {
  const [state, formAction, pending] = useActionState(createRequest, initialFormState);
  const [type, setType] = useState<RequestType>(defaultType);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const first = Object.keys(state.errors)[0];
    if (!first) return;
    const id = window.setTimeout(() => focusField(first), 60);
    return () => window.clearTimeout(id);
  }, [state]);

  /**
   * Uploads go straight from the browser to Supabase Storage.
   *
   * Not through the server action: those carry a body limit far below the 25 MiB
   * a screenshot-heavy bug report can reach, and streaming a file through the
   * server to put it somewhere the browser can already reach is wasted work.
   * The object key is prefixed with the project id, which is exactly what the
   * storage RLS policy checks.
   */
  async function onPickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length === 0) return;

    setUploadError("");
    if (files.length + picked.length > MAX_FILES) {
      setUploadError(`Up to ${MAX_FILES} files per request.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const added: Attachment[] = [];

    for (const file of picked) {
      if (file.size > MAX_BYTES) {
        setUploadError(`${file.name} is over 25 MB.`);
        continue;
      }
      // Random prefix, and the original name is never used as the key — a
      // filename is attacker-controlled text and does not belong in a path.
      const safe = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
      const path = `${projectId}/${crypto.randomUUID()}-${safe}`;

      const { error } = await supabase.storage
        .from("project-files")
        .upload(path, file, { contentType: file.type || "application/octet-stream" });

      if (error) {
        setUploadError(error.message || `${file.name} could not be uploaded.`);
        continue;
      }
      added.push({ path, name: file.name.slice(0, 200), size: file.size, mime: file.type });
    }

    setFiles((current) => [...current, ...added]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isBug = type === "bug";

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="type" value={type} />
      {files.map((file) => (
        <input
          key={file.path}
          type="hidden"
          name="uploadedFiles"
          value={`${file.path}|${file.name}|${file.size}|${file.mime}`}
        />
      ))}

      <ErrorSummary
        errors={state.errors}
        formError={state.formError}
        labels={LABELS}
        onJump={focusField}
      />

      {/* ------------------------------------------------------------ Type */}
      <fieldset>
        <legend className="text-[0.875rem] font-medium text-ink">What is this about?</legend>
        <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {requestTypes.map((option) => {
            const active = option.value === type;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer flex-col gap-1 p-4 transition-colors ${
                  active ? "bg-navy-50" : "bg-surface hover:bg-paper"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="typeChoice"
                    value={option.value}
                    checked={active}
                    onChange={() => setType(option.value)}
                    className="h-4 w-4 accent-navy-700"
                  />
                  <span
                    className={`text-[0.9375rem] font-medium ${active ? "text-navy-800" : "text-ink"}`}
                  >
                    {option.label}
                  </span>
                </span>
                <span className="pl-[1.625rem] text-[0.8125rem] leading-snug text-ink-3">
                  {option.blurb}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <TextInput
        id="title"
        name="title"
        label={LABELS.title}
        hint="One line. Enough that we know which thing you mean."
        required
        maxLength={200}
        defaultValue={state.values.title ?? ""}
        error={state.errors.title}
        placeholder={
          isBug
            ? "Job status not updating on the crew view"
            : "Add a second approver to change orders"
        }
      />

      <TextArea
        id="description"
        name="description"
        label={isBug ? "What happened?" : LABELS.description}
        hint={
          isBug
            ? "What you were doing and what the system did."
            : "As much or as little as you like. Specific beats polished."
        }
        required
        rows={5}
        maxLength={5000}
        defaultValue={state.values.description ?? ""}
        error={state.errors.description}
      />

      {/* -------------------------------------------------- Bug-only fields */}
      {isBug ? (
        <>
          <TextArea
            id="expectedResult"
            name="expectedResult"
            label={LABELS.expectedResult}
            optional
            rows={3}
            maxLength={2000}
            defaultValue={state.values.expectedResult ?? ""}
            error={state.errors.expectedResult}
          />
          <TextArea
            id="stepsToReproduce"
            name="stepsToReproduce"
            label={LABELS.stepsToReproduce}
            optional
            hint="If you can make it happen again, tell us how. If not, say so — that is useful too."
            rows={3}
            maxLength={2000}
            defaultValue={state.values.stepsToReproduce ?? ""}
            error={state.errors.stepsToReproduce}
          />
        </>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          id="priority"
          name="priority"
          label={LABELS.priority}
          options={["low", "normal", "high", "urgent"]}
          defaultValue="normal"
          placeholder="Normal"
          error={state.errors.priority}
        />
        {isBug ? (
          <Select
            id="severity"
            name="severity"
            label={LABELS.severity}
            hint="How much is it costing you right now?"
            options={["minor", "moderate", "major", "critical"]}
            defaultValue="moderate"
            placeholder="Moderate"
            error={state.errors.severity}
          />
        ) : null}
      </div>

      {/* ----------------------------------------------------- Attachments */}
      <div className="flex flex-col gap-2">
        <span className="text-[0.875rem] font-medium text-ink">
          Screenshots or files <span className="font-normal text-ink-3">(optional)</span>
        </span>
        <p className="text-[0.8125rem] leading-snug text-ink-3">
          Up to {MAX_FILES} files, 25 MB each. A screenshot usually saves a round of questions.
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onPickFiles}
          disabled={uploading}
          accept="image/*,application/pdf,.csv,.txt,.doc,.docx,.xls,.xlsx,.zip"
          className="mt-1 block w-full rounded-md border border-line-2 bg-surface px-3.5 py-3 text-[0.875rem] text-ink-2 file:mr-3 file:rounded file:border-0 file:bg-navy-50 file:px-3 file:py-1.5 file:text-[0.8125rem] file:font-medium file:text-navy-800 hover:border-navy-200"
        />

        {uploading ? <p className="text-[0.8125rem] text-ink-3">Uploading…</p> : null}
        {uploadError ? (
          <p className="text-[0.8125rem] font-medium text-danger">{uploadError}</p>
        ) : null}

        {files.length > 0 ? (
          <ul className="mt-1 flex flex-col divide-y divide-line border-y border-line">
            {files.map((file) => (
              <li key={file.path} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[0.875rem] text-ink">
                  {file.name}
                </span>
                <span className="t-mono-sm shrink-0 text-ink-3">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={() => setFiles((c) => c.filter((f) => f.path !== file.path))}
                  className="shrink-0 text-[0.8125rem] text-ink-3 underline underline-offset-4 hover:text-danger"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="border-t border-line pt-6">
        <SubmitButton pending={pending || uploading}>Send to Operava</SubmitButton>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-3">
          You will get a thread you can follow and reply on. No email chasing required.
        </p>
      </div>
    </form>
  );
}
