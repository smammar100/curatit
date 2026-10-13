import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { categoryBySlug } from "@/lib/categories";
import { resolve, type Dimension } from "./taxonomy";

// The designer queries for Precision@5 use only fields and terms curatit_mcp_search_v2 accepts
const DIMENSIONS: Dimension[] = ["archetype", "archetype_family", "objective", "hook_technique", "narrative_pattern", "typography", "layout", "imagery", "palette", "visual_device", "tone", "persuasion", "cta"];
const OTHER = ["query", "category", "brand", "format", "analysed_only", "limit", "offset"];

describe("docs/creative-eval/queries.example.json", () => {
  const queries = JSON.parse(readFileSync(join(process.cwd(), "docs", "creative-eval", "queries.example.json"), "utf8")) as { query: string; request: Record<string, unknown>; relevant: string[] }[];

  it("has at least ten queries", () => {
    expect(queries.length).toBeGreaterThanOrEqual(10);
  });

  for (const { query, request } of queries) {
    it(query, () => {
      for (const [key, value] of Object.entries(request)) {
        expect([...DIMENSIONS, ...OTHER], key).toContain(key);
        // search_v2 matches a category by its slug exactly and says nothing when there's none
        if (key === "category") expect(categoryBySlug(value as string), `category: ${value}`).not.toBeNull();
        if (DIMENSIONS.includes(key as Dimension)) {
          for (const term of [value].flat() as string[]) expect(resolve(key as Dimension, term), `${key}: ${term}`).not.toBeNull();
        }
      }
    });
  }
});
