import "server-only";

import { z } from "zod";
import { all, get, newId, now, parseJson, run, transaction } from "../db";
import type { SlideArt } from "../art";
import type { Viewer } from "../auth";
import { AppError, conflict, invalidInput, notFound } from "../errors";
import { cleanText, randomToken, sha256 } from "../security";
import { audit, track } from "./events";

/**
 * Personal inspiration boards ("collections" in the data model, plan §7.3, §34).
 *
 * Authorisation rule: every read and write is scoped by the viewer's
 * workspace, derived from the session, never from submitted IDs. A board or
 * item outside that workspace is indistinguishable from one that doesn't
 * exist (404), so IDs can't be probed.
 */

export const LIMITS = {
  nameMax: 80,
  descriptionMax: 1000,
  noteMax: 2000,
  boardsPerWorkspace: 50,
  itemsPerBoard: 200,
  shareDefaultDays: 7,
  shareMaxDays: 30,
} as const;

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type BoardSummary = {
  id: string;
  name: string;
  itemCount: number;
  covers: SlideArt[];
  version: number;
  updatedAt: string;
  hasActiveShare: boolean;
};

export type BoardItem = {
  id: string;
  postId: string;
  position: number;
  note: string;
  version: number;
  /** false when the source post was unpublished or removed after saving. */
  available: boolean;
  creative: {
    brandName: string;
    hook: string | null;
    cover: SlideArt;
    coverAlt: string;
    mediaType: string;
    slideCount: number;
    sourceUrl: string;
    objectiveId: string;
  } | null;
};

export type BoardDetail = {
  id: string;
  name: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  items: BoardItem[];
  share: { id: string; expiresAt: string; createdAt: string } | null;
};

/** What a link holder sees. Built by a dedicated serializer (plan §34.4). */
export type SharedBoard = {
  title: string;
  expiresAt: string;
  items: Array<
    | { available: true; postId: string; brandName: string; hook: string | null; cover: SlideArt; coverAlt: string; mediaType: string; slideCount: number; sourceUrl: string }
    | { available: false }
  >;
};

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

const uuid = z.string().uuid();

const nameSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().min(1, "Give the board a name.").max(LIMITS.nameMax, `Names can be up to ${LIMITS.nameMax} characters.`));

const descriptionSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().max(LIMITS.descriptionMax, `Descriptions can be up to ${LIMITS.descriptionMax} characters.`));

const noteSchema = z
  .string()
  .transform(cleanText)
  .pipe(z.string().max(LIMITS.noteMax, `Notes can be up to ${LIMITS.noteMax} characters.`));

export const createBoardSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  postIds: z.array(uuid).max(50).optional(),
});

export const updateBoardSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  expectedVersion: z.number().int().positive(),
});

export const saveSchema = z.object({ postId: uuid });
export const noteUpdateSchema = z.object({ note: noteSchema, expectedVersion: z.number().int().positive() });
export const orderSchema = z.object({
  itemIds: z.array(uuid).max(LIMITS.itemsPerBoard),
  expectedVersion: z.number().int().positive(),
});
export const shareSchema = z.object({
  expiresInDays: z.number().int().min(1).max(LIMITS.shareMaxDays).default(LIMITS.shareDefaultDays),
});

export function parse<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw invalidInput(issue?.message ?? "Invalid input.", { field: issue?.path.join(".") });
  }
  return result.data;
}

/* -------------------------------------------------------------------------- */
/*  Ownership                                                                  */
/* -------------------------------------------------------------------------- */

type BoardRow = {
  id: string;
  name: string;
  description: string;
  version: number;
  created_at: string;
  updated_at: string;
};

function ownBoard(viewer: Viewer, boardId: string): BoardRow {
  if (!uuid.safeParse(boardId).success) throw notFound("Board");
  const board = get<BoardRow>(
    "SELECT id, name, description, version, created_at, updated_at FROM collections WHERE id = ? AND workspace_id = ?",
    boardId,
    viewer.workspaceId
  );
  if (!board) {
    audit("board.access", "collection", boardId, "denied", viewer.userId);
    throw notFound("Board");
  }
  return board;
}

function ownItem(viewer: Viewer, boardId: string, itemId: string) {
  ownBoard(viewer, boardId);
  if (!uuid.safeParse(itemId).success) throw notFound("Saved reference");
  // The item must belong to *this* board — a crafted ID from another board fails.
  const item = get<{ id: string; version: number; note: string }>(
    "SELECT id, version, note FROM collection_items WHERE id = ? AND collection_id = ?",
    itemId,
    boardId
  );
  if (!item) throw notFound("Saved reference");
  return item;
}

function isPublished(postId: string) {
  return Boolean(
    get(
      "SELECT 1 FROM source_posts WHERE id = ? AND publication_status = 'published' AND processing_status = 'ready'",
      postId
    )
  );
}

function bumpBoard(boardId: string) {
  run("UPDATE collections SET version = version + 1, updated_at = ? WHERE id = ?", now(), boardId);
}

/* -------------------------------------------------------------------------- */
/*  Boards                                                                     */
/* -------------------------------------------------------------------------- */

type CoverRow = { collection_id: string; art: string };

export function listBoards(viewer: Viewer): BoardSummary[] {
  const boards = all<BoardRow & { item_count: number; active_share: number }>(
    `SELECT c.id, c.name, c.description, c.version, c.created_at, c.updated_at,
            (SELECT COUNT(*) FROM collection_items i WHERE i.collection_id = c.id) AS item_count,
            EXISTS (SELECT 1 FROM collection_shares s
                     WHERE s.collection_id = c.id AND s.revoked_at IS NULL AND s.expires_at > ?) AS active_share
       FROM collections c
      WHERE c.workspace_id = ?
      ORDER BY c.updated_at DESC`,
    now(),
    viewer.workspaceId
  );

  const covers = all<CoverRow & { position: number }>(
    `SELECT i.collection_id, s.art, i.position
       FROM collection_items i
       JOIN collections c ON c.id = i.collection_id AND c.workspace_id = ?
       JOIN source_posts p ON p.id = i.source_post_id
            AND p.publication_status = 'published' AND p.processing_status = 'ready'
       JOIN post_slides s ON s.post_id = p.id AND s.position = 0
      ORDER BY i.position`,
    viewer.workspaceId
  );

  return boards.map((board) => ({
    id: board.id,
    name: board.name,
    itemCount: board.item_count,
    covers: covers
      .filter((cover) => cover.collection_id === board.id)
      .slice(0, 3)
      .map((cover) => parseJson<SlideArt>(cover.art, {} as SlideArt)),
    version: board.version,
    updatedAt: board.updated_at,
    hasActiveShare: board.active_share === 1,
  }));
}

/** Board names + whether a given post is already saved — powers the save dialog. */
export function boardsForPost(viewer: Viewer, postId: string) {
  return all<{ id: string; name: string; saved: number }>(
    `SELECT c.id, c.name,
            EXISTS (SELECT 1 FROM collection_items i WHERE i.collection_id = c.id AND i.source_post_id = ?) AS saved
       FROM collections c
      WHERE c.workspace_id = ?
      ORDER BY c.updated_at DESC`,
    postId,
    viewer.workspaceId
  ).map((row) => ({ id: row.id, name: row.name, saved: row.saved === 1 }));
}

export function getBoard(viewer: Viewer, boardId: string): BoardDetail {
  const board = ownBoard(viewer, boardId);

  const items = all<{
    id: string;
    source_post_id: string;
    position: number;
    note: string;
    version: number;
    published: number;
    brand_name: string | null;
    hook: string | null;
    art: string | null;
    alt_text: string | null;
    media_type: string | null;
    slide_count: number;
    source_url: string | null;
    objective_id: string | null;
  }>(
    `SELECT i.id, i.source_post_id, i.position, i.note, i.version,
            (p.publication_status = 'published' AND p.processing_status = 'ready') AS published,
            b.name AS brand_name, a.hook, s.art, s.alt_text, p.media_type, p.source_url, a.objective_id,
            (SELECT COUNT(*) FROM post_slides x WHERE x.post_id = p.id) AS slide_count
       FROM collection_items i
       JOIN source_posts p ON p.id = i.source_post_id
       JOIN brands b ON b.id = p.brand_id
       LEFT JOIN creative_analyses a ON a.post_id = p.id
       LEFT JOIN post_slides s ON s.post_id = p.id AND s.position = 0
      WHERE i.collection_id = ?
      ORDER BY i.position, i.created_at`,
    board.id
  );

  const share = get<{ id: string; expires_at: string; created_at: string }>(
    `SELECT id, expires_at, created_at FROM collection_shares
      WHERE collection_id = ? AND revoked_at IS NULL AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1`,
    board.id,
    now()
  );

  return {
    id: board.id,
    name: board.name,
    description: board.description,
    version: board.version,
    createdAt: board.created_at,
    updatedAt: board.updated_at,
    share: share ? { id: share.id, expiresAt: share.expires_at, createdAt: share.created_at } : null,
    items: items.map((item) => {
      const available = item.published === 1;
      return {
        id: item.id,
        postId: item.source_post_id,
        position: item.position,
        note: item.note,
        version: item.version,
        available,
        // Removed/unpublished posts become a placeholder: nothing about them leaks.
        creative: available
          ? {
              brandName: item.brand_name ?? "",
              hook: item.hook,
              cover: parseJson<SlideArt>(item.art, {} as SlideArt),
              coverAlt: item.alt_text ?? "",
              mediaType: item.media_type ?? "static",
              slideCount: item.slide_count,
              sourceUrl: item.source_url ?? "",
              objectiveId: item.objective_id ?? "",
            }
          : null,
      };
    }),
  };
}

export function createBoard(viewer: Viewer, input: unknown) {
  const data = parse(createBoardSchema, input);

  const { count } = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM collections WHERE workspace_id = ?",
    viewer.workspaceId
  )!;
  if (count >= LIMITS.boardsPerWorkspace) {
    throw new AppError("forbidden", `You can have up to ${LIMITS.boardsPerWorkspace} boards on this plan.`);
  }

  for (const postId of data.postIds ?? []) {
    if (!isPublished(postId)) throw notFound("Creative");
  }

  const id = newId();
  const created = now();
  transaction(() => {
    run(
      `INSERT INTO collections (id, workspace_id, owner_user_id, name, description, version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      viewer.workspaceId,
      viewer.userId,
      data.name,
      data.description ?? "",
      created,
      created
    );
    (data.postIds ?? []).forEach((postId, position) => {
      run(
        `INSERT OR IGNORE INTO collection_items (id, collection_id, source_post_id, position, note, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, '', 1, ?, ?)`,
        newId(),
        id,
        postId,
        position,
        created,
        created
      );
    });
  });

  track("board_created", { viewer, resourceId: id });
  return { id };
}

export function updateBoard(viewer: Viewer, boardId: string, input: unknown) {
  const data = parse(updateBoardSchema, input);
  const board = ownBoard(viewer, boardId);

  const result = run(
    `UPDATE collections SET name = ?, description = ?, version = version + 1, updated_at = ?
      WHERE id = ? AND workspace_id = ? AND version = ?`,
    data.name ?? board.name,
    data.description ?? board.description,
    now(),
    board.id,
    viewer.workspaceId,
    data.expectedVersion
  );
  if (result.changes === 0) {
    throw conflict("This board changed in another tab or window. Reload to see the latest version.", {
      currentVersion: board.version,
    });
  }

  if (data.name && data.name !== board.name) track("board_renamed", { viewer, resourceId: board.id });
  return { version: data.expectedVersion + 1 };
}

export function deleteBoard(viewer: Viewer, boardId: string) {
  const board = ownBoard(viewer, boardId);
  transaction(() => {
    // Explicit revocation first so the audit trail shows it; cascade removes rows.
    run("UPDATE collection_shares SET revoked_at = ? WHERE collection_id = ? AND revoked_at IS NULL", now(), board.id);
    run("DELETE FROM collections WHERE id = ? AND workspace_id = ?", board.id, viewer.workspaceId);
  });
  audit("board.delete", "collection", board.id, "success", viewer.userId);
  track("board_deleted", { viewer, resourceId: board.id });
}

/* -------------------------------------------------------------------------- */
/*  Saves                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Save one post to several boards at once. Every destination is authorised
 * before anything is written; one bad ID fails the whole request (plan §34.3).
 * Idempotent: re-saving leaves a single relation.
 */
export function saveToBoards(viewer: Viewer, postId: string, boardIds: string[]) {
  if (!uuid.safeParse(postId).success || !isPublished(postId)) throw notFound("Creative");
  const unique = [...new Set(boardIds)];
  if (unique.length === 0) throw invalidInput("Choose at least one board.");
  if (unique.length > 20) throw invalidInput("Choose up to 20 boards at a time.");

  const boards = unique.map((id) => ownBoard(viewer, id));
  const created = now();
  const saved: string[] = [];

  transaction(() => {
    for (const board of boards) {
      const existing = get("SELECT 1 FROM collection_items WHERE collection_id = ? AND source_post_id = ?", board.id, postId);
      if (existing) continue;

      const { count, next } = get<{ count: number; next: number }>(
        "SELECT COUNT(*) AS count, COALESCE(MAX(position) + 1, 0) AS next FROM collection_items WHERE collection_id = ?",
        board.id
      )!;
      if (count >= LIMITS.itemsPerBoard) {
        throw new AppError("forbidden", `"${board.name}" is full (${LIMITS.itemsPerBoard} references).`);
      }

      run(
        `INSERT INTO collection_items (id, collection_id, source_post_id, position, note, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, '', 1, ?, ?)`,
        newId(),
        board.id,
        postId,
        next,
        created,
        created
      );
      bumpBoard(board.id);
      saved.push(board.id);
    }
  });

  for (const boardId of saved) track("creative_saved", { viewer, resourceId: postId, properties: { boardId } });
  return { savedTo: saved, alreadySaved: unique.filter((id) => !saved.includes(id)) };
}

/** Remove this save only — the post and its saves on other boards remain. */
export function removeItem(viewer: Viewer, boardId: string, itemId: string) {
  const item = ownItem(viewer, boardId, itemId);
  transaction(() => {
    run("DELETE FROM collection_items WHERE id = ? AND collection_id = ?", item.id, boardId);
    bumpBoard(boardId);
  });
  track("reference_removed", { viewer, resourceId: boardId });
}

export function updateItemNote(viewer: Viewer, boardId: string, itemId: string, input: unknown) {
  const data = parse(noteUpdateSchema, input);
  const item = ownItem(viewer, boardId, itemId);

  const result = run(
    "UPDATE collection_items SET note = ?, version = version + 1, updated_at = ? WHERE id = ? AND collection_id = ? AND version = ?",
    data.note,
    now(),
    item.id,
    boardId,
    data.expectedVersion
  );
  if (result.changes === 0) {
    throw conflict("This note was changed elsewhere. Reload to see the latest text before editing.", {
      currentVersion: item.version,
    });
  }

  if (!item.note && data.note) track("board_note_added", { viewer, resourceId: boardId });
  return { version: data.expectedVersion + 1 };
}

/**
 * Replace the order. The submitted IDs must be exactly the board's current
 * item set — no extras, no omissions, no duplicates — at the expected version.
 */
export function reorderItems(viewer: Viewer, boardId: string, input: unknown) {
  const data = parse(orderSchema, input);
  const board = ownBoard(viewer, boardId);

  if (board.version !== data.expectedVersion) {
    throw conflict("This board changed in another tab or window. Reload before reordering.", {
      currentVersion: board.version,
    });
  }

  const current = all<{ id: string }>("SELECT id FROM collection_items WHERE collection_id = ?", board.id).map(
    (row) => row.id
  );
  const submitted = new Set(data.itemIds);
  if (
    submitted.size !== data.itemIds.length ||
    submitted.size !== current.length ||
    current.some((id) => !submitted.has(id))
  ) {
    throw conflict("The board's references changed. Reload before reordering.", { currentVersion: board.version });
  }

  transaction(() => {
    data.itemIds.forEach((id, position) => {
      run("UPDATE collection_items SET position = ? WHERE id = ? AND collection_id = ?", position, id, board.id);
    });
    const result = run(
      "UPDATE collections SET version = version + 1, updated_at = ? WHERE id = ? AND version = ?",
      now(),
      board.id,
      data.expectedVersion
    );
    if (result.changes === 0) throw conflict("This board changed while reordering. Reload and try again.");
  });

  track("board_reordered", { viewer, resourceId: board.id });
  return { version: data.expectedVersion + 1 };
}

/* -------------------------------------------------------------------------- */
/*  Sharing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Create (or rotate) the board's read-only link. Any previous link is revoked
 * first. The secret is returned once; only its hash is stored.
 */
export function createShare(viewer: Viewer, boardId: string, input: unknown) {
  const data = parse(shareSchema, input ?? {});
  const board = ownBoard(viewer, boardId);
  const token = randomToken();
  const created = now();
  const expiresAt = new Date(Date.now() + data.expiresInDays * 86_400_000).toISOString();

  transaction(() => {
    run("UPDATE collection_shares SET revoked_at = ? WHERE collection_id = ? AND revoked_at IS NULL", created, board.id);
    run(
      `INSERT INTO collection_shares (id, collection_id, token_hash, expires_at, revoked_at, created_at, created_by)
       VALUES (?, ?, ?, ?, NULL, ?, ?)`,
      newId(),
      board.id,
      sha256(token),
      expiresAt,
      created,
      viewer.userId
    );
  });

  audit("board.share.create", "collection", board.id, "success", viewer.userId);
  track("board_share_created", { viewer, resourceId: board.id, properties: { days: data.expiresInDays } });
  return { token, expiresAt };
}

export function revokeShare(viewer: Viewer, boardId: string) {
  const board = ownBoard(viewer, boardId);
  const result = run(
    "UPDATE collection_shares SET revoked_at = ? WHERE collection_id = ? AND revoked_at IS NULL",
    now(),
    board.id
  );
  audit("board.share.revoke", "collection", board.id, "success", viewer.userId);
  track("board_share_revoked", { viewer, resourceId: board.id });
  return { revoked: result.changes > 0 };
}

/**
 * Resolve a share token. Rechecks revocation, expiry, board existence, and
 * each post's publication status on every request. Returns only the title
 * and permitted references — never the description, notes, owner, or workspace.
 */
export function getSharedBoard(token: string): SharedBoard | null {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;

  const share = get<{ collection_id: string; expires_at: string }>(
    `SELECT s.collection_id, s.expires_at
       FROM collection_shares s
       JOIN collections c ON c.id = s.collection_id
      WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?`,
    sha256(token),
    now()
  );
  if (!share) return null;

  const board = get<{ name: string }>("SELECT name FROM collections WHERE id = ?", share.collection_id);
  if (!board) return null;

  const items = all<{
    published: number;
    source_post_id: string;
    brand_name: string;
    hook: string | null;
    art: string | null;
    alt_text: string | null;
    media_type: string;
    source_url: string;
    slide_count: number;
  }>(
    `SELECT (p.publication_status = 'published' AND p.processing_status = 'ready') AS published,
            i.source_post_id, b.name AS brand_name, a.hook, s.art, s.alt_text, p.media_type, p.source_url,
            (SELECT COUNT(*) FROM post_slides x WHERE x.post_id = p.id) AS slide_count
       FROM collection_items i
       JOIN source_posts p ON p.id = i.source_post_id
       JOIN brands b ON b.id = p.brand_id
       LEFT JOIN creative_analyses a ON a.post_id = p.id
       LEFT JOIN post_slides s ON s.post_id = p.id AND s.position = 0
      WHERE i.collection_id = ?
      ORDER BY i.position, i.created_at`,
    share.collection_id
  );

  return {
    title: board.name,
    expiresAt: share.expires_at,
    items: items.map((item) =>
      item.published === 1
        ? {
            available: true as const,
            postId: item.source_post_id,
            brandName: item.brand_name,
            hook: item.hook,
            cover: parseJson<SlideArt>(item.art, {} as SlideArt),
            coverAlt: item.alt_text ?? "",
            mediaType: item.media_type,
            slideCount: item.slide_count,
            sourceUrl: item.source_url,
          }
        : { available: false as const }
    ),
  };
}
