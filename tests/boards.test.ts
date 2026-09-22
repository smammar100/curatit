/**
 * Board security and integrity — the evidence list in plan §34.6.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, get } from "../lib/db";
import {
  createBoard,
  createShare,
  deleteBoard,
  getBoard,
  getSharedBoard,
  listBoards,
  removeItem,
  reorderItems,
  revokeShare,
  saveToBoards,
  updateBoard,
  updateItemNote,
} from "../lib/services/boards";
import { applyAction } from "../lib/services/admin";
import { expectCode, makeViewer, publishedPostIds } from "./helpers";

const [postA, postB, postC] = publishedPostIds();

test("another account cannot list, read, change, reorder, share, or delete my board", () => {
  const owner = makeViewer();
  const outsider = makeViewer();
  const { id } = createBoard(owner, { name: "Owner board", description: "secret brief", postIds: [postA] });

  assert.equal(listBoards(outsider).length, 0);
  expectCode(() => getBoard(outsider, id), "not_found");
  expectCode(() => updateBoard(outsider, id, { name: "hijack", expectedVersion: 1 }), "not_found");
  expectCode(() => reorderItems(outsider, id, { itemIds: [], expectedVersion: 1 }), "not_found");
  expectCode(() => saveToBoards(outsider, postB, [id]), "not_found");
  expectCode(() => createShare(outsider, id, {}), "not_found");
  expectCode(() => revokeShare(outsider, id), "not_found");
  expectCode(() => deleteBoard(outsider, id), "not_found");

  const itemId = getBoard(owner, id).items[0].id;
  expectCode(() => updateItemNote(outsider, id, itemId, { note: "x", expectedVersion: 1 }), "not_found");
  expectCode(() => removeItem(outsider, id, itemId), "not_found");

  // Nothing changed for the owner.
  const board = getBoard(owner, id);
  assert.equal(board.name, "Owner board");
  assert.equal(board.items.length, 1);
});

test("a crafted item ID from another board cannot bypass the parent ownership check", () => {
  const owner = makeViewer();
  const attacker = makeViewer();
  const victimBoard = createBoard(owner, { name: "Victim", postIds: [postA] }).id;
  const attackerBoard = createBoard(attacker, { name: "Mine" }).id;
  const victimItem = getBoard(owner, victimBoard).items[0].id;

  // Attacker owns attackerBoard but targets the victim's item through it.
  expectCode(() => updateItemNote(attacker, attackerBoard, victimItem, { note: "pwned", expectedVersion: 1 }), "not_found");
  expectCode(() => removeItem(attacker, attackerBoard, victimItem), "not_found");
  assert.equal(getBoard(owner, victimBoard).items[0].note, "");
});

test("one post on two boards keeps independent notes; removing one save leaves the other", () => {
  const viewer = makeViewer();
  const first = createBoard(viewer, { name: "First" }).id;
  const second = createBoard(viewer, { name: "Second" }).id;

  const result = saveToBoards(viewer, postA, [first, second]);
  assert.deepEqual(new Set(result.savedTo), new Set([first, second]));

  const firstItem = getBoard(viewer, first).items[0];
  const secondItem = getBoard(viewer, second).items[0];
  updateItemNote(viewer, first, firstItem.id, { note: "Use the pacing", expectedVersion: firstItem.version });
  updateItemNote(viewer, second, secondItem.id, { note: "Use the palette", expectedVersion: secondItem.version });

  assert.equal(getBoard(viewer, first).items[0].note, "Use the pacing");
  assert.equal(getBoard(viewer, second).items[0].note, "Use the palette");

  removeItem(viewer, first, firstItem.id);
  assert.equal(getBoard(viewer, first).items.length, 0);
  assert.equal(getBoard(viewer, second).items[0].note, "Use the palette");
});

test("saving is idempotent, and a request with one unauthorised board writes nothing", () => {
  const viewer = makeViewer();
  const other = makeViewer();
  const mine = createBoard(viewer, { name: "Mine" }).id;
  const theirs = createBoard(other, { name: "Theirs" }).id;

  saveToBoards(viewer, postA, [mine]);
  const again = saveToBoards(viewer, postA, [mine]);
  assert.deepEqual(again.savedTo, []);
  assert.equal(getBoard(viewer, mine).items.length, 1);

  expectCode(() => saveToBoards(viewer, postB, [mine, theirs]), "not_found");
  assert.equal(getBoard(viewer, mine).items.length, 1, "no partial write to the authorised board");
  assert.equal(getBoard(other, theirs).items.length, 0);
});

test("stale writes return a conflict instead of silently overwriting", () => {
  const viewer = makeViewer();
  const { id } = createBoard(viewer, { name: "Board", postIds: [postA, postB] });
  const board = getBoard(viewer, id);

  updateBoard(viewer, id, { name: "Tab one", expectedVersion: board.version });
  expectCode(() => updateBoard(viewer, id, { name: "Tab two", expectedVersion: board.version }), "conflict");
  assert.equal(getBoard(viewer, id).name, "Tab one");

  const item = board.items[0];
  updateItemNote(viewer, id, item.id, { note: "first", expectedVersion: item.version });
  expectCode(() => updateItemNote(viewer, id, item.id, { note: "second", expectedVersion: item.version }), "conflict");
});

test("reordering requires exactly the board's current items at the current version", () => {
  const viewer = makeViewer();
  const { id } = createBoard(viewer, { name: "Order", postIds: [postA, postB, postC] });
  const board = getBoard(viewer, id);
  const ids = board.items.map((item) => item.id);

  expectCode(() => reorderItems(viewer, id, { itemIds: ids.slice(0, 2), expectedVersion: board.version }), "conflict");
  expectCode(() => reorderItems(viewer, id, { itemIds: [ids[0], ids[0], ids[1]], expectedVersion: board.version }), "conflict");
  expectCode(() => reorderItems(viewer, id, { itemIds: [...ids].reverse(), expectedVersion: board.version + 5 }), "conflict");

  reorderItems(viewer, id, { itemIds: [...ids].reverse(), expectedVersion: board.version });
  assert.deepEqual(getBoard(viewer, id).items.map((item) => item.id), [...ids].reverse());
});

test("shared view exposes only title and references — never description, notes, or owner", () => {
  const viewer = makeViewer();
  const { id } = createBoard(viewer, { name: "Client deck", description: "PRIVATE-DESCRIPTION", postIds: [postA] });
  const item = getBoard(viewer, id).items[0];
  updateItemNote(viewer, id, item.id, { note: "PRIVATE-NOTE", expectedVersion: item.version });

  const { token } = createShare(viewer, id, { expiresInDays: 7 });
  const shared = getSharedBoard(token);
  assert.ok(shared);
  assert.equal(shared.title, "Client deck");
  assert.equal(shared.items.length, 1);

  const serialised = JSON.stringify(shared);
  for (const secret of ["PRIVATE-DESCRIPTION", "PRIVATE-NOTE", viewer.email, viewer.workspaceId, viewer.userId, id]) {
    assert.ok(!serialised.includes(secret), `shared payload leaked ${secret}`);
  }
});

test("share tokens are stored hashed, and revoked, rotated, expired, and deleted links stop working", () => {
  const viewer = makeViewer();
  const { id } = createBoard(viewer, { name: "Shared", postIds: [postA] });

  const first = createShare(viewer, id, {});
  assert.ok(first.token.length >= 22, "at least 128 bits of entropy");
  assert.equal(get("SELECT 1 FROM collection_shares WHERE token_hash = ?", first.token), undefined, "plaintext never stored");
  assert.ok(getSharedBoard(first.token));

  // Rotation: new token works, old one doesn't come back.
  const second = createShare(viewer, id, {});
  assert.equal(getSharedBoard(first.token), null);
  assert.ok(getSharedBoard(second.token));

  revokeShare(viewer, id);
  assert.equal(getSharedBoard(second.token), null);

  const third = createShare(viewer, id, { expiresInDays: 1 });
  run("UPDATE collection_shares SET expires_at = ? WHERE collection_id = ?", new Date(Date.now() - 1000).toISOString(), id);
  assert.equal(getSharedBoard(third.token), null, "expired");

  const fourth = createShare(viewer, id, {});
  deleteBoard(viewer, id);
  assert.equal(getSharedBoard(fourth.token), null, "deleted board");

  assert.equal(getSharedBoard("not-a-real-token-at-all-000"), null);
  expectCode(() => createShare(viewer, createBoard(viewer, { name: "x" }).id, { expiresInDays: 31 }), "invalid_input");
});

test("a removed post stops serving through boards and shares, as a placeholder", () => {
  const admin = makeViewer("admin");
  const viewer = makeViewer();
  const target = publishedPostIds().at(-1)!;
  const { id } = createBoard(viewer, { name: "With removal", postIds: [target, postA] });
  const { token } = createShare(viewer, id, {});

  applyAction(admin, target, "remove");

  const board = getBoard(viewer, id);
  const removed = board.items.find((item) => item.postId === target)!;
  assert.equal(removed.available, false);
  assert.equal(removed.creative, null, "no content leaks for a removed post");

  const shared = getSharedBoard(token)!;
  assert.equal(shared.items.filter((item) => item.available).length, 1);
  assert.ok(!JSON.stringify(shared).includes(target));

  expectCode(() => saveToBoards(viewer, target, [id]), "not_found");
});

test("input limits are enforced and text is stored as plain text", () => {
  const viewer = makeViewer();
  expectCode(() => createBoard(viewer, { name: "" }), "invalid_input");
  expectCode(() => createBoard(viewer, { name: "x".repeat(81) }), "invalid_input");
  expectCode(() => createBoard(viewer, { name: "ok", description: "x".repeat(1001) }), "invalid_input");

  const { id } = createBoard(viewer, { name: "<script>alert(1)</script>", postIds: [postA] });
  assert.equal(getBoard(viewer, id).name, "<script>alert(1)</script>", "kept verbatim; React escapes on render");

  const item = getBoard(viewer, id).items[0];
  expectCode(() => updateItemNote(viewer, id, item.id, { note: "x".repeat(2001), expectedVersion: 1 }), "invalid_input");
  expectCode(() => getBoard(viewer, "not-a-uuid"), "not_found");
});
