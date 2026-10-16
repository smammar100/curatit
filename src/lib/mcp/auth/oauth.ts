// OAuth access tokens from Supabase Auth's OAuth 2.1 server (on for the project and being
// tested; docs/mcp/security.md has the status and the known gaps). The token is a JWT signed with the
// project's asymmetric key: it's checked against the issuer's JWKS, for the exact issuer, not
// expired, and for `client_id`, which only tokens issued through the OAuth server carry, so a
// first-party browser session can't be replayed here.
//
// Known deviation, documented rather than hidden: Supabase sets `aud` to "authenticated" and
// ignores the RFC 8707 resource parameter, so a token can't be bound to /mcp by audience. The
// only other place these tokens work is Curatit's own Supabase API, and that is the mitigation:
// issuer plus client_id ties the token to this product. Supabase has no custom scopes either, so
// every OAuth principal gets both Curatit scopes.

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { SCOPES } from "../config";
import { CuratitError } from "../errors";
import { ENTITLEMENT_VERSION, type Principal } from "./principal";

export type OAuthVerification = { principal: Principal; expiresAt: number };

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(issuer: URL) {
  const key = issuer.href;
  let set = jwksCache.get(key);
  if (!set) {
    set = createRemoteJWKSet(new URL(`${issuer.href.replace(/\/$/, "")}/.well-known/jwks.json`), { cooldownDuration: 30_000, timeoutDuration: 5_000 });
    jwksCache.set(key, set);
  }
  return set;
}

// The jose errors that say the token itself is wrong (expired, bad signature, wrong claims,
// an algorithm not allowed). JWKSNoMatchingKey is the token's fault too (a kid the issuer
// doesn't have), unless jose says the key set couldn't be fetched at all.
const TOKEN_PROBLEMS = new Set(["JWTExpired", "JWTClaimValidationFailed", "JWTInvalid", "JWSInvalid", "JWSSignatureVerificationFailed", "JOSEAlgNotAllowed", "JOSENotSupported", "JWKSMultipleMatchingKeys"]);

export function isTokenProblem(error: unknown) {
  const name = (error as { name?: string })?.name ?? "";
  if (TOKEN_PROBLEMS.has(name)) return true;
  if (name === "JWKSNoMatchingKey") return !/fetch/i.test(String(error));
  return false;
}

export function looksLikeJwt(token: string) {
  return /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/.test(token);
}

export async function verifyOAuthToken(issuer: URL, token: string): Promise<OAuthVerification | null> {
  if (!looksLikeJwt(token)) return null;
  let payload: JWTPayload & { client_id?: unknown; role?: unknown };
  try {
    ({ payload } = await jwtVerify(token, jwks(issuer), {
      issuer: issuer.href.replace(/\/$/, ""),
      audience: "authenticated",
      algorithms: ["ES256", "RS256"],
      clockTolerance: 30,
    }));
  } catch (error) {
    // jose's validation errors mean the token is bad. Anything else (the JWKS unreachable, a
    // non-2xx or malformed key set, a network failure) is our side's problem, and answering
    // "invalid token" would make clients throw a good token away and ask people to sign in again
    if (!isTokenProblem(error)) {
      throw new CuratitError("UPSTREAM_UNAVAILABLE", "The sign-in service didn't answer. Try again shortly.", { cause: error });
    }
    return null;
  }
  if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
  if (typeof payload.client_id !== "string" || !payload.client_id) return null;
  return {
    principal: {
      subjectId: payload.sub,
      organizationId: null,
      scopes: [...SCOPES],
      credentialKind: "oauth",
      entitlementVersion: ENTITLEMENT_VERSION,
      credentialId: payload.client_id,
    },
    expiresAt: payload.exp,
  };
}
