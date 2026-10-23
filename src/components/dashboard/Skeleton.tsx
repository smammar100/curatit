import type { CSSProperties } from "react";
// Assets
import Symbol from "@/components/assets/Symbol";
import Skeleton from "@/components/fundations/elements/Skeleton";

// Loading skeletons for the dashboard: the shape of the header, the masonry and a post, in
// the page's own proportions, so nothing jumps when the real content arrives. Server-safe,
// so the route loading files and the grid's first render can both use them. Since 2026-10-23
// every piece is the system's Skeleton atom (the hover tint, pulsing, still under reduced
// motion), at the controls' compact 28px and the Card page's shape.

// One block, kept as a name for the pieces built from it: a rect Skeleton whose corner the
// caller sets (rounded-full for a pill or a line, the system's radii for anything else; the
// atom merges classes, so the caller's corner wins over its 4px default)
export function Block({ className, style }: { className?: string; style?: CSSProperties }) {
  return <Skeleton className={className} style={style} />;
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
        <div key={c} className={`flex-col gap-6 lg:gap-8 2xl:gap-10 ${visibility}`}>
          {Array.from({ length: PER_COLUMN }, (_, i) => (
            <Block key={i} className="w-full rounded-[12px]" style={{ aspectRatio: SHAPES[(i + c * 2) % SHAPES.length] }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// The header's shape: the mark, the two tabs, the search pill (the one piece still 52px tall)
// and the three 28px controls (Create, Saved, the account)
export function HeaderSkeleton() {
  return (
    <div aria-hidden="true" className="grid h-23 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,36rem)_1fr] lg:gap-8">
      <div className="flex items-center gap-6">
        <Symbol className="size-8 text-foreground" />
        <div className="hidden items-center gap-1 lg:flex">
          <Block className="h-7 w-16 rounded-full" />
          <Block className="h-7 w-18 rounded-full" />
        </div>
      </div>
      <Block className="h-13 w-full rounded-full" />
      <div className="flex items-center justify-end gap-2">
        <Block className="h-7 w-9 rounded-full md:w-20" />
        <Block className="size-7 rounded-full" />
        <Block className="size-7 rounded-full" />
      </div>
    </div>
  );
}

// A post on its way, in the shape PostView opens in (the "Card" page, 2026-10-23): the app bar,
// the post on its grey mat on the left and the ruled card's lines on the right
export function PostSkeleton() {
  return (
    <div role="status" aria-label="Loading post" className="fixed inset-0 z-40 overflow-hidden bg-page">
      <div aria-hidden="true" className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8">
        <div>
          <Block className="h-7 w-20 rounded-full" />
        </div>
        <Block className="h-6 w-24 rounded-full" />
        <div className="flex items-center justify-end gap-1.5">
          <Block className="size-7 rounded-full" />
          <Block className="size-7 rounded-full" />
          <Block className="size-7 rounded-full" />
        </div>
      </div>
      <div aria-hidden="true" className="mx-auto grid max-w-[96rem] grid-cols-1 gap-6 px-4 pt-2 sm:px-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-10 lg:pt-4">
        <div className="flex items-center justify-center rounded-[24px] bg-muted p-4 shadow-surface-1 sm:p-8 lg:h-[calc(100dvh-10rem)]">
          <Block className="aspect-4/5 h-full max-h-full w-full max-w-[min(100%,calc((100dvh-14rem)*0.8))] rounded-[12px]" />
        </div>
        <div className="divide-y divide-border rounded-[24px] bg-surface-3 shadow-surface-2">
          <div className="space-y-2.5 p-5">
            <Block className="h-6 w-11/12 rounded-full" />
            <Block className="h-6 w-2/3 rounded-full" />
            <div className="space-y-2 pt-1">
              <Block className="h-3.5 w-full rounded-full" />
              <Block className="h-3.5 w-4/5 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Block className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Block className="h-3.5 w-24 rounded-full" />
              <Block className="h-3 w-32 rounded-full" />
            </div>
            <Block className="h-7 w-20 rounded-full" />
          </div>
          <div className="flex gap-2 p-5">
            <Block className="h-7 flex-1 rounded-full" />
            <Block className="h-7 w-14 rounded-full" />
          </div>
          <div className="space-y-2.5 p-5">
            <Block className="h-3 w-16 rounded-full" />
            <div className="flex gap-1.5">
              <Block className="h-5 w-24 rounded-full" />
              <Block className="h-5 w-20 rounded-full" />
              <Block className="h-5 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
