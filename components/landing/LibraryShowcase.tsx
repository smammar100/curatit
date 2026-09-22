"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SlideArt from "@/components/product/SlideArt";
import type { LandingLibrary } from "@/lib/services/creatives";
import Backdrop from "./Backdrop";
import { hoverEase } from "./tokens";

/** Resting and hover poses for the three stacked covers (back → front). */
const poses = {
  rest: [
    { x: -22, rotate: -7, y: 4 },
    { x: 22, rotate: 7, y: 4 },
    { x: 0, rotate: 0, y: 0 },
  ],
  spread: [
    { x: -70, rotate: -11, y: 8 },
    { x: 70, rotate: 11, y: 8 },
    { x: 0, rotate: 0, y: -8 },
  ],
};

export default function LibraryShowcase({ library, signedIn }: { library: LandingLibrary; signedIn: boolean }) {
  return (
    <section className="px-8 py-24 md:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <h2 className="max-w-lg font-display text-4xl font-light leading-tight text-ink md:text-5xl">
            Six categories, studied closely.
          </h2>
          <p className="max-w-md text-sm text-ink-muted lg:justify-self-end">
            We start narrow and deep: recognisable brands, Instagram statics and carousels, every post reviewed by an
            editor. New categories open only once they&rsquo;re properly covered.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {library.categories.map((category) => {
            const target = `/library?category=${category.id}`;
            const href = signedIn ? target : `/signup?next=${encodeURIComponent(target)}`;
            return (
              <li key={category.id}>
                <motion.div initial="rest" animate="rest" whileHover="spread" whileFocus="spread">
                  {/* One labelled link stretched over the card, instead of wrapping the whole card in <a>. */}
                  <div className="group relative overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line transition-shadow duration-150 ease-out hover:shadow-window has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent-500">
                    <div className="relative flex h-60 items-center justify-center overflow-hidden">
                      <Backdrop covers={category.covers} />
                      {category.covers.map((cover, index) => (
                        <motion.div
                          key={index}
                          className="absolute w-28 overflow-hidden rounded-md shadow-window ring-1 ring-line"
                          style={{ zIndex: index }}
                          variants={{ rest: poses.rest[index], spread: poses.spread[index] }}
                          transition={{ duration: 0.3, ease: hoverEase }}
                        >
                          <SlideArt art={cover.art} alt="" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="flex items-end justify-between gap-4 border-t border-line p-5">
                      <div>
                        <h3 className="font-display text-xl text-ink">{category.name}</h3>
                        <p className="mt-1 text-xs tabular-nums text-ink-subtle">
                          {category.count} references · {category.objectives} objectives
                        </p>
                      </div>
                      <Link
                        href={href}
                        aria-label={`Browse ${category.name}`}
                        className="shrink-0 rounded-lg bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 ease-out outline-none group-hover:bg-surface-inset after:absolute after:inset-0 after:content-['']"
                      >
                        Browse <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-xs text-ink-subtle">
          Shown with Curatit&rsquo;s demo library of fictional brands while launch sources are approved.
        </p>
      </div>
    </section>
  );
}
