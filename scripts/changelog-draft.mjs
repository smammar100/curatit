// Lists the commits since the newest day in the Roadmap's changelog (src/content/roadmap.ts),
// grouped by day, as a starting point for the next entry. Nothing is written: the changelog is
// edited by hand, in plain words, from what this prints.
//
//   npm run changelog:draft
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const source = readFileSync("src/content/roadmap.ts", "utf8");
const last = [...source.matchAll(/date: "(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]).sort().at(-1);
const log = execFileSync("git", ["log", "--reverse", "--date=short", "--format=%h%x09%ad%x09%s", ...(last ? [`--since=${last} 23:59:59`] : [])], { encoding: "utf8" });
const days = new Map();
for (const line of log.trim().split("\n").filter(Boolean)) {
  const [hash, date, subject] = line.split("\t");
  days.set(date, [...(days.get(date) ?? []), { hash, subject }]);
}
if (!days.size) console.log(`Nothing new since ${last}.`);
for (const [date, commits] of days) {
  console.log(`\n${date}`);
  for (const { hash, subject } of commits) console.log(`  ${hash}  ${subject}`);
}
