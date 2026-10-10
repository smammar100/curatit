import type { CSSProperties } from "react";
// Assets
import Symbol from "@/components/assets/Symbol";
import { cx } from "@/lib/cx";

// Loading skeletons for the dashboard: the shape of the header, the masonry and a post, in
// the page's own proportions, so nothing jumps when the real content arrives. Server-safe,
// so the route loading files and the grid's first render can both use them.

// One shimmering block. The band holds still under reduced motion.
export function Block({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "animate-shimmer bg-base-100 bg-[linear-gradient(100deg,transparent_35%,var(--color-shimmer)_50%,transparent_65%)] bg-size-[200%_100%] motion-reduce:animate-none",
        className,
      )}
      style={style}
    />
  );
}

// Tile shapes per column, varied the way real posts are (4:5 portraits, a few squares and
// tall ones), offset per column so the columns don't line up
const SHAPES = [0.8, 1, 0.8, 0.75, 0.8, 1];
const PER_COLUMN = 5;

// The masonry's shape before its width is known. Column counts approximate what the medium
// tile size gives at each width (1 on a phone, up to 4 on a wide screen).
export function GridSkeleton({ label = "Loading posts" }: { label?: string }) {
  const columns = [
    "flex",
    "hidden sm:flex",
    "hidden lg:flex",
    "hidden 2xl:flex",
  ];
  return (
    <div role="status" aria-label={label} className="grid grid-cols-1 items-start gap-x-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 2xl:grid-cols-4 2xl:gap-x-10">
      {columns.map((visibility, c) => (
        <div key={c} className={cx("flex-col gap-6 lg:gap-8 2xl:gap-10", visibility)}>
          {Array.from({ length: PER_COLUMN }, (_, i) => (
            <Block key={i} className="w-full rounded" style={{ aspectRatio: SHAPES[(i + c * 2) % SHAPES.length] }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// The header's shape: the mark, the tabs, the search pill and the buttons
export function HeaderSkeleton() {
  return (
    <div aria-hidden="true" className="grid h-23 grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,36rem)_1fr] lg:gap-8">
      <div className="flex items-center gap-6">
        <Symbol className="size-8 text-base-900" />
        <div className="hidden items-center gap-6 lg:flex">
          <Block className="h-4 w-16 rounded-full" />
          <Block className="h-4 w-14 rounded-full" />
          <Block className="h-4 w-12 rounded-full" />
        </div>
      </div>
      <Block className="h-13 w-full rounded-full" />
      <div className="flex items-center justify-end gap-2">
        <Block className="h-11 w-11 rounded-full md:w-28" />
        <Block className="hidden size-11 rounded-full sm:block" />
        <Block className="hidden size-11 rounded-full sm:block" />
        <Block className="size-11 rounded-full" />
      </div>
    </div>
  );
}

// A post on its way, in the shape PostView opens in: the dimmed page, the dark stage on the
// left and the panel's lines on the right
export function PostSkeleton() {
  return (
    <div role="status" aria-label="Loading post" className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-10 lg:px-24">
      <div aria-hidden="true" className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div className="relative grid h-full max-h-[54rem] w-full max-w-[76rem] grid-cols-[minmax(0,1fr)] grid-rows-[62dvh_1fr] overflow-hidden rounded-[28px] bg-white shadow-2xl lg:grid-cols-[minmax(0,1fr)_27rem] lg:grid-rows-1">
        <div className="bg-black" />
        <div className="flex flex-col p-6">
          <div className="flex items-center gap-3.5">
            <Block className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Block className="h-4 w-24 rounded-full" />
              <Block className="h-3 w-32 rounded-full" />
            </div>
            <Block className="h-9 w-28 rounded-full" />
          </div>
          <Block className="mt-6 h-6 w-11/12 rounded-full" />
          <Block className="mt-2 h-6 w-2/3 rounded-full" />
          <Block className="mt-3 h-3.5 w-36 rounded-full" />
          <div className="mt-6 space-y-2.5">
            <Block className="h-3.5 w-full rounded-full" />
            <Block className="h-3.5 w-full rounded-full" />
            <Block className="h-3.5 w-4/5 rounded-full" />
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2">
            <Block className="h-17 rounded-2xl" />
            <Block className="h-17 rounded-2xl" />
            <Block className="h-17 rounded-2xl" />
          </div>
          <div className="mt-auto flex gap-2 pt-8">
            <Block className="h-12 flex-1 rounded-full" />
            <Block className="h-12 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
