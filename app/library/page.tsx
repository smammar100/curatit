import type { Metadata } from "next";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import CreativeCard from "@/components/product/CreativeCard";
import { requireViewer } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/security";
import { libraryFacets, listBrands, searchCreatives, type SearchResult } from "@/lib/services/creatives";
import { track } from "@/lib/services/events";
import { libraryHref, parseSearchParams, withFilter, withoutFilter, type RawParams } from "@/lib/search/params";
import { filterDimensions, termName, type FilterDimension } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Library",
  robots: { index: false },
};

const examples = [
  "Sportswear launches with bold typography",
  "Warm editorial carousels explaining a complex service",
  "Employer branding featuring real employees",
  "Travel promotions with photography",
];

export default async function LibraryPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = await searchParams;
  const viewer = await requireViewer("/library");
  const { query, filters, cursor } = parseSearchParams(params);

  let result: SearchResult | null = null;
  let error: string | null = null;
  try {
    rateLimit(`search:${viewer.userId}`, 20);
    result = searchCreatives({ query, filters, cursor, limit: 24 });
    track("search_completed", {
      viewer,
      properties: { results: result.total, degraded: result.degraded, hasQuery: Boolean(query) },
    });
  } catch (err) {
    error = err instanceof AppError ? err.message : "Search is temporarily unavailable. Try again shortly.";
  }

  const facets = libraryFacets();
  const brands = listBrands();
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

  return (
    <section>
      <Wrapper variant="standard" className="pt-28 pb-24 lg:pt-32">
        <form action="/library" method="get" role="search" className="max-w-3xl">
          <label htmlFor="q" className="sr-only">
            Describe what you&rsquo;re looking for
          </label>
          <div className="flex gap-2">
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={query}
              maxLength={1000}
              placeholder="Describe the brief, e.g. “finance carousels explaining a feature”"
              className="block w-full px-4 h-12 text-base bg-white rounded-lg text-base-900 ring-1 ring-base-200 placeholder-base-400 focus:ring-2 focus:ring-accent-100 focus:border-accent-500 focus:outline-none shadow-sm"
            />
            {/* Keep the current filters when running a new query. */}
            {(Object.keys(filterDimensions) as FilterDimension[]).flatMap((dimension) =>
              (filters[dimension] ?? []).map((id) => <input key={`${dimension}-${id}`} type="hidden" name={dimension} value={id} />)
            )}
            {(filters.brand ?? []).map((id) => <input key={`brand-${id}`} type="hidden" name="brand" value={id} />)}
            <button
              type="submit"
              className="shrink-0 h-12 px-6 rounded-lg text-sm font-medium text-white bg-base-800 hover:bg-base-700 focus:outline-2 focus:outline-offset-2 focus:outline-base-700"
            >
              Search
            </button>
          </div>
        </form>

        {!query && !activeChips.length && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-base-500">Try:</span>
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

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[15rem_1fr]">
          {/* Filters */}
          <aside aria-label="Filters">
            <form action="/library" method="get">
              {query && <input type="hidden" name="q" value={query} />}
              <div className="space-y-2">
                {(Object.keys(filterDimensions) as FilterDimension[]).map((dimension) => {
                  const terms = filterDimensions[dimension].terms.filter((term) => (facets[dimension][term.id] ?? 0) > 0);
                  if (!terms.length) return null;
                  const activeCount = filters[dimension]?.length ?? 0;
                  return (
                    <details key={dimension} className="group border-b border-base-100 pb-2" open={activeCount > 0 || dimension === "category"}>
                      <summary className="flex cursor-pointer items-center justify-between py-2 text-sm font-medium text-base-900 select-none">
                        {filterDimensions[dimension].label}
                        {activeCount > 0 && <span className="text-xs text-accent-600">{activeCount}</span>}
                      </summary>
                      <fieldset className="space-y-1 pb-2">
                        <legend className="sr-only">{filterDimensions[dimension].label}</legend>
                        {terms.map((term) => (
                          <label key={term.id} className="flex items-center gap-2 text-sm text-base-700 cursor-pointer">
                            <input
                              type="checkbox"
                              name={dimension}
                              value={term.id}
                              defaultChecked={filters[dimension]?.includes(term.id)}
                              className="rounded border-base-300 text-accent-600 focus:ring-accent-500 size-4"
                            />
                            <span className="grow">{term.name}</span>
                            <span className="text-xs text-base-400">{facets[dimension][term.id]}</span>
                          </label>
                        ))}
                      </fieldset>
                    </details>
                  );
                })}

                <details className="border-b border-base-100 pb-2" open={Boolean(filters.brand?.length)}>
                  <summary className="cursor-pointer py-2 text-sm font-medium text-base-900 select-none">Brand</summary>
                  <fieldset className="space-y-1 pb-2">
                    <legend className="sr-only">Brand</legend>
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex items-center gap-2 text-sm text-base-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="brand"
                          value={brand.id}
                          defaultChecked={filters.brand?.includes(brand.id)}
                          className="rounded border-base-300 text-accent-600 focus:ring-accent-500 size-4"
                        />
                        <span className="grow">{brand.name}</span>
                        <span className="text-xs text-base-400">{brand.count}</span>
                      </label>
                    ))}
                  </fieldset>
                </details>

                <details className="border-b border-base-100 pb-2" open={Boolean(filters.dateFrom || filters.dateTo)}>
                  <summary className="cursor-pointer py-2 text-sm font-medium text-base-900 select-none">Published date</summary>
                  <div className="grid grid-cols-2 gap-2 pb-2">
                    <label className="text-xs text-base-600">
                      From
                      <input type="date" name="from" defaultValue={filters.dateFrom} className="mt-1 block w-full rounded-md border-base-200 text-xs" />
                    </label>
                    <label className="text-xs text-base-600">
                      To
                      <input type="date" name="to" defaultValue={filters.dateTo} className="mt-1 block w-full rounded-md border-base-200 text-xs" />
                    </label>
                  </div>
                </details>
              </div>

              <div className="mt-4 flex gap-2">
                <button type="submit" className="h-9 px-4 rounded-lg text-sm font-medium text-white bg-base-800 hover:bg-base-700">
                  Apply filters
                </button>
                <Link href={libraryHref(query, {})} className="h-9 px-4 inline-flex items-center rounded-lg text-sm font-medium text-base-900 bg-base-50 hover:bg-base-100">
                  Clear
                </Link>
              </div>
            </form>
          </aside>

          {/* Results */}
          <div>
            {activeChips.length > 0 && (
              <ul className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">
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
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
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
              <p className="mb-4 rounded-lg bg-base-50 px-4 py-3 text-xs text-base-600" role="note">
                {result.notice}
              </p>
            )}

            {error && (
              <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}{" "}
                <Link href={libraryHref(query, filters)} className="underline">
                  Retry
                </Link>
              </div>
            )}

            {result && (
              <>
                <p className="text-sm text-base-600" aria-live="polite">
                  {result.total === 0
                    ? "No references match."
                    : `${result.total} reference${result.total === 1 ? "" : "s"}${query ? " for your brief" : ""}`}
                </p>

                {result.total === 0 ? (
                  <div className="mt-6 rounded-lg bg-base-50 p-8">
                    <Text tag="h2" variant="displayXS" className="font-display text-base-900">
                      Nothing in the library matches this yet.
                    </Text>
                    <p className="mt-2 text-sm text-base-600">
                      Try fewer filters or broader words. The library covers six launch categories; other industries
                      aren&rsquo;t indexed yet.
                    </p>
                    {activeChips.length > 0 && (
                      <Link href={libraryHref(query, {})} className="mt-4 inline-block text-sm font-medium text-accent-600 hover:text-base-900">
                        Search without filters →
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                    {result.items.map((creative) => (
                      <CreativeCard key={creative.id} creative={creative} showWhy={Boolean(query)} />
                    ))}
                  </div>
                )}

                {(result.nextCursor || cursor) && (
                  <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
                    {cursor && (
                      <Link href={libraryHref(query, filters)} className="h-9 px-4 inline-flex items-center rounded-lg text-sm font-medium bg-base-50 hover:bg-base-100">
                        ← First page
                      </Link>
                    )}
                    {result.nextCursor && (
                      <Link href={libraryHref(query, filters, result.nextCursor)} className="h-9 px-4 inline-flex items-center rounded-lg text-sm font-medium text-white bg-base-800 hover:bg-base-700">
                        Next page →
                      </Link>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
