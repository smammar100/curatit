import { cache } from "react";
import { createPublicClient } from "@/utils/supabase/public";

// A board as its read-only link shows it, /s/<token>
export type SharedBoard = {
  name: string;
  description: string | null;
  posts: {
    shortCode: string;
    url: string;
    cover: string | null;
    note: string | null;
    brand: { name: string; logo: string | null } | null;
    owner: string | null;
    width: number | null;
    height: number | null;
  }[];
};

type Shared = {
  name: string;
  description: string | null;
  posts: { short_code: string; url: string; cover_path: string | null; note: string | null; owner_username: string | null }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// get_shared_board() (callable signed out: the token is the credential) gives the board and
// its posts, newest first; the library view adds each post's brand and size. Null when the
// token isn't a board's, including one whose link has been turned off.
export const getSharedBoard = cache(async (token: string): Promise<SharedBoard | null> => {
  if (!UUID.test(token)) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_shared_board", { token });
  if (error) throw new Error(`Could not load shared board: ${error.message}`);
  const board = data as Shared | null;
  if (!board) return null;

  const codes = board.posts.map((post) => post.short_code);
  const library = codes.length
    ? await supabase.from("library_posts").select("short_code, brand_name, brand_logo_path, dimensions_width, dimensions_height").in("short_code", codes)
    : { data: [], error: null };
  if (library.error) throw new Error(`Could not load the shared board's posts: ${library.error.message}`);
  const byCode = new Map(library.data.map((row) => [row.short_code as string, row]));

  return {
    name: board.name,
    description: board.description,
    posts: board.posts.map((post) => {
      const row = byCode.get(post.short_code);
      return {
        shortCode: post.short_code,
        url: post.url,
        cover: post.cover_path ? `/lib/${post.cover_path}` : null,
        note: post.note,
        brand: row?.brand_name ? { name: row.brand_name, logo: row.brand_logo_path ? `/lib/${row.brand_logo_path}` : null } : null,
        owner: post.owner_username,
        width: row?.dimensions_width ?? null,
        height: row?.dimensions_height ?? null,
      };
    }),
  };
});
