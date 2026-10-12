// The one error type the MCP and REST surfaces share. Every failure a tool or route can report
// is one of these codes, with a message safe to show a client (no SQL, stack traces, hostnames or
// credentials) and whether retrying could help. The transports map it: MCP returns it as a tool
// result with isError, REST as the matching HTTP status.

export const ERROR_CODES = [
  "INVALID_ARGUMENT",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "RATE_LIMITED",
  "QUOTA_EXCEEDED",
  "UPSTREAM_UNAVAILABLE",
  "TIMEOUT",
  "INTERNAL_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

const HTTP_STATUS: Record<ErrorCode, number> = {
  INVALID_ARGUMENT: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  QUOTA_EXCEEDED: 429,
  UPSTREAM_UNAVAILABLE: 503,
  TIMEOUT: 504,
  INTERNAL_ERROR: 500,
};

const RETRYABLE: Record<ErrorCode, boolean> = {
  INVALID_ARGUMENT: false,
  UNAUTHENTICATED: false,
  FORBIDDEN: false,
  NOT_FOUND: false,
  RATE_LIMITED: true,
  QUOTA_EXCEEDED: true,
  UPSTREAM_UNAVAILABLE: true,
  TIMEOUT: true,
  INTERNAL_ERROR: false,
};

export class CuratitError extends Error {
  readonly code: ErrorCode;
  readonly retryAfterSeconds?: number;
  // Field-level detail for INVALID_ARGUMENT, safe to show
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, options: { retryAfterSeconds?: number; details?: Record<string, unknown>; cause?: unknown } = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "CuratitError";
    this.code = code;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.details = options.details;
  }

  get status() {
    return HTTP_STATUS[this.code];
  }

  get retryable() {
    return RETRYABLE[this.code];
  }
}

export const invalid = (message: string, details?: Record<string, unknown>) => new CuratitError("INVALID_ARGUMENT", message, { details });
export const notFound = (message: string) => new CuratitError("NOT_FOUND", message);

// Anything that isn't already a CuratitError becomes one, with the original kept as `cause` for
// the log and a generic message for the client. Postgres' 22023 (invalid_parameter_value) is how
// the catalog functions report a bad request, so it maps to INVALID_ARGUMENT with its message,
// which those functions write for people. Timeouts (57014) and connection trouble map to their
// own codes so a client knows a retry is reasonable.
export function toCuratitError(error: unknown): CuratitError {
  if (error instanceof CuratitError) return error;
  const e = error as { code?: unknown; message?: unknown; name?: unknown } | null;
  const code = typeof e?.code === "string" ? e.code : "";
  const message = typeof e?.message === "string" ? e.message : "";
  if (code === "22023") return new CuratitError("INVALID_ARGUMENT", message || "Invalid request", { cause: error });
  if (code === "57014") return new CuratitError("TIMEOUT", "The request took too long. Try a narrower search.", { cause: error });
  if (e?.name === "AbortError" || e?.name === "TimeoutError") return new CuratitError("TIMEOUT", "The request took too long. Try again.", { cause: error });
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|502|503/.test(message)) {
    return new CuratitError("UPSTREAM_UNAVAILABLE", "The catalog is temporarily unavailable. Try again shortly.", { cause: error });
  }
  return new CuratitError("INTERNAL_ERROR", "Something went wrong on our side. Try again, and contact support if it keeps happening.", { cause: error });
}
