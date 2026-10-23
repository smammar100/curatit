"use client";

// The footer's email field (Footer). There's no mailing list yet, so it doesn't pretend to
// subscribe anyone: a valid address goes to sign-up with the email already filled in (handed over
// through sessionStorage, never the address bar, and read once by SignUpForm). Checked on submit,
// on leaving the field once something's typed, and live once a note shows. Since 2026-10-23 it is
// the system's Field, Input and Button. The footer panel inverts the page through its own --f-*
// palette, which the semantic tokens don't follow, so the form maps the library's variables onto
// that palette (the way Button's accent variant swaps its ink): the field, its words and the
// button then draw in the panel's colours in both themes. Under the field one line is always
// there, the note or the error, so neither moves what's below.
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/fundations/elements/Button";
import Input from "@/components/fundations/elements/Input";
import Field from "@/components/fundations/molecules/Field";
import { emailProblem, SIGNUP_EMAIL_KEY } from "@/lib/auth";

const NOTE = "Free to start. New brands land in your feed as they join.";

const palette =
  "[--foreground:var(--f-ink)] [--background:var(--f-bg)] [--muted-foreground:var(--f-quiet)] [--border:var(--f-line)] [--hover:var(--f-glint)] [--surface-3:var(--f-bg)] [--destructive:var(--f-danger)] [--focus-ring:var(--f-focus)]";

export default function FooterNewsletter() {
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
    <form noValidate onSubmit={submit} className={`w-full max-w-md ${palette}`}>
      <Field label="Your email" error={error} description={error ? undefined : NOTE} descriptionAt="control">
        <Input
          ref={input}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="name@studio.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(emailProblem(event.target.value));
          }}
          onBlur={() => email.trim() && setError(emailProblem(email))}
        />
      </Field>
      <Button type="submit" size="sm" variant="default" loading={pending} className="mt-3">
        Join free
      </Button>
    </form>
  );
}
