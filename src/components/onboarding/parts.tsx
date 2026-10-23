"use client";

// The pieces of the welcome flow (Welcome.tsx): the answers being made, and the pickers for the
// name and occupation, the brands and the taste test; the live wall; the chips of what the taps
// say; the end. The industries are folders (Folders.tsx).
//
// Since 2026-10-23 on the design system: the role chips are pressed Buttons (the ink while
// chosen, the hairline otherwise), the learned chips are Badges, and every picture sits on
// bg-muted with the one hairline drawn over it (as CardMedia does) and 12px corners; a picked
// brand or post wears a 2px ring of the ink inside its own edge, so no ring offset has to match
// the ground it sits on.
import { useEffect, useId, useRef, type ReactNode, type Ref } from "react";
import Image from "next/image";
import Check from "@/components/fundations/icons/Check";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import Input from "@/components/fundations/elements/Input";
import { ratio } from "@/components/dashboard/Grid";
import { learnedChips, rank } from "@/components/dashboard/forYou";
import type { Profile } from "@/components/dashboard/profile";
import type { DashPost } from "@/components/dashboard/types";
import { categoriesWithPosts, inCategory } from "@/lib/categories";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";

export const semibold = { fontVariationSettings: fontWeights.semibold };

// The hairline round a picture, drawn over it so the image can't cover it (as CardMedia does);
// `picked` thickens it into a 2px ring of the ink
export const edge =
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline-1 after:-outline-offset-1 after:outline-border after:transition-[outline-color,outline-width] after:duration-80";
export const picked = "after:outline-2 after:-outline-offset-2 after:outline-foreground";

// The answers while they're being made: the profile without the time it was finished
export type Draft = Omit<Profile, "onboardedAt" | "editor">;
export const OCCUPATIONS = ["Designer", "Marketer", "Founder", "Agency", "Creator", "Student"];
export const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export type Brand = { slug: string; name: string; logo: string | null };
export function brandsOf(posts: DashPost[]): Brand[] {
  const seen = new Map<string, Brand>();
  for (const post of posts) if (!seen.has(post.brand.slug)) seen.set(post.brand.slug, post.brand);
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// The categories that have posts (lib/categories), each with its hue and posts: a post counts in
// its brand's main category and in its extra tags
export type Category = { slug: string; name: string; hue: number; posts: DashPost[] };
export function categoriesOf(posts: DashPost[]): Category[] {
  return categoriesWithPosts(posts).map((c) => ({ ...c, posts: posts.filter((p) => inCategory(p, c.slug)) }));
}

// The step's question. It takes focus when the step changes (tabIndex -1: a target, not a stop),
// so it shows no ring of its own
export function Heading({ ref, id, title, sub, align = "center" }: { ref?: Ref<HTMLHeadingElement>; id?: string; title: string; sub?: string; align?: "center" | "left" }) {
  return (
    <div className={cx("text-balance", align === "center" && "text-center")}>
      <h1 ref={ref} id={id} tabIndex={-1} className="font-display text-display font-light text-foreground outline-none">
        {title}
      </h1>
      {sub && <p className="mt-2 text-subtitle text-muted-foreground">{sub}</p>}
    </div>
  );
}

// The steps as a stripe of segments, filled up to the one you're on
export function Progress({ step, total, className }: { step: number; total: number; className?: string }) {
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${total}`} className={cx("flex gap-1.5", className)}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx("h-1 flex-1 rounded-full transition-colors duration-80", i <= step ? "bg-foreground" : "bg-border")} />
      ))}
    </div>
  );
}

// A toggle chip: a pressed Button, the ink while it's on and the hairline while it's off
export function Chip({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <Button variant={on ? "default" : "secondary"} aria-pressed={on} onClick={onClick} className={className}>
      {children}
    </Button>
  );
}

// The name, then what they do as one tap. The name takes focus on arrival, except on touch
// (the keyboard would jump up); Enter in it submits the step. The step's question is its visible
// label, so the field is named by aria-label rather than a Field. The roles are chips rather than
// a Segmented: six of them, and a second tap clears the choice
export function NameRole({ value, onChange }: { value: Draft; onChange: (patch: Partial<Draft>) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const groupLabel = useId();
  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) ref.current?.focus();
  }, []);
  return (
    <div className="space-y-5">
      <Input
        ref={ref}
        name="name"
        aria-label="Your name"
        value={value.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Your name"
        autoComplete="given-name"
        maxLength={60}
      />
      <div>
        <p id={groupLabel} className="mb-2 text-caption text-muted-foreground" style={semibold}>
          And you’re a…
        </p>
        <div role="group" aria-labelledby={groupLabel} className="flex flex-wrap gap-1.5">
          {OCCUPATIONS.map((occupation) => (
            <Chip key={occupation} on={value.occupation === occupation} onClick={() => onChange({ occupation: value.occupation === occupation ? null : occupation })}>
              {occupation}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

// The check that marks a pick: the ink, with the page's own colour for the mark
export const Tick = ({ className }: { className?: string }) => (
  <span className={cx("flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm", className)}>
    <Check className="size-3" />
  </span>
);

// The brands as their marks, with a check over a picked one. A tile of a mark and a two-line
// name, so a plain pressed button rather than a Button, on the row look (12px corners, the
// hover tint, the one focus ring)
export function BrandGrid({ brands, value, onChange, className }: { brands: Brand[]; value: string[]; onChange: (next: string[]) => void; className?: string }) {
  return (
    <div className={cx("grid gap-1", className)}>
      {brands.map((b) => {
        const on = value.includes(b.slug);
        return (
          <button
            key={b.slug}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggle(value, b.slug))}
            className="group flex min-w-0 flex-col items-center gap-1.5 rounded-[12px] p-2 transition-[background-color,scale] duration-80 hover:bg-hover focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] motion-safe:active:scale-[0.96]"
          >
            <span className={cx("relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted", edge, on && picked)}>
              {b.logo && <Image src={b.logo} alt="" fill sizes="44px" className="object-cover" />}
              {/* A scrim over the logo in the ink, with the check in the page's colour */}
              {on && (
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-background">
                  <Check size="sm" />
                </span>
              )}
            </span>
            <span className={cx("line-clamp-2 w-full text-center text-caption", on ? "text-foreground" : "text-muted-foreground")} style={on ? semibold : undefined}>
              {b.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Posts to tap, as a grid of 4:5 tiles; once `max` are picked the rest step back. A picked tile
// wears the ring of the ink inside its own edge and the check in its corner
export function TasteGrid({ posts, value, onChange, max, className }: { posts: DashPost[]; value: string[]; onChange: (next: string[]) => void; max: number; className?: string }) {
  return (
    <div className={cx("grid gap-2", className)}>
      {posts.map((p) => {
        const on = value.includes(p.shortCode);
        const full = !on && value.length >= max;
        return (
          <button
            key={p.shortCode}
            type="button"
            aria-pressed={on}
            aria-label={p.hook}
            disabled={full}
            onClick={() => onChange(toggle(value, p.shortCode))}
            className={cx(
              "relative block aspect-4/5 w-full overflow-hidden rounded-[12px] bg-muted shadow-surface-1 transition-[opacity,scale] duration-150 ease-out-quint focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] motion-safe:active:scale-[0.97]",
              edge,
              on && picked,
              full && "opacity-40",
            )}
          >
            <Image src={p.cover} alt="" fill sizes="200px" className="object-cover" />
            {on && <Tick className="absolute top-2 right-2 size-6" />}
          </button>
        );
      })}
    </div>
  );
}

// A wall of posts at their own shapes, each tile rising in when the wall changes. Posts are
// dealt to the shortest of three columns, as the feed's grid does, so the order reads across
// the top row: the ones that come first are the ones you see first
export function Collage({ posts, className }: { posts: DashPost[]; className?: string }) {
  const columns: { post: DashPost; i: number }[][] = [[], [], []];
  const heights = [0, 0, 0];
  posts.forEach((post, i) => {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push({ post, i });
    heights[shortest] += 1 / ratio(post);
  });
  return (
    <div className={cx("grid grid-cols-3 items-start gap-3", className)}>
      {columns.map((column, c) => (
        <div key={c} className="flex flex-col gap-3">
          {column.map(({ post, i }) => (
            <div key={post.shortCode} className={cx("welcome-rise relative overflow-hidden rounded-[12px] bg-muted shadow-surface-1", edge)} style={{ aspectRatio: ratio(post), animationDelay: `${i * 30}ms` }}>
              <Image src={post.cover} alt="" fill sizes="240px" className="object-cover" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function LearnedChips({ posts, taste, max = 5, className }: { posts: DashPost[]; taste: string[]; max?: number; className?: string }) {
  const chips = learnedChips(posts, taste, max);
  if (!chips.length) return null;
  return (
    <ul className={cx("flex flex-wrap gap-1.5", className)} aria-label="What your picks say">
      {chips.map((chip) => (
        <li key={chip} className="welcome-chip">
          <Badge>{chip}</Badge>
        </li>
      ))}
    </ul>
  );
}

// A small ring that fills as you pick
export function Ring({ value, max, className }: { value: number; max: number; className?: string }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className={cx("size-7 -rotate-90", className)}>
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="3" className="stroke-border" />
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value / max))} className="stroke-foreground transition-[stroke-dashoffset] duration-300 ease-out-quint motion-reduce:transition-none" />
    </svg>
  );
}

// The end: the feed's new top six, fanned, and the way in
export function Done({ posts, draft, headingRef }: { posts: DashPost[]; draft: Draft; headingRef?: Ref<HTMLHeadingElement> }) {
  const top = rank(posts, draft).slice(0, 6);
  const who = firstName(draft.name);
  return (
    <div className="welcome-rise flex flex-col items-center text-center">
      <div className="mb-8 flex h-32 items-start justify-center" aria-hidden="true">
        {top.map((p, i) => (
          <span
            key={p.shortCode}
            className={cx("welcome-rise relative -mx-2 aspect-4/5 w-16 overflow-hidden rounded-[12px] bg-muted shadow-xl sm:w-20", edge)}
            style={{ rotate: `${(i - 2.5) * 7}deg`, translate: `0 ${Math.abs(i - 2.5) * 5}px`, animationDelay: `${i * 60}ms` }}
          >
            <Image src={p.cover} alt="" fill sizes="80px" className="object-cover" />
          </span>
        ))}
      </div>
      <Heading ref={headingRef} title={`${who ? `${who}, your` : "Your"} For you is ready.`} sub={`${posts.length} posts, the ones for you first.`} />
      <Button isLink href="/dashboard" size="base" variant="default" className="mt-8 w-fit">
        Open For you
      </Button>
    </div>
  );
}
