"use client";

import { useId, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
// Components
import PostCover from "./PostCover";
import { easeOut, introItem, introScale, useIntro, useLoop } from "./DemoParts";
import { detail } from "./demo";
import { usePost } from "./HomePosts";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";

// A carousel as its strip of slides, each labelled with its role; pick one to see it large.
// While on screen it steps through the slides on its own; clicking a slide takes over.
// Fills its box (HowItWorks gives every illustration the same one).
// Since 2026-10-23 the slides are drawn as the post page draws its thumbnails (10px corners,
// the one stroke, a 2px ring of the ink on the one showing) and the large slide takes the tile
// corner with the ladder's shadow; the caption pill is a raised surface. The slide buttons stay
// real buttons (aria-pressed), since they're images, not labels.
export default function DetailDemo() {
  const [slide, setSlide] = useState(0);
  const post = usePost(detail.post);
  const count = post?.images.length ?? 1;
  const { ref, playing, stop } = useLoop<HTMLDivElement>(2200, () =>
    setSlide((i) => (i + 1) % count),
  );
  const ringId = useId();
  const reduceMotion = useReducedMotion();
  const intro = useIntro();
  if (!post) return null;

  return (
    <m.div
      ref={ref}
      {...intro}
      className="flex h-full flex-col items-center pb-10"
    >
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
                "relative block w-full rounded-[10px] transition-opacity duration-150 ease-out-quint focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
                i === slide ? "opacity-100" : "opacity-60 hover:opacity-100",
              )}
            >
              <PostCover
                post={post}
                slide={i}
                sizes="56px"
                className="rounded-[10px]"
              />
              {/* One ring that glides to the selected slide */}
              {i === slide && (
                <m.span
                  layoutId={ringId}
                  aria-hidden="true"
                  className="absolute -inset-1 rounded-[14px] ring-2 ring-foreground"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", duration: 0.4, bounce: 0 }
                  }
                />
              )}
            </button>
          </m.li>
        ))}
      </ol>
      {/* The slide fills the card's width, cropped from the top so the headline stays in frame */}
      <m.div
        variants={introScale}
        className="relative mt-3 min-h-0 w-full flex-1"
      >
        <AnimatePresence initial={false}>
          <m.div
            key={slide}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, transition: { duration: 0.2 } }
            }
            transition={{ duration: 0.3, ease: easeOut }}
          >
            <PostCover
              post={post}
              slide={slide}
              sizes="260px"
              className="h-full w-full rounded-[12px] shadow-surface-2 [&_img]:object-top"
            />
          </m.div>
        </AnimatePresence>
        {/* The slide's role and count, a pill resting on the image's bottom edge */}
        <m.p
          variants={introItem}
          className="absolute inset-x-0 bottom-3 z-10 mx-auto flex h-7 w-fit items-center rounded-[20px] bg-surface-3/90 px-3 text-caption-lg text-muted-foreground shadow-surface-2 backdrop-blur-sm"
          aria-live={playing ? "off" : "polite"}
        >
          <span className="text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
            {detail.sequence[slide]}
          </span>{" "}
          · {slide + 1} / {count}
        </m.p>
      </m.div>
    </m.div>
  );
}
