"use client";

import { useActionState, useEffect, useRef } from "react";

import { DwellTimer, ErrorSummary, focusField } from "@/components/forms/form-parts";
import { SubmitButton } from "@/components/ui/button";
import { Honeypot, Select, TextArea, TextInput } from "@/components/ui/field";
import { submitSoftwareRequest } from "@/lib/actions";
import { track } from "@/lib/analytics";
import { initialFormState } from "@/lib/form-state";
import { BUDGET_RANGES, CREW_COUNTS, TIMELINES } from "@/lib/leads";
import { site } from "@/lib/site";

const LABELS = {
  name: "Your name",
  business: "Business name",
  email: "Email",
  phone: "Phone",
  website: "Company website",
  crewCount: "Team / crew size",
  currentSoftware: "What you run on today",
  integrations: "Integrations you depend on",
  painPoints: "What is not working",
  desiredSystem: "What you wish existed",
  budget: "Budget range",
  timeline: "Desired timeline",
  notes: "Anything else",
};

function Group({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5 border-t border-line pt-8 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <div>
        <p className="t-eyebrow text-ink-3" aria-hidden="true">
          {title}
        </p>
        {caption ? (
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-2">{caption}</p>
        ) : null}
      </div>
      {children}
    </fieldset>
  );
}

export function RequestForm({ ctaSource = "request-software-page" }: { ctaSource?: string }) {
  const [state, formAction, pending] = useActionState(submitSoftwareRequest, initialFormState);
  const started = useRef(false);

  useEffect(() => {
    const first = Object.keys(state.errors)[0];
    if (!first) return;
    const id = window.setTimeout(() => focusField(first), 60);
    return () => window.clearTimeout(id);
  }, [state]);

  function onFirstInput() {
    if (started.current) return;
    started.current = true;
    track("software_request_started", { source: ctaSource });
  }

  const values = state.values;
  const errors = state.errors;

  return (
    <form action={formAction} noValidate onInput={onFirstInput} className="flex flex-col gap-8">
      <Honeypot name="contact_fax" />
      <DwellTimer />
      <input type="hidden" name="page" value="/request-software" />
      <input type="hidden" name="cta" value={ctaSource} />

      <ErrorSummary
        errors={errors}
        formError={state.formError}
        labels={LABELS}
        onJump={(field) => focusField(field)}
      />

      <Group title="Who you are">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            id="name"
            name="name"
            label={LABELS.name}
            autoComplete="name"
            required
            maxLength={120}
            defaultValue={values.name ?? ""}
            error={errors.name}
          />
          <TextInput
            id="business"
            name="business"
            label={LABELS.business}
            autoComplete="organization"
            required
            maxLength={160}
            defaultValue={values.business ?? ""}
            error={errors.business}
          />
          <TextInput
            id="email"
            name="email"
            type="email"
            label={LABELS.email}
            autoComplete="email"
            required
            maxLength={200}
            defaultValue={values.email ?? ""}
            error={errors.email}
          />
          <TextInput
            id="phone"
            name="phone"
            type="tel"
            label={LABELS.phone}
            optional
            autoComplete="tel"
            maxLength={40}
            defaultValue={values.phone ?? ""}
            error={errors.phone}
          />
          <TextInput
            id="website"
            name="website"
            type="text"
            inputMode="url"
            label={LABELS.website}
            optional
            autoComplete="url"
            maxLength={300}
            defaultValue={values.website ?? ""}
            error={errors.website}
            placeholder="reyeslandscape.com"
          />
          <Select
            id="crewCount"
            name="crewCount"
            label={LABELS.crewCount}
            optional
            options={CREW_COUNTS}
            placeholder="Select one"
            defaultValue={values.crewCount ?? ""}
            error={errors.crewCount}
          />
        </div>
      </Group>

      <Group
        title="Your current setup"
        caption="Whatever the company actually runs on, including the spreadsheets nobody admits to."
      >
        <TextInput
          id="currentSoftware"
          name="currentSoftware"
          label={LABELS.currentSoftware}
          required
          maxLength={800}
          defaultValue={values.currentSoftware ?? ""}
          error={errors.currentSoftware}
          placeholder="Jobber, QuickBooks Online, Google Sheets, a shared inbox"
        />
        <TextInput
          id="integrations"
          name="integrations"
          label={LABELS.integrations}
          optional
          hint="Anything that has to keep working — accounting, payments, phones, email."
          maxLength={800}
          defaultValue={values.integrations ?? ""}
          error={errors.integrations}
          placeholder="QuickBooks and Stripe have to stay"
        />
      </Group>

      <Group
        title="The problem"
        caption="This is the part we actually read. Specific beats polished."
      >
        <TextArea
          id="painPoints"
          name="painPoints"
          label={LABELS.painPoints}
          required
          rows={6}
          maxLength={2000}
          defaultValue={values.painPoints ?? ""}
          error={errors.painPoints}
          placeholder="Estimating takes too long because our pricing depends on square footage tiers the software can't handle, so every quote gets rebuilt by hand in a spreadsheet."
        />
        <TextArea
          id="desiredSystem"
          name="desiredSystem"
          label={LABELS.desiredSystem}
          optional
          hint="A description is plenty. You do not need to know what to call it."
          rows={4}
          maxLength={2000}
          defaultValue={values.desiredSystem ?? ""}
          error={errors.desiredSystem}
        />
      </Group>

      <Group title="Scope">
        <div className="grid gap-5 sm:grid-cols-2">
          <Select
            id="timeline"
            name="timeline"
            label={LABELS.timeline}
            optional
            options={TIMELINES}
            placeholder="Not sure yet"
            defaultValue={values.timeline ?? ""}
            error={errors.timeline}
          />
          <Select
            id="budget"
            name="budget"
            label={LABELS.budget}
            optional
            options={BUDGET_RANGES}
            placeholder="Prefer not to say"
            defaultValue={values.budget ?? ""}
            error={errors.budget}
          />
        </div>

        <TextArea
          id="notes"
          name="notes"
          label={LABELS.notes}
          optional
          hint="Have screenshots or a report that shows the problem? Mention it here — we'll reply by email so you can send them across."
          rows={4}
          maxLength={2000}
          defaultValue={values.notes ?? ""}
          error={errors.notes}
        />
      </Group>

      <div className="flex flex-col gap-4 border-t border-line pt-8">
        <SubmitButton pending={pending}>Send This to Operava</SubmitButton>
        <p className="text-[0.8125rem] leading-relaxed text-ink-3">
          Most custom builds start around {site.startingPrice}. Sending this does not commit you
          to anything — we read it, and reply with a straight answer about whether custom
          software is worth it for your situation.
        </p>
      </div>
    </form>
  );
}
