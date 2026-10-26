// Sums the Supabase usage a metered run wrote (src/utils/supabase/meter.ts, one file per process
// in CURATIT_SUPABASE_USAGE's directory) and fails when it's over budget. CI runs the site build
// metered and checks it, so a build that reads the database a page at a time again (about 1,500
// requests a build until 2026-10-26; ~90 since) fails instead of quietly spending the egress quota.
//
//   node scripts/perf/supabase-budget.mjs <dir> [--max-requests 400] [--max-gzip-mib 8]
import { existsSync, readdirSync, readFileSync } from "node:fs";

const [dir, ...rest] = process.argv.slice(2);
const option = (name, fallback) => (rest.includes(name) ? Number(rest[rest.indexOf(name) + 1]) : fallback);
const maxRequests = option("--max-requests", 400);
const maxGzipMiB = option("--max-gzip-mib", 8);
if (!dir || !existsSync(dir)) {
  console.error(`supabase budget: no usage in ${dir ?? "(no directory given)"}; was the run metered (CURATIT_SUPABASE_USAGE)?`);
  process.exit(1);
}

const total = {};
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  for (const [endpoint, u] of Object.entries(JSON.parse(readFileSync(`${dir}/${file}`, "utf8")).usage)) {
    const t = (total[endpoint] ??= { requests: 0, bytes: 0, gzipBytes: 0, errors: 0 });
    t.requests += u.requests;
    t.bytes += u.bytes;
    t.gzipBytes += u.gzipBytes;
    t.errors += u.errors;
  }
}
const sum = Object.values(total).reduce((s, u) => ({ requests: s.requests + u.requests, bytes: s.bytes + u.bytes, gzipBytes: s.gzipBytes + u.gzipBytes }), { requests: 0, bytes: 0, gzipBytes: 0 });
const mib = (n) => `${(n / 1048576).toFixed(2)} MiB`;
console.log(`supabase usage: ${sum.requests} requests, ${mib(sum.bytes)} raw, ${mib(sum.gzipBytes)} gzipped (budget ${maxRequests} requests, ${maxGzipMiB} MiB gzipped)`);
for (const [endpoint, u] of Object.entries(total).sort((a, b) => b[1].requests - a[1].requests)) {
  console.log(`  ${endpoint.padEnd(52)} ${String(u.requests).padStart(5)} ${mib(u.bytes).padStart(11)} ${mib(u.gzipBytes).padStart(11)}${u.errors ? `  ${u.errors} failed` : ""}`);
}
if (sum.requests > maxRequests || sum.gzipBytes > maxGzipMiB * 1048576) {
  console.error("supabase budget: over budget. A page reading the database for itself again? See docs/performance/supabase-egress-optimization.md");
  process.exit(1);
}
