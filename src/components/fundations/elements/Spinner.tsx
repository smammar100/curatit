import { cn } from "@/lib/utils";

// An inline wait: something is happening right here and will be done in a second or two
// (copying, saving a note, a search on its way). For a button's own request use Button's
// `loading`, which puts this same figure over the label and keeps the button's width. For a
// region whose content is on its way use Skeleton, which holds the layout. For longer work, say
// what's happening in words.
//
// Since 2026-10-23 it's Fluid Functionalism's spinner, the one inside its Button: a figure of
// eight drawn as one path, a 15/85 dash running round it (2s, linear) while the dash itself
// breathes between 15 and 40 (4s, ease-in-out); the keyframes (spinner-move, spinner-dash) were
// installed with the button. It draws in the text colour; under reduced motion it holds still.
// Name it with `label`, read out once as a status (role="status", the words visually hidden), or
// mark it `decorative` when the control around it already says it's busy (a button's aria-busy, a
// heading that says "Saving"). The types make you pick one.

// Sizes: sm 14 (beside 12px text), md 16 (the default, beside 13px text), lg 20
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
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
    >
      <svg className={sizes[size]} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M 12 12 C 14 8.5 19 8.5 19 12 C 19 15.5 14 15.5 12 12 C 10 8.5 5 8.5 5 12 C 5 15.5 10 15.5 12 12 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength="100"
          className="[animation:spinner-move_2s_linear_infinite,spinner-dash_4s_ease-in-out_infinite] [stroke-dasharray:15_85] motion-reduce:[animation:none]"
        />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
