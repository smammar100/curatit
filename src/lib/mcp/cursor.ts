// Search pagination cursors: an opaque, signed token holding the next offset and a fingerprint of
// the search it belongs to (query, filters, sort) and of the caller's authorization context. A
// cursor from another search, another account or a tampered one is refused, so a client can't
// walk a different query's pages or replay one tenant's cursor as another. The catalog paginates
// by offset (at most 500); the cursor hides that.

import { invalid } from "./errors";

const encoder = new TextEncoder();

async function hmac(secret: Uint8Array<ArrayBuffer>, data: string) {
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64url(new Uint8Array(sig));
}

function base64url(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

export async function fingerprint(parts: unknown) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(parts)));
  return base64url(new Uint8Array(digest)).slice(0, 22);
}

// `marker` is the catalog as it was when the first page was taken (curatit_mcp_search_v2's
// catalog_marker), so a later page can say when the library changed in between
export type CursorPayload = { offset: number; search: string; principal: string; marker?: string | null };

export async function encodeCursor(secret: Uint8Array<ArrayBuffer>, payload: CursorPayload) {
  const body = base64url(encoder.encode(JSON.stringify({ o: payload.offset, s: payload.search, p: payload.principal, v: 1, ...(payload.marker ? { m: payload.marker } : {}) })));
  return `${body}.${await hmac(secret, body)}`;
}

export async function decodeCursor(secret: Uint8Array<ArrayBuffer>, cursor: string, expected: { search: string; principal: string }): Promise<{ offset: number; marker: string | null }> {
  const [body, sig, ...rest] = cursor.split(".");
  if (!body || !sig || rest.length) throw invalid("The cursor is not valid. Start the search again without one.");
  const expectedSig = await hmac(secret, body);
  if (!timingSafeEqual(sig, expectedSig)) throw invalid("The cursor is not valid. Start the search again without one.");
  let parsed: { o?: unknown; s?: unknown; p?: unknown; v?: unknown; m?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    throw invalid("The cursor is not valid. Start the search again without one.");
  }
  if (parsed.v !== 1 || typeof parsed.o !== "number" || !Number.isInteger(parsed.o) || parsed.o < 0) {
    throw invalid("The cursor is not valid. Start the search again without one.");
  }
  if (parsed.s !== expected.search) throw invalid("The cursor belongs to a different search. Send the same query, filters and sort, or drop the cursor.");
  if (parsed.p !== expected.principal) throw invalid("The cursor was issued to a different account. Start the search again without one.");
  return { offset: parsed.o, marker: typeof parsed.m === "string" && parsed.m ? parsed.m : null };
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
