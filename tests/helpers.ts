import { all, get, newId, now, run } from "../lib/db";
import type { Viewer } from "../lib/auth";
import { AppError, type ErrorCode } from "../lib/errors";

/** Create a user + personal workspace directly (no password flow needed). */
export function makeViewer(role: "member" | "admin" = "member"): Viewer {
  const userId = newId();
  const workspaceId = newId();
  const email = `${userId}@test.local`;
  run(
    "INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, 'scrypt$x$x', ?, ?)",
    userId,
    email,
    role,
    now()
  );
  run("INSERT INTO workspaces (id, name, created_at) VALUES (?, 'Personal', ?)", workspaceId, now());
  run("INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')", workspaceId, userId);
  return { userId, email, role, workspaceId };
}

export function publishedPostIds(): string[] {
  return all<{ id: string }>(
    "SELECT id FROM source_posts WHERE publication_status = 'published' ORDER BY published_at DESC"
  ).map((row) => row.id);
}

export function postIdByHook(hookStart: string): string {
  const row = get<{ post_id: string }>("SELECT post_id FROM creative_analyses WHERE hook LIKE ?", `${hookStart}%`);
  if (!row) throw new Error(`No seeded post with hook starting "${hookStart}"`);
  return row.post_id;
}

/** Assert that `fn` throws an AppError with the given code. */
export function expectCode(fn: () => unknown, code: ErrorCode) {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError && error.code === code) return error;
    throw new Error(`Expected AppError "${code}", got ${error instanceof AppError ? `"${error.code}"` : String(error)}`);
  }
  throw new Error(`Expected AppError "${code}", but nothing was thrown`);
}
