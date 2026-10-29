"use client";

// The empty search's illustration, the "Flip" direction (chosen from a five-way prototype on
// 2026-10-29, at the owner's request): a hand of real posts fans open and the middle card turns
// over to show it's blank, the search bar's own magnifying glass on its back. The post that was
// described isn't in the hand. Covers real, from different brands; Glaze's tokens and Fluid
// Functionalism's surface ladder. The motion runs once (.search-art-* in global.css, transform
// only); reduced motion shows the finished hand. Decorative: the words under it say what to do.
import { useMemo, type CSSProperties } from "react";
import Image from "next/image";
import { Icon, Search } from "@/components/glaze/icon";
import { cx } from "@/lib/cx";
import { useBoards } from "./boards";
import type { DashPost } from "./types";

// How far each card in the hand turns, outside in; the middle one is the card that flips
const ANGLES = [-30, -15, 15, 30];

export default function SearchEmptyArt({ className }: { className?: string }) {
  const { list } = useBoards();
  // Five posts from different brands: four for the hand, one for the card that turns over
  const posts = useMemo(() => {
    const picked: DashPost[] = [];
    for (const post of list) {
      if (!picked.some((p) => p.brand.slug === post.brand.slug)) picked.push(post);
      if (picked.length === 5) break;
    }
    return picked;
  }, [list]);
  if (posts.length < 5) return null;

  return (
    <div aria-hidden="true" className={cx("pointer-events-none relative h-50 w-80 select-none", className)}>
      {ANGLES.map((angle, i) => (
        <div
          key={posts[i].shortCode}
          className="search-art-card absolute top-14 left-1/2 -ml-9 aspect-4/5 w-18 overflow-hidden rounded-tag bg-field shadow-surface-2"
          style={{ "--angle": `${angle}deg`, "--delay": `${120 + Math.abs(angle) * 4}ms` } as CSSProperties}
        >
          <Image src={posts[i].cover} alt="" fill sizes="72px" className="object-cover" />
        </div>
      ))}
      <div className="search-art-flip absolute top-14 left-1/2 -ml-10 aspect-4/5 w-20">
        <div className="search-art-face absolute inset-0 overflow-hidden rounded-tag bg-field shadow-surface-4">
          <Image src={posts[4].cover} alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="search-art-face search-art-back absolute inset-0 flex items-center justify-center rounded-tag border border-dashed border-line-strong bg-paper shadow-surface-4">
          <Icon icon={Search} size={32} className="text-text-3" />
        </div>
      </div>
    </div>
  );
}
