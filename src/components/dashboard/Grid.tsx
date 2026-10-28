"use client";

// The dashboard's masonry: posts at their own proportions in as many columns as the chosen
// tile size fits, each tile opening the post, with Save on hover. Since 2026-10-24 on Glaze: the
// cover in the panel corner over Glaze's Skeleton until its image arrives, the brand label a tag
// of paper, and Glaze's focus ring on the tile.
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import BrandName from "@/components/home/BrandName";
import { Skeleton } from "@/components/glaze/ui/skeleton";
import { cx } from "@/lib/cx";
import { SaveMenu } from "./boards";
import { GridSkeleton } from "./Skeleton";
import { useGridSize, type GridSize } from "./prefs";
import type { DashPost } from "./types";

// Tile width each grid size aims for; the column count is however many fit. Medium matches
// Cosmos: three columns at 1,166px, five at 1,860px.
const TARGET: Record<GridSize, number> = { large: 460, medium: 320, small: 230 };
// Gaps grow with the screen, 24px on a phone to 40px on a wide display
const gapFor = (width: number) => Math.round(Math.min(40, Math.max(24, width * 0.022)));

export const ratio = (post: Pick<DashPost, "width" | "height">) => (post.width && post.height ? post.width / post.height : 0.8);
export const postHref = (shortCode: string) => `/dashboard/p/${shortCode}`;

// A tile clicked in the feed or on a board opens its post over that page (an intercepted
// route), so closing the post can step back to the page as it was, scroll and all, instead of
// loading the feed again. The second and third clicks of a double or triple click open nothing:
// they landed on whatever tile sat under a dialog that the first click had just closed
// (2026-10-28, from a QA run: a triple-clicked Create board opened a stranger's post)
let openedOverPage = false;
export function rememberOpener(event: MouseEvent) {
  if (event.detail > 1) return event.preventDefault();
  openedOverPage = !location.pathname.startsWith("/dashboard/p/");
}
export function backToPage() {
  const was = openedOverPage;
  openedOverPage = false;
  return was;
}

// Deals the posts across the columns, each to the one that is currently shortest, so the
// order reads across the top row first and the columns end close together. Plain CSS
// columns would fill top to bottom and put the first posts all on the left.
function intoColumns(posts: DashPost[], count: number) {
  const columns: DashPost[][] = Array.from({ length: count }, () => []);
  const heights = Array<number>(count).fill(0);
  for (const post of posts) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(post);
    heights[shortest] += 1 / ratio(post);
  }
  return columns;
}

export default function Grid({ posts, priority = true }: { posts: DashPost[]; priority?: boolean }) {
  const { size } = useGridSize();
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // The grid lays out from its measured width, so it renders once that is known: the columns
  // never re-shuffle in front of you on load. Measured before the first paint, then kept up
  // to date as the window resizes.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(Math.round(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const gap = gapFor(width);
  const count = width ? Math.max(1, Math.floor((width + gap) / (TARGET[size] + gap))) : 0;
  const columns = useMemo(() => (count ? intoColumns(posts, count) : []), [posts, count]);

  return (
    <div ref={ref}>
      {/* Until the width is known (in the server's HTML, before the page's code has loaded)
          the grid's shape stands in, so the feed never opens on a blank page */}
      {count === 0 && <GridSkeleton />}
      {count > 0 && (
        <div
          className="grid grid-cols-(--columns) items-start gap-x-(--gap)"
          style={{ "--columns": `repeat(${count}, minmax(0, 1fr))`, "--gap": `${gap}px` } as CSSProperties}
        >
          {columns.map((column, c) => (
            <ul key={c} className="flex flex-col gap-y-(--gap)">
              {column.map((post, i) => (
                <Tile key={post.shortCode} post={post} priority={priority && i === 0} sizes={`${Math.ceil(100 / count)}vw`} />
              ))}
            </ul>
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({ post, priority, sizes }: { post: DashPost; priority: boolean; sizes: string }) {
  // The tile shows the Skeleton until its image has arrived
  const [loaded, setLoaded] = useState(false);
  return (
    <li className="group relative">
      <Link
        href={postHref(post.shortCode)}
        scroll={false}
        onClick={rememberOpener}
        className="block rounded-panel"
      >
        {/* No fill of its own: the Skeleton is the placeholder. The tile's own corner clips it */}
        {/* Off screen the browser skips the cover, placeholder and image alike: with a couple of
            hundred tiles it was restyling every waiting tile's shimmer on every frame of a scroll
            (2026-10-20). Its size comes from the aspect ratio, so nothing shifts. On the cover, not
            the tile, so the Save menu that opens from the tile is never clipped */}
        <div
          className="relative aspect-(--ratio) w-full overflow-hidden rounded-panel [content-visibility:auto]"
          style={{ "--ratio": ratio(post) } as CSSProperties}
        >
          {!loaded && <Skeleton className="absolute inset-0" />}
          <Image
            src={post.cover}
            alt={post.hook}
            fill
            sizes={sizes}
            priority={priority}
            onLoad={() => setLoaded(true)}
            className="object-cover"
          />
        </div>
      </Link>
      {/* Revealed on hover or keyboard focus; always there where there is no hover */}
      <div
        className={cx(
          "pointer-events-none absolute inset-0 flex flex-col justify-between p-2 opacity-0 transition-opacity duration-(--dur-state) ease-out",
          "group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
        )}
      >
        <SaveMenu post={post.shortCode} tone="overlay" className="pointer-events-auto self-end" />
        {/* A label over the cover: a tag of paper, which reads over any image */}
        <span className="self-start rounded-(--radius-nested) bg-paper px-2 py-1">
          <BrandName brand={post.brand} />
        </span>
      </div>
    </li>
  );
}
