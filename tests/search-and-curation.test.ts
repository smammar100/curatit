/**
 * Retrieval contract (plan §26) and the publication invariant (plan §25).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { get } from "../lib/db";
import { getCreative, searchCreatives } from "../lib/services/creatives";
import { applyAction, listQueue } from "../lib/services/admin";
import { interpretQuery } from "../lib/search/interpret";
import { categories } from "../lib/taxonomy";
import { expectCode, makeViewer, postIdByHook } from "./helpers";

test("browse returns only published, processed posts", () => {
  const result = searchCreatives({});
  const published = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM source_posts WHERE publication_status = 'published' AND processing_status = 'ready'"
  )!.count;
  assert.equal(result.total, published);
  assert.equal(result.mode, "browse");
  assert.equal(result.degraded, false);
});

test("a hard category filter never leaks other categories", () => {
  for (const category of categories) {
    const result = searchCreatives({ query: "launch", filters: { category: [category.id] }, limit: 24 });
    assert.ok(result.items.every((item) => item.categoryId === category.id), `${category.id} leaked`);
  }
});

test("natural-language briefs are interpreted into suggestions, not silent filters", () => {
  const terms = interpretQuery("Sportswear launches with bold typography");
  const ids = terms.map((term) => `${term.dimension}:${term.id}`);
  assert.ok(ids.includes("category:sports"));
  assert.ok(ids.includes("objective:product-launch"));
  assert.ok(ids.includes("visualStyle:bold-typography"));
  // "bold typography" wins over plain "bold"; no duplicate style.
  assert.equal(ids.filter((id) => id.startsWith("visualStyle:")).length, 1);

  const result = searchCreatives({ query: "Sportswear launches with bold typography" });
  assert.ok(result.total > 0);
  assert.equal(result.degraded, true, "semantic search not connected is disclosed");
  assert.deepEqual(result.appliedFilters, {}, "interpretation did not become a hard filter");
  const top = result.items[0];
  assert.equal(top.categoryId, "sports");
  assert.ok(top.whyMatched.length > 0, "every ranked result explains itself");
});

test("simple inflections still map to taxonomy terms", () => {
  const ids = interpretQuery("warm editorial carousels explaining a complex service").map((t) => `${t.dimension}:${t.id}`);
  assert.ok(ids.includes("objective:educational"), "explaining → educational");
  assert.ok(ids.includes("visualStyle:editorial"));
  assert.ok(ids.includes("mediaType:carousel"));
});

test("results diversify: at most three from one brand in the first ten", () => {
  const result = searchCreatives({ query: "carousel", limit: 24 });
  const firstTen = result.items.slice(0, 10);
  const perBrand = new Map<string, number>();
  for (const item of firstTen) perBrand.set(item.brand.id, (perBrand.get(item.brand.id) ?? 0) + 1);
  assert.ok([...perBrand.values()].every((count) => count <= 3));
});

test("an impossible brief returns an honest empty result", () => {
  const result = searchCreatives({ query: "zzqx nonexistent vocabulary" });
  assert.equal(result.total, 0);
  assert.equal(result.items.length, 0);
});

test("invalid input is rejected with a safe error", () => {
  expectCode(() => searchCreatives({ filters: { category: ["crypto"] } }), "invalid_input");
  expectCode(() => searchCreatives({ query: "x".repeat(1001) }), "invalid_input");
  expectCode(() => searchCreatives({ limit: 500 }), "invalid_input");
  expectCode(() => searchCreatives({ filters: { dateFrom: "2026-09-10", dateTo: "2026-01-01" } }), "invalid_input");
});

test("cursors are bound to their query and can't be tampered with", () => {
  const first = searchCreatives({ limit: 5 });
  assert.ok(first.nextCursor);
  const second = searchCreatives({ limit: 5, cursor: first.nextCursor! });
  assert.notEqual(second.items[0].id, first.items[0].id);

  expectCode(() => searchCreatives({ limit: 5, query: "different", cursor: first.nextCursor! }), "invalid_input");
  const forged = Buffer.from(JSON.stringify({ o: 0 })).toString("base64url") + ".forged";
  expectCode(() => searchCreatives({ limit: 5, cursor: forged }), "invalid_input");
});

test("missing dates never satisfy a date filter", () => {
  const future = searchCreatives({ filters: { dateFrom: "2099-01-01" } });
  assert.equal(future.total, 0);
});

test("unpublished and unknown posts are not served", () => {
  const queued = listQueue(makeViewer("admin"), "review")[0];
  expectCode(() => getCreative(queued.id), "not_found");
  expectCode(() => getCreative("00000000-0000-0000-0000-000000000000"), "not_found");
  expectCode(() => getCreative("../../etc/passwd"), "not_found");
});

test("curation requires an admin", () => {
  const member = makeViewer();
  expectCode(() => listQueue(member, "review"), "forbidden");
  expectCode(() => applyAction(member, postIdByHook("Lighter than"), "remove"), "forbidden");
});

test("publication follows candidate → shortlisted → published, and removal overrides everything", () => {
  const admin = makeViewer("admin");
  const candidate = listQueue(admin, "review").find((item) => item.editorialStatus === "candidate")!;

  expectCode(() => applyAction(admin, candidate.id, "publish"), "conflict");
  expectCode(() => applyAction(admin, candidate.id, "reject", ""), "invalid_input");

  applyAction(admin, candidate.id, "shortlist");
  applyAction(admin, candidate.id, "publish");
  assert.equal(getCreative(candidate.id).id, candidate.id);
  assert.ok(searchCreatives({ limit: 24 }).total > 0);

  applyAction(admin, candidate.id, "remove");
  expectCode(() => getCreative(candidate.id), "not_found");
  assert.ok(!searchCreatives({ query: candidate.hook ?? "" }).items.some((item) => item.id === candidate.id));

  // A late "publish" (e.g. a retried job) can't resurrect a removed post.
  expectCode(() => applyAction(admin, candidate.id, "publish"), "conflict");
  expectCode(() => applyAction(admin, candidate.id, "shortlist"), "conflict");

  // Restore returns it to review — never straight to published.
  applyAction(admin, candidate.id, "restore");
  expectCode(() => getCreative(candidate.id), "not_found");
  assert.ok(listQueue(admin, "review").some((item) => item.id === candidate.id));
});
