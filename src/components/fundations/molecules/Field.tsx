import {
  Children,
  cloneElement,
  useId,
  type AriaAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { cx } from "@/lib/cx";

// A form control with its words: the label, an optional hint, an optional error, a required
// marker and an `aside` at the label's right (like "Forgot password?"). Every Input, Textarea,
// SearchField, Checkbox, Switch or Segmented with a visible label goes in one; a control with no
// visible label (a search pill in a header) takes an aria-label instead.
//
// It wires itself by cloning its one child: the control gets the id the label points at,
// aria-labelledby (so a Segmented, which a <label> can't name, is named too), aria-describedby
// for the hint and the error, aria-invalid while there's an error (the control turns its ring
// red from that) and `required`. No context, so it works in server components (useId is allowed
// there); the child must be the control itself, not a wrapper around it.
//
//   layout  stacked     label above, the control under it (text entry; the default)
//           inline      the control at the start of the label's line (Checkbox)
//           inline-end  the label at the start and the control at the end (Switch, a setting row)
//   description    a hint: under the label (descriptionAt="label", the default, read before
//                  typing) or under the control ("control"). Beside a checkbox, under its label
//   error          what's wrong and how to fix it, in words: red, with an icon. Shown under the
//                  control; while it's there the control is aria-invalid
//   required       an asterisk after the label (hidden from screen readers, which hear the
//                  control's `required`). Mark the required fields only in a form that's mostly
//                  optional; where every field is needed, mark none
//
// In the inline layouts the whole label line takes a click, the gap beside the control included,
// and on touch screens the row grows to 44px so neighbouring rows' hit areas never overlap.
// A disabled control greys its label too. `className` is for layout, on the root.
//
// FieldGroup (a named export) is the heading over a set of controls: a <fieldset> whose <legend>
// is set as a Field's label, with an optional hint under it and an error under the set. The
// controls inside are Fields, or bare controls named with aria-label (a list of textareas,
// "Takeaway 1", "Takeaway 2"). One question with several controls is a FieldGroup; one control is
// a Field.

type ControlProps = Pick<AriaAttributes, "aria-describedby" | "aria-labelledby" | "aria-invalid" | "aria-label"> & {
  id?: string;
  required?: boolean;
};

export type FieldProps = {
  label: ReactNode;
  /** The control: one Input, Textarea, SearchField, Checkbox, Switch or Segmented */
  children: ReactElement<ControlProps>;
  layout?: "stacked" | "inline" | "inline-end";
  description?: ReactNode;
  /** Where the hint sits in the stacked layout */
  descriptionAt?: "label" | "control";
  error?: ReactNode;
  required?: boolean;
  /** At the label's right: a quiet TextLink, a character count */
  aside?: ReactNode;
  /** The control's id, when the page needs to know it (otherwise the child's, or a generated one) */
  id?: string;
  /** Layout only (width, margins, grid placement), on the root */
  className?: string;
};

const labelClass =
  "text-body-sm font-medium text-primary-foreground group-has-[:disabled]/field:text-disabled-foreground";
const hintClass = "text-caption-lg text-pretty text-secondary-foreground";

export default function Field({
  label,
  children,
  layout = "stacked",
  description,
  descriptionAt = "label",
  error,
  required = false,
  aside,
  id,
  className,
}: FieldProps) {
  const generated = useId();
  const child = Children.only(children);
  const own = child.props;
  const controlId = id ?? own.id ?? `${generated}-control`;
  const labelId = `${controlId}-label`;
  const hintId = description ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const control = cloneElement(child, {
    id: controlId,
    // Its own name wins: an aria-label or aria-labelledby already on the control stays
    "aria-labelledby": own["aria-labelledby"] ?? (own["aria-label"] ? undefined : labelId),
    "aria-describedby": [own["aria-describedby"], errorId, hintId].filter(Boolean).join(" ") || undefined,
    "aria-invalid": error ? true : own["aria-invalid"],
    required: required || own.required || undefined,
  });

  const marker = required && (
    <span aria-hidden="true" className="ml-0.5 text-secondary-foreground">
      *
    </span>
  );
  const hint = description && (
    <p id={hintId} className={hintClass}>
      {description}
    </p>
  );
  const problem = error && <FieldError id={errorId}>{error}</FieldError>;

  if (layout === "stacked") {
    const hintFirst = descriptionAt === "label";
    return (
      <div className={cx("group/field", className)}>
        <div className={cx("flex items-baseline justify-between gap-3", hintFirst && hint ? "mb-0.5" : "mb-1.5")}>
          <label id={labelId} htmlFor={controlId} className={labelClass}>
            {label}
            {marker}
          </label>
          {aside}
        </div>
        {hintFirst && hint && <div className="mb-2">{hint}</div>}
        {control}
        {problem && <div className="mt-1.5">{problem}</div>}
        {!hintFirst && hint && <div className="mt-1.5">{hint}</div>}
      </div>
    );
  }

  // Inline: the control in a box one text line tall (20px), so a 16 or 20px checkbox and the
  // 28px switch all centre on the label's first line however many lines follow. The label is a
  // block across its column, and a pseudo-element reaches over the 12px gap, so the gap clicks
  // too. The DOM follows what's seen, so a screen reader meets them in the same order
  const end = layout === "inline-end";
  const slot = <span className="flex h-5 shrink-0 items-center">{control}</span>;
  return (
    <div className={cx("group/field flex items-start gap-3 pointer-coarse:py-3", className)}>
      {!end && slot}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <label
            id={labelId}
            htmlFor={controlId}
            className={cx(
              labelClass,
              "relative block flex-1 cursor-pointer group-has-[:disabled]/field:cursor-default",
              end
                ? "after:absolute after:inset-y-0 after:-right-3 after:w-3"
                : "before:absolute before:inset-y-0 before:-left-3 before:w-3",
            )}
          >
            {label}
            {marker}
          </label>
          {aside}
        </div>
        {hint && <div className="mt-0.5">{hint}</div>}
        {problem && <div className="mt-1.5">{problem}</div>}
      </div>
      {end && slot}
    </div>
  );
}

// The note under a field: red, with an icon, so it never relies on colour alone (as AuthField's)
function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-caption-lg text-pretty text-danger-foreground">
      <WarningCircle className="mt-px size-3.5 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------------------------
// FieldGroup: a heading over several controls

export type FieldGroupProps = {
  /** The group's heading, set as a Field's label */
  legend: ReactNode;
  /** The controls: Fields, or bare controls with an aria-label each */
  children: ReactNode;
  /** A hint under the legend */
  description?: ReactNode;
  /** What's wrong with the set as a whole, under it: red, with an icon */
  error?: ReactNode;
  /** Layout only (width, margins, grid placement), on the fieldset */
  className?: string;
};

// The legend never greys (unlike a Field's label): one disabled control in a set doesn't disable
// the question
const legendClass = "mb-1.5 text-body-sm font-medium text-primary-foreground";

export function FieldGroup({ legend, children, description, error, className }: FieldGroupProps) {
  const generated = useId();
  const hintId = description ? `${generated}-hint` : undefined;
  const errorId = error ? `${generated}-error` : undefined;
  return (
    <fieldset
      aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
      className={cx("min-w-0", className)}
    >
      <legend className={legendClass}>{legend}</legend>
      {description && (
        <p id={hintId} className={cx(hintClass, "-mt-1 mb-2")}>
          {description}
        </p>
      )}
      {children}
      {error && (
        <div className="mt-1.5">
          <FieldError id={errorId}>{error}</FieldError>
        </div>
      )}
    </fieldset>
  );
}
