import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/lib/cx";

// The single-line text field, Interfere's (design.interfere.com/input): a white surface lifted by
// the default shadow instead of a border, the brand ring on focus, a red ring when its value has a
// problem, 16px text on touch screens so iOS doesn't zoom into it. For a name, an email, a URL, a
// token's name: anything typed on one line. Several lines is Textarea; a search box (its icon, a
// clear button, Escape) is SearchField; one of a few fixed values is Segmented; on or off is
// Switch or Checkbox. Give it its label, hint and error with Field, which wires the ids.
//
//   size     md 40px, Interfere's, for the site's and the auth forms (the default)
//            lg 44px, the dashboard's, in its body role and radius 10
//   invalid  sets aria-invalid; the red ring keys off the attribute, so Field's error does the same
//   leadingIcon  a decorative icon inside on the left (a Phosphor icon; drawn at 16px, never read)
//   trailing     one small thing inside on the right: a Kbd, or an xxs icon Button. Room is
//                reserved for 24px; clicks on anything but a button or link fall through to the
//                field, so a click on a Kbd still focuses it
//
// Server component. `className` is for layout and lands on the wrapper (width, margins, flex);
// every other prop, `ref` included, is the <input>'s. The native `size` attribute isn't offered:
// set the width with className. Under it all, the @tailwindcss/forms plugin styles text fields
// with a grey border and a blue focus ring: border-0 and focus:ring-0 take them off, and
// outline-hidden keeps an outline for forced-colours mode, where the shadow ring isn't drawn.

// Height, radius and type, then the padding each side takes with and without a slot there
const sizes = {
  md: {
    field: "h-10 rounded-lg text-body-sm",
    start: "pl-3",
    startIcon: "pl-9",
    end: "pr-3",
    endSlot: "pr-10",
    icon: "left-3",
    slot: "right-2",
  },
  lg: {
    field: "h-11 rounded-xl text-body",
    start: "pl-3.5",
    startIcon: "pl-10",
    end: "pr-3.5",
    endSlot: "pr-11",
    icon: "left-3.5",
    slot: "right-2.5",
  },
} as const;

// The recipe (inputClass in auth/AuthParts.tsx), plus states it lacked: a disabled look, and an
// error ring that shows at rest (as a variant it outranks shadow-sm, which a plain class didn't).
// `peer` lets the slots after it react to its focus. Exported for Textarea, which shares it
export const fieldClass =
  "peer block w-full min-w-0 border-0 bg-component-on-container-subtle text-primary-foreground shadow-sm placeholder:text-tertiary-foreground transition-[box-shadow] duration-150 ease-out-quint focus:ring-0 focus:outline-hidden focus:shadow-[0_0_0_2px_var(--color-brand-border-focus)] aria-invalid:shadow-[0_0_0_1px_var(--color-danger-border-default)] aria-invalid:focus:shadow-[0_0_0_2px_var(--color-danger-border-default)] disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:shadow-none disabled:placeholder:text-disabled-foreground pointer-coarse:text-[16px]";

// type="search" without the browser's own clear button and magnifier (SearchField draws its own)
const searchClass = "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none";

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
  const s = sizes[size];
  return (
    <span className={cx("relative block", className)}>
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || ariaInvalid || undefined}
        className={cx(
          fieldClass,
          type === "search" && searchClass,
          s.field,
          leadingIcon ? s.startIcon : s.start,
          trailing ? s.endSlot : s.end,
        )}
        {...rest}
      />
      {/* After the field, so it can follow the field's state (peer); never takes a click */}
      {leadingIcon && (
        <span
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-y-0 flex items-center text-tertiary-foreground transition-colors duration-150 ease-out-quint peer-focus:text-secondary-foreground peer-disabled:text-disabled-foreground [&_svg]:size-4",
            s.icon,
          )}
        >
          {leadingIcon}
        </span>
      )}
      {trailing && (
        <span
          className={cx(
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
