// The one token verifier the bearer gate uses: a personal access token or, when the OAuth
// issuer is configured, a Supabase OAuth JWT. Anything else is an invalid token, answered with
// the 401 challenge and the resource metadata URL so a client can start the OAuth flow.

import { OAuthError, OAuthErrorCode, type AuthInfo } from "@modelcontextprotocol/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { McpConfig } from "../config";
import type { Logger } from "../log";
import { verifyOAuthToken } from "./oauth";
import { isPersonalAccessToken, verifyPersonalAccessToken } from "./pat";
import { toAuthInfo } from "./principal";

export type Verifier = { verifyAccessToken(token: string): Promise<AuthInfo> };

export function createVerifier(config: McpConfig, admin: SupabaseClient<Database>, log?: Logger): Verifier {
  return {
    async verifyAccessToken(token) {
      try {
        if (isPersonalAccessToken(token)) {
          const found = await verifyPersonalAccessToken(admin, token);
          if (found) return toAuthInfo(token, found.principal, found.expiresAt, config.mcpUrl);
        } else if (config.oauthIssuer) {
          const found = await verifyOAuthToken(config.oauthIssuer, token);
          if (found) return toAuthInfo(token, found.principal, found.expiresAt, config.mcpUrl);
        }
      } catch (error) {
        // Our problem, not the token's: say so (500 server_error) and log the cause
        log?.error("auth.verify_failed", { cause: String((error as Error)?.message ?? error) });
        throw new OAuthError(OAuthErrorCode.ServerError, "Token verification is temporarily unavailable.");
      }
      throw new OAuthError(OAuthErrorCode.InvalidToken, config.oauthIssuer ? "The token is invalid, expired or revoked." : "The token is invalid, expired or revoked. This server takes Curatit personal access tokens.");
    },
  };
}
