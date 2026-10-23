import type { ChangeEvent, InputHTMLAttributes, Ref } from "react";
import Check from "@/components/fundations/icons/Check";
import { cx } from "@/lib/cx";

// A checkbox: one of several independent yes/no choices (the scopes of an API token, the
// categories to include), or a single "I agree" that a form reads when it's sent. A setting that
// takes effect the moment it's flipped is a Switch; one choice out of a few is Segmented.
//
// A real <input type="checkbox">, so the keyboard (Space), forms, autofill and screen readers
// work as they do natively. It draws itself (appearance-none): a white box with the default
// shadow and a strong hairline, filled with the primary button's near-black when checked (near
// white on the dark site), with Phosphor's Check, or a bar for `indeterminate`, drawn over it.
// In forced-colours mode it hands back to the system's own checkbox.
//
//   size   sm 16px (in a dense list or a table row), md 20px (the default)
//   checked / defaultChecked / onCheckedChange   controlled or uncontrolled; the native onChange
//          works too
//   invalid  sets aria-invalid (a red hairline); Field does it from its error
//   indeterminate  some, not all, of a group: a "select all" over a list. Client components
//          only: it's a DOM property, set through a ref, and a server component can't hold a ref
//          (React refuses at render). A partly-checked group is client state anyway
//
// Name it: wrap it in Field (layout="inline"), point a <label htmlFor> at its id, or pass
// aria-label. On touch screens its hit area reaches 44px through an invisible ::after, so space a
// list of them 44px apart (Field's inline layout does). `className` is for layout and lands on the
// wrapper; every other prop, `ref` included, is the <input>'s.

const sizes = {
  sm: {
    box: "size-4 rounded-sm",
    touch: "pointer-coarse:after:-inset-3.5",
    check: "size-3",
    bar: "h-0.5 w-2",
  },
  md: {
    box: "size-5 rounded-md",
    touch: "pointer-coarse:after:-inset-3",
    check: "size-3.5",
    bar: "h-0.5 w-2.5",
  },
} as const;

// The box. @tailwindcss/forms draws checkboxes too (a grey border, a blue fill and its own check
// image, a blue ring with a white offset on focus); border-0, bg-none and ring-offset-0 take
// those off, and our utilities win over its base styles wherever both set something. Disabled
// takes no pointer, so no hover lands on it
const boxClass =
  "peer relative col-start-1 row-start-1 m-0 cursor-pointer appearance-none border-0 bg-none p-0 shadow-sm ring-offset-0 ring-inset ring-border-strong transition-[background-color,box-shadow] duration-150 ease-out-quint focus:outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus aria-invalid:ring-danger-border-default disabled:pointer-events-none disabled:bg-disabled disabled:shadow-none disabled:ring-0 pointer-coarse:after:absolute forced-colors:appearance-auto";
// The fill, picked in one place so two backgrounds never land at once (cx doesn't merge):
// white with a hairline until it's checked, or the inverted fill throughout while it's mixed
const fills = {
  binary:
    "bg-component-on-container-subtle ring-1 hover:bg-component-on-container-subtle-hover checked:bg-inverted-solid checked:ring-0 checked:hover:bg-inverted-solid-hover",
  mixed: "bg-inverted-solid ring-0 hover:bg-inverted-solid-hover",
} as const;
// The mark over it: never takes a click, in the inverted ink, hidden in forced-colours mode
const markClass =
  "pointer-events-none col-start-1 row-start-1 text-on-inverted-foreground peer-disabled:text-disabled-foreground forced-colors:hidden";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  size?: keyof typeof sizes;
  /** Called with the new state. Client components only, like any handler */
  onCheckedChange?: (checked: boolean) => void;
  /** Some of a group, not all: drawn as a bar, read as "mixed". Client components only */
  indeterminate?: boolean;
  /** Sets aria-invalid: a red hairline. Field sets it from its error */
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
  "aria-invalid": ariaInvalid,
  className,
  ref,
  ...rest
}: CheckboxProps) {
  const s = sizes[size];
  // Only built when there's something to call, so a server component can render it bare
  const change =
    onChange || onCheckedChange
      ? (event: ChangeEvent<HTMLInputElement>) => {
          onChange?.(event);
          onCheckedChange?.(event.currentTarget.checked);
        }
      : undefined;
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
    <span className={cx("inline-grid shrink-0 place-items-center align-middle", className)}>
      <input
        ref={setRef}
        type="checkbox"
        onChange={change}
        aria-invalid={invalid || ariaInvalid || undefined}
        // Drawn from the prop, not :indeterminate, so the server's HTML is already right before
        // the property is set
        className={cx(boxClass, indeterminate ? fills.mixed : fills.binary, s.box, s.touch)}
        {...rest}
      />
      {indeterminate ? (
        <span aria-hidden="true" className={cx(markClass, "rounded-full bg-current", s.bar)} />
      ) : (
        <Check
          className={cx(
            markClass,
            "opacity-0 transition-opacity duration-150 ease-out-quint peer-checked:opacity-100",
            s.check,
          )}
        />
      )}
    </span>
  );
}
