"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Input from "@/components/fundations/elements/Input";
import Text from "@/components/fundations/elements/Text";
// Components
import BrandName from "./BrandName";
import PostCover from "./PostCover";
import { introFromRight, introItem, useIntro, useLoop } from "./DemoParts";
import { board } from "./demo";
import { usePosts } from "./HomePosts";
import { cx } from "@/lib/cx";

// The board as the client opens it: the share link, then the references with their notes
// in a strip that runs off the right edge. While on screen the strip drifts and the link
// copies itself every few seconds; clicking Copy takes over.
// Fills its box (HowItWorks gives every illustration the same one).
// Since 2026-10-23 the link field is the system's Input (read-only, selects on focus) beside the
// primary Button, which carries the Copied state; the covers take the tile corner and the
// surface ladder's shadow.
export default function BoardDemo() {
  const [copied, setCopied] = useState(false);
  const { ref, playing, stop } = useLoop<HTMLDivElement>(5000, () =>
    setCopied(true),
  );
  const posts = usePosts(board.references.map((reference) => reference.post));
  const intro = useIntro();

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <m.div ref={ref} {...intro} className="flex h-full flex-col pb-10">
      <m.div variants={introItem} className="flex items-center gap-2">
        <Input
          readOnly
          value="curatit.com/s/k7Qm2xVbR4"
          aria-label="Example share link"
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={() => {
            stop();
            setCopied(true);
          }}
          className="shrink-0"
        >
          {/* Both labels share one cell, so the button keeps its width (and the link field
              its own) when it says Copied; the hidden one is out of the button's name */}
          <span className="grid">
            <span className={cx("[grid-area:1/1]", copied && "invisible")}>
              Copy example link
            </span>
            <span className={cx("[grid-area:1/1]", !copied && "invisible")}>
              Copied
            </span>
          </span>
        </Button>
      </m.div>
      <m.div variants={introItem} className="mt-5">
        <Text tag="p" variant="h6" className="text-foreground">
          {board.name}
        </Text>
        <p className="mt-0.5 text-caption-lg text-muted-foreground">
          Read-only · {posts.length} references
        </p>
      </m.div>
      {/* Bleeds into the card's right padding so the last cover is cut by the edge. A size
          container, so each item can take its width from the strip's height (cqh). */}
      <m.div
        variants={introFromRight}
        className="-mr-6 mt-3 min-h-0 flex-1 overflow-hidden [container-type:size] lg:-mr-8"
      >
        <m.ul
          className="flex h-full gap-3"
          animate={playing ? { x: [0, -32] } : { x: 0 }}
          transition={
            playing
              ? {
                  duration: 6,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "mirror",
                }
              : { duration: 0.4, ease: "easeOut" }
          }
        >
          {posts.map((post) => {
            const { note } = board.references.find(
              (reference) => reference.post === post.shortCode,
            )!;
            return (
              // Cover height is the strip minus the two caption lines (2.5rem); width follows at 4:5
              <li
                key={post.shortCode}
                className="w-[calc((100cqh-2.5rem)*0.8)] shrink-0"
              >
                <PostCover
                  post={post}
                  sizes="180px"
                  className="w-full rounded-[12px] shadow-surface-2"
                />
                <BrandName brand={post.brand} className="mt-2" />
                <p className="truncate text-caption-lg text-muted-foreground">
                  {note}
                </p>
              </li>
            );
          })}
        </m.ul>
      </m.div>
    </m.div>
  );
}
