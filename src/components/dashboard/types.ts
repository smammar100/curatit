import type { LibraryPost } from "@/lib/posts";

// What the dashboard needs of a post, so the page sends the browser no more than that
export type DashPost = Pick<LibraryPost, "id" | "shortCode" | "hook" | "brand" | "category" | "format" | "width" | "height" | "postedAt"> & {
  cover: string;
};

// A board, from public.boards with its board_posts. Items are short codes, newest first.
export type Board = {
  id: string;
  name: string;
  description?: string;
  // The token in its read-only link, /s/<token>, while it's shared (boards.share_token)
  shareToken: string | null;
  // When a post was last added or removed, or the board renamed (see the board_activity migration)
  updatedAt: string;
  items: { post: string; note?: string; addedAt: string }[];
};
