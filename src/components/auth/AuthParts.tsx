import type { InputHTMLAttributes, ReactNode } from "react";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { cx } from "@/lib/cx";

// Shared pieces of the auth forms (sign in, sign up, forgot and reset password)

// The input, since 2026-10-23 the shared Input's recipe (Fluid Functionalism's field: the one
// stroke as a 1px ring on no fill, a faint hover tint, the card surface while focused, a red ring
// when the field has a problem, the page's 1px terracotta focus outline) at the compact step:
// 28px, 12px text, a pill, the same as the card's Sign in button under it. 16px on touch
// screens so iOS doesn't zoom into it. border-0 takes off the grey border @tailwindcss/forms
// gives text fields, and focus:ring-border keeps its blue focus ring off.
export const inputClass =
  "block h-7 w-full rounded-[20px] border-0 bg-transparent px-2.5 text-[length:var(--fs-body-compact,12px)] leading-[var(--lh-body-compact,18px)] text-foreground ring-1 ring-border placeholder:text-muted-foreground transition-[background-color,box-shadow] duration-80 hover:bg-hover focus:z-10 focus:bg-surface-3 focus:ring-border focus:hover:bg-surface-3 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] pointer-coarse:text-[16px]";
const ringClass = {
  ok: "",
  // Keyed off aria-invalid (which AuthField sets with the error), so the red ring shows at rest
  // and on focus. The shared Input's fieldClass does the same
  error: "aria-invalid:ring-destructive/50 aria-invalid:focus:ring-destructive/50",
};

// A labelled input; `aside` sits at the label's right, like "Forgot password?". `error` is a
// problem with this field: it shows under it in red, turns its ring red and is read with the field
export function AuthField({
  id,
  label,
  aside,
  error,
  ...input
}: {
  id: string;
  label: string;
  aside?: ReactNode;
  error?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy =
    [input["aria-describedby"], error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="w-full">
      {/* The label in the muted ink, a notch in from the field's edge, as Field sets its labels */}
      <div className="mb-1 flex items-baseline justify-between gap-3 px-2.5">
        <label
          htmlFor={id}
          className="block text-body text-muted-foreground"
        >
          {label}
        </label>
        {aside}
      </div>
      <input
        id={id}
        name={id}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(inputClass, error ? ringClass.error : ringClass.ok)}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

// The note under a field: red, with an icon so it never relies on colour alone
function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p
      id={id}
      className="mt-1 flex items-start gap-1.5 px-2.5 text-caption text-pretty text-destructive"
    >
      <WarningCircle className="mt-px size-3.5 shrink-0" />
      {children}
    </p>
  );
}

// A problem with the form (from the server: wrong password, a rate limit), read out as soon as
// it appears: a pale red panel with an icon
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-[20px] bg-danger-subtle px-3.5 py-2.5 text-body text-pretty text-danger-foreground"
    >
      <WarningCircle className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
