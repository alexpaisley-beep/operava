"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { DwellTimer, ErrorSummary, focusField } from "@/components/forms/form-parts";
import { SubmitButton } from "@/components/ui/button";
import { Honeypot, RadioCards, Select, TextArea, TextInput } from "@/components/ui/field";
import { track } from "@/lib/analytics";
import { submitDiscoveryCall } from "@/lib/actions";
import { initialFormState } from "@/lib/form-state";
import {
  BUDGET_RANGES,
  COMPANY_SIZES,
  CONTACT_METHODS,
  CREW_COUNTS,
  TIMELINES,
} from "@/lib/leads";
import { site } from "@/lib/site";

const STEPS = [
  {
    title: "Your company",
    caption: "So we know who we are talking to and how to reach you.",
    fields: [
      "name",
      "business",
      "email",
      "phone",
      "website",
      "companySize",
      "crewCount",
      "preferredContact",
    ],
  },
  {
    title: "How you operate today",
    caption: "The useful part. Be specific — vague answers make for a vague call.",
    fields: ["currentSoftware", "painPoints", "desiredSystem"],
  },
  {
    title: "Scope and timing",
    caption: "Optional, but it helps us come into the call with a realistic starting point.",
    fields: ["budget", "timeline", "notes"],
  },
] as const;

const LABELS = {
  name: "Your name",
  business: "Company name",
  email: "Email",
  phone: "Phone",
  website: "Company website",
  companySize: "Company size",
  crewCount: "Crews or field teams",
  currentSoftware: "Current software",
  painPoints: "Biggest frustration",
  desiredSystem: "What you wish it could do",
  budget: "Budget range",
  timeline: "Timeline",
  preferredContact: "Preferred contact method",
  notes: "Anything else",
};

function stepOf(field: string): number {
  const index = STEPS.findIndex((step) => (step.fields as readonly string[]).includes(field));
  return index < 0 ? 0 : index;
}

export function BookingForm({ ctaSource = "book-page" }: { ctaSource?: string }) {
  const [state, formAction, pending] = useActionState(submitDiscoveryCall, initialFormState);
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const started = useRef(false);

  // When a submission comes back rejected, move to the panel holding the first
  // bad field. Adjusted during render rather than in an effect so there is no
  // intermediate paint on the wrong step.
  const [lastResult, setLastResult] = useState(state);
  if (state !== lastResult) {
    setLastResult(state);
    const first = Object.keys(state.errors)[0];
    if (first) setStep(stepOf(first));
  }

  // Focus is a DOM effect, so it stays here.
  useEffect(() => {
    const first = Object.keys(state.errors)[0];
    if (!first) return;
    const id = window.setTimeout(() => focusField(first), 60);
    return () => window.clearTimeout(id);
  }, [state]);

  function scrollToForm() {
    const top = formRef.current?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: top + window.scrollY - 120, behavior: "smooth" });
  }

  function onFirstInput() {
    if (started.current) return;
    started.current = true;
    track("booking_started", { source: ctaSource });
  }

  /** Only advance when the current panel's controls are actually valid. */
  function goNext() {
    const panel = formRef.current?.querySelector<HTMLElement>(`[data-panel-index="${step}"]`);
    const controls = panel?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >("input, select, textarea");

    for (const control of controls ?? []) {
      if (control.type === "hidden") continue;
      if (!control.checkValidity()) {
        control.reportValidity();
        control.focus();
        return;
      }
    }

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    scrollToForm();
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
    scrollToForm();
  }

  const values = state.values;
  const errors = state.errors;
  const isLast = step === STEPS.length - 1;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      onInput={onFirstInput}
      className="relative"
    >
      <Honeypot name="contact_fax" />
      <DwellTimer />
      <input type="hidden" name="page" value="/book" />
      <input type="hidden" name="cta" value={ctaSource} />

      {/* Stepper — replaced by plain stacked sections when scripting is off. */}
      <div className="js-only mb-8 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4" aria-live="polite">
          <p className="t-eyebrow text-ink-3">
            Step {step + 1} of {STEPS.length}
          </p>
          <p className="text-[0.875rem] font-medium text-ink">{STEPS[step]?.title}</p>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((entry, index) => (
            <span
              key={entry.title}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                index <= step ? "bg-navy-700" : "bg-line-2"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <ErrorSummary
          errors={errors}
          formError={state.formError}
          labels={LABELS}
          onJump={(field) => {
            setStep(stepOf(field));
            window.setTimeout(() => focusField(field), 40);
          }}
        />

        {/* ------------------------------------------------------------ Step 1 */}
        <section
          data-panel-index={0}
          data-panel={step === 0 ? "shown" : "hidden"}
          aria-label={STEPS[0]?.title}
          className="flex flex-col gap-6"
        >
          <StepHeader index={0} />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              id="name"
              name="name"
              label={LABELS.name!}
              autoComplete="name"
              required
              maxLength={120}
              defaultValue={values.name ?? ""}
              error={errors.name}
              placeholder="Jordan Reyes"
            />
            <TextInput
              id="business"
              name="business"
              label={LABELS.business!}
              autoComplete="organization"
              required
              maxLength={160}
              defaultValue={values.business ?? ""}
              error={errors.business}
              placeholder="Reyes Mechanical"
            />
            <TextInput
              id="email"
              name="email"
              type="email"
              label={LABELS.email!}
              autoComplete="email"
              required
              maxLength={200}
              defaultValue={values.email ?? ""}
              error={errors.email}
              placeholder="jordan@reyesmechanical.com"
            />
            <TextInput
              id="phone"
              name="phone"
              type="tel"
              label={LABELS.phone!}
              autoComplete="tel"
              required
              maxLength={40}
              defaultValue={values.phone ?? ""}
              error={errors.phone}
              placeholder="(555) 214-8890"
            />
            <TextInput
              id="website"
              name="website"
              type="text"
              inputMode="url"
              label={LABELS.website!}
              optional
              autoComplete="url"
              maxLength={300}
              defaultValue={values.website ?? ""}
              error={errors.website}
              placeholder="reyesmechanical.com"
              className="sm:col-span-2"
            />
            <Select
              id="companySize"
              name="companySize"
              label={LABELS.companySize!}
              options={COMPANY_SIZES}
              required
              defaultValue={values.companySize ?? ""}
              error={errors.companySize}
            />
            <Select
              id="crewCount"
              name="crewCount"
              label={LABELS.crewCount!}
              options={CREW_COUNTS}
              required
              defaultValue={values.crewCount ?? ""}
              error={errors.crewCount}
            />
          </div>

          <RadioCards
            name="preferredContact"
            legend={LABELS.preferredContact!}
            options={CONTACT_METHODS}
            defaultValue={values.preferredContact ?? "Phone call"}
            error={errors.preferredContact}
          />
        </section>

        {/* ------------------------------------------------------------ Step 2 */}
        <section
          data-panel-index={1}
          data-panel={step === 1 ? "shown" : "hidden"}
          aria-label={STEPS[1]?.title}
          className="flex flex-col gap-6"
        >
          <StepHeader index={1} />

          <TextInput
            id="currentSoftware"
            name="currentSoftware"
            label={LABELS.currentSoftware!}
            hint="Everything the company runs on — CRM, accounting, scheduling, spreadsheets, the works."
            required
            maxLength={800}
            defaultValue={values.currentSoftware ?? ""}
            error={errors.currentSoftware}
            placeholder="ServiceTitan, QuickBooks, two shared Google Sheets, a whiteboard"
          />

          <TextArea
            id="painPoints"
            name="painPoints"
            label={LABELS.painPoints!}
            hint="What breaks, what wastes time, or what your team has built a workaround for."
            required
            maxLength={2000}
            rows={5}
            defaultValue={values.painPoints ?? ""}
            error={errors.painPoints}
            placeholder="Every change from the field gets texted in, then retyped into the schedule and again into QuickBooks. Something gets missed most weeks."
          />

          <TextArea
            id="desiredSystem"
            name="desiredSystem"
            label={LABELS.desiredSystem!}
            optional
            hint="You don't need a spec. Plain language is fine."
            maxLength={2000}
            rows={4}
            defaultValue={values.desiredSystem ?? ""}
            error={errors.desiredSystem}
            placeholder="I want to see every crew's week on one screen and move a job without breaking the rest of the schedule or the billing."
          />
        </section>

        {/* ------------------------------------------------------------ Step 3 */}
        <section
          data-panel-index={2}
          data-panel={step === 2 ? "shown" : "hidden"}
          aria-label={STEPS[2]?.title}
          className="flex flex-col gap-6"
        >
          <StepHeader index={2} />

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              id="budget"
              name="budget"
              label={LABELS.budget!}
              optional
              options={BUDGET_RANGES}
              placeholder="Prefer not to say"
              defaultValue={values.budget ?? ""}
              error={errors.budget}
            />
            <Select
              id="timeline"
              name="timeline"
              label={LABELS.timeline!}
              optional
              options={TIMELINES}
              placeholder="Not sure yet"
              defaultValue={values.timeline ?? ""}
              error={errors.timeline}
            />
          </div>

          <TextArea
            id="notes"
            name="notes"
            label={LABELS.notes!}
            optional
            maxLength={2000}
            rows={4}
            defaultValue={values.notes ?? ""}
            error={errors.notes}
            placeholder="Anything we should know before the call."
          />

          <div className="rounded-md border border-line bg-muted p-5">
            <p className="text-[0.9375rem] leading-relaxed text-ink-2">
              <strong className="font-semibold text-ink">
                Most custom builds start around {site.startingPrice}.
              </strong>{" "}
              Larger systems are scoped on complexity. Ongoing hosting, maintenance and support
              runs from {site.supportPrice}. Nothing is quoted until we understand how your
              company runs.
            </p>
          </div>
        </section>

        {/* ----------------------------------------------------------- Controls */}
        <div className="js-only flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-line-2 px-5 py-3 text-[0.9375rem] font-medium text-ink-2 transition-colors hover:border-navy-200 hover:text-ink"
            >
              Back
            </button>
          ) : null}

          {isLast ? (
            <SubmitButton pending={pending}>Book a Discovery Call</SubmitButton>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-navy-700 px-6 py-3.5 text-[1rem] font-medium text-white shadow-sm transition-colors hover:bg-navy-800"
            >
              Continue
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              >
                <path
                  d="M3 8h9m0 0L8.5 4.5M12 8l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* The no-JavaScript path: every panel is visible, so one submit does it all. */}
        <noscript>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-md bg-navy-700 px-6 py-3.5 text-[1rem] font-medium text-white sm:w-auto"
          >
            Book a Discovery Call
          </button>
        </noscript>

        <p className="text-[0.8125rem] leading-relaxed text-ink-3">
          We use these details to prepare for the call. No newsletters, no lead lists, no
          reselling your information.
        </p>
      </div>
    </form>
  );
}

function StepHeader({ index }: { index: number }) {
  const step = STEPS[index];
  if (!step) return null;

  return (
    <header className="border-b border-line pb-4">
      <p className="t-eyebrow text-ink-3">
        {String(index + 1).padStart(2, "0")} &middot; {step.title}
      </p>
      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{step.caption}</p>
    </header>
  );
}
