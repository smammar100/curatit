"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import type { LibraryPost } from "@/lib/posts";
import { cx } from "@/lib/cx";
import BrandName from "./BrandName";
import PostCover from "./PostCover";
import { easeOut } from "./DemoParts";
import { categories } from "./demo";

// The newest posts in a category, taking one brand at a time so the grid isn't all one brand
function categoryPosts(posts: LibraryPost[], category: string, count: number) {
  const queues = Map.groupBy(
    posts.filter((post) => post.category.slug === category),
    (post) => post.brand.slug
  );
  const picked: LibraryPost[] = [];
  while (picked.length < count && [...queues.values()].some((queue) => queue.length)) {
    for (const queue of queues.values()) {
      const next = queue.shift();
      if (next && picked.length < count) picked.push(next);
    }
  }
  return picked;
}

// One gallery, filtered by a row of category tabs. The ten slots stay where they are;
// each one cross-fades to its new post, slot by slot, so the grid never reflows.
export default function Categories({ posts }: { posts: LibraryPost[] }) {
  const [active, setActive] = useState(categories[0].category);
  const reduceMotion = useReducedMotion();
  const id = useId();
  const shown = categoryPosts(posts, active, 10);

  return (
    <section>
      <Wrapper variant="standard" className="py-20">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
            Six categories, studied closely
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
          className="scrollbar-hide -mx-8 mt-12 flex gap-1 overflow-x-auto px-8 py-0.5 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
        >
          {categories.map((category) => {
            const selected = category.category === active;
            const count = posts.filter((post) => post.category.slug === category.category).length;
            return (
              <button
                key={category.category}
                type="button"
                role="tab"
                id={`${id}-${category.category}`}
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                onClick={(event) => {
                  setActive(category.category);
                  event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
                }}
                className={cx(
                  // The pill is 40px; the pseudo-element brings the hit area to 44px
                  "relative h-10 shrink-0 touch-manipulation rounded-lg px-4 text-sm transition-[color,transform] duration-150 ease-out before:absolute before:inset-x-0 before:-inset-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-400 active:scale-[0.96]",
                  selected ? "text-white" : "text-base-600 hover:text-base-900"
                )}
              >
                {selected && (
                  <motion.span
                    layoutId={`${id}-pill`}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg bg-base-800"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0 }}
                  />
                )}
                <span className="relative">
                  {category.name}
                  <span className={cx("ml-1.5 text-xs tabular-nums", selected ? "text-white/60" : "text-base-400")}>
                    {count}
                  </span>
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
                <motion.div
                  key={post.shortCode}
                  className="min-w-0 [grid-area:1/1]"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.12 } }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: easeOut, delay: slot * 0.03 }}
                >
                  <PostCover post={post} sizes="(min-width: 1024px) 220px, 45vw" className="rounded shadow" />
                  <BrandName brand={post.brand} className="mt-2" />
                  <p className="truncate text-xs text-base-500">{post.hook}</p>
                </motion.div>
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </Wrapper>
    </section>
  );
}
