// Shared by the auth server actions, the /auth/callback route and the forms.

// Where to land after signing in. Only paths on this site: "//evil.com" and "/\evil.com" are
// read by browsers as other hosts, so anything that isn't a plain absolute path falls back. URL
// parsers also drop tabs and newlines before reading a path ("/<tab>/evil.com" is "//evil.com"),
// so a path with a control character falls back too, and what's left must resolve to this site.
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/dashboard") {
  if (typeof value !== "string" || !/^\/(?![/\\])/.test(value)) return fallback;
  if ([...value].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) return fallback;
  return new URL(value, "http://site.invalid").host === "site.invalid" ? value : fallback;
}

// Supabase Auth error codes (https://supabase.com/docs/guides/auth/debugging/error-codes) in
// words a person can act on: what happened, then what to do. Anything unlisted gets the
// generic line.
const SAME_BROWSER = "Open this link in the browser where you asked for it, or request a new link.";
const MESSAGES: Record<string, string> = {
  invalid_credentials: "The email or password is incorrect. Check both and try again, or reset your password.",
  email_not_confirmed: "Confirm your email address first. Open the link we sent you when you signed up.",
  user_already_exists: "This email is already in use.",
  email_exists: "This email is already in use.",
  weak_password: "This password isn’t strong enough. Choose a stronger one.",
  pwned_password: "This password has appeared in a known data breach, so it isn’t safe to use. Choose a different one.",
  same_password: "Your new password must be different from your current one.",
  email_address_invalid: "Enter a valid email address, like name@example.com.",
  validation_failed: "Some of the details aren’t valid. Check them and try again.",
  email_address_not_authorized: "We can’t send emails to this address yet. Use a different email address.",
  signup_disabled: "New sign-ups are paused right now. Try again later.",
  user_banned: "This account has been suspended. Contact us if you think this is a mistake.",
  // The email limit is for the whole project per hour (Supabase's own sender allows only a few),
  // not for this address, so it isn't the person's doing
  over_email_send_rate_limit: "We’ve sent too many emails in the last hour, so we can’t send yours yet. Try again in a little while.",
  over_request_rate_limit: "Too many attempts in a short time. Wait a minute, then try again.",
  request_timeout: "That took too long. Check your connection and try again.",
  otp_expired: "This link has expired or has already been used. Request a new one.",
  flow_state_not_found: SAME_BROWSER,
  flow_state_expired: "This link has expired. Request a new one.",
  bad_code_verifier: SAME_BROWSER,
  pkce_code_verifier_not_found: SAME_BROWSER,
  access_denied: "Sign-in was cancelled, or the link is no longer valid. Try again.",
  session_missing: "Your password reset link has expired. Request a new one.",
};

export function authMessage(code: string | null | undefined) {
  return (code && MESSAGES[code]) || "Something went wrong on our side. Try again in a moment.";
}

// The sign-in page's ?error=, from a link that failed in /auth/callback. Anyone can type one, so
// an unknown code gets a line about the link rather than one that blames the server
export function linkMessage(code: string) {
  return MESSAGES[code] ?? "That link didn’t work. Try again, or request a new one.";
}

// The forms' own checks, run before anything is sent (and again in the server actions, for a
// submit without JavaScript). Each returns what's wrong and how to fix it, or null.
// An address typed into the site footer's email field, handed to sign-up through sessionStorage
// (global/FooterNewsletter writes it, auth/AuthForms' SignUpForm reads and clears it)
export const SIGNUP_EMAIL_KEY = "curatit-signup-email";

// The HTML spec's pattern for type="email" (ASCII only), with at least one dot in the domain. The
// field's built-in check uses the spec's, and the form's Field shows it, so this one has to agree:
// an address with an emoji or a zero-width space turned the field red with no message
// (2026-10-28, from a QA run). It also turns away lookalike letters in a domain
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function emailProblem(email: string) {
  const value = email.trim();
  if (!value) return "Enter your email address.";
  // 254 characters is the longest address mail servers accept (RFC 5321)
  if (value.length > 254) return "This email address is too long. Use a shorter one.";
  if (!EMAIL.test(value)) return "Enter a valid email address, like name@example.com.";
  return null;
}

// What the auth forms say when a guard in src/lib/auth-guard.ts turns an attempt down
export const GUARD_MESSAGES = {
  limited: "Too many attempts from your connection. Wait a few minutes, then try again.",
  disposable: "Use a permanent email address. Temporary inboxes can’t receive the emails your account needs.",
};

// The project's password rules, as set in the Supabase dashboard (Authentication → Sign In /
// Providers → Email: minimum length 8, and "Lowercase, uppercase letters, digits and symbols").
// Supabase enforces them; this copy lets the forms show them as a checklist and say exactly
// what's missing before anything is sent. Change the two together. The symbols are the set
// Supabase accepts, so "£" or a space doesn't count.
const SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export const PASSWORD_RULES: { id: string; label: string; missing: string; test: (password: string) => boolean }[] = [
  { id: "length", label: "8 or more characters", missing: "at least 8 characters", test: (p) => p.length >= 8 },
  { id: "lower", label: "A lowercase letter", missing: "a lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "An uppercase letter", missing: "an uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "A number", missing: "a number", test: (p) => /[0-9]/.test(p) },
  { id: "symbol", label: "A symbol, like ! ? #", missing: "a symbol (like ! ? #)", test: (p) => [...p].some((c) => SYMBOLS.includes(c)) },
];

// What a new password still needs, in a sentence, or null when it meets every rule. Supabase
// refuses passwords over 72 characters (bcrypt's limit), so say so here rather than after sending
export function passwordProblem(password: string) {
  if (!password) return "Create a password.";
  if (password.length > 72) return "Your password can be at most 72 characters long.";
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.missing);
  if (!missing.length) return null;
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`;
  return `Your password needs ${list}.`;
}
