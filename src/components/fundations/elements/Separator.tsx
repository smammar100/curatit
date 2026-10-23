import type { HTMLAttributes, Ref } from "react";
import { cx } from "@/lib/cx";

// A hairline between groups: menu sections, the rows of a settings list, two halves of a
// toolbar. Use it where space alone doesn't separate two groups; most of the time a gap does,
// and a line is one more thing to read. Lines between every row of a list are
// `divide-y divide-border-default` on the list, not a Separator per row. Never a 2px line:
// 2px is the focus ring's width, so a thick line reads as focus.
//
// Decorative by default (role="none": a screen reader skips it), which is right when the groups
// already have headings or are separate lists. `semantic` makes it a real separator
// (role="separator", aria-orientation) for a boundary nothing else announces, like the two
// halves of a menu.
//
// Horizontal fills its container's width; vertical stretches to its flex row's height (outside
// a flex row, give it a height in className). Margins are the caller's.

// Tones: the border tokens, alpha tints that sit back on any ground. default 6%, subtle 2%
// (between the rows of a dense table), strong 15% (a boundary that must hold on a grey mat)
const tones = {
  default: "bg-border-default",
  subtle: "bg-border-subtle",
  strong: "bg-border-strong",
} as const;
const orientations = {
  horizontal: "h-px w-full",
  vertical: "w-px self-stretch",
} as const;

export type SeparatorProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "role" | "aria-orientation"
> & {
  orientation?: keyof typeof orientations;
  tone?: keyof typeof tones;
  /** A real separator for assistive tech: role="separator" with aria-orientation */
  semantic?: boolean;
  ref?: Ref<HTMLDivElement>;
};

export default function Separator({
  orientation = "horizontal",
  tone = "default",
  semantic = false,
  className,
  ref,
  ...rest
}: SeparatorProps) {
  return (
    <div
      {...rest}
      ref={ref}
      role={semantic ? "separator" : "none"}
      aria-orientation={semantic ? orientation : undefined}
      className={cx("shrink-0", orientations[orientation], tones[tone], className)}
    />
  );
}
