import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";

// The shape of content that's on its way: a grey block with a band of light crossing it, in
// the size and place the real thing will take, so nothing moves when it arrives. Use it for a
// region whose layout you know (a feed, a card, a row of text, an avatar). For a wait inside a
// control, or one with no layout to hold, use Spinner; for "there is nothing here", EmptyState.
//
// Three shapes, all hidden from screen readers:
//   line    one line of text: as tall as the text around it (1lh), the bar 0.75em, so stacked
//           lines keep the text's own rhythm. Put it where the text goes, in the same type
//           class; `width` shortens a last line.
//   circle  an avatar, at Avatar's sizes.
//   rect    anything else (a cover, a card, a button): size it with className (w-full
//           aspect-4/5, h-10 w-32) and give it the radius of what it stands in for.
// The band is the dashboard's recipe (dashboard/Skeleton.tsx): bg-component with the
// --color-shimmer band, 1.6s ease-in-out, and it holds still under reduced motion.
//
// Announce the wait once, around the skeletons, never on each block:
//   <div role="status" aria-label="Loading posts">…skeletons…</div>
// and swap the whole region for the content when it lands.

const shimmer =
  "animate-shimmer bg-component bg-[linear-gradient(100deg,transparent_35%,var(--color-shimmer)_50%,transparent_65%)] bg-size-[200%_100%] motion-reduce:animate-none";

// A line's width: full by default, shorter for the last line of a paragraph or a title
const widths = {
  full: "w-full",
  "3/4": "w-3/4",
  "2/3": "w-2/3",
  "1/2": "w-1/2",
  "1/3": "w-1/3",
  "1/4": "w-1/4",
} as const;
// A circle: Avatar's sizes (xs 20, sm 24, md 32, lg 44)
const circles = {
  xs: "size-5",
  sm: "size-6",
  md: "size-8",
  lg: "size-11",
} as const;
// A rect's corners: copy what it stands in for. sm (4px) is an image's, the default; lg (8px) a
// button's or a field's; 2xl (12px) a card's; full a pill's
const radii = {
  none: "rounded-none",
  sm: "rounded-sm",
  lg: "rounded-lg",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

type Common = {
  /** Layout only: margins, width, height and aspect on a rect */
  className?: string;
  /** For a size worked out at run time, like a post's own aspect ratio */
  style?: CSSProperties;
};

export type SkeletonProps = Common &
  (
    | { shape?: "rect"; radius?: keyof typeof radii; width?: never; size?: never }
    | { shape: "line"; width?: keyof typeof widths; radius?: never; size?: never }
    | { shape: "circle"; size?: keyof typeof circles; radius?: never; width?: never }
  );

export default function Skeleton(props: SkeletonProps) {
  const { className, style } = props;

  if (props.shape === "line") {
    // The line box is the text's height; the bar sits in its middle, so lines stack apart
    return (
      <span
        aria-hidden="true"
        className={cx("flex h-[1lh] items-center", widths[props.width ?? "full"], className)}
        style={style}
      >
        <span className={cx("block h-[0.75em] w-full rounded-full", shimmer)} />
      </span>
    );
  }

  if (props.shape === "circle") {
    return (
      <span
        aria-hidden="true"
        className={cx("block shrink-0 rounded-full", circles[props.size ?? "md"], shimmer, className)}
        style={style}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cx("block", radii[props.radius ?? "sm"], shimmer, className)}
      style={style}
    />
  );
}
