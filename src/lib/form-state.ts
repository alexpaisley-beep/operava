import type { FieldErrors } from "./validation";

/**
 * Shared shape returned by every form action.
 *
 * `values` is echoed back so a failed submission never wipes what someone
 * typed — including when JavaScript is unavailable and the browser re-renders
 * the page from the server response.
 */
export type FormState = {
  errors: FieldErrors;
  values: Record<string, string>;
  formError?: string;
};

export const initialFormState: FormState = { errors: {}, values: {} };
