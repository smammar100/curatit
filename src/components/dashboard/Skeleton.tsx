import type { CSSProperties } from "react";
// Assets
import Symbol from "@/components/assets/Symbol";
import { Skeleton } from "@/components/glaze/ui/skeleton";

// Loading skeletons for the dashboard: the shape of the header, the masonry and a post, in
// the page's own proportions, so nothing jumps when the real content arrives. Server-safe,
// so the route loading files and the grid's first render can both use them. Since 2026-10-24
// every piece is Glaze's Skeleton (the grey field, still: Glaze's one loop is the pending arc),
// at Glaze's control heights.

// One block, kept as a name for the pieces built from it: a Skeleton whose corner the caller sets
// (rounded-pill for a pill or a line, the panel corner for a tile; the tag corner otherwise). A
// size known only at runtime comes in through a custom property in `style`
export function Block({ className, style }: { className?: string; style?: CSSProperties }) {
  return <Skeleton className={className} style={style} />;
}

// Tile shapes per column, varied the way real posts are (4:5 portraits, a few squares and
// tall ones), offset per column so the columns don't line up
const SHAPES = [0.8, 1, 0.8, 0.75, 0.8, 1];
const PER_COLUMN = 5;

// The masonry's shape before its width is known. Column counts approximate what the medium
// tile size gives at each width (1 on a phone, up to 4 on a wide screen: from xl, Glaze's widest
// breakpoint).
export function GridSkeleton({ label = "Loading posts" }: { label?: string }) {
  const columns = ["flex", "hidden sm:flex", "hidden lg:flex", "hidden xl:flex"];
  return (
    <div role="status" aria-label={label} className="grid grid-cols-1 items-start gap-x-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4 xl:gap-x-10">
      {columns.map((visibility, c) => (
        <div key={c} className={`flex-col gap-6 lg:gap-8 xl:gap-10 ${visibility}`}>
          {Array.from({ length: PER_COLUMN }, (_, i) => (
            <Block key={i} className="aspect-(--ratio) w-full rounded-panel" style={{ "--ratio": SHAPES[(i + c * 2) % SHAPES.length] } as CSSProperties} />
          ))}
        </div>
      ))}
    </div>
  );
}

// The header's shape: the mark, the two views, the search pill (the one piece still 52px tall)
// and the three controls at Glaze's 32px (Create, Saved, the account)
export function HeaderSkeleton() {
  return (
    <div aria-hidden="true" className="grid h-23 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,2fr)_1fr] lg:gap-8">
      <div className="flex items-center gap-6">
        <Symbol className="size-8 text-text-1" />
        <Block className="hidden h-(--control) w-40 rounded-pill lg:block" />
      </div>
      <Block className="h-13 w-full max-w-xl justify-self-center rounded-pill" />
      <div className="flex items-center justify-end gap-2">
        <Block className="size-(--control) rounded-pill md:w-22" />
        <Block className="size-(--control) rounded-pill" />
        <Block className="size-(--control) rounded-pill" />
      </div>
    </div>
  );
}

// PostView's frame, the feed's: a 92px bar, 24px gutters from sm, the stage beside a 26rem card, the
// stage the window less the bar and its gaps, the 4:5 cover as tall as the stage allows
const POST_FRAME = {
  "--columns": "minmax(0, 1fr) 26rem",
  "--stage-h": "calc(100dvh - 7.25rem)",
  "--cover-max": "min(100%, calc((100dvh - 11.25rem) * 0.8))",
} as CSSProperties;

// A post on its way, in the shape PostView opens in (the "Card" page, 2026-10-23): the app bar,
// the post on its grey mat on the left and the card's lines on the right
export function PostSkeleton() {
  return (
    <div role="status" aria-label="Loading post" className="fixed inset-0 z-(--z-overlay) overflow-hidden bg-page">
      <div aria-hidden="true" className="grid h-23 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <div>
          <Block className="h-(--control-lg) w-28 rounded-pill" />
        </div>
        <Block className="h-6 w-24 rounded-pill" />
        <div className="flex items-center justify-end gap-1.5">
          <Block className="size-(--control-lg) rounded-pill" />
          <Block className="size-(--control-lg) rounded-pill" />
          <Block className="size-(--control-lg) rounded-pill" />
        </div>
      </div>
      <div aria-hidden="true" className="grid grid-cols-1 gap-6 px-4 pt-2 sm:px-6 lg:grid-cols-(--columns) lg:gap-10" style={POST_FRAME}>
        <div className="flex items-center justify-center rounded-(--radius-float) bg-shell p-4 sm:p-8 lg:h-(--stage-h)">
          <Block className="aspect-4/5 h-full max-h-full w-full max-w-(--cover-max) rounded-(--radius-nested)" />
        </div>
        <div className="divide-y divide-line-faint rounded-shell bg-surface-2 shadow-surface-2">
          <div className="space-y-2.5 p-5">
            <Block className="h-6 w-11/12 rounded-pill" />
            <Block className="h-6 w-2/3 rounded-pill" />
            <div className="space-y-2 pt-1">
              <Block className="h-3.5 w-full rounded-pill" />
              <Block className="h-3.5 w-4/5 rounded-pill" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Block className="size-8 rounded-pill" />
            <div className="flex-1 space-y-2">
              <Block className="h-3.5 w-24 rounded-pill" />
              <Block className="h-3 w-32 rounded-pill" />
            </div>
            <Block className="h-(--control) w-20 rounded-pill" />
          </div>
          <div className="flex gap-2 p-5">
            <Block className="h-(--control) flex-1 rounded-pill" />
            <Block className="h-(--control) w-14 rounded-pill" />
          </div>
          <div className="space-y-2.5 p-5">
            <Block className="h-3 w-16 rounded-pill" />
            <div className="flex gap-1.5">
              <Block className="h-5 w-24 rounded-tag" />
              <Block className="h-5 w-20 rounded-tag" />
              <Block className="h-5 w-28 rounded-tag" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
