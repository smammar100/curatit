import type { InputHTMLAttributes } from "react";

// Shared pieces of the sign-in and sign-up forms

const inputClass =
  "block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition-[box-shadow,border-color] duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-900 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm";

// A labelled input
export function AuthField({ id, label, ...input }: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-base-500">
        {label}
      </label>
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
