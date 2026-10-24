"use client";

// The empty Saved view's illustration, the "Pocket" direction (chosen from a three-way prototype
// on 2026-10-11): the header's bookmark drawn large as a pocket, three posts from the feed
// dropping into it one after another, then a count popping onto its corner. Where your saves go,
// and that they're counted. A drawing, kept as one since 2026-10-24 on Glaze's tokens: the
// pocket's inside is the grey field and its face paper (so the face is lighter than the inside in
// both themes), its outline and seam Glaze's line, the posts on the panel corner lifted with Fluid
// Functionalism's surface pair, and the count Glaze's Badge. Covers real. The motion runs once
// (.saved-art-* in global.css); reduced motion shows the finished scene. Decorative: the words
// under it say what to do.
import { useMemo, type CSSProperties } from "react";
import Image from "next/image";
import { Badge } from "@/components/glaze/ui/badge";
import { cx } from "@/lib/cx";
import { useBoards } from "./boards";
import type { DashPost } from "./types";

const BACK = "M18 0H142A18 18 0 0 1 160 18V200L80 170L0 200V18A18 18 0 0 1 18 0Z";
// Where the face starts: the posts show above it
const MOUTH = 100;
const FRONT = `M0 ${MOUTH}H160V200L80 170L0 200Z`;

export default function SavedArt({ className }: { className?: string }) {
  const { list } = useBoards();
  // Three posts from different categories, so the pocket holds a mix
  const posts = useMemo(() => {
    const picked: DashPost[] = [];
    for (const post of list) {
      if (!picked.some((p) => p.category.slug === post.category.slug)) picked.push(post);
      if (picked.length === 3) break;
    }
    return picked;
  }, [list]);
  if (posts.length < 3) return null;
  const cards = [
    { post: posts[0], x: -38, angle: -12, delay: 0 },
    { post: posts[2], x: 38, angle: 12, delay: 110 },
    { post: posts[1], x: 0, angle: 0, delay: 220 },
  ];

  return (
    <div aria-hidden="true" className={cx("pointer-events-none relative h-60 w-72 select-none", className)}>
      <div className="absolute bottom-2 left-1/2 h-50 w-40 -translate-x-1/2">
        {/* The pocket's inside */}
        <svg viewBox="0 0 160 200" className="absolute inset-0 overflow-visible">
          <path d={BACK} fill="var(--field)" stroke="var(--line)" strokeWidth="1.5" />
        </svg>
        {/* The posts, dropping in */}
        {cards.map(({ post, x, angle, delay }) => (
          <div
            key={post.shortCode}
            className="absolute top-1 left-1/2 w-24 rotate-(--angle) [translate:calc(-50%+var(--x))_0]"
            style={{ "--x": `${x}px`, "--angle": `${angle}deg` } as CSSProperties}
          >
            <div
              className="saved-art-card relative aspect-4/5 overflow-hidden rounded-panel bg-surface-4 shadow-surface-4 [animation-delay:var(--delay)]"
              style={{ "--delay": `${delay}ms` } as CSSProperties}
            >
              <Image src={post.cover} alt="" fill sizes="96px" className="object-cover" />
            </div>
          </div>
        ))}
        <svg viewBox="0 0 160 200" className="absolute inset-0 overflow-visible">
          <defs>
            <linearGradient id="saved-art-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ink)" stopOpacity="0" />
              <stop offset="1" stopColor="var(--ink)" stopOpacity="0.22" />
            </linearGradient>
          </defs>
          {/* Where the posts slip in behind the face */}
          <rect x="1" y={MOUTH - 14} width="158" height="14" fill="url(#saved-art-shade)" />
          {/* The face, lighter than the inside, with a stitched seam */}
          <path d={FRONT} fill="var(--paper)" stroke="var(--line)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={`M14 ${MOUTH + 12}H146`} stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 5" strokeLinecap="round" />
        </svg>
        {/* The count, arriving once they're in */}
        <Badge count={3} className="saved-art-badge absolute -top-2.5 -right-2.5" />
      </div>
    </div>
  );
}
