"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Text from "@/components/fundations/elements/Text";
import SlideArt from "@/components/product/SlideArt";
import type { LandingLibrary } from "@/lib/services/creatives";
import { hoverEase, smoothEase } from "./tokens";

/** Resting and hover poses for the three stacked covers (back → front). */
const rest = [
  { x: -18, rotate: -6 },
  { x: 18, rotate: 6 },
  { x: 0, rotate: 0 },
];
const spread = [
  { x: -64, rotate: -10 },
  { x: 64, rotate: 10 },
  { x: 0, rotate: 0, y: -6 },
];

export default function LibraryShowcase({ library, signedIn }: { library: LandingLibrary; signedIn: boolean }) {
  return (
    <section className="px-8 py-24 md:px-16">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="flex flex-wrap items-end justify-between gap-6"
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: smoothEase }}
        >
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[2.5px] text-base-500">Inside the library</p>
            <Text tag="h2" variant="displayLG" className="mt-4 font-display font-light text-base-900 text-balance">
              Six categories, studied closely.
            </Text>
          </div>
          <Text tag="p" variant="textSM" className="max-w-sm text-base-600">
            We start narrow and deep: recognisable brands, Instagram statics and carousels, every post reviewed by an
            editor. New categories open only once they&rsquo;re properly covered.
          </Text>
        </motion.div>

        <ul className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {library.categories.map((category, index) => {
            const target = `/library?category=${category.id}`;
            const href = signedIn ? target : `/signup?next=${encodeURIComponent(target)}`;
            return (
              <motion.li
                key={category.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: smoothEase, delay: (index % 3) * 0.06 }}
              >
                <motion.div initial="rest" whileHover="spread" whileFocus="spread" animate="rest">
                  <Link
                    href={href}
                    className="block rounded-lg focus:outline-2 focus:outline-offset-4 focus:outline-accent-500"
                  >
                    <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-lg bg-base-50">
                      {category.covers.map((cover, coverIndex) => (
                        <motion.div
                          key={coverIndex}
                          className="absolute w-32 overflow-hidden rounded shadow-lg"
                          style={{ zIndex: coverIndex }}
                          variants={{ rest: rest[coverIndex], spread: spread[coverIndex] }}
                          transition={{ duration: 0.35, ease: hoverEase }}
                        >
                          <SlideArt art={cover.art} alt="" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <Text tag="h3" variant="textBase" className="font-medium text-base-900">
                        {category.name}
                      </Text>
                      <span className="text-xs text-base-500">
                        {category.count} reference{category.count === 1 ? "" : "s"} →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              </motion.li>
            );
          })}
        </ul>

        <p className="mt-6 text-xs text-base-400">
          Shown with Curatit&rsquo;s demo library of fictional brands while launch sources are approved.
        </p>
      </div>
    </section>
  );
}
