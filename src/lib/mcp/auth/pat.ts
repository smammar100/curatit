// Personal access tokens: `curatit_pat_` and 32 random bytes, shown to the owner once. Only a
// SHA-256 of the secret is stored (public.api_tokens, the …_mcp_access_tokens migration), with
// a name, the scopes chosen, an expiry and a revocation flag. Checking one is a single call to
// curatit_api_token_verify (service_role only), which also notes when it was last used. A token
// can't do more than its owner: scopes are limited to what every member may do.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { SCOPES, type Scope } from "../config";
import { CuratitError, toCuratitError } from "../errors";
import { ENTITLEMENT_VERSION, isScope, type Principal } from "./principal";

export const PAT_PREFIX = "curatit_pat_";
export const PAT_MAX_DAYS = 365;
export const PAT_DEFAULT_DAYS = 90;

export function isPersonalAccessToken(token: string) {
  return token.startsWith(PAT_PREFIX);
}

// These run in the browser (the tokens page makes the token) as well as on the server, so they
// use Web Crypto and their own encoders: there is no Buffer in a browser
const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// A new token: the secret for the owner, the hash and display prefix for the table
export async function mintToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const secret = PAT_PREFIX + base64url(bytes);
  return { secret, hash: await hashToken(secret), prefix: secret.slice(0, PAT_PREFIX.length + 8) };
}

export async function hashToken(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return hex(new Uint8Array(digest));
}

export function parseScopes(values: string[]): Scope[] {
  const scopes = [...new Set(values)].filter(isScope);
  if (!scopes.length) throw new CuratitError("INVALID_ARGUMENT", `Choose at least one scope: ${SCOPES.join(", ")}.`);
  return scopes;
}

type VerifyRow = { token_id: string; user_id: string; scopes: string[]; expires_at: string } | null;

export type PatVerification = { principal: Principal; expiresAt: number };

// Looks the token up by its hash as service_role. Unknown, revoked and expired tokens all come
// back as one answer, so a caller learns nothing about which it was.
export async function verifyPersonalAccessToken(admin: SupabaseClient<Database>, token: string): Promise<PatVerification | null> {
  if (!isPersonalAccessToken(token) || token.length < PAT_PREFIX.length + 40 || token.length > 120) return null;
  const hash = await hashToken(token);
  const { data, error } = await admin.rpc("curatit_api_token_verify", { p_token_hash: hash });
  if (error) throw toCuratitError(error);
  const row = data as VerifyRow;
  if (!row) return null;
  const expiresAt = Math.floor(new Date(row.expires_at).getTime() / 1000);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 <= Date.now()) return null;
  return {
    principal: {
      subjectId: row.user_id,
      organizationId: null,
      scopes: row.scopes.filter(isScope),
      credentialKind: "personal_access_token",
      entitlementVersion: ENTITLEMENT_VERSION,
      credentialId: row.token_id,
    },
    expiresAt,
  };
}
