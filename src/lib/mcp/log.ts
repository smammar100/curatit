// Structured logs for the MCP and REST surfaces: one JSON line per event with the request id,
// the tool or route, outcome and timing. Values that could be credentials (bearer tokens, PATs,
// signed URLs, Authorization headers) are redacted before anything is written, whatever field
// they turn up in. Never log request bodies or briefs.

import type { McpConfig } from "./config";

type Level = McpConfig["logLevel"];
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const SECRET_PATTERNS = [
  /curatit_pat_[A-Za-z0-9_-]+/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /([?&](?:token|signature|sig|key|apikey)=)[^&\s"']+/gi,
];

export function redact(value: unknown): unknown {
  if (typeof value === "string") {
    let out = value;
    for (const pattern of SECRET_PATTERNS) out = out.replace(pattern, (m, prefix) => (prefix ? `${prefix}[redacted]` : "[redacted]"));
    return out;
  }
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = /authorization|token|secret|password|cookie|signature/i.test(k) ? "[redacted]" : redact(v);
    }
    return out;
  }
  return value;
}

export type Logger = {
  debug: (event: string, fields?: Record<string, unknown>) => void;
  info: (event: string, fields?: Record<string, unknown>) => void;
  warn: (event: string, fields?: Record<string, unknown>) => void;
  error: (event: string, fields?: Record<string, unknown>) => void;
};

export function createLogger(level: Level, base: Record<string, unknown> = {}, write: (line: string) => void = (line) => console.log(line)): Logger {
  const emit = (lvl: Level, event: string, fields?: Record<string, unknown>) => {
    if (ORDER[lvl] < ORDER[level]) return;
    const record = { time: new Date().toISOString(), level: lvl, event, ...base, ...(fields ? (redact(fields) as Record<string, unknown>) : {}) };
    write(JSON.stringify(record));
  };
  return {
    debug: (e, f) => emit("debug", e, f),
    info: (e, f) => emit("info", e, f),
    warn: (e, f) => emit("warn", e, f),
    error: (e, f) => emit("error", e, f),
  };
}

// A pseudonymous account id for logs: the first 12 hex characters of a SHA-256, never the id itself
export async function pseudonym(subject: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(subject));
  return Array.from(new Uint8Array(digest).slice(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
}
