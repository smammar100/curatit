import type { InputHTMLAttributes, ReactNode } from "react";
import WarningCircle from "@/components/fundations/icons/WarningCircle";

// Shared pieces of the auth forms (sign in, sign up, forgot and reset password)

const inputClass =
  "block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition-[box-shadow,border-color] duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-900 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm";

// A labelled input; `aside` sits at the label's right, like "Forgot password?"
export function AuthField({ id, label, aside, ...input }: { id: string; label: string; aside?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-base-500">
          {label}
        </label>
        {aside}
      </div>
      <input id={id} name={id} className={inputClass} {...input} />
    </div>
  );
}

// "or" between the provider button and the email form
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-base-400" role="separator">
      <span className="h-px flex-1 bg-base-200" />
      or
      <span className="h-px flex-1 bg-base-200" />
    </div>
  );
}

// A problem with the form, read out as soon as it appears. The palette has no red and accent is
// for interaction, so it's a quiet panel with an icon rather than a coloured one.
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md bg-base-50 px-3 py-2.5 text-sm text-pretty text-base-900">
      <WarningCircle className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}
