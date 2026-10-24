"use client";

// Discover's row of categories above the grid, after Cosmos's Explore: All, then each of the
// library's categories as an icon and its name, with only the one that's on pressed, tinted with
// its category's hue (the swatch hue the homepage and the search panel use; All takes Glaze's
// pressed wash). Only categories with posts are listed, and a post counts in its brand's main
// category and in its extra tags (lib/categories). When the row is wider than the window it
// scrolls sideways, and the edge with more beyond it fades out, only while there is more, so the
// last category is never left faded.
//
// Since 2026-10-24 each is Glaze's Chip, a toggle (pressing the one that's on goes back to All,
// which a tab can't do). The one that's on keeps its category's hue, the palette's recorded
// exception, through light-dark() in custom properties the chip's classes read.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Chip } from "@/components/glaze/ui/chip";
import {
  AddressBook,
  AirplaneTilt,
  Barbell,
  Basketball,
  BookOpen,
  Briefcase,
  Camera,
  ChatsCircle,
  Code,
  CreditCard,
  CurrencyBtc,
  FirstAid,
  ForkKnife,
  GraduationCap,
  Handshake,
  House,
  Icon,
  Light,
  ListChecks,
  MapTrifold,
  MusicNotes,
  Newspaper,
  PaintBrush,
  Popcorn,
  ShareNetwork,
  ShoppingBag,
  Sparkle,
  SquaresFour,
  Tool,
  UsersThree,
  type GlazeIcon,
} from "@/components/glaze/icon";
import { categoriesWithPosts } from "@/lib/categories";
import type { DashPost } from "./types";

// Each category's glyph, by slug: the same Phosphor glyphs as categoryIcons.ts (the homepage's
// tabs and the welcome flow's folders), from Glaze's icon set, for the row and the search panel
export const CATEGORY_GLYPHS: Record<string, GlazeIcon> = {
  ai: Sparkle,
  business: Briefcase,
  collaboration: UsersThree,
  communication: ChatsCircle,
  crm: AddressBook,
  "crypto-web3": CurrencyBtc,
  "developer-tools": Code,
  education: GraduationCap,
  entertainment: Popcorn,
  finance: CreditCard,
  "food-drink": ForkKnife,
  "graphics-design": PaintBrush,
  "health-fitness": Barbell,
  "jobs-recruitment": Handshake,
  lifestyle: Light,
  "maps-navigation": MapTrifold,
  medical: FirstAid,
  "music-audio": MusicNotes,
  news: Newspaper,
  "photo-video": Camera,
  productivity: ListChecks,
  "real-estate": House,
  reference: BookOpen,
  shopping: ShoppingBag,
  "social-networking": ShareNetwork,
  sports: Basketball,
  "travel-transportation": AirplaneTilt,
  utilities: Tool,
};

// The selected category's chip: a pale tint of its hue with the icon and name in a deep shade of
// it (6.3:1 or more in both themes)
const TINT = "data-pressed:border-transparent data-pressed:bg-(--tint) data-pressed:text-(--tint-ink) data-pressed:[&_svg]:text-(--tint-ink)";
const tint = (hue: number) =>
  ({
    "--tint": `light-dark(oklch(0.93 0.04 ${hue}), oklch(0.32 0.05 ${hue}))`,
    "--tint-ink": `light-dark(oklch(0.42 0.09 ${hue}), oklch(0.86 0.08 ${hue}))`,
  }) as CSSProperties;

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
        const glyph = CATEGORY_GLYPHS[option.slug];
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
