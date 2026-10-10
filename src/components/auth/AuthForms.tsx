"use client";

// The auth forms, each driven by a server action in src/app/auth/actions.ts. The pages are
// static, so ?next= (where to go after signing in) and ?error= (a link that failed in
// /auth/callback) are read from the address once the page has loaded.
import { useActionState, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";
// Components
import {
  requestPasswordReset,
  resendConfirmation,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
  type AuthState,
} from "@/app/auth/actions";
import { authMessage } from "@/lib/auth";
import { AuthField, AuthNotice, OrDivider } from "./AuthParts";

const linkClass = "font-medium text-accent-500 hover:text-accent-600";

function useParam(name: string) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => setValue(new URLSearchParams(location.search).get(name)), [name]);
  return value;
}

function Next() {
  const next = useParam("next");
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

function Heading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="text-center text-balance">
      <Text tag="h1" variant="displaySM" className="font-display font-light text-base-900">
        {title}
      </Text>
      <Text tag="p" variant="textSM" className="mt-2 text-base-600">
        {children}
      </Text>
    </div>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <Text tag="p" variant="textXS" className="mt-5 text-center font-medium text-base-500">
      {children}
    </Text>
  );
}

function Submit({ pending, idle, busy }: { pending: boolean; idle: string; busy: string }) {
  return (
    <Button size="base" variant="default" type="submit" disabled={pending} aria-disabled={pending} className="w-full disabled:opacity-70">
      {pending ? busy : idle}
    </Button>
  );
}

function GoogleButton() {
  const [state, action, pending] = useActionState(signInWithGoogle, {});
  return (
    <form action={action} className="space-y-3">
      <Next />
      <Button size="base" variant="muted" type="submit" disabled={pending} className="w-full disabled:opacity-70">
        {pending ? "Opening Google…" : "Continue with Google"}
      </Button>
      {state.error && <AuthNotice>{state.error}</AuthNotice>}
    </form>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, {});
  const linkError = useParam("error");
  const error = state.error ?? (linkError ? authMessage(linkError) : null);
  return (
    <>
      <Heading title="Welcome back">Sign in to pick up your boards where you left them.</Heading>
      <div className="mt-6 space-y-5">
        <GoogleButton />
        <OrDivider />
        <form action={action} className="space-y-4">
          <Next />
          <AuthField id="email" label="Email address" type="email" placeholder="you@example.com" inputMode="email" autoComplete="email" required defaultValue={state.email} />
          <AuthField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            aside={
              <Link href="/forgot-password" className="text-xs font-medium text-base-500 hover:text-accent-600">
                Forgot password?
              </Link>
            }
          />
          {error && <AuthNotice>{error}</AuthNotice>}
          <Submit pending={pending} idle="Sign in" busy="Signing in…" />
        </form>
      </div>
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
  if (state.sent) return <CheckEmail email={state.sent} />;
  return (
    <>
      <Heading title="Create your account">Search by brief and save the posts worth studying.</Heading>
      <div className="mt-6 space-y-5">
        <GoogleButton />
        <OrDivider />
        <form action={action} className="space-y-4">
          <Next />
          <AuthField id="email" label="Email address" type="email" placeholder="you@example.com" inputMode="email" autoComplete="email" required defaultValue={state.email} />
          <AuthField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={8}
            required
            aside={<span className="text-xs text-base-400">8 or more characters</span>}
          />
          {state.error && <AuthNotice>{state.error}</AuthNotice>}
          <Submit pending={pending} idle="Create account" busy="Creating account…" />
        </form>
      </div>
      <Footer>
        Already have an account?{" "}
        <Link href="/signin" className={linkClass}>
          Sign in
        </Link>
      </Footer>
    </>
  );
}

// After sign-up, when the project confirms email addresses: the link has to be opened in this
// browser, since it finishes a sign-in this browser started
function CheckEmail({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, { sent: email });
  const [resent, setResent] = useState(false);
  return (
    <>
      <Heading title="Check your email">
        We sent a link to <span className="font-medium text-base-900">{email}</span>. Open it in this browser to finish signing up.
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
        <Button size="base" variant="muted" type="submit" disabled={pending} className="w-full disabled:opacity-70">
          {pending ? "Sending…" : "Send the link again"}
        </Button>
      </form>
      <Footer>
        Wrong address?{" "}
        {/* A full load, so the form starts empty */}
        <a href="/signup" className={linkClass}>
          Start again
        </a>
      </Footer>
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {} as AuthState);
  if (state.sent) {
    return (
      <>
        <Heading title="Check your email">
          If there&apos;s an account for <span className="font-medium text-base-900">{state.sent}</span>, a link to choose a new password is on its way. Open
          it in this browser.
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
      <Heading title="Reset your password">Enter your email and we&apos;ll send you a link to choose a new one.</Heading>
      <form action={action} className="mt-6 space-y-4">
        <AuthField id="email" label="Email address" type="email" placeholder="you@example.com" inputMode="email" autoComplete="email" required defaultValue={state.email} />
        {state.error && <AuthNotice>{state.error}</AuthNotice>}
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
  return (
    <>
      <Heading title="Choose a new password">Use 8 or more characters. You&apos;ll stay signed in on this device.</Heading>
      <form action={action} className="mt-6 space-y-4">
        <AuthField id="password" label="New password" type="password" placeholder="••••••••" autoComplete="new-password" minLength={8} required />
        {state.error && (
          <AuthNotice>
            {state.error}
            {state.error === authMessage("session_missing") && (
              <>
                {" "}
                <Link href="/forgot-password" className="font-medium underline underline-offset-2">
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
