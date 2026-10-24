"use client";

// The footer's email field (Footer). There's no mailing list yet, so it doesn't pretend to
// subscribe anyone: a valid address goes to sign-up with the email already filled in (handed over
// through sessionStorage, never the address bar, and read once by SignUpForm). Checked on submit,
// on leaving the field once something's typed, and live once a note shows. Since 2026-10-24 it is
// Glaze's Field, Input and Button; the footer panel is a Glaze scope in the dark theme, so they
// draw in its colours with no palette of their own. Under the field one line is always there, the
// note or the error, so neither moves what's below.
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/glaze/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/glaze/ui/field";
import { Input } from "@/components/glaze/ui/input";
import { Failed, Icon } from "@/components/glaze/icon";
import { emailProblem, SIGNUP_EMAIL_KEY } from "@/lib/auth";

const NOTE = "Free to start. New brands land in your feed as they join.";

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
    <form noValidate onSubmit={submit} className="w-full max-w-md">
      {/* The form's own checks decide what's wrong (invalid) and say it */}
      <Field invalid={!!error}>
        <FieldLabel>Your email</FieldLabel>
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
        {error ? (
          <FieldError className="flex-row items-start gap-1.5">
            <Icon icon={Failed} className="mt-0.75" />
            {error}
          </FieldError>
        ) : (
          <FieldDescription>{NOTE}</FieldDescription>
        )}
      </Field>
      <Button type="submit" size="sm" variant="primary" pending={pending} className="mt-3">
        Join free
      </Button>
    </form>
  );
}
