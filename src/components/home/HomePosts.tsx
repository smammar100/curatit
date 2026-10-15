"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LibraryPost } from "@/lib/posts";

// The library posts the homepage demos show, keyed by short code. The page
// loads them from Supabase on the server and hands them down here, so the
// client demos can look them up without fetching.
const HomePostsContext = createContext<Record<string, LibraryPost>>({});

export function HomePostsProvider({
  posts,
  children,
}: {
  posts: LibraryPost[];
  children: ReactNode;
}) {
  const byShortCode = Object.fromEntries(
    posts.map((post) => [post.shortCode, post]),
  );
  return (
    <HomePostsContext.Provider value={byShortCode}>
      {children}
    </HomePostsContext.Provider>
  );
}

// The posts for these short codes, in order, skipping any that aren't published
export function usePosts(shortCodes: string[]) {
  const posts = useContext(HomePostsContext);
  return shortCodes.flatMap((shortCode) => posts[shortCode] ?? []);
}

export function usePost(shortCode: string): LibraryPost | undefined {
  return useContext(HomePostsContext)[shortCode];
}
