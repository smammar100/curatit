"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import { CATEGORY_ICONS } from "@/components/dashboard/categoryIcons";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
import type { CategoryDef } from "@/lib/categories";
import type { PostCard } from "@/lib/posts";
import { cx } from "@/lib/cx";
import BrandName from "./BrandName";
import PostCover from "./PostCover";
import { easeOut } from "./DemoParts";

// Every tab shares lightness and chroma; only the hue changes, so the tabs read as one set.
// The selected pill is tabFill; tint is the hover wash, ink the icon and selected text.
// Each tone has a light and a dark value; light-dark() follows the theme's color-scheme
const tabFill = (hue: number) =>
  `light-dark(oklch(0.9 0.06 ${hue}), oklch(0.36 0.07 ${hue}))`;
function tabTone(hue: number) {
  return {
    "--tab-tint": `light-dark(oklch(0.96 0.025 ${hue}), oklch(0.27 0.035 ${hue}))`,
    "--tab-ink": `light-dark(oklch(0.42 0.1 ${hue}), oklch(0.82 0.09 ${hue}))`,
  } as CSSProperties;
}

// One gallery, filtered by a row of category tabs. `categories` are the brands' main categories
// with enough posts to fill the gallery and `galleries` each tab's ten posts, by slug (both picked
// on the server, see page.tsx); a tab's gallery takes its extra tags too. The ten slots stay put;
// each one cross-fades to its new post, slot by slot, so the grid never reflows.
export default function Categories({
  categories,
  galleries,
}: {
  categories: CategoryDef[];
  galleries: Record<string, PostCard[]>;
}) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const reduceMotion = useReducedMotion();
  const id = useId();
  const shown = galleries[active] ?? [];

  // The tab row scrolls sideways once it doesn't fit; which edges have more beyond them
  // (2026-10-15, at the person's request, after the dashboard's CategoryBar): that edge fades
  // and gets a caret that scrolls the row, only while there is more
  const row = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const measure = () =>
      setMore({
        left: el.scrollLeft > 1,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      });
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [categories]);
  // An edge with more beyond it is fully clear under its caret (which ends 4.75rem in from
  // the edge), then fades in, so no tab text shows through the caret
  const edge = (side: "left" | "right") =>
    side === "left"
      ? more.left
        ? "transparent 0, transparent 4.75rem, black 8rem"
        : "black 0"
      : more.right
        ? "black calc(100% - 8rem), transparent calc(100% - 4.75rem), transparent 100%"
        : "black 100%";
  const mask = `linear-gradient(to right, ${edge("left")}, ${edge("right")})`;
  const nudge = (dir: 1 | -1) =>
    row.current?.scrollBy({
      left: dir * row.current.clientWidth * 0.6,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  const caret =
    "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-base-900 shadow ring-1 ring-base-200 transition-[background-color,scale] duration-150 ease-out-quint motion-safe:active:scale-[0.96] hover:bg-base-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus";

  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text
            tag="h2"
            variant="displayLG"
            className="text-base-900"
          >
            Explore posts by industry.
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            Browse examples from finance, food, travel and more.
          </Text>
        </div>
        {/* One scrolling row, bleeding to the page gutter.
            py-0.5 keeps the tabs' extended hit areas from being clipped by the scroller. One line at every
            width (2026-10-15, at the person's request): centred while it fits, scrolling sideways once it doesn't. */}
        <div className="relative -mx-4 mt-12 sm:-mx-8">
          {more.left && (
            <button
              type="button"
              aria-label="Scroll categories left"
              onClick={() => nudge(-1)}
              className={cx(caret, "left-4 sm:left-8")}
            >
              <CaretLeft className="size-4" />
            </button>
          )}
          {more.right && (
            <button
              type="button"
              aria-label="Scroll categories right"
              onClick={() => nudge(1)}
              className={cx(caret, "right-4 sm:right-8")}
            >
              <CaretRight className="size-4" />
            </button>
          )}
          <div
            ref={row}
            role="tablist"
            aria-label="Category"
            style={{ maskImage: mask, WebkitMaskImage: mask }}
            className="scrollbar-hide flex justify-center-safe gap-1 overflow-x-auto px-4 py-0.5 sm:px-8"
          >
            {categories.map((category) => {
              const selected = category.slug === active;
              const Icon = CATEGORY_ICONS[category.slug];
              return (
                <button
                  key={category.slug}
                  type="button"
                  role="tab"
                  id={`${id}-${category.slug}`}
                  aria-selected={selected}
                  aria-controls={`${id}-panel`}
                  style={tabTone(category.hue)}
                  onClick={(event) => {
                    setActive(category.slug);
                    event.currentTarget.scrollIntoView({
                      block: "nearest",
                      inline: "nearest",
                    });
                  }}
                  className={cx(
                    // The pill is 40px; the pseudo-element brings the hit area to 44px. The press
                    // is Tailwind's `scale` property, so that's what transitions, not transform
                    "relative h-10 shrink-0 touch-manipulation rounded-lg pr-4 pl-3.5 text-sm transition-[color,background-color,scale] duration-150 ease-out-quint before:absolute before:inset-x-0 before:-inset-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus motion-safe:active:scale-[0.96]",
                    selected
                      ? "text-(--tab-ink)"
                      : "text-base-600 hover:bg-(--tab-tint) hover:text-base-900",
                  )}
                >
                  {/* One pill that slides to the selected tab, taking on its colour as it goes */}
                  {selected && (
                    <m.span
                      layoutId={`${id}-pill`}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg"
                      initial={false}
                      animate={{ backgroundColor: tabFill(category.hue) }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", duration: 0.5, bounce: 0 }
                      }
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {Icon && (
                      <Icon className="size-4 shrink-0 text-(--tab-ink)" />
                    )}
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <ul
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-${active}`}
          className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5"
        >
          {shown.map((post, slot) => (
            // Each slot is a one-cell grid: the leaving and arriving posts overlap while they fade
            <li key={slot} className="grid grid-cols-1">
              <AnimatePresence initial={false}>
                <m.div
                  key={post.shortCode}
                  className="min-w-0 [grid-area:1/1]"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: reduceMotion ? 0 : 0.12 },
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.3, ease: easeOut, delay: slot * 0.03 }
                  }
                >
                  <PostCover
                    post={post}
                    sizes="(min-width: 1024px) 220px, 45vw"
                    className="rounded shadow"
                  />
                  <BrandName brand={post.brand} className="mt-2" />
                </m.div>
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </Wrapper>
    </section>
  );
}
