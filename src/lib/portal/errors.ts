/**
 * One error shape for every consumer of the domain layer.
 *
 * Server actions turn these into form errors; the MCP turns them into
 * structured tool errors. Anything that is not a PortalError is a bug and is
 * reported as `internal` without leaking its message.
 */

export const PORTAL_ERROR_CODES = [
  "unauthorized", // no authenticated principal
  "forbidden", // authenticated, but not allowed to do this
  "not_found", // entity missing, or hidden from this principal
  "validation_failed", // input rejected before touching the database
  "invalid_transition", // state machine refused the change
  "conflict", // uniqueness/idempotency collision that is not safely replayable
  "db_error", // the database refused the operation
  "internal", // unexpected failure
] as const;

export type PortalErrorCode = (typeof PORTAL_ERROR_CODES)[number];

export class PortalError extends Error {
  readonly code: PortalErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: PortalErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "PortalError";
    this.code = code;
    this.details = details;
  }
}

export function isPortalError(error: unknown): error is PortalError {
  return error instanceof PortalError;
}

/**
 * Normalise anything thrown into a PortalError, logging unexpected failures
 * server-side while keeping their internals out of the caller-visible message.
 */
export function toPortalError(error: unknown): PortalError {
  if (isPortalError(error)) return error;
  console.error("portal.internal_error", error);
  return new PortalError("internal", "Something went wrong on our side.");
}
