import type { CSSProperties, Ref, TextareaHTMLAttributes } from "react";
import { fieldClass } from "@/components/fundations/elements/Input";
import { cx } from "@/lib/cx";

// Multi-line text entry on the Input's recipe: the same white surface, shadow, brand focus ring,
// red ring when invalid and 16px text on touch screens. For a description, a note, a message:
// anything that may run past one line. One line (a name, an email) is Input. Its label, hint and
// error come from Field, as for Input.
//
//   size        md (the default) and lg, the Input's two: one row is exactly 40 or 44px tall,
//               so a one-row textarea lines up with an Input beside it
//   rows        the height it opens at (3 by default)
//   resize      "vertical" (the default: a person can drag it taller) or "none" (a fixed box,
//               like a note on a board)
//   autoResize  grows with its text, never shorter than `rows`, up to `maxRows` (then it
//               scrolls). Pure CSS (field-sizing: content), so the browser sizes it while it lays
//               the page out: no measuring script, no jump a frame late. Where field-sizing isn't
//               supported yet (Firefox, older Safari) it stays at `rows` and scrolls, which is
//               the plain textarea. It turns the drag handle off.
//
// Server component. As with Input, `className` is for layout (width, margins) and lands on a
// wrapper; every other prop and `ref` go to the <textarea>. Enter makes a new line, so a form with a textarea needs a submit button;
// a client form can also send on Cmd/Ctrl+Enter (form.requestSubmit()).

// One row's height is the line (20px) plus the padding, matching the Input's heights
const sizes = {
  md: { field: "rounded-lg px-3 py-2.5 text-body-sm", padY: "1.25rem" },
  lg: { field: "rounded-xl px-3.5 py-3 text-body", padY: "1.5rem" },
} as const;

const resizes = {
  vertical: "resize-y",
  none: "resize-none",
} as const;

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: keyof typeof sizes;
  /** The value has a problem: sets aria-invalid, which turns the ring red. Field sets it for you */
  invalid?: boolean;
  resize?: keyof typeof resizes;
  /** Grow with the text (CSS field-sizing), from `rows` up to `maxRows` */
  autoResize?: boolean;
  /** With autoResize: the tallest it grows before it scrolls. No limit by default */
  maxRows?: number;
  ref?: Ref<HTMLTextAreaElement>;
  /** Layout only (width, margins), on the wrapper */
  className?: string;
};

export default function Textarea({
  size = "md",
  invalid = false,
  resize = "vertical",
  autoResize = false,
  maxRows,
  rows = 3,
  className,
  style,
  "aria-invalid": ariaInvalid,
  ref,
  ...rest
}: TextareaProps) {
  const s = sizes[size];
  // With field-sizing the rows attribute no longer sets the height, so the floor (and the
  // ceiling) are set in lines of its own line-height (lh) plus the padding
  const grow: CSSProperties | undefined = autoResize
    ? {
        minHeight: `calc(${rows}lh + ${s.padY})`,
        maxHeight: maxRows ? `calc(${maxRows}lh + ${s.padY})` : undefined,
      }
    : undefined;
  return (
    <span className={cx("block", className)}>
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || ariaInvalid || undefined}
        style={grow || style ? { ...grow, ...style } : undefined}
        className={cx(fieldClass, s.field, autoResize ? "field-sizing-content resize-none" : resizes[resize])}
        {...rest}
      />
    </span>
  );
}
