"use client";

// The auth forms, each driven by a server action in src/app/auth/actions.ts. The pages are
// static, so ?next= (where to go after signing in) and ?error= (a link that failed in
// /auth/callback) are read from the address once the page has loaded. Since 2026-10-24 every
// piece is Glaze's: the fields are AuthField (a Field with an Input and a FieldError), the
// server's message a fail Alert, the submit a primary Button that pends with its -ing verb, the
// links TextLinks (inline in the footers and inside notes, quiet for "Forgot password?" at the
// label's right), the words text-1 and text-2 and the medium weight where they were semibold.
// The validation, the copy and the analytics are as they were.
import {
  useActionState,
  useEffect,
  useState,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react";
// Fundations
import Text from "@/components/fundations/elements/Text";
import TextLink from "@/components/fundations/elements/TextLink";
// Glaze
import { Button } from "@/components/glaze/ui/button";
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

export function Heading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="text-center text-balance">
      <Text tag="h1" variant="h5" className="text-text-1">
        {title}
      </Text>
      <Text tag="p" variant="bodySM" className="mt-2 text-text-2">
        {children}
      </Text>
    </div>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  return (
    <Text
      tag="p"
      variant="captionLG"
      className="mt-5 text-center font-medium text-text-2"
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

// The form's button, the card's one primary. While its action runs it shows the arc and the busy
// words and ignores presses (pending: focus stays on it, aria-busy is set and its name stays the
// idle words); `waiting` is for before it can be used at all, and disables it outright, which
// also holds back a press made before the page's script has loaded
export function Submit({
  pending,
  waiting = false,
  idle,
  busy,
}: {
  pending: boolean;
  waiting?: boolean;
  idle: string;
  busy: string;
}) {
  return (
    <Button
      // Glaze's default step, 32px, the same as the fields above it
      variant="primary"
      type="submit"
      pending={pending}
      pendingLabel={busy}
      disabled={waiting}
      className="w-full"
    >
      {idle}
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
            // The label's own size
            <TextLink variant="quiet" href="/forgot-password" className="type-body-sm">
              Forgot password?
            </TextLink>
          }
        />
        {error && <AuthNotice>{error}</AuthNotice>}
        <Submit pending={pending} idle="Sign in" busy="Signing in…" />
      </form>
      <Footer>
        Don&apos;t have an account? <TextLink href="/signup">Sign up</TextLink>
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
        Already have an account? <TextLink href="/signin">Sign in</TextLink>
      </Footer>
    </>
  );
}

// Under the email on sign-up when the address already has an account: sign in, or write to us
function EmailTaken() {
  return (
    <span>
      {authMessage("email_exists")} <TextLink href="/signin">Sign in</TextLink> instead, or{" "}
      <TextLink href={SUPPORT_MAILTO}>contact support</TextLink>.
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
        <span className="font-medium text-text-1">{email}</span>
        . Open it in this browser to finish signing up.
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
          <Text
            tag="p"
            variant="bodySM"
            role="status"
            className="text-center text-text-2"
          >
            Sent again. It can take a minute to arrive.
          </Text>
        )}
        <Button
          variant="secondary"
          type="submit"
          pending={pending}
          pendingLabel="Sending…"
          className="w-full"
        >
          Send the link again
        </Button>
      </form>
      <Footer>
        Wrong address?{" "}
        {/* A full load (not a client-side navigation to the page that's already here), so the
            form starts empty */}
        <TextLink
          href="/signup"
          onClick={(event) => {
            event.preventDefault();
            location.assign("/signup");
          }}
        >
          Start again
        </TextLink>
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
          <span className="font-medium text-text-1">{state.sent}</span>
          , a link to choose a new password is on its way. Open it in this browser.
        </Heading>
        <Footer>
          <TextLink href="/signin">Back to sign in</TextLink>
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
        Remembered it? <TextLink href="/signin">Sign in</TextLink>
      </Footer>
    </>
  );
}

// /auth/confirm, where the confirm, reset and change-email links land. The link's token is only
// used when the person clicks the button (a POST to /auth/callback), so a mail scanner that
// opens every link doesn't use it up first. Supabase's {{ .RedirectTo }} arrives as next: the
// /auth/callback?next=… address the flow was started with, so the visitor still ends up where
// they were going; failing that, each kind of link has its own default.
const CONFIRM = {
  email: { title: "Confirm your email", body: "One click and your Curatit account is ready.", button: "Confirm email", busy: "Confirming…", next: "/dashboard" },
  recovery: { title: "Reset your password", body: "Continue to choose a new password for your account.", button: "Choose a new password", busy: "Opening…", next: "/reset-password" },
  email_change: { title: "Confirm your new email", body: "Confirm this is the address you want to use for Curatit.", button: "Confirm new email", busy: "Confirming…", next: "/dashboard" },
} as const;
const CONFIRM_TYPES: Record<string, keyof typeof CONFIRM> = { email: "email", signup: "email", recovery: "recovery", email_change: "email_change" };

function nextFromLink(raw: string | null) {
  if (!raw) return null;
  try {
    const url = new URL(raw, location.origin);
    if (url.origin !== location.origin) return null;
    return url.pathname === "/auth/callback" ? url.searchParams.get("next") : url.pathname + url.search;
  } catch {
    return null;
  }
}

export function ConfirmLinkForm() {
  const [link, setLink] = useState<{ tokenHash: string | null; type: string | null; next: string | null } | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setLink({ tokenHash: params.get("token_hash"), type: params.get("type"), next: nextFromLink(params.get("next")) });
  }, []);
  const kind = link?.type ? CONFIRM_TYPES[link.type] : undefined;
  const copy = CONFIRM[kind ?? "email"];

  if (link && (!link.tokenHash || !kind)) {
    return (
      <>
        <Heading title="This link isn't complete">
          Open the button in the email again, or copy the whole link into your browser.
        </Heading>
        <Footer>
          <TextLink href="/signin">Back to sign in</TextLink>
        </Footer>
      </>
    );
  }
  return (
    <>
      <Heading title={copy.title}>{copy.body}</Heading>
      <form method="post" action="/auth/callback" onSubmit={() => setPending(true)} className="mt-6">
        <input type="hidden" name="token_hash" value={link?.tokenHash ?? ""} />
        <input type="hidden" name="type" value={link?.type ?? ""} />
        <input type="hidden" name="next" value={link?.next ?? copy.next} />
        {/* Waits for the address to be read, so it never posts an empty token */}
        <Submit pending={pending} waiting={!link} idle={copy.button} busy={copy.busy} />
      </form>
      <Footer>
        <TextLink href="/signin">Back to sign in</TextLink>
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
                <TextLink href="/forgot-password">Get a new link</TextLink>
              </>
            )}
          </AuthNotice>
        )}
        <Submit pending={pending} idle="Save password" busy="Saving…" />
      </form>
      <Footer>
        <TextLink href="/signin">Back to sign in</TextLink>
      </Footer>
    </>
  );
}
