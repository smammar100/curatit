/**
 * Standard error vocabulary for the web/API contract (plan §26):
 * safe codes and request IDs, never stack traces.
 */
export type ErrorCode =
  | "invalid_input"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unavailable";

const statusByCode: Record<ErrorCode, number> = {
  invalid_input: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  unavailable: 503,
};

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.status = statusByCode[code];
  }
}

export const notFound = (what = "Resource") => new AppError("not_found", `${what} not found.`);
export const invalidInput = (message: string, details?: Record<string, unknown>) =>
  new AppError("invalid_input", message, details);
export const conflict = (message: string, details?: Record<string, unknown>) =>
  new AppError("conflict", message, details);
