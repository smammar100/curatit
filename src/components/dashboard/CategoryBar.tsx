"use client";

// Discover's row of categories above the grid, after Cosmos's Explore: All, then each of the
// library's categories as an icon and its name in the tab size, quiet grey, with only the one
// that's on sitting in a soft pill, tinted with its category's hue (the swatch hue the homepage
// and the search panel use; All stays grey). The icons are the homepage category tabs'
// (Categories). Only categories with posts are listed, and a post counts in its brand's main
// category and in its extra tags (lib/categories). When the row is wider than the window it scrolls sideways, and the edge with more beyond it fades out, only
// while there is more, so the last category is never left faded.
import { useEffect, useMemo, useRef, useState } from "react";
import SquaresFour from "@/components/fundations/icons/SquaresFour";
import { categoriesWithPosts } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { CATEGORY_ICONS } from "./categoryIcons";
import type { DashPost } from "./types";

const FADE = "48px";

export default function CategoryBar({ posts, value, onChange }: { posts: DashPost[]; value: string | null; onChange: (category: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  const options = useMemo(() => categoriesWithPosts(posts), [posts]);

  // Which edges have more to scroll to
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const measure = () => setMore({ left: row.scrollLeft > 1, right: row.scrollLeft + row.clientWidth < row.scrollWidth - 1 });
    measure();
    row.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => {
      row.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [options]);

  const mask = `linear-gradient(to right, ${more.left ? "transparent" : "black"}, black ${FADE}, black calc(100% - ${FADE}), ${more.right ? "transparent" : "black"})`;
  const item = (on: boolean) =>
    cx(
      "flex h-11 shrink-0 items-center gap-2 rounded-full pr-5 pl-4 text-title font-medium whitespace-nowrap transition-[background-color,color] duration-150",
      on ? "bg-base-100 text-base-900" : "text-base-500 hover:text-base-900",
    );
  // The selected category's pill: a pale tint of its hue with the icon and name in a deep shade
  // of it (6.3:1 or more in both themes), through light-dark() as inline colours do here
  const tint = (hue: number) => ({
    background: `light-dark(oklch(0.93 0.04 ${hue}), oklch(0.32 0.05 ${hue}))`,
    color: `light-dark(oklch(0.42 0.09 ${hue}), oklch(0.86 0.08 ${hue}))`,
  });

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Categories"
      // Spread evenly from the page's left gutter to its right one while the tabs fit (the gaps
      // grow, the tabs keep their size); once they don't, space-between packs them and the row scrolls
      className="scrollbar-hide -mx-4 mb-8 flex justify-between gap-1 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={item(value === null)}>
        <SquaresFour aria-hidden="true" className="size-4.5 shrink-0" />
        All
      </button>
      {options.map((option) => {
        const on = option.slug === value;
        const Glyph = CATEGORY_ICONS[option.slug];
        return (
          <button key={option.slug} type="button" aria-pressed={on} onClick={() => onChange(on ? null : option.slug)} className={item(on)} style={on ? tint(option.hue) : undefined}>
            {Glyph && <Glyph aria-hidden="true" className="size-4.5 shrink-0" />}
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
