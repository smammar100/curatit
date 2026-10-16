"use client";

// The solution in the problem → solution scroll: the real dashboard, drawn small. Its header (the
// mark, For you / Discover, the search pill holding the brief, Create, Saved with its
// count, and the account), the feed as a masonry of library posts at their own proportions, dealt row by row
// like the real grid, and one post being saved: its hover state with "Saved", the Save menu open
// on the board it went to, and the toast that confirms it. It mirrors components/dashboard, so
// keep the two in step when the dashboard changes.
import Image from "next/image";
// Fundation
import Symbol from "@/components/assets/Symbol";
import Check from "@/components/fundations/icons/Check";
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import Plus from "@/components/fundations/icons/Plus";
import Search from "@/components/fundations/icons/Search";
import type { LibraryPost } from "@/lib/posts";
// Components
import AppWindow from "./AppWindow";
import BrandName from "./BrandName";
import { board, libraryWindow } from "./demo";
import { usePosts } from "./HomePosts";
import { cx } from "@/lib/cx";
import { useMounted } from "@/lib/useMounted";

// Five columns in a wide window, four in a medium one, three on a phone
const COLUMNS = 5;
const ratio = (post: LibraryPost) =>
  post.width && post.height ? post.width / post.height : 0.8;

// Each post to the column that's shortest so far, as the dashboard's grid deals them
function intoColumns(posts: LibraryPost[]) {
  const columns: LibraryPost[][] = Array.from({ length: COLUMNS }, () => []);
  const heights = Array<number>(COLUMNS).fill(0);
  for (const post of posts) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(post);
    heights[shortest] += 1 / ratio(post);
  }
  return columns;
}

export default function LibraryWindow({ className }: { className?: string }) {
  const posts = usePosts(libraryWindow.posts);
  const boardCovers = usePosts(
    board.references.map((reference) => reference.post),
  );
  const columns = intoColumns(posts);

  return (
    <div
      role="img"
      aria-label="The Curatit dashboard: a brief searched for, the library's posts that match it, and one of them saved to a board"
      className={cx("pointer-events-none select-none", className)}
    >
      <AppWindow title="Curatit" className="flex h-full flex-col">
        {/* The header */}
        <div className="flex h-12 shrink-0 items-center gap-3 px-4 @lg:gap-5">
          <div className="flex items-center gap-3 @lg:gap-4">
            <Symbol className="size-5 text-base-900" />
            <div className="hidden items-center gap-3 text-xs font-medium @lg:flex">
              <span className="text-base-900">For you</span>
              <span className="text-base-500">Discover</span>
            </div>
          </div>
          <div className="mx-auto flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-3 text-xs ring-1 ring-base-200 @lg:max-w-[22rem]">
            <Search className="size-3 shrink-0 text-base-500" />
            <span className="truncate text-base-900">
              {libraryWindow.query}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-base-900 ring-1 ring-base-200">
              <Plus className="size-3" />
              <span className="hidden @md:inline">Create</span>
            </span>
            <span className="relative flex size-7 items-center justify-center rounded-full text-base-900 ring-1 ring-base-200">
              <BookmarkSimple className="size-3" />
              <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent-600 px-0.5 text-[8px] text-paper tabular-nums ring-1 ring-white">
                {board.references.length}
              </span>
            </span>
            <span className="flex size-7 items-center justify-center rounded-full bg-accent-100 text-[9px] font-medium text-accent-700">
              AM
            </span>
          </div>
        </div>

        {/* The feed, running off the bottom like a real screen */}
        <div className="relative min-h-0 flex-1 overflow-hidden px-4 pt-1">
          <div className="grid grid-cols-3 items-start gap-2.5 @lg:grid-cols-4 @lg:gap-3 @3xl:grid-cols-5">
            {columns.map((column, c) => (
              <ul
                key={c}
                className={cx(
                  "flex flex-col gap-2.5 @lg:gap-3",
                  c === 3 && "hidden @lg:flex",
                  c === 4 && "hidden @3xl:flex",
                )}
              >
                {column.map((post) => (
                  <Tile
                    key={post.shortCode}
                    post={post}
                    saved={post.shortCode === libraryWindow.saved}
                    boardCovers={boardCovers}
                  />
                ))}
              </ul>
            ))}
          </div>

          {/* The toast the save sets off */}
          <p className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-base-900 px-3 py-1.5 text-[11px] whitespace-nowrap text-white shadow-lg">
            <Check className="size-2.5" />
            Saved to {board.name}
          </p>
        </div>
      </AppWindow>
    </div>
  );
}

// One post in the feed. The saved one shows the hover state (brand chip and Saved) with the
// Save menu open below it.
function Tile({
  post,
  saved,
  boardCovers,
}: {
  post: LibraryPost;
  saved: boolean;
  boardCovers: LibraryPost[];
}) {
  // The cover is requested only after mount, so the window's twelve files stay out of the first paint
  const mounted = useMounted();
  return (
    <li className={cx("relative", saved && "z-10")}>
      <div
        className="relative w-full overflow-hidden rounded-sm bg-base-100"
        style={{ aspectRatio: ratio(post) }}
      >
        {mounted && (
          <Image
            src={post.images[0]}
            alt=""
            fill
            sizes="(min-width: 1024px) 170px, 30vw"
            draggable={false}
            className="object-cover"
          />
        )}
      </div>
      {saved && (
        <>
          <div className="absolute inset-x-0 top-0 flex justify-end p-1.5">
            <span className="flex h-6 items-center gap-1 rounded-md bg-white/95 px-2 text-[10px] font-medium text-base-900 shadow-sm">
              <Check className="size-2.5" />
              Saved
            </span>
          </div>
          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-white/95 px-1.5 py-1 shadow-sm">
            <BrandName brand={post.brand} />
          </span>
          {/* The Save menu, as the dashboard draws it */}
          <div className="absolute top-9 right-1.5 w-36 rounded-lg bg-white p-1 text-[11px] shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] ring-1 ring-edge @lg:w-44">
            <p className="px-2 pt-1 pb-1.5 text-[10px] font-medium text-base-500">
              Save to board
            </p>
            {libraryWindow.boards.map((name, i) => (
              <p
                key={name}
                className={cx(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-base-900",
                  i === 0 && "bg-base-50",
                )}
              >
                <span className="relative size-5 shrink-0 overflow-hidden rounded-sm bg-base-100">
                  {i === 0 && mounted && boardCovers[0] && (
                    <Image
                      src={boardCovers[0].images[0]}
                      alt=""
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {i === 0 && (
                  <Check className="size-2.5 shrink-0 text-base-500" />
                )}
              </p>
            ))}
            <p className="flex items-center gap-2 rounded-md px-2 py-1.5 text-base-900">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-base-100">
                <Plus className="size-2.5" />
              </span>
              New board
            </p>
          </div>
        </>
      )}
    </li>
  );
}
