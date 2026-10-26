// Counts what this process asks of Supabase: requests, response bytes and time, per endpoint
// (2026-10-26). Supabase's edge logs have no response sizes, so egress is measured here, at the
// client. Off unless CURATIT_SUPABASE_USAGE is set, and then free of per-request logging: one
// summary per process when it exits, to stderr ("1") or as a JSON file in that directory (CI's
// build writes there, and scripts/perf/supabase-budget.mjs checks the totals against a budget).
// Server only. Never records a query string, a header or a body, only sizes.

// bytes: the response bodies; gzipBytes: what they come to gzipped, about what crosses the network
// when the client accepts compression (Supabase's API does compress); ms: time to the full body
export type EndpointUsage = { requests: number; bytes: number; gzipBytes: number; ms: number; errors: number };
export type SupabaseUsage = Record<string, EndpointUsage>;

const KEY = Symbol.for("curatit.supabase-usage");
type Meter = { usage: SupabaseUsage; reported: boolean };

function meter(): Meter {
  const holder = globalThis as unknown as Record<symbol, Meter | undefined>;
  return (holder[KEY] ??= { usage: {}, reported: false });
}

export const meteringEnabled = () => typeof process !== "undefined" && Boolean(process.env.CURATIT_SUPABASE_USAGE);

// The endpoint a request counts under: a table or function, never the query, an id or a file
// path (Storage counts per bucket), so the summary stays a handful of rows
export function endpointOf(url: string, method = "GET") {
  const { pathname } = new URL(url);
  const parts = pathname.split("/").filter(Boolean);
  const name = parts[0] === "storage" ? parts.slice(0, 5).join("/") : parts.slice(0, parts[2] === "rpc" ? 4 : 3).join("/");
  return `${method.toUpperCase()} /${name}`;
}

function record(endpoint: string, entry: { bytes: number; gzipBytes: number; ms: number; error: boolean }) {
  const usage = (meter().usage[endpoint] ??= { requests: 0, bytes: 0, gzipBytes: 0, ms: 0, errors: 0 });
  usage.requests++;
  usage.bytes += entry.bytes;
  usage.gzipBytes += entry.gzipBytes;
  usage.ms += entry.ms;
  if (entry.error) usage.errors++;
  report();
}

// supabase-js lets us swap fetch; this one passes every request through unchanged and, while
// metering is on, counts it. The body is measured on a copy, after the caller has the response
export function meteredFetch(base: typeof fetch = fetch): typeof fetch {
  if (!meteringEnabled()) return base;
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const endpoint = endpointOf(url, init?.method ?? (input instanceof Request ? input.method : "GET"));
    const started = performance.now();
    try {
      const res = await base(input, init);
      void res
        .clone()
        .arrayBuffer()
        .then((body) => {
          const gzip = body.byteLength ? process.getBuiltinModule("node:zlib").gzipSync(new Uint8Array(body)).byteLength : 0;
          record(endpoint, { bytes: body.byteLength, gzipBytes: gzip, ms: performance.now() - started, error: !res.ok });
        })
        .catch(() => record(endpoint, { bytes: 0, gzipBytes: 0, ms: performance.now() - started, error: true }));
      return res;
    } catch (error) {
      record(endpoint, { bytes: 0, gzipBytes: 0, ms: performance.now() - started, error: true });
      throw error;
    }
  };
}

export function supabaseUsage(): SupabaseUsage {
  return structuredClone(meter().usage);
}

export function resetSupabaseUsage() {
  meter().usage = {};
}

// The process's totals: to stderr when it exits ("1"), or kept in one file per process in that
// directory, rewritten after every request (a build's workers are stopped without a normal exit,
// so a report at exit would be lost). "memory" keeps them for the process to read itself
function report() {
  const m = meter();
  const target = typeof process === "undefined" ? undefined : process.env.CURATIT_SUPABASE_USAGE;
  if (!target || target === "memory") return;
  const line = () => JSON.stringify({ pid: process.pid, argv: process.argv.slice(1, 3).join(" "), usage: m.usage });
  if (target !== "1") {
    // Fetched at run time, so no bundle that reaches this module through a shared import ever has
    // to resolve node:fs
    const fs = process.getBuiltinModule("node:fs");
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(`${target}/usage-${process.pid}.json`, line());
    return;
  }
  if (m.reported) return;
  m.reported = true;
  process.on("exit", () => process.stderr.write(`[supabase-usage] ${line()}
`));
}
