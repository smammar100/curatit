// The one error type the MCP and REST surfaces share. Every failure a tool or route can report
// is one of these codes, with a message safe to show a client (no SQL, stack traces, hostnames or
// credentials) and whether retrying could help. The transports map it: MCP returns it as a tool
// result with isError, REST as the matching HTTP status.

import { redact } from "./log";

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

// A dependency's failure, tagged where it happened, before it becomes a code: the Postgres or
// PostgREST code, the HTTP status (0 when the request never got an answer), the message, and the
// stage of the call that failed (resolvePost, get_post_v2, probe…). It travels as a CuratitError's
// `cause`, so the log can say which dependency failed and why; the client only sees the code.
export type UpstreamFailure = { pg_code: string | null; http_status: number | null; message: string; stage: string };

export function upstreamFailure(stage: string, error: unknown, status?: number | null): UpstreamFailure {
  const e = error as { code?: unknown; message?: unknown; name?: unknown } | null;
  const message = typeof e?.message === "string" ? e.message : String(error ?? "");
  const name = error instanceof Error && e?.name !== "Error" && !message.startsWith(`${e?.name}:`) ? `${e?.name}: ` : "";
  return {
    pg_code: typeof e?.code === "string" && e.code ? e.code : null,
    http_status: typeof status === "number" ? status : null,
    message: name + message,
    stage,
  };
}

const UNAVAILABLE = "The catalog is temporarily unavailable. Try again shortly.";
const TOO_LONG = "The request took too long. Try again, or ask for less (a narrower search, fewer references).";
// The database couldn't read a value it was given. Its own words can echo the value back, so
// the client gets a fixed message instead
const UNREADABLE = "A value in the request isn't in a form the catalog can read (a malformed id, or text with characters it can't store). Check the arguments.";

// Postgres and PostgREST codes for "try again": PostgREST can't reach or load the database
// (PGRST000-003), connection exceptions (08…), too many connections, the server shutting down or
// restarting, and transactions that lost a serialization or deadlock race
const TRANSIENT_CODES = /^(PGRST00[0-3]|08[0-9A-Z]{3}|53300|57P0[1-3]|40001|40P01)$/;
// Bad input the database refused before doing anything: text it can't represent (22P02, 22P05,
// 22021) or a request PostgREST couldn't parse (PGRST100-102)
const UNREADABLE_CODES = /^(22P02|22P05|22021|PGRST10[0-2])$/;
// Gateways and proxies in front of the database: bad gateway, unavailable, Cloudflare's 52x, and
// too many requests
const TRANSIENT_STATUS = new Set([429, 502, 503, 520, 521, 522, 523, 524]);
// Node's network errors, as whole words, when a fetch never got an answer
const NETWORK = /\b(fetch failed|ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|EPIPE|UND_ERR_[A-Z_]+|socket hang up)\b/;

// Anything that isn't already a CuratitError becomes one, with the original kept as `cause` for
// the log and a safe message for the client. Postgres' 22023 (invalid_parameter_value) is how the
// catalog functions report a bad request, so it maps to INVALID_ARGUMENT with its message, which
// those functions write for people. Timeouts and outages map to their own codes, retryable, so a
// client knows to try again; input the database can't read is the caller's to fix. Only codes,
// statuses and error names decide: a number inside a message (a post id) never does.
export function toCuratitError(error: unknown): CuratitError {
  if (error instanceof CuratitError) return error;
  const e = error as { code?: unknown; pg_code?: unknown; message?: unknown; name?: unknown; status?: unknown; http_status?: unknown } | null;
  const code = typeof e?.pg_code === "string" ? e.pg_code : typeof e?.code === "string" ? e.code : "";
  const status = typeof e?.http_status === "number" ? e.http_status : typeof e?.status === "number" ? e.status : null;
  const message = typeof e?.message === "string" ? e.message : "";
  const name = typeof e?.name === "string" ? e.name : "";
  const fail = (kind: "INVALID_ARGUMENT" | "UPSTREAM_UNAVAILABLE" | "TIMEOUT" | "INTERNAL_ERROR", text: string) => new CuratitError(kind, text, { cause: error });

  if (code === "22023") return fail("INVALID_ARGUMENT", message || "Invalid request");
  // supabase-js reports a fetch that threw as "<name>: <message>" with status 0
  if (name === "AbortError" || name === "TimeoutError" || /^(TimeoutError|AbortError):/.test(message)) return fail("TIMEOUT", TOO_LONG);
  if (code === "57014" || status === 504) return fail("TIMEOUT", TOO_LONG);
  if (UNREADABLE_CODES.test(code)) return fail("INVALID_ARGUMENT", UNREADABLE);
  if (TRANSIENT_CODES.test(code) || (status !== null && TRANSIENT_STATUS.has(status))) return fail("UPSTREAM_UNAVAILABLE", UNAVAILABLE);
  if (status === 0 || /^TypeError: fetch failed/.test(message) || NETWORK.test(message)) return fail("UPSTREAM_UNAVAILABLE", UNAVAILABLE);
  return fail("INTERNAL_ERROR", "Something went wrong on our side. Try again, and contact support if it keeps happening.");
}

// What the log says about a failure's cause: codes, status, stage and the first 200 characters
// of the message, with anything that looks like a credential taken out first. Never values from
// the request beyond what an error message itself repeats.
export function causeOf(error: CuratitError): { pg_code: string | null; http_status: number | null; stage: string | null; message: string } | null {
  const cause = error.cause;
  if (cause === undefined || cause === null) return null;
  const c = cause as { pg_code?: unknown; code?: unknown; http_status?: unknown; status?: unknown; stage?: unknown; message?: unknown; name?: unknown };
  const raw = typeof c.message === "string" ? c.message : typeof cause === "string" ? cause : "";
  const prefix = cause instanceof Error && typeof c.name === "string" && c.name !== "Error" && !raw.startsWith(`${c.name}:`) ? `${c.name}: ` : "";
  const message = String(redact(prefix + raw)).slice(0, 200);
  return {
    pg_code: typeof c.pg_code === "string" ? c.pg_code : typeof c.code === "string" && c.code ? c.code : null,
    http_status: typeof c.http_status === "number" ? c.http_status : typeof c.status === "number" ? c.status : null,
    stage: typeof c.stage === "string" ? c.stage : null,
    message,
  };
}
