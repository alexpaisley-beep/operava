"use client";

import { ActionPanel } from "@/components/portal/action-panel";
import { EnumSelect, toOptions } from "@/components/portal/enum-select";
import { TextArea, TextInput } from "@/components/ui/field";
import { COMPANY_STATUSES, COMPANY_STATUS_LABELS } from "@/lib/portal/types";

import { createCustomerAction } from "../actions";

export function NewCustomerForm() {
  return (
    <ActionPanel action={createCustomerAction} submitLabel="Create customer">
      <TextInput id="nc-name" name="name" label="Company name" required maxLength={160} />
      <TextInput
        id="nc-contact"
        name="primaryContactName"
        label="Primary contact"
        optional
        maxLength={160}
      />
      <TextInput
        id="nc-email"
        name="contactEmail"
        type="email"
        label="Contact email"
        optional
        maxLength={320}
      />
      <TextInput id="nc-phone" name="contactPhone" label="Phone" optional maxLength={40} />
      <EnumSelect
        id="nc-status"
        name="status"
        label="Status"
        defaultValue="active"
        options={toOptions(COMPANY_STATUSES, COMPANY_STATUS_LABELS)}
      />
      <TextArea
        id="nc-notes"
        name="internalNotes"
        label="Internal notes"
        hint="Never shown to the customer."
        optional
        rows={3}
        maxLength={10000}
      />
    </ActionPanel>
  );
}
