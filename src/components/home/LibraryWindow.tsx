"use client";

// The solution in the problem → solution scroll: the real dashboard, drawn small. Its header (the
// mark, For you / Discover, the search pill holding the brief, Create, Saved with its count, and
// the account), the feed as a masonry of library posts at their own proportions, dealt row by row
// like the real grid, and one post being saved: its hover state with "Saved", the Save menu open
// on the board it went to, and the toast that confirms it. It mirrors components/dashboard, so
// keep the two in step when the dashboard changes.
//
// Since 2026-10-24 it mirrors the dashboard on Glaze (components/dashboard/Header.tsx): the header
// is Glaze's own components at their small size (the SegmentedControl, Create and Saved as
// secondary Buttons, Saved carrying its count as its label, the Avatar in a ghost icon Button),
// the search on the field recipe, the Save menu on the overlay and menu-row recipes with the
// first board under the highlight, and the toast on the overlay recipe with the success glyph.
// The whole drawing is inert, so the real components in it take no focus and no pointer, and the
// picture is named once, by its role="img" label.
import Image from "next/image";
import type { CSSProperties } from "react";
// Assets
import Symbol from "@/components/assets/Symbol";
// Glaze
import { Add, Bookmark, Check, Icon, Search, Success } from "@/components/glaze/icon";
import { Avatar } from "@/components/glaze/ui/avatar";
import { Button } from "@/components/glaze/ui/button";
import { SegmentedControl, SegmentedControlItem } from "@/components/glaze/ui/segmented-control";
import { menuItemClass, menuLabelClass } from "@/lib/glaze/overlay";
// Components
import AppWindow from "./AppWindow";
import BrandName from "./BrandName";
import { board, libraryWindow } from "./demo";
import { usePosts, type HomePost } from "./HomePosts";
import { cx } from "@/lib/cx";
import { useMounted } from "@/lib/useMounted";

// Five columns in a wide window, four in a medium one, three on a phone
const COLUMNS = 5;
const ratio = (post: HomePost) => (post.width && post.height ? post.width / post.height : 0.8);

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

export default function LibraryWindow({ className }: { className?: string }) {
  const posts = usePosts(libraryWindow.posts);
  const boardCovers = usePosts(board.references.map((reference) => reference.post));
  const columns = intoColumns(posts);
  const saved = board.references.length;

  return (
    <div
      role="img"
      aria-label="The Curatit dashboard: a brief searched for, the library's posts that match it, and one of them saved to a board"
      className={cx("pointer-events-none select-none", className)}
    >
      <AppWindow title="Curatit" className="flex h-full flex-col">
        <div inert className="flex min-h-0 flex-1 flex-col">
          {/* The header */}
          <div className="flex h-12 shrink-0 items-center gap-3 px-4 @lg:gap-5">
            <div className="flex items-center gap-3 @lg:gap-4">
              <Symbol className="size-5 text-text-1" aria-hidden="true" />
              <SegmentedControl aria-label="Feed" size="sm" value="For you" className="hidden @lg:flex">
                <SegmentedControlItem value="For you">For you</SegmentedControlItem>
                <SegmentedControlItem value="Discover">Discover</SegmentedControlItem>
              </SegmentedControl>
            </div>
            {/* The search pill, on the field recipe */}
            <div className="field mx-auto flex-1 [--field-h:var(--control-sm)] @lg:max-w-88">
              <Icon icon={Search} size={12} className="text-text-3" />
              <span className="truncate">{libraryWindow.query}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="icon-sm" aria-label="Create a board" className="@md:hidden">
                <Icon icon={Add} />
              </Button>
              <Button variant="secondary" size="sm" className="hidden @md:inline-flex">
                <Icon icon={Add} />
                Create
              </Button>
              <Button variant="secondary" size="sm" aria-label={`Saved, ${saved} posts`}>
                <Icon icon={Bookmark} />
                <span className="data">{saved}</span>
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Account">
                <Avatar name="A M" size="sm" decorative />
              </Button>
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

            {/* The toast the save sets off, on the overlay recipe as Glaze's Toast draws it */}
            <p className="overlay absolute bottom-4 left-1/2 z-(--z-raised) flex -translate-x-1/2 items-center gap-1.5 px-3 py-2 type-label-sm whitespace-nowrap">
              <Icon icon={Success} size={12} className="text-ok" />
              Saved to {board.name}
            </p>
          </div>
        </div>
      </AppWindow>
    </div>
  );
}

// One post in the feed. The saved one shows the hover state (brand chip and Saved) with the
// Save menu open below it.
function Tile({ post, saved, boardCovers }: { post: HomePost; saved: boolean; boardCovers: HomePost[] }) {
  // The cover is requested only after mount, so the window's twelve files stay out of the first paint
  const mounted = useMounted();
  return (
    <li className={cx("relative", saved && "z-(--z-raised)")}>
      <div
        className="relative aspect-(--ratio) w-full overflow-hidden rounded-tag bg-field"
        style={{ "--ratio": ratio(post) } as CSSProperties}
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
            <span className="flex h-6 items-center gap-1 rounded-pill border border-line bg-paper px-2 type-label-sm text-text-1">
              <Icon icon={Check} size={12} />
              Saved
            </span>
          </div>
          <span className="absolute bottom-1.5 left-1.5 rounded-pill border border-line bg-paper px-2 py-1">
            <BrandName brand={post.brand} />
          </span>
          {/* The Save menu, on the overlay and menu-row recipes: the small rows, the first board
              under the highlight */}
          <div data-size="sm" className="overlay absolute top-9 right-1.5 w-36 p-1 [--menu-item-h:var(--menu-row-sm)] @lg:w-44">
            <p className={menuLabelClass}>Save to board</p>
            {libraryWindow.boards.map((name, i) => (
              <p key={name} data-highlighted={i === 0 ? "" : undefined} className={menuItemClass}>
                <span className="relative size-5 shrink-0 overflow-hidden rounded-tag bg-field">
                  {i === 0 && mounted && boardCovers[0] && (
                    <Image src={boardCovers[0].images[0]} alt="" fill sizes="20px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {i === 0 && <Icon icon={Check} />}
              </p>
            ))}
            <p className={menuItemClass}>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-tag bg-field">
                <Icon icon={Add} />
              </span>
              New board
            </p>
          </div>
        </>
      )}
    </li>
  );
}
