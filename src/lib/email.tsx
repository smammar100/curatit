import type { ReactElement } from "react";
import { Resend } from "resend";
import Welcome, { subject as welcomeSubject } from "@/emails/welcome";
import { appUrl } from "@/emails/_components/tokens";
import { SUPPORT_EMAIL } from "@/lib/site";

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

// EMAIL_FROM must be on a domain verified in Resend, e.g. `Curatit <hello@curatit.com>`.
// EMAIL_REPLY_TO is where replies land; the welcome email asks people to reply, so it should
// be an inbox someone reads.
const from = () => process.env.EMAIL_FROM || "Curatit <onboarding@resend.dev>";
const replyTo = () => process.env.EMAIL_REPLY_TO || SUPPORT_EMAIL;

type Email = {
  to: string;
  subject: string;
  react: ReactElement;
  /** Resend drops a second send with the same key within 24 hours, so a retry or a second
   * click on a link never sends twice. */
  idempotencyKey?: string;
};

/** Sends one email. Never throws: a failed send is logged and reported as false, because no
 * email is worth failing the request that triggered it. */
export async function sendEmail({ to, subject, react, idempotencyKey }: Email): Promise<boolean> {
  const api = resend();
  if (!api) return false;
  try {
    const { error } = await api.emails.send({ from: from(), replyTo: replyTo(), to, subject, react }, { idempotencyKey });
    if (error) console.error(JSON.stringify({ msg: "email_failed", subject, error: error.name, detail: error.message }));
    return !error;
  } catch (cause) {
    console.error(JSON.stringify({ msg: "email_failed", subject, error: String(cause) }));
    return false;
  }
}

/** The welcome email, once per account: sent when the sign-up is confirmed (the email link, or
 * straight away when the project doesn't confirm addresses). */
export function sendWelcomeEmail(user: { id: string; email?: string; user_metadata?: { full_name?: unknown } }) {
  if (!user.email) return Promise.resolve(false);
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim().split(/\s+/)[0] : undefined;
  const brief = "launch carousel that shows the product";
  return sendEmail({
    to: user.email,
    subject: welcomeSubject,
    react: <Welcome email={user.email} firstName={name || undefined} brief={brief} searchUrl={`${appUrl}/dashboard?q=${encodeURIComponent(brief)}`} />,
    idempotencyKey: `welcome/${user.id}`,
  });
}
