import type { Metadata } from "next";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import CommandSearch from "@/components/product/CommandSearch";
import LibraryGrid from "@/components/product/LibraryGrid";
import { requireViewer } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/security";
import {
  libraryFacets,
  listBrands,
  quickSearchIndex,
  searchCreatives,
  type SearchFilters,
  type SearchResult,
} from "@/lib/services/creatives";
import { track } from "@/lib/services/events";
import { libraryHref, parseSearchParams, withFilter, withoutFilter, type RawParams } from "@/lib/search/params";
import { categories, filterDimensions, termName, type FilterDimension } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Library", robots: { index: false } };

const examples = [
  "Sportswear launches with bold typography",
  "Warm editorial carousels explaining a complex service",
  "Employer branding featuring real employees",
];

/** Carbon-style centred hero copy that reflects the current view. */
function heading(query: string, filters: SearchFilters) {
  if (query) return { title: <>Results for &ldquo;{query}&rdquo;</>, body: null };
  const onlyCategory = filters.category?.length === 1 && Object.keys(filters).length === 1;
  if (onlyCategory) {
    const name = termName("category", filters.category![0]);
    return { title: <>Explore {name}</>, body: `Every ${name} reference in the library, newest first.` };
  }
  return {
    title: (
      <>
        <span className="block">No concepts.</span>
        <span className="block">Just real brand posts.</span>
      </>
    ),
    body: "A curated library of organic brand posts worth studying — hooks, structure, and execution. Use them to benchmark your own work, not to copy it.",
  };
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const viewer = await requireViewer("/library");
  const { query, filters } = parseSearchParams(params);

  let result: SearchResult | null = null;
  let error: string | null = null;
  try {
    rateLimit(`search:${viewer.userId}`, 20);
    result = searchCreatives({ query, filters, limit: 24 });
    track("search_completed", {
      viewer,
      properties: { results: result.total, degraded: result.degraded, hasQuery: Boolean(query) },
    });
  } catch (err) {
    error = err instanceof AppError ? err.message : "Search is temporarily unavailable. Try again shortly.";
  }

  const facets = libraryFacets();
  const brands = listBrands();
  const hero = heading(query, filters);
  const activeCategory = filters.category?.length === 1 ? filters.category[0] : null;
  const advanced = (Object.keys(filterDimensions) as FilterDimension[]).filter((dimension) => dimension !== "category");

  const activeChips: Array<{ key: FilterDimension | "brand"; id: string; label: string }> = [
    ...(Object.keys(filterDimensions) as FilterDimension[]).flatMap((dimension) =>
      (filters[dimension] ?? []).map((id) => ({
        key: dimension,
        id,
        label: `${filterDimensions[dimension].label}: ${termName(dimension, id)}`,
      }))
    ),
    ...(filters.brand ?? []).map((id) => ({
      key: "brand" as const,
      id,
      label: `Brand: ${brands.find((brand) => brand.id === id)?.name ?? id}`,
    })),
  ];
  const suggestions = (result?.interpretations ?? []).filter(
    (term) => !(filters[term.dimension] ?? []).includes(term.id)
  );
  const advancedCount = advanced.reduce((sum, dimension) => sum + (filters[dimension]?.length ?? 0), 0) +
    (filters.brand?.length ?? 0) + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

  return (
    <>
      <CommandSearch items={quickSearchIndex()} />

      <section>
        <Wrapper variant="standard" className="pt-24 lg:pt-48">
          <div className="mx-auto max-w-3xl text-balance text-center">
            <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900 break-words">
              {hero.title}
            </Text>
            {hero.body && (
              <Text tag="p" variant="textBase" className="mt-4 text-base-600">
                {hero.body}
              </Text>
            )}
            {!query && !activeChips.length && (
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
                {examples.map((example) => (
                  <Link
                    key={example}
                    href={libraryHref(example, {})}
                    className="rounded-full bg-base-50 px-3 py-1 text-base-700 hover:bg-base-100"
                  >
                    {example}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Wrapper>
      </section>

      <section>
        <Wrapper variant="standard" className="pb-32 pt-24">
          {/* Category chips — Carbon's tag row */}
          <nav aria-label="Categories" className="relative flex snap-x snap-proximity gap-1 overflow-x-scroll py-2 scrollbar-hide">
            <Button
              isLink
              size="xs"
              variant={!activeCategory && !filters.category?.length ? "default" : "muted"}
              href={libraryHref(query, withoutCategory(filters))}
              className="shrink-0"
            >
              All
            </Button>
            {categories
              .filter((category) => (facets.category[category.id] ?? 0) > 0)
              .map((category) => (
                <Button
                  key={category.id}
                  isLink
                  size="xs"
                  variant={activeCategory === category.id ? "default" : "muted"}
                  href={libraryHref(query, { ...withoutCategory(filters), category: [category.id] })}
                  aria-current={activeCategory === category.id ? "page" : undefined}
                  className="shrink-0"
                >
                  {category.name}
                </Button>
              ))}
          </nav>

          {/* Everything else, collapsed until needed */}
          <details className="group/filters mt-2" open={advancedCount > 0}>
            <summary className="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg px-1 py-2 text-xs font-medium text-base-600 hover:text-base-900">
              More filters{advancedCount > 0 && <span className="text-accent-600">({advancedCount})</span>}
            </summary>
            <form action="/library" method="get" className="mt-2 rounded-lg bg-base-50 p-8">
              {query && <input type="hidden" name="q" value={query} />}
              {(filters.category ?? []).map((id) => (
                <input key={id} type="hidden" name="category" value={id} />
              ))}
              <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
                {advanced.map((dimension) => {
                  const terms = filterDimensions[dimension].terms.filter((term) => (facets[dimension][term.id] ?? 0) > 0);
                  if (!terms.length) return null;
                  return (
                    <fieldset key={dimension}>
                      <legend className="text-sm font-medium text-base-900">{filterDimensions[dimension].label}</legend>
                      <div className="mt-2 space-y-1">
                        {terms.map((term) => (
                          <label key={term.id} className="flex cursor-pointer items-center gap-2 text-sm text-base-700">
                            <input
                              type="checkbox"
                              name={dimension}
                              value={term.id}
                              defaultChecked={filters[dimension]?.includes(term.id)}
                              className="size-4 rounded border-base-300 text-accent-600 focus:ring-accent-500"
                            />
                            <span className="grow">{term.name}</span>
                            <span className="text-xs text-base-400">{facets[dimension][term.id]}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
                <fieldset>
                  <legend className="text-sm font-medium text-base-900">Brand</legend>
                  <div className="mt-2 space-y-1">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex cursor-pointer items-center gap-2 text-sm text-base-700">
                        <input
                          type="checkbox"
                          name="brand"
                          value={brand.id}
                          defaultChecked={filters.brand?.includes(brand.id)}
                          className="size-4 rounded border-base-300 text-accent-600 focus:ring-accent-500"
                        />
                        <span className="grow">{brand.name}</span>
                        <span className="text-xs text-base-400">{brand.count}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-medium text-base-900">Published date</legend>
                  <div className="mt-2 grid gap-2">
                    <label className="text-xs text-base-600">
                      From
                      <input type="date" name="from" defaultValue={filters.dateFrom} className="mt-1 block w-full rounded-md border-base-200 text-xs" />
                    </label>
                    <label className="text-xs text-base-600">
                      To
                      <input type="date" name="to" defaultValue={filters.dateTo} className="mt-1 block w-full rounded-md border-base-200 text-xs" />
                    </label>
                  </div>
                </fieldset>
              </div>
              <div className="mt-8 flex gap-2">
                <Button type="submit" size="sm" variant="default">
                  Apply filters
                </Button>
                <Button isLink size="sm" variant="muted" href={libraryHref(query, {})}>
                  Clear all
                </Button>
              </div>
            </form>
          </details>

          {activeChips.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
              {activeChips.map((chip) => (
                <li key={`${chip.key}-${chip.id}`}>
                  <Link
                    href={libraryHref(query, withoutFilter(filters, chip.key, chip.id))}
                    className="inline-flex items-center gap-1 rounded-full bg-base-800 px-3 py-1 text-xs text-white hover:bg-base-700"
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    {chip.label} <span aria-hidden="true">×</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-base-500">We read your brief as:</span>
              {suggestions.map((term) => (
                <Link
                  key={`${term.dimension}-${term.id}`}
                  href={libraryHref(query, withFilter(filters, term.dimension, term.id))}
                  className="rounded-full bg-accent-50 px-3 py-1 text-accent-700 ring-1 ring-inset ring-accent-100 hover:bg-accent-100"
                  title="Apply as a strict filter"
                >
                  + {filterDimensions[term.dimension].label}: {term.name}
                </Link>
              ))}
            </div>
          )}

          {result?.notice && (
            <p className="mt-4 rounded-lg bg-base-50 px-4 py-3 text-xs text-base-600" role="note">
              {result.notice}
            </p>
          )}

          {error && (
            <div role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}{" "}
              <Link href={libraryHref(query, filters)} className="underline">
                Retry
              </Link>
            </div>
          )}

          {result && (
            <>
              <p className="mt-6 text-xs uppercase tracking-wide text-base-500" aria-live="polite">
                {result.total} reference{result.total === 1 ? "" : "s"}
              </p>
              {result.total === 0 ? (
                <div className="mt-8 rounded-lg bg-base-50 p-12 text-center">
                  <Text tag="h2" variant="displaySM" className="font-display font-light text-base-900">
                    Nothing in the library matches this yet.
                  </Text>
                  <p className="mx-auto mt-3 max-w-md text-sm text-base-600">
                    Try fewer filters or broader words. The library covers six launch categories; other industries
                    aren&rsquo;t indexed yet.
                  </p>
                  {(activeChips.length > 0 || query) && (
                    <Button isLink size="sm" variant="muted" href="/library" className="mx-auto mt-6 w-fit">
                      Browse everything
                    </Button>
                  )}
                </div>
              ) : (
                <LibraryGrid
                  key={libraryHref(query, filters)}
                  initialItems={result.items}
                  initialCursor={result.nextCursor}
                  query={query}
                  filters={filters}
                />
              )}
            </>
          )}
        </Wrapper>
      </section>
    </>
  );
}

function withoutCategory(filters: SearchFilters): SearchFilters {
  const next = { ...filters };
  delete next.category;
  return next;
}
