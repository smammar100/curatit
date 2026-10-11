import type { InputHTMLAttributes, ReactNode } from "react";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { cx } from "@/lib/cx";

// Shared pieces of the auth forms (sign in, sign up, forgot and reset password)

const inputClass =
  "block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition-[box-shadow,border-color] duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-900 ring-1 placeholder-base-400 focus:ring-2 focus:outline-none shadow-sm";
// The ring and focus colours, normal or with an error (red, see --color-danger-* in global.css)
const ringClass = { ok: "ring-base-200 focus:border-accent-500 focus:ring-accent-100", error: "ring-danger-500 focus:border-danger-500 focus:ring-danger-100" };

// A labelled input; `aside` sits at the label's right, like "Forgot password?". `error` is a
// problem with this field: it shows under it in red, turns its ring red and is read with the field
export function AuthField({ id, label, aside, error, ...input }: { id: string; label: string; aside?: ReactNode; error?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [input["aria-describedby"], error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-base-500">
          {label}
        </label>
        {aside}
      </div>
      <input id={id} name={id} {...input} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cx(inputClass, error ? ringClass.error : ringClass.ok)} />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

// The note under a field: red, with an icon so it never relies on colour alone
function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs text-pretty text-danger-600">
      <WarningCircle className="mt-px size-3.5 shrink-0" />
      {children}
    </p>
  );
}

// A problem with the form (from the server: wrong password, a rate limit), read out as soon as
// it appears: a pale red panel with an icon
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-50 px-3 py-2.5 text-sm text-pretty text-danger-700">
      <WarningCircle className="mt-0.5 size-4 shrink-0 text-danger-600" />
      {children}
    </p>
  );
}
