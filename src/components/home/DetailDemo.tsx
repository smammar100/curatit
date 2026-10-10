"use client";

import { useId, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
// Components
import PostCover from "./PostCover";
import { easeOut, introItem, introScale, useIntro, useLoop } from "./DemoParts";
import { detail } from "./demo";
import { usePost } from "./HomePosts";
import { cx } from "@/lib/cx";

// A carousel as its strip of slides, each labelled with its role; pick one to see it large.
// While on screen it steps through the slides on its own; clicking a slide takes over.
// Fills its box (HowItWorks gives every illustration the same one).
export default function DetailDemo() {
  const [slide, setSlide] = useState(0);
  const post = usePost(detail.post);
  const count = post?.images.length ?? 1;
  const { ref, playing, stop } = useLoop<HTMLDivElement>(2200, () => setSlide((i) => (i + 1) % count));
  const ringId = useId();
  const reduceMotion = useReducedMotion();
  const intro = useIntro();
  if (!post) return null;

  return (
    <m.div ref={ref} {...intro} className="flex h-full flex-col items-center pb-10">
      <ol className="grid w-full grid-cols-5 gap-1.5">
        {post.images.map((_, i) => (
          <m.li key={i} variants={introItem}>
            <button
              type="button"
              aria-label={`Slide ${i + 1}: ${detail.sequence[i]}`}
              aria-pressed={i === slide}
              onClick={() => {
                stop();
                setSlide(i);
              }}
              className={cx(
                "relative block w-full rounded transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-400",
                i === slide ? "opacity-100" : "opacity-60 hover:opacity-100"
              )}
            >
              <PostCover post={post} slide={i} sizes="56px" className="rounded" />
              {/* One ring that glides to the selected slide */}
              {i === slide && (
                <m.span
                  layoutId={ringId}
                  aria-hidden="true"
                  className="absolute -inset-1 rounded-md ring-2 ring-base-800"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }}
                />
              )}
            </button>
          </m.li>
        ))}
      </ol>
      <m.p variants={introItem} className="mt-3 text-center text-xs text-base-600" aria-live={playing ? "off" : "polite"}>
        <span className="font-medium text-base-900">{detail.sequence[slide]}</span> · {slide + 1} / {count}
      </m.p>
      <m.div variants={introScale} className="relative mt-3 aspect-4/5 min-h-0 flex-1">
        <AnimatePresence initial={false}>
          <m.div
            key={slide}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: easeOut }}
          >
            <PostCover post={post} slide={slide} sizes="260px" className="h-full rounded shadow" />
          </m.div>
        </AnimatePresence>
      </m.div>
    </m.div>
  );
}
