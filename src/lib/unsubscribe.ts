import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { appUrl } from "@/emails/_components/tokens";
import { NOTE_MAX, type UnsubscribeReason } from "./unsubscribe-reasons";

// Server only (it reads the secrets). Unsubscribing from Curatit's optional emails (onboarding, the weekly edition, product notices;
// never the account emails). The link in an email's footer is /unsubscribe?t=<token>, where the
// token is the address and an HMAC of it, so the page can trust whose address it is without a
// sign-in, and nobody can unsubscribe someone else by editing the link. Signed with
// EMAIL_UNSUBSCRIBE_SECRET, else the MCP signing secret (the "unsubscribe:" prefix keeps the two
// uses apart). The answers live in public.email_unsubscribes, which only the secret key reaches.

export { NOTE_MAX, UNSUBSCRIBE_REASONS, type UnsubscribeReason } from "./unsubscribe-reasons";

const secret = () => process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.CURATIT_MCP_SIGNING_SECRET;
const sign = (key: string, email: string) => createHmac("sha256", key).update(`unsubscribe:${email}`).digest("base64url");

/** The token for an address, or null while no secret is set. */
export function unsubscribeToken(email: string) {
  const key = secret();
  if (!key) return null;
  const address = email.trim().toLowerCase();
  return `${Buffer.from(address).toString("base64url")}.${sign(key, address)}`;
}

/** The footer link for an address, with the email it came from; undefined while no secret is set. */
export function unsubscribeUrl(email: string, source?: string) {
  const token = unsubscribeToken(email);
  if (!token) return undefined;
  return `${appUrl}/unsubscribe?t=${token}${source ? `&s=${encodeURIComponent(source)}` : ""}`;
}

/** The address a token stands for, or null when it's missing, malformed or not ours. */
export function readUnsubscribeToken(token: string | null | undefined) {
  const key = secret();
  if (!key || !token) return null;
  const [encoded, mac, extra] = token.split(".");
  if (!encoded || !mac || extra !== undefined) return null;
  const email = Buffer.from(encoded, "base64url").toString("utf8");
  if (!email.includes("@") || email.length > 320 || email !== email.toLowerCase()) return null;
  const expected = Buffer.from(sign(key, email));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given) ? email : null;
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Records the unsubscribe (or updates its reason). True once it's stored. The one-click route
 * passes no reason (`undefined`), which leaves a reason given earlier on the page in place. */
export async function saveUnsubscribe(row: { email: string; reason?: UnsubscribeReason | null; note?: string | null; source?: string | null }) {
  const db = admin();
  if (!db) return false;
  const answers = row.reason === undefined ? {} : { reason: row.reason, note: row.note?.trim().slice(0, NOTE_MAX) || null };
  const { error } = await db.from("email_unsubscribes").upsert(
    { email: row.email, ...answers, source: row.source?.slice(0, 64) || null, updated_at: new Date().toISOString() },
    { onConflict: "email" },
  );
  if (error) console.error(JSON.stringify({ msg: "unsubscribe_failed", error: error.code, detail: error.message }));
  return !error;
}

/** Whether an address has unsubscribed. Unknown (no key, or the read failed) counts as yes, so
 * an optional email is never sent to someone who may have opted out. */
export async function isUnsubscribed(email: string) {
  const db = admin();
  if (!db) return true;
  const { data, error } = await db.from("email_unsubscribes").select("email").eq("email", email.trim().toLowerCase()).maybeSingle();
  return Boolean(error || data);
}
