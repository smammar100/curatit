// Where the bridge's token comes from: the CURATIT_ACCESS_TOKEN environment variable, or a file
// named by CURATIT_ACCESS_TOKEN_FILE (readable by the user alone). Never an argument: process
// lists and shell histories keep those. Errors say what to set, never what was found.

import { readFileSync } from "node:fs";

export const TOKEN_ENV = "CURATIT_ACCESS_TOKEN";
export const TOKEN_FILE_ENV = "CURATIT_ACCESS_TOKEN_FILE";

export class CredentialError extends Error {}

export function loadToken(env: Record<string, string | undefined> = process.env): string {
  const direct = env[TOKEN_ENV]?.trim();
  if (direct) return check(direct);
  const file = env[TOKEN_FILE_ENV]?.trim();
  if (file) {
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      throw new CredentialError(`${TOKEN_FILE_ENV} points at a file that can't be read.`);
    }
    return check(text.trim());
  }
  throw new CredentialError(`No token. Set ${TOKEN_ENV} (a Curatit personal access token from /dashboard/settings/tokens) or ${TOKEN_FILE_ENV} in the client's environment.`);
}

function check(token: string) {
  if (!/^[A-Za-z0-9._~+/=-]{20,4096}$/.test(token)) throw new CredentialError(`${TOKEN_ENV} doesn't look like a token.`);
  return token;
}
