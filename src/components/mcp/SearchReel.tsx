"use client";

// The MCP landing page's "one search" reel (2026-10-15, replacing the before/after, after the
// "Design research took hours. Now, it's one search." section of Mobbin's homepage, at the person's
// request): a query typed out beside a search icon, then a row of that search's real results that
// runs off the window's right edge. Each result is a grey tile holding the post's cover with the
// brand's mark on its corner, and opens the post on Instagram. While the reel is on screen it
// types the next query every few seconds and the tiles arrive one after another; it pauses while
// pointed at or focused, stops in a hidden tab, and under reduced motion shows the first search
// still. The queries are buttons too, under the row, so anyone can pick one.
//
// Since 2026-10-23 the tiles are grey mats with the container corner, the cover inside them the
// tile corner with the one stroke and the ladder's shadow, the brand's mark a raised tile, and
// the queries are the system's Buttons (secondary; the chosen one the tinted muted look, with
// aria-pressed saying which) in a wrapping row.

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";
import SearchSparkle from "@/components/fundations/icons/SearchSparkle";
import { cx } from "@/lib/cx";
import { useReducedMotion } from "@/lib/motion";
import { useMounted } from "@/lib/useMounted";
import type { ExampleSearch } from "./searchExamples";

const HOLD_MS = 5200;
const TYPE_MS = 38;

export default function SearchReel({
  searches,
}: {
  searches: ExampleSearch[];
}) {
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(searches[0]?.query.length ?? 0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  // Covers are requested only after mount, so the first results stay out of the first paint
  const mounted = useMounted();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const search = searches[active];

  // Runs only while on screen, in a visible tab, without reduced motion
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let inView = false;
    const update = () =>
      setPlaying(inView && document.visibilityState === "visible");
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        update();
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // Type the active query out
  useEffect(() => {
    if (!search) return;
    if (typed >= search.query.length) return;
    const timer = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
    return () => clearTimeout(timer);
  }, [typed, search]);

  // Then hold, and move on to the next search
  const done = search ? typed >= search.query.length : true;
  useEffect(() => {
    if (!playing || paused || !done || searches.length < 2) return;
    const timer = setTimeout(
      () => choose((active + 1) % searches.length),
      HOLD_MS,
    );
    return () => clearTimeout(timer);
  });

  // Under reduced motion a picked query shows whole rather than typing out
  function choose(i: number) {
    setActive(i);
    setTyped(reduced ? (searches[i]?.query.length ?? 0) : 0);
  }

  if (!search) return null;

  return (
    <div
      ref={ref}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* The query, typed */}
      <Text
        variant="h3"
        className="flex min-h-12 items-center gap-3 text-foreground"
        aria-live="off"
      >
        <SearchSparkle
          className="size-6 shrink-0 lg:size-7"
          aria-hidden="true"
        />
        <span className="sr-only">Search: </span>
        <span>{search.query.slice(0, typed)}</span>
        <span
          aria-hidden="true"
          className={cx(
            "-ml-2 h-[0.9em] w-px bg-foreground",
            done && "search-reel-caret",
          )}
        />
      </Text>

      {/* The results: a row that runs off the right edge (the section clips it) */}
      <ul
        key={active}
        aria-label={`Results for “${search.query}”`}
        className="mt-8 flex gap-4 sm:gap-6"
      >
        {search.results.map((result, i) => (
          <li
            key={result.shortCode}
            className="search-reel-tile group relative w-60 shrink-0 rounded-[24px] bg-card p-5 sm:w-72 sm:p-6 lg:w-80"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            {/* The cover zooms in a touch under the pointer, inside its clipped frame (isolate
                keeps Safari clipping the rounded corners while it scales) */}
            <div className="relative isolate aspect-4/5 overflow-hidden rounded-[12px] bg-muted shadow-surface-2 ring-1 ring-border">
              {mounted && (
                <Image
                  src={result.cover}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 272px, (min-width: 640px) 240px, 200px"
                  className="object-cover transition-[scale] duration-300 ease-out-quint motion-safe:group-hover:scale-[1.03]"
                />
              )}
            </div>
            {/* The brand's mark on the tile's corner, like an app icon */}
            <div className="absolute top-3 left-3 size-12 overflow-hidden rounded-[12px] bg-surface-3 shadow-surface-2 sm:size-14">
              {mounted && result.logo ? (
                <Image
                  src={result.logo}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 rounded-[24px] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
            >
              <span className="sr-only">
                Open this {result.brand} post on Instagram (opens in a new tab)
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Every search as a button, so it can be picked rather than waited for */}
      <div
        role="group"
        aria-label="Example searches"
        className="mt-6 flex flex-wrap gap-2"
      >
        {searches.map((option, i) => (
          <Button
            key={option.query}
            variant={i === active ? "muted" : "secondary"}
            size="sm"
            aria-pressed={i === active}
            onClick={() => choose(i)}
          >
            {option.query}
          </Button>
        ))}
      </div>
    </div>
  );
}
