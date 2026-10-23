"use client";

// The footer's email field (Footer). There's no mailing list yet, so it doesn't pretend to
// subscribe anyone: a valid address goes to sign-up with the email already filled in (handed over
// through sessionStorage, never the address bar, and read once by SignUpForm). Checked on submit,
// on leaving the field once something's typed, and live once a note shows.
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { emailProblem, SIGNUP_EMAIL_KEY } from "@/lib/auth";
import { cx } from "@/lib/cx";

export default function FooterNewsletter() {
  const id = useId();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => router.prefetch("/signup"), [router]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = emailProblem(email);
    setError(problem);
    if (problem) return input.current?.focus();
    try {
      sessionStorage.setItem(SIGNUP_EMAIL_KEY, email.trim());
    } catch {
      // Storage off: sign-up just starts empty
    }
    startTransition(() => router.push("/signup"));
  }

  return (
    <form noValidate onSubmit={submit} className="w-full max-w-md">
      <label htmlFor={`${id}-email`} className="block text-caption-lg/5 font-medium text-[color:var(--f-body)]">
        Your email
      </label>
      <div className="relative mt-2">
        <input
          ref={input}
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="name@studio.com"
          value={email}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-note`}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(emailProblem(event.target.value));
          }}
          onBlur={() => email.trim() && setError(emailProblem(email))}
          className="footer-field block h-13 w-full rounded-xl py-0 pr-32 pl-4 text-body-sm pointer-coarse:text-[16px]"
        />
        <button type="submit" aria-disabled={pending || undefined} className="footer-submit absolute inset-y-1 right-1 grid place-items-center rounded-md px-4 text-body-sm font-medium">
          {/* Both labels share one cell, so the button keeps its width */}
          <span className="grid justify-items-center">
            <span className="invisible [grid-area:1/1]" aria-hidden="true">
              Opening…
            </span>
            <span className="[grid-area:1/1]">{pending ? "Opening…" : "Join free"}</span>
          </span>
        </button>
      </div>
      {/* Room for two lines on phones and one on wider screens, so a note never moves what's below */}
      <p id={`${id}-note`} className={cx("mt-3 flex min-h-10 gap-1.5 text-caption-lg/5 text-pretty sm:min-h-5", error ? "text-[color:var(--f-danger)]" : "text-[color:var(--f-quiet)]")}>
        {error && <WarningCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
        {error ?? "Free to start. New brands land in your feed as they join."}
      </p>
    </form>
  );
}
