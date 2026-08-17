/**
 * A very small, dependency-free validator.
 *
 * Two public forms do not justify a schema library. What they do justify is
 * predictable field-level errors that the form can attach to inputs with
 * `aria-invalid` / `aria-describedby`.
 */

export type FieldErrors = Record<string, string>;

export type FieldRule = {
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  kind?: "text" | "email" | "url" | "phone";
  oneOf?: readonly string[];
};

export type Schema = Record<string, FieldRule>;

export type ValidationResult =
  | { ok: true; value: Record<string, string> }
  | { ok: false; errors: FieldErrors; value: Record<string, string> };

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}$/i;

/** Control characters, minus tab and newline which are legitimate in textareas. */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Normalise line endings, strip control characters, cap runaway input. */
export function clean(raw: FormDataEntryValue | null, cap = 5000): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\r\n/g, "\n").replace(CONTROL_CHARS, "").trim().slice(0, cap);
}

/** Accept "acme.com", "www.acme.com" or a full URL; always store a full URL. */
export function normalizeUrl(value: string): string {
  if (!value) return "";
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname.includes(".")) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function validate(values: Record<string, string>, schema: Schema): ValidationResult {
  const errors: FieldErrors = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = values[field] ?? "";

    if (!value) {
      if (rule.required) errors[field] = `${rule.label} is required.`;
      continue;
    }

    if (rule.min && value.length < rule.min) {
      errors[field] = `${rule.label} needs at least ${rule.min} characters.`;
      continue;
    }

    if (rule.max && value.length > rule.max) {
      errors[field] = `${rule.label} must be under ${rule.max} characters.`;
      continue;
    }

    if (rule.oneOf && !rule.oneOf.includes(value)) {
      errors[field] = `Choose one of the listed options for ${rule.label.toLowerCase()}.`;
      continue;
    }

    if (rule.kind === "email" && !EMAIL.test(value)) {
      errors[field] = "Enter an email address we can actually reply to.";
      continue;
    }

    if (rule.kind === "phone") {
      const count = digits(value).length;
      if (count < 7 || count > 15) {
        errors[field] = "Enter a phone number with area code.";
        continue;
      }
    }

    if (rule.kind === "url" && !normalizeUrl(value)) {
      errors[field] = "Enter a valid website address, like acme-landscaping.com.";
      continue;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors, value: values };
  return { ok: true, value: values };
}
