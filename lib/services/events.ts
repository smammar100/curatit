import "server-only";

import { newId, now, run } from "../db";
import type { Viewer } from "../auth";

/**
 * Product analytics (plan §30, §34.7). Store IDs, timestamps, and outcomes only:
 * never query text, board names, notes, share URLs, or tokens.
 */
export type EventName =
  | "search_completed"
  | "creative_opened"
  | "creative_saved"
  | "board_created"
  | "board_renamed"
  | "board_deleted"
  | "board_reopened"
  | "board_note_added"
  | "board_reordered"
  | "reference_removed"
  | "board_share_created"
  | "board_share_revoked"
  | "shared_board_viewed";

type Primitive = string | number | boolean | null;

export function track(
  name: EventName,
  options: {
    viewer?: Viewer | null;
    resourceId?: string | null;
    requestId?: string | null;
    success?: boolean;
    properties?: Record<string, Primitive>;
  } = {}
) {
  try {
    run(
      `INSERT INTO product_events (id, name, user_id, workspace_id, resource_id, request_id, success, properties, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId(),
      name,
      options.viewer?.userId ?? null,
      options.viewer?.workspaceId ?? null,
      options.resourceId ?? null,
      options.requestId ?? null,
      options.success === false ? 0 : 1,
      JSON.stringify(options.properties ?? {}),
      now()
    );
  } catch {
    // Analytics must never break the user's action.
  }
}

/** Security-relevant actions (plan §34.5): identifiers and outcomes only. */
export function audit(
  action: string,
  resourceType: string,
  resourceId: string | null,
  outcome: "success" | "denied" | "failed",
  actorUserId?: string | null
) {
  try {
    run(
      `INSERT INTO audit_events (id, actor_user_id, action, resource_type, resource_id, outcome, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      newId(),
      actorUserId ?? null,
      action,
      resourceType,
      resourceId,
      outcome,
      now()
    );
  } catch {
    // Never block the request on audit storage.
  }
}
