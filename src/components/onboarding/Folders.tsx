"use client";

// The industries as folders, for the welcome flow: the homepage's first category section (the
// interactive folder gallery from 21st.dev, ui/interactive-folder-gallery.tsx in the first
// commits), cut down to a picker on 2026-10-11. Each folder is tinted with its category's hue
// and holds three of its posts, tucked in with their tops showing; they slide up on hover and
// stay up when the folder is picked, with a check on its front. The gallery's open-and-drag is
// gone: here a tap means "this one". The folder keeps its own proportions (176×128) whatever
// the cell's width. Motion is in global.css (.folder-*), still under reduced motion.
//
// Since 2026-10-24 on Glaze's tokens: the tint stays its own (the category's hue is data, so it
// reaches the folder only through the --folder-* custom properties below), while the posts, the
// name pill and the check draw on the ink, the lines and the surface ladder. The folder itself is
// a toggle (Base UI's Toggle, which Glaze's Chip is built on), not a Button: it's a drawing, not a
// control with a label, and Glaze's base draws its focus ring. Its posts and its name pill are
// the drawing's cards, so they lift on Fluid Functionalism's surface pair.
import type { CSSProperties } from "react";
import Image from "next/image";
import { Toggle } from "@base-ui/react/toggle";
import { CATEGORY_ICONS } from "@/components/dashboard/categoryIcons";
import { Icon } from "@/components/glaze/icon";
import { cx } from "@/lib/cx";
import { edge, Tick, toggle, type Category } from "./parts";

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
    <Toggle
      pressed={on}
      onPressedChange={onClick}
      style={tone(category.hue)}
      className="folder group relative h-36 w-full touch-manipulation rounded-panel transition-[scale] duration-(--dur-slide) ease-out motion-safe:active:scale-(--scale-press)"
    >
      <span className="sr-only">
        {category.name}, {category.posts.length} posts
      </span>
      {/* The folder, 176 by 128, centred in the cell */}
      <span aria-hidden="true" className="absolute bottom-2 left-1/2 block h-32 w-full max-w-44 -translate-x-1/2">
        {/* The back: the tab, the body, the pocket the posts sit in */}
        <span className="absolute start-0 top-0 h-6 w-16 rounded-t-tag bg-(--folder-back)" />
        <span className="absolute inset-x-0 top-4 bottom-0 rounded-tr-panel rounded-b-panel bg-(--folder-back)" />
        <span className="absolute inset-x-1.5 top-6 bottom-1.5 rounded-tag bg-(--folder-pocket)" />

        {/* Three of its posts, tucked in behind the front with their tops showing; they slide up
            on hover and stay up once picked */}
        <span className="absolute inset-x-0 bottom-3.5 flex justify-center">
          {category.posts.slice(0, 3).map((post, i) => {
            const offset = i - 1;
            return (
              <span
                key={post.shortCode}
                className={cx("folder-card absolute bottom-0 z-(--stack) aspect-4/5 w-14 origin-bottom overflow-hidden rounded-tag bg-surface-3 shadow-surface-3", edge)}
                style={
                  {
                    "--stack": i + 1,
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
        <span className="folder-front absolute inset-x-0 bottom-0 z-(--z-raised) flex h-18 flex-col items-center justify-end gap-1 rounded-panel bg-(--folder-front) pb-2.5 ring-1 ring-line-faint">
          {Glyph && <Icon icon={Glyph} size={20} className="text-(--folder-ink)" />}
          {/* The name and its count as a small raised pill on the tinted front */}
          <span className="flex max-w-[calc(100%-var(--space-4))] items-center gap-1.5 rounded-pill bg-surface-3 px-2.5 py-1 type-label-sm text-text-1 shadow-surface-3">
            <span className="truncate">{category.name}</span>
            <span className="shrink-0 text-text-2 tabular-nums">{category.posts.length}</span>
          </span>
          {on && <Tick className="absolute end-2 top-2 size-6 ring-2 ring-paper" />}
        </span>
      </span>
    </Toggle>
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
