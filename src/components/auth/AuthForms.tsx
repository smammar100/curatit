"use client";

// The auth forms, each driven by a server action in src/app/auth/actions.ts. The pages are
// static, so ?next= (where to go after signing in) and ?error= (a link that failed in
// /auth/callback) are read from the address once the page has loaded.
import {
  useActionState,
  useEffect,
  useState,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";
// Components
import {
  requestPasswordReset,
  resendConfirmation,
  signIn,
  signUp,
  updatePassword,
  type AuthFields,
  type AuthState,
} from "@/app/auth/actions";
import { identify } from "@/lib/analytics";
import {
  authMessage,
  emailProblem,
  passwordProblem,
  SIGNUP_EMAIL_KEY,
} from "@/lib/auth";
import { SUPPORT_MAILTO } from "@/lib/site";
import { AuthField, AuthNotice } from "./AuthParts";
import PasswordField from "./PasswordField";

const linkClass = "font-medium text-accent-500 hover:text-accent-600";

function useParam(name: string) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(
    () => setValue(new URLSearchParams(location.search).get(name)),
    [name],
  );
  return value;
}

function Next() {
  const next = useParam("next");
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

function Heading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="text-center text-balance">
      <Text tag="h1" variant="h5" className="text-primary-foreground">
        {title}
      </Text>
      <Text tag="p" variant="bodySM" className="mt-2 text-secondary-foreground">
        {children}
      </Text>
    </div>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <Text
      tag="p"
      variant="textXS"
      className="mt-5 text-center font-medium text-base-500"
    >
      {children}
    </Text>
  );
}

// The forms check their own fields (the browser's bubbles are off: noValidate). A field's note
// shows on submit, which is then held back with focus on the first problem; when you leave a
// field you've typed in, for the fields in `onLeave` (not a new password, whose checklist
// already says what's missing as you type); and it updates as you edit, so it goes the moment
// the field is fixed. The server actions run the same checks for a submit without JavaScript,
// and what they find about a field (`server`: an email that's already in use, a password
// Supabase turned down) shows under it the same way.
type Checks = Record<string, (value: string) => string | null>;
const enterPassword = (value: string) =>
  value ? null : "Enter your password.";

function useValidation(
  checks: Checks,
  onLeave: string[] = [],
  server?: AuthFields,
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (server) setErrors(server as Record<string, string>);
  }, [server]);
  const set = (name: string, message: string | null) =>
    setErrors((current) => {
      if ((current[name] ?? null) === message) return current;
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  const checked = (target: EventTarget) =>
    target instanceof HTMLInputElement && target.name in checks ? target : null;
  return {
    errors,
    any: Object.keys(errors).length > 0,
    form: {
      noValidate: true,
      onSubmit(event: FormEvent<HTMLFormElement>) {
        const form = event.currentTarget;
        const found: Record<string, string> = {};
        for (const [name, check] of Object.entries(checks)) {
          const input = form.elements.namedItem(name);
          const message =
            input instanceof HTMLInputElement ? check(input.value) : null;
          if (message) found[name] = message;
        }
        setErrors(found);
        const first = Object.keys(found)[0];
        if (first) {
          event.preventDefault();
          (form.elements.namedItem(first) as HTMLInputElement).focus();
        }
      },
      onChange(event: FormEvent<HTMLFormElement>) {
        const input = checked(event.target);
        if (input && errors[input.name])
          set(input.name, checks[input.name](input.value));
      },
      onBlur(event: FocusEvent<HTMLFormElement>) {
        const input = checked(event.target);
        if (input && input.value && onLeave.includes(input.name))
          set(input.name, checks[input.name](input.value));
      },
    },
  };
}

function Submit({
  pending,
  idle,
  busy,
}: {
  pending: boolean;
  idle: string;
  busy: string;
}) {
  return (
    <Button
      size="base"
      variant="default"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="w-full disabled:opacity-70"
    >
      {pending ? busy : idle}
    </Button>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});
  const linkError = useParam("error");
  const check = useValidation(
    { email: emailProblem, password: enterPassword },
    ["email"],
    state.fields,
  );
  const error = check.any
    ? null
    : (state.error ?? (linkError ? authMessage(linkError) : null));
  return (
    <>
      <Heading title="Welcome back">
        Sign in to pick up your boards where you left them.
      </Heading>
      <form action={action} {...check.form} className="mt-6 space-y-4">
        <Next />
        <AuthField
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          error={check.errors.email}
        />
        <AuthField
          id="password"
          error={check.errors.password}
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          aside={
            <Link
              href="/forgot-password"
              className="text-caption-lg font-medium text-secondary-foreground hover:text-brand-foreground"
            >
              Forgot password?
            </Link>
          }
        />
        {error && <AuthNotice>{error}</AuthNotice>}
        <Submit pending={pending} idle="Sign in" busy="Signing in…" />
      </form>
      <Footer>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className={linkClass}>
          Sign up
        </Link>
      </Footer>
    </>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, {});
  const check = useValidation(
    { email: emailProblem, password: passwordProblem },
    ["email"],
    state.fields,
  );

  // An address typed into the site footer's field (FooterNewsletter), handed over once
  useEffect(() => {
    let email: string | null = null;
    try {
      email = sessionStorage.getItem(SIGNUP_EMAIL_KEY);
      sessionStorage.removeItem(SIGNUP_EMAIL_KEY);
    } catch {
      return;
    }
    const field = document.getElementById("email") as HTMLInputElement | null;
    if (email && field && !field.value) field.value = email;
  }, []);
  // Analytics: tie this browser's visit to the new account now, not only once the email is
  // confirmed, so a sign-up that stops at the email still counts in the funnel
  useEffect(() => {
    if (state.userId) identify(state.userId, { email: state.sent });
  }, [state.userId, state.sent]);
  if (state.sent) return <CheckEmail email={state.sent} />;
  const error = check.any ? null : state.error;
  return (
    <>
      <Heading title="Create your account">
        Find references and save them for your next project. Free during the
        beta.
      </Heading>
      <form action={action} {...check.form} className="mt-6 space-y-4">
        <Next />
        <AuthField
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          error={
            check.errors.email === authMessage("email_exists") ? (
              <EmailTaken />
            ) : (
              check.errors.email
            )
          }
        />
        <PasswordField error={check.errors.password} />
        {error && <AuthNotice>{error}</AuthNotice>}
        <Submit
          pending={pending}
          idle="Create account"
          busy="Creating account…"
        />
      </form>
      <Footer>
        Already have an account?{" "}
        <Link href="/signin" className={linkClass}>
          Sign in
        </Link>
      </Footer>
    </>
  );
}

// Under the email on sign-up when the address already has an account: sign in, or write to us
function EmailTaken() {
  const link = "font-medium underline underline-offset-2";
  return (
    <span>
      {authMessage("email_exists")}{" "}
      <Link href="/signin" className={link}>
        Sign in
      </Link>{" "}
      instead, or{" "}
      <a href={SUPPORT_MAILTO} className={link}>
        contact support
      </a>
      .
    </span>
  );
}

// After sign-up, when the project confirms email addresses: the link has to be opened in this
// browser, since it finishes a sign-in this browser started
function CheckEmail({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, {
    sent: email,
  });
  const [resent, setResent] = useState(false);
  return (
    <>
      <Heading title="Check your email">
        We sent a link to{" "}
        <span className="font-medium text-base-900">{email}</span>. Open it in
        this browser to finish signing up.
      </Heading>
      <form
        action={(form) => {
          setResent(true);
          return action(form);
        }}
        className="mt-6 space-y-4"
      >
        <input type="hidden" name="email" value={email} />
        <Next />
        {state.error && <AuthNotice>{state.error}</AuthNotice>}
        {resent && !pending && !state.error && (
          <p role="status" className="text-center text-sm text-base-600">
            Sent again. It can take a minute to arrive.
          </p>
        )}
        <Button
          size="base"
          variant="muted"
          type="submit"
          disabled={pending}
          className="w-full disabled:opacity-70"
        >
          {pending ? "Sending…" : "Send the link again"}
        </Button>
      </form>
      <Footer>
        Wrong address? {/* A full load, so the form starts empty */}
        <a href="/signup" className={linkClass}>
          Start again
        </a>
      </Footer>
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    {} as AuthState,
  );
  const check = useValidation({ email: emailProblem }, ["email"], state.fields);
  if (state.sent) {
    return (
      <>
        <Heading title="Check your email">
          If there&apos;s an account for{" "}
          <span className="font-medium text-base-900">{state.sent}</span>, a
          link to choose a new password is on its way. Open it in this browser.
        </Heading>
        <Footer>
          <Link href="/signin" className={linkClass}>
            Back to sign in
          </Link>
        </Footer>
      </>
    );
  }
  return (
    <>
      <Heading title="Reset your password">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </Heading>
      <form action={action} {...check.form} className="mt-6 space-y-4">
        <AuthField
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          error={check.errors.email}
        />
        {state.error && !check.any && <AuthNotice>{state.error}</AuthNotice>}
        <Submit pending={pending} idle="Send reset link" busy="Sending…" />
      </form>
      <Footer>
        Remembered it?{" "}
        <Link href="/signin" className={linkClass}>
          Sign in
        </Link>
      </Footer>
    </>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  const check = useValidation(
    {
      password: (value) =>
        value ? passwordProblem(value) : "Enter a new password.",
    },
    [],
    state.fields,
  );
  const error = check.any ? null : state.error;
  return (
    <>
      <Heading title="Choose a new password">
        Make it one you don&apos;t use anywhere else. You&apos;ll stay signed in
        on this device.
      </Heading>
      <form action={action} {...check.form} className="mt-6 space-y-4">
        <PasswordField label="New password" error={check.errors.password} />
        {error && (
          <AuthNotice>
            {error}
            {error === authMessage("session_missing") && (
              <>
                {" "}
                <Link
                  href="/forgot-password"
                  className="font-medium underline underline-offset-2"
                >
                  Get a new link
                </Link>
              </>
            )}
          </AuthNotice>
        )}
        <Submit pending={pending} idle="Save password" busy="Saving…" />
      </form>
      <Footer>
        <Link href="/signin" className={linkClass}>
          Back to sign in
        </Link>
      </Footer>
    </>
  );
}
