"use client";

// Previous and next on a post's review page. The page steps through the list it was opened from
// (a tab of the queue), kept as it was at that moment in sessionStorage, so a post that leaves
// Needs review when it's approved keeps its place and Next still goes where you'd expect. A post
// opened from a link builds the list from the queue instead: the tab it's on, else Needs review.
import { useEffect, useState } from "react";
import { loadQueue, type PostSummary } from "./data";

export type WalkItem = { id: string; label: string };
export type Walk = { list: string; items: WalkItem[] };

const KEY = "curatit-review-walk";

export const walkOf = (list: string, posts: PostSummary[]): Walk => ({
  list,
  items: [...new Map(posts.map((post) => [post.id, { id: post.id, label: `${post.brand} · ${post.short_code}` }])).values()],
});

export function saveWalk(walk: Walk) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(walk));
  } catch {
    // Storage blocked: the post page builds its list from the queue
  }
}

function savedWalk(postId: string): Walk | null {
  try {
    const walk = JSON.parse(sessionStorage.getItem(KEY) ?? "null") as Walk | null;
    const valid = walk && typeof walk.list === "string" && Array.isArray(walk.items) && walk.items.every((item) => typeof item?.id === "string" && typeof item.label === "string");
    return valid && walk.items.some((item) => item.id === postId) ? walk : null;
  } catch {
    return null;
  }
}

// The list this post is being reviewed in, and the posts either side of it. Only for components
// that mount in the browser (the review pages render their content once the editor's data loads)
export function useWalk(postId: string) {
  const [walk, setWalk] = useState<Walk | null>(() => savedWalk(postId));
  const [checked, setChecked] = useState(walk !== null);

  useEffect(() => {
    if (checked) return;
    let live = true;
    loadQueue()
      .then((queue) => {
        if (!live) return;
        const lists: [string, PostSummary[]][] = [
          ["Needs review", queue.review.map((row) => row.post)],
          ["Published", queue.published.map((row) => row.post)],
          ["Failed", queue.failed.map((row) => row.post)],
        ];
        const [list, posts] = lists.find(([, posts]) => posts.some((post) => post.id === postId)) ?? lists[0];
        const next = walkOf(list, posts);
        saveWalk(next);
        setWalk(next);
      })
      .catch(() => {})
      .finally(() => live && setChecked(true));
    return () => {
      live = false;
    };
  }, [checked, postId]);

  const items = walk?.items ?? [];
  const index = items.findIndex((item) => item.id === postId);
  return {
    walk,
    // -1 when the post isn't in the list (it left every tab before the page was opened); Next
    // then goes to the list's first post
    index,
    previous: index > 0 ? items[index - 1] : null,
    next: index >= 0 ? (items[index + 1] ?? null) : (items.find((item) => item.id !== postId) ?? null),
    ready: checked,
  };
}
