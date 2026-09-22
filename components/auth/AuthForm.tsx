"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthState } from "@/app/actions/auth";

const fieldClass =
  "block w-full px-4 py-2 text-sm leading-tight bg-white border border-transparent transition duration-300 ease-in-out h-10 rounded-md text-base-900 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm";

export default function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "signin" | "signup";
  action: (state: AuthState, form: FormData) => Promise<AuthState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, email: "" });
  const isSignUp = mode === "signup";

  return (
    <form action={formAction} className="mt-10 space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label htmlFor="email" className="block mb-1 text-sm font-medium text-base-600">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          placeholder="you@agency.com"
          className={fieldClass}
          aria-describedby={state.error ? "auth-error" : undefined}
        />
      </div>

      <div>
        <label htmlFor="password" className="block mb-1 text-sm font-medium text-base-600">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={isSignUp ? 10 : undefined}
          placeholder="••••••••••"
          className={fieldClass}
          aria-describedby={isSignUp ? "password-hint" : undefined}
        />
        {isSignUp && (
          <p id="password-hint" className="mt-1 text-xs text-base-500">
            At least 10 characters.
          </p>
        )}
      </div>

      {isSignUp && (
        <div>
          <label htmlFor="confirm" className="block mb-1 text-sm font-medium text-base-600">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••••"
            className={fieldClass}
          />
        </div>
      )}

      <div id="auth-error" role="alert" aria-live="assertive" className="min-h-5 text-sm text-red-700">
        {state.error}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center h-10 px-5 rounded-lg text-sm font-medium text-white bg-accent-600 hover:bg-accent-500 transition-colors disabled:opacity-60 focus:outline-2 focus:outline-offset-2 focus:outline-accent-500"
      >
        {pending ? "One moment…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className="text-center text-xs text-base-500">
        {isSignUp ? "Already have an account? " : "New to Curatit? "}
        <Link
          href={`${isSignUp ? "/signin" : "/signup"}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-accent-600 hover:text-base-900"
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
