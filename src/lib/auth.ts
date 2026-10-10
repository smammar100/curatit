// Shared by the auth server actions, the /auth/callback route and the forms.

// Where to land after signing in. Only paths on this site: "//evil.com" and "/\evil.com" are
// read by browsers as other hosts, so anything that isn't a plain absolute path falls back.
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/dashboard") {
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : fallback;
}

// Supabase Auth error codes (https://supabase.com/docs/guides/auth/debugging/error-codes) in
// words a person can act on. Anything unlisted gets the generic line.
const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don’t match. Try again, or reset your password.",
  email_not_confirmed: "Confirm your email first: open the link we sent when you signed up.",
  user_already_exists: "There’s already an account with that email. Sign in instead.",
  email_exists: "There’s already an account with that email. Sign in instead.",
  weak_password: "Choose a longer password, at least 8 characters.",
  same_password: "That’s your current password. Choose a new one.",
  email_address_invalid: "That email address doesn’t look right.",
  email_address_not_authorized: "We can’t send email to that address yet. Try another one.",
  signup_disabled: "New sign-ups are closed for now.",
  over_email_send_rate_limit: "Too many emails sent just now. Wait a few minutes and try again.",
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
  otp_expired: "That link has expired or was already used. Ask for a new one.",
  flow_state_not_found: "Open the link in the same browser you started in, or ask for a new one.",
  flow_state_expired: "That link has expired. Ask for a new one.",
  bad_code_verifier: "Open the link in the same browser you started in, or ask for a new one.",
  pkce_code_verifier_not_found: "Open the link in the same browser you started in, or ask for a new one.",
  access_denied: "Sign-in was cancelled or the link is no longer valid.",
  session_missing: "Your reset link has expired. Ask for a new one.",
};

export function authMessage(code: string | null | undefined) {
  return (code && MESSAGES[code]) || "Something went wrong. Try again in a moment.";
}
