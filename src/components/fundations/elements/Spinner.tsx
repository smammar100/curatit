import CircleNotch from "@/components/fundations/icons/CircleNotch";
import { cx } from "@/lib/cx";

// An inline wait: something is happening right here and will be done in a second or two
// (copying, saving a note, a search on its way). For a button's own request use Button's
// `loading`, which puts this same notch over the label and keeps the button's width. For a
// region whose content is on its way use Skeleton, which holds the layout. For longer work, say
// what's happening in words.
//
// The Phosphor notch spins in the text colour (currentColor); under reduced motion it holds
// still, an open ring. Name it with `label`, read out once as a status (role="status", the
// words visually hidden), or mark it `decorative` when the control around it already says it's
// busy (a button's aria-busy, a heading that says "Saving"). The types make you pick one.

// Sizes: sm 14 (beside 12-13px text), md 16 (the default, beside 15px text and in buttons), lg 20
const sizes = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const;

type Naming =
  | { /** Read out once as a status: "Saving note" */ label: string; decorative?: never }
  | { /** Silent: the control around it already says it's busy */ decorative: true; label?: never };

export type SpinnerProps = Naming & {
  size?: keyof typeof sizes;
  className?: string;
};

export default function Spinner({ size = "md", label, className }: SpinnerProps) {
  // relative: holds the hidden words, which would otherwise be placed against the page and can
  // widen a scrolling row on a phone
  return (
    <span
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      className={cx("relative inline-flex shrink-0 items-center justify-center", className)}
    >
      <CircleNotch className={cx("animate-spin motion-reduce:animate-none", sizes[size])} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
