"use client";

import { useEffect, useState, type ChangeEvent, type InputHTMLAttributes, type Ref } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

// A checkbox: one of several independent yes/no choices (the scopes of an API token, the
// categories to include), or a single "I agree" that a form reads when it's sent. A setting that
// takes effect the moment it's flipped is a Switch; one choice out of a few is Segmented.
//
// A real <input type="checkbox">, so the keyboard (Space), forms, autofill and screen readers
// work as they do natively. Since 2026-10-23 it's drawn as Fluid Functionalism's CheckboxItem
// draws its square: a 1.5px stroke of the one border on no fill, darkening under the pointer;
// checked, the stroke goes and the check alone marks the state, drawing itself in 80ms and
// retracting in 40ms (at once under reduced motion). `indeterminate` is a bar. In forced-colours
// mode it hands back to the system's own checkbox.
//
//   size   sm 14px (in a dense list or a table row, the compact step), md 16px (the default)
//   checked / defaultChecked / onCheckedChange   controlled or uncontrolled; the native onChange
//          works too
//   invalid  sets aria-invalid (a red stroke); Field does it from its error
//   indeterminate  some, not all, of a group: a "select all" over a list. It's a DOM property,
//          set through a ref
//
// Name it: wrap it in Field (layout="inline"), point a <label htmlFor> at its id, or pass
// aria-label. On touch screens its hit area reaches 44px through an invisible ::after, so space a
// list of them 44px apart (Field's inline layout does). `className` is for layout and lands on the
// wrapper; every other prop, `ref` included, is the <input>'s.

const sizes = {
  sm: { box: "size-3.5 rounded-[4px]", touch: "pointer-coarse:after:-inset-[15px]", mark: 14, bar: "h-0.5 w-1.5" },
  md: { box: "size-4 rounded-[5px]", touch: "pointer-coarse:after:-inset-3.5", mark: 16, bar: "h-0.5 w-2" },
} as const;

// The box. @tailwindcss/forms draws checkboxes too (a grey border, a blue fill and its own check
// image, a blue ring with a white offset on focus); border-0, bg-none and ring-offset-0 take
// those off. The stroke is a box-shadow, so it can be 1.5px and go transparent when checked
const boxClass =
  "peer relative col-start-1 row-start-1 m-0 cursor-pointer appearance-none border-0 bg-none bg-transparent p-0 ring-offset-0 shadow-[inset_0_0_0_1.5px_var(--border)] transition-[box-shadow] duration-80 hover:shadow-[inset_0_0_0_1.5px_var(--muted-foreground)] checked:shadow-[inset_0_0_0_1.5px_transparent] focus:outline-hidden focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] aria-invalid:shadow-[inset_0_0_0_1.5px_var(--destructive)] disabled:pointer-events-none disabled:opacity-50 pointer-coarse:after:absolute forced-colors:appearance-auto";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  size?: keyof typeof sizes;
  /** Called with the new state */
  onCheckedChange?: (checked: boolean) => void;
  /** Some of a group, not all: drawn as a bar, read as "mixed" */
  indeterminate?: boolean;
  /** Sets aria-invalid: a red stroke. Field sets it from its error */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
  /** Layout only (margins, alignment), on the wrapper */
  className?: string;
};

export default function Checkbox({
  size = "md",
  onCheckedChange,
  onChange,
  indeterminate,
  invalid = false,
  checked,
  defaultChecked,
  "aria-invalid": ariaInvalid,
  className,
  ref,
  ...rest
}: CheckboxProps) {
  const s = sizes[size];
  const reduced = useReducedMotion();
  // The mark follows the input's state: the prop when controlled, otherwise what the input says
  const [own, setOwn] = useState(Boolean(defaultChecked));
  const on = checked ?? own;
  useEffect(() => {
    if (checked !== undefined) setOwn(checked);
  }, [checked]);

  const change = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onCheckedChange?.(event.currentTarget.checked);
    if (checked === undefined) setOwn(event.currentTarget.checked);
  };
  // indeterminate is a property, not an attribute: set it on every render (a click clears it, and
  // the parent's next render puts it back if it still holds), then hand the element to `ref`
  const setRef =
    indeterminate === undefined
      ? ref
      : (element: HTMLInputElement | null) => {
          if (element) element.indeterminate = indeterminate;
          if (typeof ref === "function") return ref(element);
          if (ref) ref.current = element;
        };
  return (
    <MotionConfig reducedMotion="user">
      <span className={cn("inline-grid shrink-0 place-items-center align-middle", className)}>
        <input
          ref={setRef}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={change}
          aria-invalid={invalid || ariaInvalid || undefined}
          className={cn(boxClass, indeterminate && "shadow-[inset_0_0_0_1.5px_transparent]", s.box, s.touch)}
          {...rest}
        />
        {indeterminate ? (
          <span
            aria-hidden="true"
            className={cn("pointer-events-none col-start-1 row-start-1 rounded-full bg-foreground peer-disabled:opacity-50 forced-colors:hidden", s.bar)}
          />
        ) : (
          // initial={false}: a box checked at mount shows the finished check instead of drawing it
          <AnimatePresence initial={false}>
            {on && (
              <motion.svg
                key="check"
                aria-hidden="true"
                width={s.mark}
                height={s.mark}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none col-start-1 row-start-1 text-foreground peer-disabled:opacity-50 forced-colors:hidden"
              >
                <motion.path
                  d="M6 12L10 16L18 8"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={{ pathLength: 1, transition: { duration: 0.08, ease: "easeOut" } }}
                  exit={{ pathLength: 0, transition: { duration: 0.04, ease: "easeIn" } }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        )}
      </span>
    </MotionConfig>
  );
}
