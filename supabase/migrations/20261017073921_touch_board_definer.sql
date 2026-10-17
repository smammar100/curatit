-- Deleting an account failed with "permission denied for table boards" (2026-10-17). Supabase's
-- Auth service deletes the auth.users row as supabase_auth_admin; the delete cascades to the
-- profile, its boards and their board_posts, and each board_posts row fires touch_board, which
-- ran as the caller and so tried to update public.boards as supabase_auth_admin, which has no
-- rights there. A member deleting their own board never hit it: they may update their boards.
--
-- touch_board now runs as its owner. It only moves updated_at on the board of the board_posts
-- row that fired it (no input but that row, search_path already empty), and as a trigger
-- function it can't be called directly (execute is revoked from public).

alter function private.touch_board() security definer;
