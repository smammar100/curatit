"use client";

// The pieces of the welcome flow (Welcome.tsx): the answers being made, and the pickers for the
// name and occupation and the brands; the live wall; the end. The industries are folders
// (Folders.tsx).
//
// Since 2026-10-24 on Glaze: the role chips are filter Chips (on while chosen), the name field is
// Glaze's Input, and every picture sits on the grey field with the faint line drawn over it; a
// picked brand wears a 2px line of the ink inside its own edge, so nothing has to match the
// ground it sits on. The picture tiles (brands, the folders) are toggles with aria-pressed: Glaze
// has no picture toggle, so they're Base UI's Toggle (the primitive Glaze's Chip is built on)
// drawn with Glaze's tokens, and Glaze's base draws their focus ring.
import { useEffect, useId, useRef, useState, type CSSProperties, type Ref } from "react";
import Image from "next/image";
import Link from "next/link";
import { Toggle } from "@base-ui/react/toggle";
import { Button } from "@/components/glaze/ui/button";
import { Chip, ChipGroup } from "@/components/glaze/ui/chip";
import { Input } from "@/components/glaze/ui/input";
import { Check, Icon } from "@/components/glaze/icon";
import { ratio } from "@/components/dashboard/Grid";
import { rank } from "@/components/dashboard/forYou";
import type { Profile } from "@/components/dashboard/profile";
import type { DashPost } from "@/components/dashboard/types";
import { categoriesWithPosts, inCategory } from "@/lib/categories";
import { cx } from "@/lib/cx";

// The faint line round a picture, drawn over it so the image can't cover it; `picked` thickens
// it into a 2px line of the ink. The picture's own corner is inherited
export const edge =
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline-1 after:-outline-offset-1 after:outline-line-faint after:transition-[outline-color,outline-width] after:duration-(--dur-state) after:ease-out";
export const picked = "after:outline-2 after:-outline-offset-2 after:outline-ink";

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
  return categoriesWithPosts(posts, { catchAll: false }).map((c) => ({ ...c, posts: posts.filter((p) => inCategory(p, c.slug)) }));
}

// The step's question. It takes focus when the step changes (tabIndex -1: a target, not a stop),
// so it shows no ring of its own
export function Heading({ ref, id, title, sub, align = "center" }: { ref?: Ref<HTMLHeadingElement>; id?: string; title: string; sub?: string; align?: "center" | "left" }) {
  return (
    <div className={cx("text-balance", align === "center" && "text-center")}>
      <h1 ref={ref} id={id} tabIndex={-1} className="type-title text-text-1">
        {title}
      </h1>
      {sub && <p className="mt-2 type-body text-text-2">{sub}</p>}
    </div>
  );
}

// The steps as a stripe of segments, filled up to the one you're on
export function Progress({ step, total, className }: { step: number; total: number; className?: string }) {
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${total}`} className={cx("flex gap-1.5", className)}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx("h-1 flex-1 rounded-full transition-colors duration-(--dur-state) ease-out", i <= step ? "bg-ink" : "bg-line")} />
      ))}
    </div>
  );
}

// The name, then what they do as one tap, or Other and a few words of their own (the column takes
// 40 characters). The name takes focus on arrival, except on touch (the keyboard would jump up);
// Enter in it submits the step. The step's question is its visible label, so the fields are named
// by aria-label rather than a Field. The roles are filter Chips rather than a SegmentedControl:
// seven of them, and a second tap clears the choice
export function NameRole({ value, onChange }: { value: Draft; onChange: (patch: Partial<Draft>) => void }) {
  // Glaze's Input takes no ref, so the field is found inside its box
  const box = useRef<HTMLDivElement>(null);
  const groupLabel = useId();
  const own = value.occupation && !OCCUPATIONS.includes(value.occupation) ? value.occupation : "";
  const [other, setOther] = useState(!!own);
  const [text, setText] = useState(own);
  useEffect(() => {
    if (!matchMedia("(pointer: coarse)").matches) box.current?.querySelector("input")?.focus();
  }, []);
  const pick = (occupation: string) => {
    setOther(false);
    onChange({ occupation: value.occupation === occupation ? null : occupation });
  };
  return (
    <div className="space-y-5">
      <div ref={box}>
        <Input
          name="name"
          aria-label="Your name"
          value={value.name}
          onValueChange={(name) => onChange({ name })}
          placeholder="Your name"
          autoComplete="given-name"
          maxLength={60}
        />
      </div>
      <div>
        <p id={groupLabel} className="mb-2 type-label-sm text-text-2">
          And you’re a…
        </p>
        <ChipGroup role="group" aria-labelledby={groupLabel}>
          {OCCUPATIONS.map((occupation) => (
            <Chip key={occupation} pressed={!other && value.occupation === occupation} onPressedChange={() => pick(occupation)}>
              {occupation}
            </Chip>
          ))}
          <Chip
            pressed={other}
            onPressedChange={() => {
              setOther(!other);
              onChange({ occupation: other ? null : text.trim() || null });
            }}
          >
            Other
          </Chip>
        </ChipGroup>
        {/* Opened by a tap on Other, so it takes focus even on touch */}
        {other && (
          <Input
            name="occupation"
            aria-label="What do you do?"
            placeholder="What do you do?"
            value={text}
            onValueChange={(next) => {
              setText(next);
              onChange({ occupation: next.trim() || null });
            }}
            maxLength={40}
            autoFocus
            className="mt-3"
          />
        )}
      </div>
    </div>
  );
}

// The check that marks a pick: the ink, with the inverse text for the mark
export const Tick = ({ className }: { className?: string }) => (
  <span className={cx("flex size-5 items-center justify-center rounded-full bg-ink text-text-inverse", className)}>
    <Icon icon={Check} size={12} />
  </span>
);

// The brands as their marks, with a check over a picked one. A tile of a mark and a two-line
// name: a toggle on the row look (the panel corner, the hover wash, the press)
export function BrandGrid({ brands, value, onChange, className }: { brands: Brand[]; value: string[]; onChange: (next: string[]) => void; className?: string }) {
  return (
    <div className={cx("grid gap-1", className)}>
      {brands.map((b) => {
        const on = value.includes(b.slug);
        return (
          <Toggle
            key={b.slug}
            pressed={on}
            onPressedChange={() => onChange(toggle(value, b.slug))}
            className="group flex min-w-0 flex-col items-center gap-1.5 rounded-panel p-2 transition-[background-color,scale] duration-(--dur-state) ease-out hover:bg-hover motion-safe:active:scale-(--scale-press)"
          >
            <span className={cx("relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-field", edge, on && picked)}>
              {b.logo && <Image src={b.logo} alt="" fill sizes="44px" className="object-cover" />}
              {/* A scrim over the logo in the ink, with the check in the inverse text */}
              {on && (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/60 text-text-inverse">
                  <Icon icon={Check} />
                </span>
              )}
            </span>
            <span className={cx("line-clamp-2 w-full text-center type-caption", on ? "font-medium text-text-1" : "text-text-2")}>
              {b.name}
            </span>
          </Toggle>
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
            <div
              key={post.shortCode}
              className={cx("welcome-rise relative aspect-(--ratio) overflow-hidden rounded-panel bg-field [animation-delay:var(--delay)]", edge)}
              style={{ "--ratio": ratio(post), "--delay": `${i * 30}ms` } as CSSProperties}
            >
              <Image src={post.cover} alt="" fill sizes="240px" className="object-cover" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// The end, alone in the middle of the page: the feed's new top six, fanned, and the way in. The
// name is shown capitalised, however it was typed
export function Done({ posts, draft, headingRef }: { posts: DashPost[]; draft: Draft; headingRef?: Ref<HTMLHeadingElement> }) {
  const top = rank(posts, draft).slice(0, 6);
  const first = firstName(draft.name);
  const who = first.charAt(0).toLocaleUpperCase() + first.slice(1);
  return (
    <div className="welcome-rise flex flex-col items-center text-center">
      <div className="mb-8 flex h-32 items-start justify-center" aria-hidden="true">
        {top.map((p, i) => (
          // Fanned: each card's tilt, drop and delay come from its place, through custom properties.
          // The cards are a drawing that lifts off the page, so they take Fluid Functionalism's
          // surface pair
          <span
            key={p.shortCode}
            className={cx(
              "welcome-rise relative -mx-2 aspect-4/5 w-16 rotate-(--tilt) translate-y-(--drop) overflow-hidden rounded-panel bg-surface-6 shadow-surface-6 [animation-delay:var(--delay)] sm:w-20",
              edge,
            )}
            style={{ "--tilt": `${(i - 2.5) * 7}deg`, "--drop": `${Math.abs(i - 2.5) * 5}px`, "--delay": `${i * 60}ms` } as CSSProperties}
          >
            <Image src={p.cover} alt="" fill sizes="80px" className="object-cover" />
          </span>
        ))}
      </div>
      <Heading ref={headingRef} title={`You’re all set${who ? `, ${who}` : ""}.`} sub={`We’ve sorted ${posts.length} posts so the ones that fit you come first.`} />
      <Button render={<Link href="/dashboard" />} nativeButton={false} size="lg" className="mt-8 w-fit">
        Go to my feed
      </Button>
    </div>
  );
}
