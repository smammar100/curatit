import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { get, newId, now, run, transaction } from "./db";
import { AppError } from "./errors";
import { hashPassword, randomToken, sha256, verifyPassword } from "./security";

/**
 * Local session auth. Production swaps this module for Supabase Auth; the
 * `Viewer` shape is the contract the rest of the app depends on.
 */

export const SESSION_COOKIE = "curatit_session";
const SESSION_DAYS = 30;

export type Viewer = {
  userId: string;
  email: string;
  role: "member" | "admin";
  workspaceId: string;
};

function adminEmails() {
  return (process.env.CURATIT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

/* -------------------------------------------------------------------------- */
/*  Accounts                                                                   */
/* -------------------------------------------------------------------------- */

export function createAccount(email: string, password: string) {
  const address = normaliseEmail(email);
  if (get("SELECT id FROM users WHERE email = ?", address)) {
    throw new AppError("conflict", "An account with this email already exists.");
  }

  const userId = newId();
  const workspaceId = newId();
  const created = now();
  const role = adminEmails().includes(address) ? "admin" : "member";

  transaction(() => {
    run(
      "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
      userId,
      address,
      hashPassword(password),
      role,
      created
    );
    run("INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)", workspaceId, "Personal", created);
    run(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
      workspaceId,
      userId
    );
  });

  return userId;
}

/** Returns the user ID, or null — callers show one generic error either way. */
export function checkCredentials(email: string, password: string): string | null {
  const user = get<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ?",
    normaliseEmail(email)
  );
  // Verify against a dummy hash when the user is missing to keep timing flat.
  const stored = user?.password_hash ?? "scrypt$00000000000000000000000000000000$00";
  const valid = verifyPassword(password, stored);
  return user && valid ? user.id : null;
}

/* -------------------------------------------------------------------------- */
/*  Sessions                                                                   */
/* -------------------------------------------------------------------------- */

export async function startSession(userId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  run(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    sha256(token),
    userId,
    expires.toISOString(),
    now()
  );

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", sha256(token));
  jar.delete(SESSION_COOKIE);
}

/** The signed-in viewer for this request, or null. Memoised per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = get<{
    user_id: string;
    email: string;
    role: "member" | "admin";
    expires_at: string;
    workspace_id: string;
  }>(
    `SELECT s.user_id, s.expires_at, u.email, u.role, m.workspace_id
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN workspace_members m ON m.user_id = u.id AND m.role = 'owner'
      WHERE s.token_hash = ?`,
    sha256(token)
  );

  if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;

  return { userId: row.user_id, email: row.email, role: row.role, workspaceId: row.workspace_id };
});

/** For pages: redirect to sign-in when signed out. */
export async function requireViewer(next?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(next ? `/signin?next=${encodeURIComponent(next)}` : "/signin");
  return viewer;
}

/** For API routes: throw a 401 instead of redirecting. */
export async function requireApiViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new AppError("unauthenticated", "Sign in to continue.");
  return viewer;
}

export function isAdmin(viewer: Viewer | null) {
  return viewer?.role === "admin";
}

/** Housekeeping: drop expired sessions. Cheap enough to call on sign-in. */
export function pruneSessions() {
  run("DELETE FROM sessions WHERE expires_at < ?", now());
}
