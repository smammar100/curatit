import type { InputHTMLAttributes, ReactNode } from "react";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { cx } from "@/lib/cx";

// Shared pieces of the auth forms (sign in, sign up, forgot and reset password)

// The input, Interfere's (design.interfere.com/input, installed 2026-10-15) at its extra large
// size: 40px, 13px text, radius 8, a white surface carrying the default shadow in place of a
// border, the brand ring on focus, the danger ring when the field has a problem. 16px on touch
// screens so iOS doesn't zoom into it.
export const inputClass =
  "block h-10 w-full rounded-lg bg-component-on-container-subtle px-3 text-body-sm text-primary-foreground shadow-sm placeholder:text-tertiary-foreground transition-[box-shadow] duration-150 ease-out focus:z-10 focus:outline-none pointer-coarse:text-[16px]";
const ringClass = {
  ok: "focus:shadow-[0_0_0_2px_var(--color-brand-border-focus)]",
  error:
    "shadow-[0_0_0_1px_var(--color-danger-border-default)] focus:shadow-[0_0_0_2px_var(--color-danger-border-default)]",
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
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="block text-body-sm font-medium text-primary-foreground"
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
      className="mt-1.5 flex items-start gap-1.5 text-caption-lg text-pretty text-danger-foreground"
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
      className="flex items-start gap-2 rounded-lg bg-danger-subtle px-3 py-2.5 text-body-sm text-pretty text-danger-foreground"
    >
      <WarningCircle className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
