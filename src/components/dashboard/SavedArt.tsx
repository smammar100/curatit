"use client";

// The empty Saved view's illustration, the "Pocket" direction (chosen from a three-way prototype
// on 2026-10-11): the header's bookmark drawn large as a pocket, three posts from the feed
// dropping into it one after another, then the header's count badge popping onto its corner.
// Where your saves go, and that they're counted. A drawing, kept as one since 2026-10-23 on the
// system's tokens: the pocket's inside is the muted tint and its face a step up the surface
// ladder (so the face is lighter than the inside in both themes), its outline and seam the one
// stroke, the posts on 10px corners with the ladder's depth, and the count the ink, like the
// header's. Covers real. The motion runs once (.saved-art-* in global.css); reduced motion shows
// the finished scene. Decorative: the words under it say what to do.
import { useMemo } from "react";
import Image from "next/image";
import Badge from "@/components/fundations/elements/Badge";
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
      <div className="absolute bottom-2 left-1/2 h-[200px] w-40 -translate-x-1/2">
        {/* The pocket's inside */}
        <svg viewBox="0 0 160 200" className="absolute inset-0 overflow-visible">
          <path d={BACK} className="fill-muted stroke-border" strokeWidth="1.5" />
        </svg>
        {/* The posts, dropping in */}
        {cards.map(({ post, x, angle, delay }) => (
          <div key={post.shortCode} className="absolute top-1 left-1/2 w-24" style={{ translate: `calc(-50% + ${x}px) 0`, rotate: `${angle}deg` }}>
            <div
              className="saved-art-card relative aspect-4/5 overflow-hidden rounded-[10px] bg-muted shadow-lg outline-1 -outline-offset-1 outline-border"
              style={{ animationDelay: `${delay}ms` }}
            >
              <Image src={post.cover} alt="" fill sizes="96px" className="object-cover" />
            </div>
          </div>
        ))}
        <svg viewBox="0 0 160 200" className="absolute inset-0 overflow-visible">
          <defs>
            <linearGradient id="saved-art-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="black" stopOpacity="0" />
              <stop offset="1" stopColor="black" stopOpacity="0.22" />
            </linearGradient>
          </defs>
          {/* Where the posts slip in behind the face */}
          <rect x="1" y={MOUTH - 14} width="158" height="14" fill="url(#saved-art-shade)" />
          {/* The face, a step up the ladder from the inside, with a stitched seam */}
          <path d={FRONT} className="fill-surface-3 stroke-border" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={`M14 ${MOUTH + 12}H146`} className="stroke-border" strokeWidth="1.5" strokeDasharray="4 5" strokeLinecap="round" />
        </svg>
        {/* The header's count, arriving once they're in */}
        <Badge variant="inverted" className="saved-art-badge absolute -top-2.5 -right-2.5 tabular-nums ring-4 ring-page">
          3
        </Badge>
      </div>
    </div>
  );
}
