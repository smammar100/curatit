import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Plus, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Wrapper from "@/components/fundations/containers/Wrapper";
import CommandSearch from "@/components/product/CommandSearch";
import LibraryGrid from "@/components/product/LibraryGrid";
import { requireViewer } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { fontWeights } from "@/lib/font-weight";
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

/** Plain input recipe matching FF's InputField, for native GET form fields. */
const field =
  "h-9 w-full rounded-lg bg-background px-3 text-[13px] text-foreground shadow-surface-1 placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]";

/** Page title and one-line intro that reflect the current view. */
function heading(query: string, filters: SearchFilters, total: number | null) {
  const count = total === null ? null : `${total} reference${total === 1 ? "" : "s"}`;
  if (query) return { title: <>Results for &ldquo;{query}&rdquo;</>, body: count };
  const onlyCategory = filters.category?.length === 1 && Object.keys(filters).length === 1;
  if (onlyCategory) {
    const name = termName("category", filters.category![0]);
    return { title: <>{name}</>, body: count && `${count} in ${name}, newest first.` };
  }
  return {
    title: <>Library</>,
    body: `${count ? `${count}, ` : ""}each reviewed by an editor. Study the hook, the structure and the execution, then make your own.`,
  };
}

/** A label that turns semibold when current, with a hidden heavier copy so neighbours never shift. */
function WeightLabel({ children, current }: { children: string; current: boolean }) {
  return (
    <span className="inline-grid">
      <span className="invisible col-start-1 row-start-1" style={{ fontVariationSettings: fontWeights.semibold }} aria-hidden="true">
        {children}
      </span>
      <span
        className="col-start-1 row-start-1"
        style={{ fontVariationSettings: current ? fontWeights.semibold : fontWeights.normal }}
      >
        {children}
      </span>
    </span>
  );
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
  const hero = heading(query, filters, result?.total ?? null);
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
  const allCurrent = !activeCategory && !filters.category?.length;

  return (
    <>
      <Wrapper variant="standard" className="pb-24">
        <header className="pt-24 sm:pt-28">
          <h1 className="heading-display text-balance break-words text-foreground">{hero.title}</h1>
          <p className="mt-2 max-w-2xl text-pretty text-[15px] leading-6 text-muted-foreground">
            {hero.body}
          </p>
          <div className="mt-6 max-w-3xl">
            <CommandSearch items={quickSearchIndex()} initialQuery={query} />
          </div>
          {!query && !activeChips.length && (
            <div className="-mx-6 mt-3 flex items-center gap-1.5 overflow-x-auto px-6 scrollbar-hide">
              <span className="mr-1 shrink-0 text-[12px] text-muted-foreground">Try</span>
              {examples.map((example) => (
                <Button key={example} asChild variant="tertiary" size="compact" className="shrink-0 whitespace-nowrap">
                  <Link href={libraryHref(example, {})}>{example}</Link>
                </Button>
              ))}
            </div>
          )}
        </header>

        {/* Categories and the filter toggle share one row; filters are real links and a GET form, since they live in the URL */}
        <div className="relative mt-8">
          <nav
            aria-label="Categories"
            className="flex snap-x snap-proximity gap-1 overflow-x-auto border-b border-border pb-3 pr-28 scrollbar-hide"
          >
            <Button asChild size="compact" variant={allCurrent ? "secondary" : "ghost"} className="shrink-0 snap-start">
              <Link href={libraryHref(query, withoutCategory(filters))} aria-current={allCurrent ? "page" : undefined}>
                <WeightLabel current={allCurrent}>All</WeightLabel>
              </Link>
            </Button>
            {categories
              .filter((category) => (facets.category[category.id] ?? 0) > 0)
              .map((category) => {
                const current = activeCategory === category.id;
                return (
                  <Button key={category.id} asChild size="compact" variant={current ? "secondary" : "ghost"} className="shrink-0 snap-start">
                    <Link
                      href={libraryHref(query, { ...withoutCategory(filters), category: [category.id] })}
                      aria-current={current ? "page" : undefined}
                    >
                      <WeightLabel current={current}>{category.name}</WeightLabel>
                    </Link>
                  </Button>
                );
              })}
          </nav>

        <details className="group/filters" open={advancedCount > 0}>
          <summary className="absolute right-0 top-0 inline-flex h-7 cursor-pointer select-none list-none items-center gap-1.5 rounded-lg bg-background px-2 text-[12px] text-foreground outline-none transition-colors duration-80 hover:bg-hover focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal size={14} strokeWidth={1.5} aria-hidden="true" />
            Filters
            {advancedCount > 0 && <span className="tabular-nums text-muted-foreground">{advancedCount}</span>}
            <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" className="text-muted-foreground group-open/filters:rotate-180" />
          </summary>
          <form action="/library" method="get" className="mt-3 border-b border-border pb-6">
            {query && <input type="hidden" name="q" value={query} />}
            {(filters.category ?? []).map((id) => (
              <input key={id} type="hidden" name="category" value={id} />
            ))}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
              {advanced.map((dimension) => {
                const terms = filterDimensions[dimension].terms.filter((term) => (facets[dimension][term.id] ?? 0) > 0);
                if (!terms.length) return null;
                return (
                  <fieldset key={dimension}>
                    <legend className="text-[13px] text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                      {filterDimensions[dimension].label}
                    </legend>
                    <div className="mt-2 space-y-0.5">
                      {terms.map((term) => (
                        <label
                          key={term.id}
                          className="-mx-2 flex h-7 cursor-pointer items-center gap-2 rounded-lg px-2 text-[13px] text-foreground hover:bg-hover"
                        >
                          <input
                            type="checkbox"
                            name={dimension}
                            value={term.id}
                            defaultChecked={filters[dimension]?.includes(term.id)}
                            className="size-3.5 shrink-0 accent-foreground"
                          />
                          <span className="grow truncate">{term.name}</span>
                          <span className="text-[12px] tabular-nums text-muted-foreground">{facets[dimension][term.id]}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}
              <fieldset>
                <legend className="text-[13px] text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                  Brand
                </legend>
                <div className="mt-2 space-y-0.5">
                  {brands.map((brand) => (
                    <label
                      key={brand.id}
                      className="-mx-2 flex h-7 cursor-pointer items-center gap-2 rounded-lg px-2 text-[13px] text-foreground hover:bg-hover"
                    >
                      <input
                        type="checkbox"
                        name="brand"
                        value={brand.id}
                        defaultChecked={filters.brand?.includes(brand.id)}
                        className="size-3.5 shrink-0 accent-foreground"
                      />
                      <span className="grow truncate">{brand.name}</span>
                      <span className="text-[12px] tabular-nums text-muted-foreground">{brand.count}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-[13px] text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                  Published date
                </legend>
                <div className="mt-2 grid gap-3">
                  <label className="grid gap-1 text-[12px] text-muted-foreground">
                    From
                    <input type="date" name="from" defaultValue={filters.dateFrom} className={field} />
                  </label>
                  <label className="grid gap-1 text-[12px] text-muted-foreground">
                    To
                    <input type="date" name="to" defaultValue={filters.dateTo} className={field} />
                  </label>
                </div>
              </fieldset>
            </div>
            <div className="mt-6 flex gap-2">
              <Button type="submit" size="compact" variant="primary">
                Apply filters
              </Button>
              <Button asChild size="compact" variant="ghost">
                <Link href={libraryHref(query, {})}>Clear all</Link>
              </Button>
            </div>
          </form>
        </details>
        </div>

        {activeChips.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
            {activeChips.map((chip) => (
              <li key={`${chip.key}-${chip.id}`}>
                <Link
                  href={libraryHref(query, withoutFilter(filters, chip.key, chip.id))}
                  className="group/chip inline-flex rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <Badge className="gap-1 pr-1.5 transition-colors duration-80 group-hover/chip:bg-selected!">
                    <span className="inline-flex items-center gap-1">
                      {chip.label}
                      <X size={12} strokeWidth={1.5} aria-hidden="true" className="text-muted-foreground group-hover/chip:text-foreground" />
                    </span>
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-muted-foreground">We read your brief as:</span>
            {suggestions.map((term) => (
              <Button key={`${term.dimension}-${term.id}`} asChild size="compact" variant="tertiary" className="pl-2">
                <Link
                  href={libraryHref(query, withFilter(filters, term.dimension, term.id))}
                  title="Apply as a strict filter"
                >
                  <span className="inline-flex items-center gap-1">
                    <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
                    {filterDimensions[term.dimension].label}: {term.name}
                  </span>
                </Link>
              </Button>
            ))}
          </div>
        )}

        {result?.notice && (
          <p className="mt-4 rounded-xl bg-muted px-3 py-2.5 text-[13px] text-foreground" role="note">
            {result.notice}
          </p>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-xl bg-destructive-light px-3 py-2.5 text-[13px] text-destructive">
            {error}{" "}
            <Link
              href={libraryHref(query, filters)}
              className="underline decoration-current/40 underline-offset-[3px] hover:decoration-current"
            >
              Retry
            </Link>
          </div>
        )}

        {result && (
          <>
            <p className="sr-only" aria-live="polite">
              {result.total} reference{result.total === 1 ? "" : "s"}
            </p>
            {result.total === 0 ? (
              <div className="flex max-w-md flex-col items-start gap-2 py-12">
                <h2 className="heading-section text-foreground">Nothing in the library matches this yet</h2>
                <p className="text-[14px] leading-6 text-muted-foreground">
                  Try fewer filters or broader words. The library covers six launch categories; other industries
                  aren&rsquo;t indexed yet.
                </p>
                {(activeChips.length > 0 || query) && (
                  <Button asChild variant="secondary" className="mt-2">
                    <Link href="/library">Browse everything</Link>
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
    </>
  );
}

function withoutCategory(filters: SearchFilters): SearchFilters {
  const next = { ...filters };
  delete next.category;
  return next;
}
