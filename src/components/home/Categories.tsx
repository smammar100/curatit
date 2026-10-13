"use client";

import { useId, useState, type CSSProperties } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import { CATEGORY_ICONS } from "@/components/dashboard/categoryIcons";
import type { CategoryDef } from "@/lib/categories";
import { categoryPosts, type LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";
import BrandName from "./BrandName";
import PostCover from "./PostCover";
import { easeOut } from "./DemoParts";

// Every tab shares lightness and chroma; only the hue changes, so the tabs read as one set.
// The selected pill is tabFill; tint is the hover wash, ink the icon and selected text.
// Each tone has a light and a dark value; light-dark() follows the theme's color-scheme
const tabFill = (hue: number) => `light-dark(oklch(0.9 0.06 ${hue}), oklch(0.36 0.07 ${hue}))`;
function tabTone(hue: number) {
  return {
    "--tab-tint": `light-dark(oklch(0.96 0.025 ${hue}), oklch(0.27 0.035 ${hue}))`,
    "--tab-ink": `light-dark(oklch(0.42 0.1 ${hue}), oklch(0.82 0.09 ${hue}))`,
  } as CSSProperties;
}


// One gallery, filtered by a row of category tabs. `categories` are the brands' main categories
// with enough posts to fill the gallery and `posts` just what the tabs can show (both picked on
// the server, see page.tsx); a tab's gallery takes its extra tags too. The ten slots stay put;
// each one cross-fades to its new post, slot by slot, so the grid never reflows.
export default function Categories({ categories, posts }: { categories: CategoryDef[]; posts: LibraryPost[] }) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const reduceMotion = useReducedMotion();
  const id = useId();
  const shown = categoryPosts(posts, active, 10);

  return (
    <section>
      <Wrapper variant="standard" className="py-20">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
            Every category, studied closely
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4">
            Every post is tagged from one vocabulary of 36 terms for objective, format, structure and
            visual style, so “listicle” means the same thing in every category. Pick a category to look
            inside.
          </Text>
        </div>
        {/* One scrolling row on phones (bleeding to the screen edge), a centred wrap from sm up.
            py-0.5 keeps the tabs' extended hit areas from being clipped by the scroller. */}
        <div
          role="tablist"
          aria-label="Category"
          className="scrollbar-hide -mx-4 mt-12 flex gap-1 overflow-x-auto px-4 py-0.5 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
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
                  event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
                }}
                className={cx(
                  // The pill is 40px; the pseudo-element brings the hit area to 44px
                  "relative h-10 shrink-0 touch-manipulation rounded-lg pr-4 pl-3.5 text-sm transition-[color,background-color,transform] duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-400 active:scale-[0.96]",
                  selected ? "text-(--tab-ink)" : "text-base-600 hover:bg-(--tab-tint) hover:text-base-900"
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
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {Icon && <Icon className="size-4 shrink-0 text-(--tab-ink)" />}
                  {category.name}
                </span>
              </button>
            );
          })}
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
                  exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.12 } }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: easeOut, delay: slot * 0.03 }}
                >
                  <PostCover post={post} sizes="(min-width: 1024px) 220px, 45vw" className="rounded shadow" />
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
