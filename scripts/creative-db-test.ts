// Runs the Creative Intelligence database tests (supabase/tests/creative_intelligence.sql) against
// the linked Supabase project, inside one transaction that always rolls back: the suite ends by
// raising its own results log, so nothing it does is ever committed. With --with-migration the
// Creative Intelligence migrations are applied inside that transaction first, so they can be tested
// before they're pushed.
//
//   npm run creative:test-db                     after the migration is pushed
//   npm run creative:test-db -- --with-migration before
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FIXTURE_DNA, FIXTURE_PERCEPTION } from "@/lib/creative/fixtures";
import { PIPELINE_VERSION } from "@/lib/creative/pipeline";
import { DIMENSIONS } from "@/lib/creative/taxonomy";

// Applied in this order by --with-migration
const MIGRATIONS = ["supabase/migrations/20261011124829_creative_intelligence.sql", "supabase/migrations/20261011131743_creative_mcp_v2.sql"];
const SUITE = "supabase/tests/creative_intelligence.sql";

const literal = (value: unknown) => JSON.stringify(value).replace(/'/g, "''");
const termCount = Object.values(DIMENSIONS).reduce((sum, terms) => sum + terms.length, 0);

const suite = readFileSync(SUITE, "utf8")
  .replaceAll("{{PIPELINE}}", PIPELINE_VERSION)
  .replaceAll("{{TERM_COUNT}}", String(termCount))
  .replaceAll("{{FIXTURE_DNA}}", literal(FIXTURE_DNA))
  .replaceAll("{{FIXTURE_SLIDE}}", literal(FIXTURE_PERCEPTION.slides[0]));
const [before, after] = suite.split("-- @migration");
if (after === undefined) throw new Error(`${SUITE} is missing its -- @migration line`);

const sql = [
  "begin;",
  before,
  ...(process.argv.includes("--with-migration") ? MIGRATIONS.map((file) => readFileSync(file, "utf8")) : []),
  after,
  "do $$ begin raise exception 'TESTLOG%', chr(10) || current_setting('test.log', true); end $$;",
  "",
].join("\n");

const file = join(mkdtempSync(join(tmpdir(), "creative-db-test-")), "suite.sql");
writeFileSync(file, sql);

const run = spawnSync("npx", ["supabase", "db", "query", "--linked", "-f", file], {
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 16 * 1024 * 1024,
});
const output = `${run.stdout ?? ""}\n${run.stderr ?? ""}`;

// The CLI reports the raised log as an error: {"error": {"message": "unexpected status 400: {\"message\": \"... ERROR: P0001: TESTLOG\n...\"}"}}
function sqlError(text: string): string | null {
  const line = text.split("\n").find((l) => l.trim().startsWith("{") && l.includes('"_tag"'));
  if (!line) return null;
  const outer = JSON.parse(line).error?.message ?? "";
  const brace = outer.indexOf("{");
  try {
    return brace >= 0 ? (JSON.parse(outer.slice(brace)).message as string) : outer;
  } catch {
    return outer;
  }
}

const message = sqlError(output);
const marker = message?.indexOf("TESTLOG") ?? -1;
if (!message || marker < 0) {
  console.error("The suite didn't finish:\n");
  console.error(message ?? output);
  process.exit(1);
}

const log = message
  .slice(marker + "TESTLOG".length)
  .split("\nCONTEXT:")[0]
  .split("\n")
  .filter(Boolean);
for (const line of log) console.log(line);
const failed = log.filter((line) => line.startsWith("FAIL")).length;
console.log(`\n${log.length - failed} passed, ${failed} failed (rolled back; nothing was saved)`);
process.exit(failed ? 1 : 0);
