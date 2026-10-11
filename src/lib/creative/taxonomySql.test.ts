import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TAXONOMY_VERSION } from "./taxonomy";
import { taxonomySql } from "./taxonomySql";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

describe("taxonomySql", () => {
  it("escapes quotes and writes arrays", () => {
    const sql = taxonomySql();
    expect(sql).toContain("'Can''t be told from the caption and images.'");
    expect(sql).toContain("array['news', 'update']");
    expect(taxonomySql()).toBe(sql);
  });

  it("is in a migration for the current taxonomy version", () => {
    const files = readdirSync(MIGRATIONS).filter((file) => file.endsWith(".sql")).sort();
    const holder = files.filter((file) => readFileSync(join(MIGRATIONS, file), "utf8").includes(`-- Taxonomy ${TAXONOMY_VERSION},`)).at(-1);
    expect(holder, `No migration seeds taxonomy ${TAXONOMY_VERSION}; run npm run creative -- taxonomy-sql into a new migration`).toBeDefined();
    // Git may check the file out with CRLF line endings
    expect(readFileSync(join(MIGRATIONS, holder!), "utf8").replace(/\r\n/g, "\n")).toContain(taxonomySql());
  });
});
