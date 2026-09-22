import "server-only";

import fs from "node:fs";
import path from "node:path";
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { AppError } from "./errors";

/* -------------------------------------------------------------------------- */
/*  Server secret (HMAC key for cursors)                                       */
/* -------------------------------------------------------------------------- */

let cachedSecret: string | undefined;

/**
 * `CURATIT_SECRET` in production. In development, a random secret is created
 * once and kept in data/.secret so restarts don't invalidate cursors.
 */
export function serverSecret(): string {
  if (cachedSecret) return cachedSecret;

  if (process.env.CURATIT_SECRET) {
    cachedSecret = process.env.CURATIT_SECRET;
    return cachedSecret;
  }
  if (process.env.NODE_ENV === "production" && process.env.CURATIT_ALLOW_DEV_SECRET !== "1") {
    throw new Error("CURATIT_SECRET must be set in production.");
  }

  const file = path.join(process.cwd(), "data", ".secret");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, randomBytes(32).toString("hex"), { mode: 0o600 });
  cachedSecret = fs.readFileSync(file, "utf8").trim();
  return cachedSecret;
}

/* -------------------------------------------------------------------------- */
/*  Tokens                                                                     */
/* -------------------------------------------------------------------------- */

/** 256-bit random secret, URL-safe. Share links need ≥128 bits (plan §34.3). */
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(value: string) {
  return createHmac("sha256", serverSecret()).update(value).digest("base64url");
}

/** Tamper-resistant payload bound to a context string (e.g. a query hash). */
export function signPayload(payload: object, context: string) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(`${body}.${context}`)}`;
}

export function verifyPayload<T>(token: string, context: string): T | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = hmac(`${body}.${context}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Passwords (local auth only — production uses Supabase Auth)                */
/* -------------------------------------------------------------------------- */

const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 64 };

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT.keyLength, SCRYPT).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, SCRYPT.keyLength, SCRYPT);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* -------------------------------------------------------------------------- */
/*  Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

type Bucket = { tokens: number; updated: number };
const buckets = new Map<string, Bucket>();

/**
 * Token bucket, in-process. Adequate for a single dev/demo server; production
 * needs a shared store so web and MCP share one meter (plan §27).
 */
export function rateLimit(key: string, perMinute: number) {
  const nowMs = Date.now();
  const bucket = buckets.get(key) ?? { tokens: perMinute, updated: nowMs };
  const refill = ((nowMs - bucket.updated) / 60_000) * perMinute;
  bucket.tokens = Math.min(perMinute, bucket.tokens + refill);
  bucket.updated = nowMs;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    const retryAfter = Math.ceil(((1 - bucket.tokens) / perMinute) * 60);
    throw new AppError("rate_limited", "Too many requests. Try again shortly.", { retryAfter });
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
}

/* -------------------------------------------------------------------------- */
/*  Input hygiene                                                              */
/* -------------------------------------------------------------------------- */

/** Strip control characters; user text is always rendered escaped. */
export function cleanText(value: string) {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}
