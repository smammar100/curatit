"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Glaze
import { ChevronLeft, ChevronRight, Icon } from "@/components/glaze/icon";
import { Button } from "@/components/glaze/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/glaze/ui/tabs";
// Components
import { CATEGORY_ICONS } from "@/components/dashboard/categoryIcons";
import type { CategoryDef } from "@/lib/categories";
import type { PostCard } from "@/lib/posts";
import { cx } from "@/lib/cx";
import BrandName from "./BrandName";
import PostCover from "./PostCover";
import { easeOut } from "./DemoParts";

// Every category's ink shares lightness and chroma; only the hue changes, so the icons read as one
// set. It has a light and a dark value; light-dark() follows the theme's color-scheme. The hue is
// the category's data (src/lib/categories.ts), handed to the icon as a custom property
const tabInk = (hue: number) => `light-dark(oklch(0.42 0.1 ${hue}), oklch(0.82 0.09 ${hue}))`;

// One gallery, filtered by a row of category tabs. `categories` are the brands' main categories
// with enough posts to fill the gallery and `galleries` each tab's ten posts, by slug (both picked
// on the server, see page.tsx); a tab's gallery takes its extra tags too. The ten slots stay put;
// each one cross-fades to its new post, slot by slot, so the grid never reflows.
//
// Since 2026-10-24 the row is Glaze's Tabs: its paper pill slides to the selected tab, the arrow
// keys move between tabs, and the selected one scrolls itself into view. Each tab keeps its
// category's hue on its icon (the --tab-ink property), a recorded exception to Glaze's black and
// white, since the pill itself is Glaze's and takes no colour.
export default function Categories({
  categories,
  galleries,
}: {
  categories: CategoryDef[];
  galleries: Record<string, PostCard[]>;
}) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const reduceMotion = useReducedMotion();
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
  // An edge with more beyond it is fully clear under its caret (which ends 2.25rem in from the
  // list's edge), then fades in, so no tab text shows through the caret. A mask paints nothing
  const edge = (side: "left" | "right") =>
    side === "left"
      ? more.left
        ? "transparent 0, transparent 3rem, black 6rem"
        : "black 0"
      : more.right
        ? "black calc(100% - 6rem), transparent calc(100% - 3rem), transparent 100%"
        : "black 100%";
  const mask = `linear-gradient(to right, ${edge("left")}, ${edge("right")})`;
  const nudge = (dir: 1 | -1) =>
    row.current?.scrollBy({
      left: dir * row.current.clientWidth * 0.6,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  // A caret is the secondary icon Button; this places it over the row's edge
  const caret = "absolute top-1/2 z-(--z-raised) flex -translate-y-1/2";

  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="mx-auto max-w-3xl text-center text-balance">
          <Text tag="h2" variant="h1" className="text-text-1">
            Explore posts by industry.
          </Text>
          <Text tag="p" variant="body" className="mt-4 text-text-2">
            Browse examples from finance, food, travel and more.
          </Text>
        </div>
        <Tabs value={active} onValueChange={(value) => setActive(String(value))} className="mt-12 gap-8">
          {/* One scrolling row, bleeding to the page gutter. One line at every width (2026-10-15,
              at the person's request): centred while it fits, scrolling sideways once it doesn't */}
          <div className="relative -mx-4 flex justify-center px-4 sm:-mx-8 sm:px-8">
            {more.left && (
              <span className={cx(caret, "left-4 sm:left-8")}>
                <Button variant="secondary" size="icon-lg" aria-label="Scroll categories left" onClick={() => nudge(-1)}>
                  <Icon icon={ChevronLeft} />
                </Button>
              </span>
            )}
            {more.right && (
              <span className={cx(caret, "right-4 sm:right-8")}>
                <Button variant="secondary" size="icon-lg" aria-label="Scroll categories right" onClick={() => nudge(1)}>
                  <Icon icon={ChevronRight} />
                </Button>
              </span>
            )}
            <TabsList
              ref={row}
              aria-label="Category"
              style={{ "--row-mask": mask } as CSSProperties}
              className="[mask-image:var(--row-mask)]"
            >
              {categories.map((category) => {
                const Glyph = CATEGORY_ICONS[category.slug];
                return (
                  <TabsTrigger
                    key={category.slug}
                    value={category.slug}
                    style={{ "--tab-ink": tabInk(category.hue) } as CSSProperties}
                  >
                    {Glyph && <Icon icon={Glyph} className="shrink-0 text-(--tab-ink)" />}
                    {category.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          <TabsContent value={active}>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
              {shown.map((post, slot) => (
                // Each slot is a one-cell grid: the leaving and arriving posts overlap while they fade
                <li key={slot} className="grid grid-cols-1">
                  <AnimatePresence initial={false}>
                    <m.div
                      key={post.shortCode}
                      className="col-start-1 row-start-1 min-w-0"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.12 } }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: easeOut, delay: slot * 0.03 }}
                    >
                      <PostCover post={post} sizes="(min-width: 1024px) 220px, 45vw" className="rounded-panel" />
                      <BrandName brand={post.brand} className="mt-2" />
                    </m.div>
                  </AnimatePresence>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </Wrapper>
    </section>
  );
}
