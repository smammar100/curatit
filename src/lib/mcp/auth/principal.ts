// Who is calling, once a credential has been checked: the same Principal whether it came from a
// personal access token or an OAuth access token, so nothing downstream cares which. Curatit
// has one tenant and no plans yet, so organizationId is null and the entitlement version is a
// constant; both are here so the shape doesn't change when that does.

import type { AuthInfo } from "@modelcontextprotocol/server";
import { SCOPES, type Scope } from "../config";
import { CuratitError } from "../errors";

export type Principal = {
  subjectId: string;
  organizationId: null;
  scopes: Scope[];
  credentialKind: "oauth" | "personal_access_token";
  entitlementVersion: string;
  // The access token's id (PAT) or the OAuth client id, for logs and rate-limit keys
  credentialId: string;
};

export const ENTITLEMENT_VERSION = "2026-10-12.free";

export function isScope(value: string): value is Scope {
  return (SCOPES as readonly string[]).includes(value);
}

// The Principal travels on AuthInfo.extra from the bearer gate to the tool handlers
export function toAuthInfo(token: string, principal: Principal, expiresAt: number, resource: URL): AuthInfo {
  return {
    token,
    clientId: principal.credentialId,
    scopes: principal.scopes,
    expiresAt,
    resource,
    extra: { principal },
  };
}

export function principalOf(authInfo: AuthInfo | undefined): Principal {
  const principal = (authInfo?.extra as { principal?: Principal } | undefined)?.principal;
  if (!principal) throw new CuratitError("UNAUTHENTICATED", "Sign in with a personal access token or OAuth to use this tool.");
  return principal;
}

export function requireScope(principal: Principal, scope: Scope) {
  if (!principal.scopes.includes(scope)) {
    throw new CuratitError("FORBIDDEN", `This tool needs the ${scope} scope; the credential has ${principal.scopes.join(", ") || "none"}. Create a token with that scope.`);
  }
}

// A stable, non-identifying key for cursors and rate limits
export const principalKey = (p: Principal) => `${p.credentialKind}:${p.subjectId}`;
