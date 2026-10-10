import type { LibraryPost } from "@/lib/posts";

// What the dashboard needs of a post, so the page sends the browser no more than that
export type DashPost = Pick<LibraryPost, "shortCode" | "hook" | "brand" | "category" | "format" | "width" | "height" | "postedAt"> & {
  cover: string;
};

// A board, shaped like public.boards + board_posts
export type Board = {
  id: string;
  name: string;
  description?: string;
  // Has a share link (boards.share_token is set)
  shared: boolean;
  updated: string;
  items: { post: string; note?: string }[];
};
