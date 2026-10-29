"use client";

// Discover's row of categories above the grid, after Cosmos's Explore: All, then each of the
// library's categories as an icon and its name, each in its category's hue (the swatch hue the
// homepage and the search panel use), the one that's on filled with it (All takes Glaze's pressed
// wash). Only categories with posts are listed, and a post counts in its brand's main
// category and in its extra tags (lib/categories). When the row is wider than the window it
// scrolls sideways, and the edge with more beyond it fades out, only while there is more, so the
// last category is never left faded.
//
// Since 2026-10-24 each is Glaze's Chip, a toggle (pressing the one that's on goes back to All,
// which a tab can't do). Every chip keeps its category's hue, the palette's recorded
// exception, through light-dark() in custom properties the chip's classes read.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Chip } from "@/components/glaze/ui/chip";
import { Icon, SquaresFour } from "@/components/glaze/icon";
import { CATEGORY_ICONS } from "./categoryIcons";
import { categoriesWithPosts } from "@/lib/categories";
import type { DashPost } from "./types";


// Every category's chip in its own colour (2026-10-24, at the owner's request): at rest a pale tint of
// its hue with the icon and name in a deep shade of it (6:1 or more in both themes), a step deeper
// under the pointer; the one that's on filled with the deep shade, its words in near-white (in near-black
// on the dark site)
const TINT = [
  "border-transparent bg-(--tint) text-(--tint-ink) [&_svg]:text-(--tint-ink)",
  "hover:not-data-disabled:border-transparent hover:not-data-disabled:bg-(--tint-hover)",
  "data-pressed:border-transparent data-pressed:bg-(--tint-ink) data-pressed:text-(--tint-on) data-pressed:[&_svg]:text-(--tint-on)",
  "hover:not-data-disabled:data-pressed:bg-(--tint-ink)",
].join(" ");
const tint = (hue: number) =>
  ({
    "--tint": `light-dark(oklch(0.95 0.035 ${hue}), oklch(0.27 0.04 ${hue}))`,
    "--tint-hover": `light-dark(oklch(0.91 0.05 ${hue}), oklch(0.32 0.05 ${hue}))`,
    "--tint-ink": `light-dark(oklch(0.42 0.09 ${hue}), oklch(0.86 0.08 ${hue}))`,
    "--tint-on": `light-dark(oklch(0.99 0.01 ${hue}), oklch(0.2 0.03 ${hue}))`,
  }) as CSSProperties;

export default function CategoryBar({ posts, value, onChange }: { posts: DashPost[]; value: string | null; onChange: (category: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  const options = useMemo(() => categoriesWithPosts(posts), [posts]);

  // Which edges have more to scroll to; only a change at an edge updates the bar, not every scroll event
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    const measure = () => {
      const left = row.scrollLeft > 1;
      const right = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
      setMore((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    measure();
    row.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => {
      row.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [options]);

  // The fades: an edge with more beyond it runs from transparent to opaque over 48px
  const fades = { "--fade-l": more.left ? "transparent" : "black", "--fade-r": more.right ? "transparent" : "black" } as CSSProperties;

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Categories"
      // Spread evenly from the page's left gutter to its right one while the chips fit (the gaps
      // grow, the chips keep their size); once they don't, space-between packs them and the row scrolls
      className="-mx-4 mb-8 flex justify-between gap-1 overflow-x-auto px-4 py-2 scrollbar-none [mask-image:linear-gradient(to_right,var(--fade-l),black_48px,black_calc(100%-48px),var(--fade-r))] sm:-mx-6 sm:px-6"
      style={fades}
    >
      <Chip pressed={value === null} onPressedChange={() => onChange(null)}>
        <Icon icon={SquaresFour} />
        All
      </Chip>
      {options.map((option) => {
        const on = option.slug === value;
        const glyph = CATEGORY_ICONS[option.slug];
        return (
          <Chip key={option.slug} pressed={on} onPressedChange={() => onChange(on ? null : option.slug)} className={TINT} style={tint(option.hue)}>
            {glyph && <Icon icon={glyph} />}
            {option.name}
          </Chip>
        );
      })}
    </div>
  );
}
