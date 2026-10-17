// Guards in front of the auth actions (2026-10-18, a pre-launch security pass): a per-visitor
// limit on attempts, a refusal of throwaway email domains at sign-up, and the Turnstile token
// handed on to Supabase. Server only (it reads next/headers).
//
// Supabase Auth limits requests per IP too, but the actions call it from Vercel, so it sees
// Vercel's address rather than the visitor's: one bot isn't told apart from everyone else, and
// real people can be throttled together. These limits count the visitor's own address, in the
// MCP's shared Postgres counter (curatit_rate_limit_hit, service_role only). Without
// SUPABASE_SECRET_KEY, or if the counter doesn't answer within 1.5 s, the attempt goes ahead:
// an outage never locks people out, and Supabase's own limits still apply behind it.
import { headers } from "next/headers";
import { catalogClient } from "@/lib/mcp/repo/supabase";
import { DISPOSABLE_DOMAINS } from "./disposable-domains";

export type GuardedAction = "sign_in" | "sign_up" | "resend" | "reset";

// Attempts per address per window. Generous for a person retyping a password; low enough that a
// script can't use sign-up, resend or reset to email strangers in bulk.
const LIMITS: Record<GuardedAction, { limit: number; windowSeconds: number }> = {
  sign_in: { limit: 10, windowSeconds: 5 * 60 },
  sign_up: { limit: 5, windowSeconds: 30 * 60 },
  resend: { limit: 3, windowSeconds: 30 * 60 },
  reset: { limit: 3, windowSeconds: 30 * 60 },
};

// The visitor's address as Vercel reports it (x-real-ip is set by Vercel and can't be forged by
// the client; x-forwarded-for is the fallback elsewhere)
async function visitor() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

let admin: ReturnType<typeof catalogClient> | null | undefined;
function counter() {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  admin = url && key ? catalogClient(url, key, 1_500) : null;
  return admin;
}

// True when this visitor has used up their attempts at `action` for now
export async function overLimit(action: GuardedAction): Promise<boolean> {
  const ip = await visitor();
  const client = counter();
  if (!ip || !client) return false;
  const { limit, windowSeconds } = LIMITS[action];
  try {
    const { data, error } = await client.rpc("curatit_rate_limit_hit", { p_key: `auth:${action}:${ip}`, p_limit: limit, p_window_seconds: windowSeconds });
    if (error) return false;
    return !(data as { allowed: boolean }).allowed;
  } catch {
    return false;
  }
}

// Whether an address is at a known throwaway-inbox service (or a subdomain of one)
export function isDisposableEmail(email: string) {
  const domain = email.trim().toLowerCase().split("@").pop() ?? "";
  if (!domain) return false;
  const parts = domain.split(".");
  // example.com, then mail.example.com's parent, and so on
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE_DOMAINS.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

// The Cloudflare Turnstile token the form carries when the widget is on (it adds a hidden
// cf-turnstile-response field). Supabase checks it when Attack Protection → CAPTCHA is on;
// without a token the option is left out, which is what Supabase expects while CAPTCHA is off.
export function captchaToken(form: FormData) {
  const token = form.get("cf-turnstile-response");
  return typeof token === "string" && token ? token : undefined;
}
