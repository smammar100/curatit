"use client";

// The solution in the problem → solution scroll: the real dashboard, drawn small. Its header (the
// mark, For you / Discover, the search pill holding the brief, Create, Saved with its
// count, and the account), the feed as a masonry of library posts at their own proportions, dealt row by row
// like the real grid, and one post being saved: its hover state with "Saved", the Save menu open
// on the board it went to, and the toast that confirms it. It mirrors components/dashboard, so
// keep the two in step when the dashboard changes.
//
// Since 2026-10-23 it is drawn on the system the dashboard is built from: the header's tabs as
// the pressed pill and heavier label of the shared Tabs, the search field on the Input's recipe
// (the one stroke, no fill), Create and Saved as the secondary Button (a hairline ring, 28px),
// the count in the brand's solid with the page's ring, the account as the Avatar's initials, the
// Save menu as the Menu (a 12px container two steps up the surface ladder, 8px rows, the hover
// tint on the first) and the toast as the Toast (the ink, the page's colour on it). Weights come
// from fontVariationSettings, never a font-* class.
import Image from "next/image";
// Fundation
import Symbol from "@/components/assets/Symbol";
import Avatar from "@/components/fundations/elements/Avatar";
import Check from "@/components/fundations/icons/Check";
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import Plus from "@/components/fundations/icons/Plus";
import Search from "@/components/fundations/icons/Search";
// Components
import AppWindow from "./AppWindow";
import BrandName from "./BrandName";
import { board, libraryWindow } from "./demo";
import { usePosts, type HomePost } from "./HomePosts";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";
import { useMounted } from "@/lib/useMounted";

const semibold = { fontVariationSettings: fontWeights.semibold };

// Five columns in a wide window, four in a medium one, three on a phone
const COLUMNS = 5;
const ratio = (post: HomePost) =>
  post.width && post.height ? post.width / post.height : 0.8;

// Each post to the column that's shortest so far, as the dashboard's grid deals them
function intoColumns(posts: HomePost[]) {
  const columns: HomePost[][] = Array.from({ length: COLUMNS }, () => []);
  const heights = Array<number>(COLUMNS).fill(0);
  for (const post of posts) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(post);
    heights[shortest] += 1 / ratio(post);
  }
  return columns;
}

// The secondary Button, drawn: the one stroke, no fill, the compact 28px pill
const secondary =
  "flex h-7 items-center justify-center rounded-[20px] text-caption text-foreground ring-1 ring-border";

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
            <Symbol className="size-5 text-foreground" />
            {/* The tabs: the one you're on sits on the pressed pill with the heavier label */}
            <div className="hidden items-center text-caption @lg:flex">
              <span
                className="flex h-7 items-center rounded-[20px] bg-active px-3 text-foreground"
                style={semibold}
              >
                For you
              </span>
              <span className="flex h-7 items-center rounded-[20px] px-3 text-muted-foreground">
                Discover
              </span>
            </div>
          </div>
          {/* The search field, on the Input's recipe */}
          <div className="mx-auto flex h-7 min-w-0 flex-1 items-center gap-2 rounded-[20px] px-2.5 text-caption ring-1 ring-border @lg:max-w-[22rem]">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-foreground">
              {libraryWindow.query}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cx(secondary, "gap-1 px-2.5")} style={semibold}>
              <Plus className="size-3.5" />
              <span className="hidden @md:inline">Create</span>
            </span>
            <span className="relative inline-flex">
              <span className={cx(secondary, "size-7")}>
                <BookmarkSimple className="size-3.5" />
              </span>
              {/* The count: the brand's solid, cut out of the header by a ring of the page's colour */}
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-solid px-1 text-micro text-on-brand-solid-foreground tabular-nums ring-2 ring-surface-3">
                {board.references.length}
              </span>
            </span>
            <Avatar name="A M" size="sm" decorative />
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

          {/* The toast the save sets off: the ink, as the Toast draws it */}
          <p
            className="absolute bottom-4 left-1/2 z-20 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-[20px] bg-foreground px-3 text-micro whitespace-nowrap text-background shadow-surface-4"
            style={semibold}
          >
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
  post: HomePost;
  saved: boolean;
  boardCovers: HomePost[];
}) {
  // The cover is requested only after mount, so the window's twelve files stay out of the first paint
  const mounted = useMounted();
  return (
    <li className={cx("relative", saved && "z-10")}>
      <div
        className="relative w-full overflow-hidden rounded-[8px] bg-muted"
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
            <span
              className="flex h-6 items-center gap-1 rounded-[20px] bg-surface-3/95 px-2 text-caption-sm text-foreground shadow-surface-2"
              style={semibold}
            >
              <Check className="size-2.5" />
              Saved
            </span>
          </div>
          <span className="absolute bottom-1.5 left-1.5 rounded-[20px] bg-surface-3/95 px-2 py-1 shadow-surface-2">
            <BrandName brand={post.brand} />
          </span>
          {/* The Save menu, as the Menu draws it: a 12px container two steps up the ladder, 8px
              rows, the first board under the hover tint */}
          <div className="absolute top-9 right-1.5 w-36 rounded-[12px] bg-surface-5 p-1 text-micro shadow-surface-3 @lg:w-44">
            <p
              className="px-2 pt-1 pb-1.5 text-caption-sm text-muted-foreground"
              style={semibold}
            >
              Save to board
            </p>
            {libraryWindow.boards.map((name, i) => (
              <p
                key={name}
                className={cx(
                  "flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-foreground",
                  i === 0 && "bg-hover",
                )}
              >
                <span className="relative size-5 shrink-0 overflow-hidden rounded-[4px] bg-muted">
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
                  <Check className="size-2.5 shrink-0 text-muted-foreground" />
                )}
              </p>
            ))}
            <p className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-[4px] bg-muted">
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
