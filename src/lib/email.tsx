import type { ReactElement } from "react";
import { Resend } from "resend";
import WelcomeNote, { subject as welcomeSubject } from "@/emails/welcome-note";
import { appUrl } from "@/emails/_components/tokens";
import { isUnsubscribed, unsubscribeUrl } from "@/lib/unsubscribe";

// Server only (it reads RESEND_API_KEY). Every email the app itself sends goes through here, to
// Resend. The templates are in src/emails (React Email); Supabase Auth's own emails (confirm,
// reset, change email) are the same templates rendered by `npm run email:render` and sent by
// Supabase through Resend's SMTP (docs/emails.md). Off while RESEND_API_KEY is unset: nothing
// is sent and nothing fails.

let client: Resend | null | undefined;
function resend() {
  if (client === undefined) client = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  return client;
}

// The sender is on curatit.app, verified in Resend (docs/emails.md); EMAIL_FROM overrides it,
// and must also be on a domain verified there.
// Replies go to the sender, whose inbox is Resend's Receiving tab for curatit.app (the welcome is
// signed by Ammar, so people answer it; check it there). EMAIL_REPLY_TO sends them elsewhere, but
// keep it on curatit.app: a free-mail Reply-To (Hotmail, Gmail) under a curatit.app sender is a
// common spam-filter penalty, which is why SUPPORT_EMAIL stopped being the default (2026-10-18).
const from = () => process.env.EMAIL_FROM || "Curatit <hello@curatit.app>";
const replyTo = () => process.env.EMAIL_REPLY_TO || undefined;

type Email = {
  to: string;
  subject: string;
  /** The email, or for an optional one a function given its unsubscribe link for the footer. */
  react: ReactElement | ((unsubscribeUrl: string) => ReactElement);
  /** Marks an optional email (onboarding, the weekly edition, product notices) and names it,
   * e.g. "onboarding". It isn't sent to anyone who has unsubscribed, and it carries an
   * unsubscribe link and the one-click List-Unsubscribe headers. Leave it out for account and
   * billing emails, which nobody can opt out of. */
  optional?: string;
  /** Resend drops a second send with the same key within 24 hours, so a retry or a second
   * click on a link never sends twice. */
  idempotencyKey?: string;
};

/** Sends one email. Never throws: a failed send is logged and reported as false, because no
 * email is worth failing the request that triggered it. */
export async function sendEmail({ to, subject, react, optional, idempotencyKey }: Email): Promise<boolean> {
  const api = resend();
  if (!api) return false;
  try {
    let headers: Record<string, string> | undefined;
    if (optional) {
      const link = unsubscribeUrl(to, optional);
      // No link means no signing secret: an optional email without a way out isn't sent
      if (!link || (await isUnsubscribed(to))) return false;
      const oneClick = link.replace("/unsubscribe?", "/api/unsubscribe?");
      headers = { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
      if (typeof react === "function") react = react(link);
    } else if (typeof react === "function") {
      throw new Error("Only an optional email takes an unsubscribe link");
    }
    const { error } = await api.emails.send({ from: from(), replyTo: replyTo(), to, subject, react, headers }, { idempotencyKey });
    if (error) console.error(JSON.stringify({ msg: "email_failed", subject, error: error.name, detail: error.message }));
    return !error;
  } catch (cause) {
    console.error(JSON.stringify({ msg: "email_failed", subject, error: String(cause) }));
    return false;
  }
}

/** The welcome email (the "note": a hero of library posts, three short paragraphs and Ammar's
 * signature), once per account: sent when the sign-up is confirmed (the email link, or straight
 * away when the project doesn't confirm addresses). Its button opens the dashboard, since the
 * person is signed in by then. */
export function sendWelcomeEmail(user: { id: string; email?: string; user_metadata?: { full_name?: unknown } }) {
  if (!user.email) return Promise.resolve(false);
  const first = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim().split(/\s+/)[0] : undefined;
  // Anyone can set this metadata when calling Supabase Auth directly, so only a name-shaped word
  // goes into the email: "evil.example/verify" would otherwise arrive from hello@curatit.app as a
  // link mail clients make clickable
  const name = first && first.length <= 40 && /^[\p{L}\p{M}'’-]+$/u.test(first) ? first : undefined;
  return sendEmail({
    to: user.email,
    subject: welcomeSubject,
    react: <WelcomeNote email={user.email} firstName={name || undefined} libraryUrl={`${appUrl}/dashboard`} />,
    idempotencyKey: `welcome/${user.id}`,
  });
}
