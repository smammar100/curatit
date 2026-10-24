"use client";

import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { useShape } from "@/lib/shape-context";
import { useSize } from "@/lib/size-context";
import { cn } from "@/lib/utils";

// The single-line text field, since 2026-10-23 on Fluid Functionalism's field recipe (its select
// trigger and InputField): the one stroke (a 1px --border ring) on no fill, a faint hover tint,
// the card surface while focused, the control height and corners from the size and shape
// providers (36px and a pill on the site's default step), and the page's 1px focus outline. A
// field whose value has a problem wears a red ring. 16px text on touch screens, so iOS doesn't
// zoom into it. For a name, an email, a URL, a token's name: anything typed on one line. Several
// lines is Textarea; a search box (its icon, a clear button, Escape) is SearchField; one of a few
// fixed values is Segmented; on or off is Switch or Checkbox. Give it its label, hint and error
// with Field, which wires the ids.
//
//   size     md and lg are both the default step, 36px (the site's setting since 2026-10-24; lg is kept for call sites)
//   invalid  sets aria-invalid; the red ring keys off the attribute, so Field's error does the same
//   leadingIcon  a decorative icon inside on the left (a Phosphor icon; drawn at 14px, never read)
//   trailing     one small thing inside on the right: a Kbd, or an xxs icon Button. Clicks on
//                anything but a button or link fall through to the field
//
// `className` is for layout and lands on the wrapper (width, margins, flex); every other prop,
// `ref` included, is the <input>'s. Under it all, the @tailwindcss/forms plugin styles text
// fields with a grey border and a blue focus ring: border-0 and focus:ring-0 take them off.

// The padding each side takes with and without a slot there, per step
const steps = {
  compact: { start: "pl-2.5", startIcon: "pl-8", end: "pr-2.5", endSlot: "pr-8", icon: "left-2.5", slot: "right-1.5" },
  default: { start: "pl-3", startIcon: "pl-9", end: "pr-3", endSlot: "pr-9", icon: "left-3", slot: "right-2" },
} as const;

// The recipe, shared with Textarea. `peer` lets the slots after it react to its focus
export const fieldClass =
  "peer block w-full min-w-0 border-0 bg-transparent text-foreground ring-1 ring-border placeholder:text-muted-foreground transition-[background-color,box-shadow] duration-80 hover:bg-hover focus:bg-surface-3 focus:ring-border focus:hover:bg-surface-3 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] aria-invalid:ring-destructive/50 aria-invalid:focus:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

// type="search" without the browser's own clear button and magnifier (SearchField draws its own)
const searchClass = "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none";

// The site's two sizes on the library's two steps
// Both names on the default step: the site's setting since 2026-10-24, the dashboard's settings
// forms included
const sizes = { md: "default", lg: "default" } as const;

export type InputSize = keyof typeof sizes;

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  /** The value has a problem: sets aria-invalid, which turns the ring red. Field sets it for you */
  invalid?: boolean;
  /** A decorative icon inside, on the left */
  leadingIcon?: ReactNode;
  /** One small thing inside, on the right: a Kbd or an xxs icon Button */
  trailing?: ReactNode;
  ref?: Ref<HTMLInputElement>;
  /** Layout only (width, margins, flex), on the wrapper */
  className?: string;
};

export default function Input({
  size = "md",
  invalid = false,
  leadingIcon,
  trailing,
  className,
  type = "text",
  "aria-invalid": ariaInvalid,
  ref,
  ...rest
}: InputProps) {
  const shape = useShape();
  const step = useSize(sizes[size]);
  const s = steps[step.variant];
  return (
    <span className={cn("relative block", className)}>
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || ariaInvalid || undefined}
        className={cn(
          fieldClass,
          type === "search" && searchClass,
          shape.input,
          step.control,
          step.field,
          leadingIcon ? s.startIcon : s.start,
          trailing ? s.endSlot : s.end,
        )}
        {...rest}
      />
      {/* After the field, so it can follow the field's state (peer); never takes a click */}
      {leadingIcon && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 flex items-center text-muted-foreground transition-colors duration-80 peer-focus:text-foreground peer-disabled:opacity-50 [&_svg]:size-3.5",
            s.icon,
          )}
        >
          {leadingIcon}
        </span>
      )}
      {trailing && (
        <span
          className={cn(
            "pointer-events-none absolute inset-y-0 flex items-center gap-1 [&_a]:pointer-events-auto [&_button]:pointer-events-auto",
            s.slot,
          )}
        >
          {trailing}
        </span>
      )}
    </span>
  );
}
