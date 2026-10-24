"use client";

import { useId, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Toggle } from "@base-ui/react/toggle";
// Components
import PostCover from "./PostCover";
import { easeOut, introItem, introScale, useIntro, useLoop } from "./DemoParts";
import { detail } from "./demo";
import { usePost } from "./HomePosts";
import { cx } from "@/lib/cx";

// A carousel as its strip of slides, each labelled with its role; pick one to see it large.
// While on screen it steps through the slides on its own; clicking a slide takes over.
// Fills its box (HowItWorks gives every illustration the same one).
// Since 2026-10-24 on Glaze: the slides are thumbnails on the tag corner with the faint hairline,
// a 2px ink ring (on the overlay corner, concentric with them) gliding to the one showing, the
// large slide on the panel corner, and the caption a paper pill with the overlay's ring. The slide
// buttons stay real toggle buttons (aria-pressed), on Base UI's Toggle, which Glaze's own toggles
// are built on: Glaze has no image toggle, and its Button and Chip are one-line pills. Glaze's
// base styles give them the ink focus ring.
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
            <Toggle
              aria-label={`Slide ${i + 1}: ${detail.sequence[i]}`}
              pressed={i === slide}
              onPressedChange={() => {
                stop();
                setSlide(i);
              }}
              className={cx(
                "relative block w-full cursor-pointer rounded-tag transition-opacity duration-(--dur-state) ease-out",
                i === slide ? "opacity-100" : "opacity-60 hover:opacity-100",
              )}
            >
              <PostCover post={post} slide={i} sizes="56px" className="rounded-tag" />
              {/* One ring that glides to the selected slide */}
              {i === slide && (
                <m.span
                  layoutId={ringId}
                  aria-hidden="true"
                  className="absolute -inset-1 rounded-overlay ring-2 ring-ink"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", duration: 0.4, bounce: 0 }}
                />
              )}
            </Toggle>
          </m.li>
        ))}
      </ol>
      {/* The slide fills the card's width, cropped from the top so the headline stays in frame */}
      <m.div variants={introScale} className="relative mt-3 min-h-0 w-full flex-1">
        <AnimatePresence initial={false}>
          <m.div
            key={slide}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: easeOut }}
          >
            <PostCover post={post} slide={slide} sizes="260px" className="h-full w-full rounded-panel [&_img]:object-top" />
          </m.div>
        </AnimatePresence>
        {/* The slide's role and count, a pill resting on the image's bottom edge */}
        <m.p
          variants={introItem}
          className="absolute inset-x-0 bottom-3 z-(--z-raised) mx-auto flex h-(--control-sm) w-fit items-center gap-1 rounded-pill border border-line bg-paper px-3 type-caption text-text-2"
          aria-live={playing ? "off" : "polite"}
        >
          <span className="type-label-sm text-text-1">{detail.sequence[slide]}</span>
          · {slide + 1} / {count}
        </m.p>
      </m.div>
    </m.div>
  );
}
