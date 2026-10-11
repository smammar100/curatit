"use client";

// The industries as folders, for the welcome flow: the homepage's first category section (the
// interactive folder gallery from 21st.dev, ui/interactive-folder-gallery.tsx in the first
// commits), cut down to a picker on 2026-10-11. Each folder is tinted with its category's hue
// and holds three of its posts, tucked in with their tops showing; they slide up on hover and
// stay up when the folder is picked, with a check on its front. The gallery's open-and-drag is
// gone: here a tap means "this one". The folder keeps its own proportions (176×128) whatever
// the cell's width. Motion is in global.css (.folder-*), still under reduced motion.
import type { CSSProperties } from "react";
import Image from "next/image";
import { CATEGORY_ICONS } from "@/components/dashboard/categoryIcons";
import { cx } from "@/lib/cx";
import { Tick, toggle, type Category } from "./parts";

// Same lightness and chroma for every folder; only the hue changes, so the seven read as one
// set. Each tone has a light and a dark value, through light-dark().
function tone(hue: number) {
  return {
    "--folder-front": `light-dark(oklch(0.88 0.055 ${hue}), oklch(0.34 0.06 ${hue}))`,
    "--folder-back": `light-dark(oklch(0.8 0.075 ${hue}), oklch(0.28 0.05 ${hue}))`,
    "--folder-pocket": `light-dark(oklch(0.71 0.085 ${hue}), oklch(0.22 0.04 ${hue}))`,
    "--folder-ink": `light-dark(oklch(0.42 0.1 ${hue}), oklch(0.85 0.09 ${hue}))`,
  } as CSSProperties;
}

export function FolderTile({ category, on, onClick }: { category: Category; on: boolean; onClick: () => void }) {
  const Glyph = CATEGORY_ICONS[category.slug];
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={tone(category.hue)}
      className="folder group relative h-36 w-full touch-manipulation rounded-xl transition-[scale] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-900 active:scale-[0.97]"
    >
      <span className="sr-only">
        {category.name}, {category.posts.length} posts
      </span>
      {/* The folder, 176 by 128, centred in the cell */}
      <span aria-hidden="true" className="absolute bottom-2 left-1/2 block h-32 w-full max-w-44 -translate-x-1/2">
        {/* The back: the tab, the body, the pocket the posts sit in */}
        <span className="absolute top-0 left-0 h-6 w-16 rounded-t-lg bg-(--folder-back)" />
        <span className="absolute inset-x-0 top-4 bottom-0 rounded-tr-xl rounded-b-xl bg-(--folder-back)" />
        <span className="absolute inset-x-1.5 top-6 bottom-1.5 rounded-lg bg-(--folder-pocket)" />

        {/* Three of its posts, tucked in behind the front with their tops showing; they slide up
            on hover and stay up once picked */}
        <span className="absolute inset-x-0 bottom-3.5 flex justify-center">
          {category.posts.slice(0, 3).map((post, i) => {
            const offset = i - 1;
            return (
              <span
                key={post.shortCode}
                className="folder-card absolute bottom-0 aspect-4/5 w-14 origin-bottom overflow-hidden rounded-md bg-white shadow-md outline-1 -outline-offset-1 outline-edge"
                style={
                  {
                    zIndex: i + 1,
                    "--rest": `translate(${offset * 4}px, ${offset * -2}px) rotate(${offset * 4}deg)`,
                    "--fan": `translate(${offset * 26}px, ${-30 + Math.abs(offset) * -3}px) rotate(${offset * 10}deg)`,
                  } as CSSProperties
                }
              >
                <Image src={post.cover} alt="" fill sizes="56px" className="object-cover" />
              </span>
            );
          })}
        </span>

        {/* The front, with the icon and the name; it tilts open on hover */}
        <span className="folder-front absolute inset-x-0 bottom-0 z-10 flex h-[4.5rem] flex-col items-center justify-end gap-1 rounded-xl bg-(--folder-front) pb-2.5 shadow-sm ring-1 ring-base-900/10">
          {Glyph && <Glyph className="size-5 text-(--folder-ink)" />}
          <span className="flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-caption font-medium text-base-900 shadow-sm ring-1 ring-base-200">
            <span className="truncate">{category.name}</span>
            <span className="shrink-0 text-base-600 tabular-nums">{category.posts.length}</span>
          </span>
          {on && <Tick className="absolute top-2 right-2 size-6 ring-2 ring-white" />}
        </span>
      </span>
    </button>
  );
}

export function FolderTiles({ list, value, onChange, className }: { list: Category[]; value: string[]; onChange: (next: string[]) => void; className?: string }) {
  return (
    <div className={cx("grid gap-x-3 gap-y-1", className)}>
      {list.map((c) => (
        <FolderTile key={c.slug} category={c} on={value.includes(c.slug)} onClick={() => onChange(toggle(value, c.slug))} />
      ))}
    </div>
  );
}
