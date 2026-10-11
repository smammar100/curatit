"use client";

// The pieces of the welcome flow (Welcome.tsx): the answers being made, and the pickers for the
// name and occupation, the brands and the taste test; the live wall; the chips of what the taps
// say; the end. The industries are folders (Folders.tsx).
import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import Check from "@/components/fundations/icons/Check";
import Button from "@/components/fundations/elements/Button";
import { ratio } from "@/components/dashboard/Grid";
import { learnedChips, rank } from "@/components/dashboard/forYou";
import type { Profile } from "@/components/dashboard/profile";
import type { DashPost } from "@/components/dashboard/types";
import { categories } from "@/components/home/demo";
import { cx } from "@/lib/cx";

// The answers while they're being made: the profile without the time it was finished
export type Draft = Omit<Profile, "onboardedAt">;
export const OCCUPATIONS = ["Designer", "Marketer", "Founder", "Agency", "Creator", "Student"];
export const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export type Brand = { slug: string; name: string; logo: string | null };
export function brandsOf(posts: DashPost[]): Brand[] {
  const seen = new Map<string, Brand>();
  for (const post of posts) if (!seen.has(post.brand.slug)) seen.set(post.brand.slug, post.brand);
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// The library's categories, in the homepage's order, each with its hue and posts
export type Category = { slug: string; name: string; hue: number; posts: DashPost[] };
export function categoriesOf(posts: DashPost[]): Category[] {
  return categories.flatMap((c) => {
    const inIt = posts.filter((p) => p.category.slug === c.category);
    return inIt.length ? [{ slug: c.category, name: inIt[0].category.name, hue: c.hue, posts: inIt }] : [];
  });
}

export function Heading({ id, title, sub, align = "center" }: { id?: string; title: string; sub?: string; align?: "center" | "left" }) {
  return (
    <div className={cx("text-balance", align === "center" && "text-center")}>
      <h1 id={id} className="font-display text-display font-light text-base-900">
        {title}
      </h1>
      {sub && <p className="mt-2 text-subtitle text-base-600">{sub}</p>}
    </div>
  );
}

// The steps as a stripe of segments, filled up to the one you're on
export function Progress({ step, total, className }: { step: number; total: number; className?: string }) {
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${total}`} className={cx("flex gap-1.5", className)}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx("h-1 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-base-900" : "bg-base-200")} />
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cx(
        "flex h-10 items-center gap-2 rounded-full px-4 text-body font-medium whitespace-nowrap transition-[background-color,color,scale] duration-150 active:scale-[0.96]",
        on ? "bg-base-900 text-white" : "bg-base-50 text-base-900 hover:bg-base-100",
        className,
      )}
    >
      {children}
    </button>
  );
}

const field =
  "h-12 w-full rounded-full border-0 bg-base-50 px-5 text-subtitle pointer-coarse:text-[16px] text-base-900 placeholder:text-base-400 ring-1 ring-base-200 transition-[box-shadow] duration-150 focus:ring-2 focus:ring-base-400 focus:outline-none";

// The name, then what they do as one tap. The name takes focus on arrival, except on touch
// (the keyboard would jump up); Enter in it submits the step.
export function NameRole({ value, onChange }: { value: Draft; onChange: (patch: Partial<Draft>) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) ref.current?.focus();
  }, []);
  return (
    <div className="space-y-5">
      <label className="block">
        <span className="sr-only">Your name</span>
        <input ref={ref} type="text" name="name" value={value.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Your name" autoComplete="given-name" maxLength={60} className={field} />
      </label>
      <div>
        <p className="mb-2 text-caption font-medium text-base-500">And you’re a…</p>
        <div className="flex flex-wrap gap-1.5">
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

export const Tick = ({ className }: { className?: string }) => (
  <span className={cx("flex size-5 items-center justify-center rounded-full bg-base-900 text-white shadow-sm", className)}>
    <Check className="size-3" />
  </span>
);

// The brands as their marks, with a check over a picked one
export function BrandGrid({ brands, value, onChange, className }: { brands: Brand[]; value: string[]; onChange: (next: string[]) => void; className?: string }) {
  return (
    <div className={cx("grid gap-1", className)}>
      {brands.map((b) => {
        const on = value.includes(b.slug);
        return (
          <button key={b.slug} type="button" aria-pressed={on} onClick={() => onChange(toggle(value, b.slug))} className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl p-2 transition-[background-color,scale] duration-150 hover:bg-base-50 active:scale-[0.96]">
            <span className={cx("relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-100 outline-1 -outline-offset-1 outline-edge transition-[box-shadow] duration-150", on && "ring-2 ring-base-900 ring-offset-2 ring-offset-white")}>
              {b.logo && <Image src={b.logo} alt="" fill sizes="44px" className="object-cover" />}
              {on && (
                <span className="absolute inset-0 flex items-center justify-center bg-base-900/55 text-white">
                  <Check className="size-4" />
                </span>
              )}
            </span>
            <span className={cx("w-full truncate text-center text-caption", on ? "font-medium text-base-900" : "text-base-600")}>{b.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// Posts to tap, as a grid of 4:5 tiles; once `max` are picked the rest step back
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
              "relative block aspect-4/5 w-full overflow-hidden rounded-lg bg-base-100 outline-1 -outline-offset-1 outline-edge transition-[opacity,scale,box-shadow] duration-150 active:scale-[0.97]",
              on && "ring-2 ring-base-900 ring-offset-2 ring-offset-white",
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

// A wall of posts at their own shapes, each tile rising in when the wall changes
export function Collage({ posts, className }: { posts: DashPost[]; className?: string }) {
  return (
    <div className={cx("columns-3 gap-3", className)}>
      {posts.map((p, i) => (
        <div key={p.shortCode} className="welcome-rise relative mb-3 break-inside-avoid overflow-hidden rounded-lg bg-base-100 outline-1 -outline-offset-1 outline-edge" style={{ aspectRatio: ratio(p), animationDelay: `${i * 30}ms` }}>
          <Image src={p.cover} alt="" fill sizes="240px" className="object-cover" />
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
        <li key={chip} className="welcome-chip rounded-full bg-base-50 px-3 py-1.5 text-caption font-medium whitespace-nowrap text-base-900">
          {chip}
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
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="3" className="stroke-base-200" />
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value / max))} className="stroke-base-900 transition-[stroke-dashoffset] duration-300 ease-out" />
    </svg>
  );
}

// The end: the feed's new top six, fanned, and the way in
export function Done({ posts, draft }: { posts: DashPost[]; draft: Draft }) {
  const top = rank(posts, draft).slice(0, 6);
  const who = firstName(draft.name);
  return (
    <div className="welcome-rise flex flex-col items-center text-center">
      <div className="mb-8 flex h-32 items-start justify-center" aria-hidden="true">
        {top.map((p, i) => (
          <span
            key={p.shortCode}
            className="welcome-rise relative -mx-2 aspect-4/5 w-20 overflow-hidden rounded-lg bg-base-100 shadow-[0_10px_24px_-12px_rgb(0_0_0/0.45)] outline-1 -outline-offset-1 outline-edge"
            style={{ rotate: `${(i - 2.5) * 7}deg`, translate: `0 ${Math.abs(i - 2.5) * 5}px`, animationDelay: `${i * 60}ms` }}
          >
            <Image src={p.cover} alt="" fill sizes="80px" className="object-cover" />
          </span>
        ))}
      </div>
      <Heading title={`${who ? `${who}, your` : "Your"} For you is ready.`} sub={`${posts.length} posts, the ones for you first.`} />
      <Button isLink href="/dashboard" size="base" variant="default" className="mt-8 w-fit">
        Open For you
      </Button>
    </div>
  );
}
