import type { CreativeSummary } from "@/lib/services/creatives";
import { termName } from "@/lib/taxonomy";
import { Card } from "@/components/ui/card";
import { fontWeights } from "@/lib/font-weight";
import SlideArt from "./SlideArt";
import SaveButton from "./SaveButton";

/**
 * One library post, image first. Render inside a `CardGroup columns separated`
 * so one highlight glides across the grid as a frame around the art; the
 * artwork itself never moves. Save rides on the art and shows on hover or focus.
 */
export default function CreativeCard({
  creative,
  showWhy = true,
  index,
}: {
  creative: CreativeSummary;
  showWhy?: boolean;
  /** Injected by CardGroup. */
  index?: number;
}) {
  const category = termName("category", creative.categoryId);

  return (
    <Card
      href={`/creatives/${creative.id}`}
      label={`${creative.brand.name}: ${creative.hook}`}
      index={index}
      className="p-2 pb-2.5"
    >
      <div className="relative overflow-hidden rounded-[2px] shadow-surface-1">
        <SlideArt art={creative.cover} alt={creative.coverAlt} />
        {creative.mediaType === "carousel" && (
          <span className="absolute right-2 top-2 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[11px] tabular-nums text-white">
            1/{creative.slideCount}
          </span>
        )}
        <span className="absolute left-2 top-2 z-30">
          <SaveButton postId={creative.id} variant="overlay" />
        </span>
      </div>
      <div className="flex min-w-0 items-baseline justify-between gap-3 px-1 pt-2.5">
        <span className="truncate text-[13px] text-foreground sm:text-[14px]" style={{ fontVariationSettings: fontWeights.medium }}>
          {creative.brand.name}
        </span>
        <span className="hidden shrink-0 text-[12px] text-muted-foreground sm:inline">{category}</span>
      </div>
      {showWhy && creative.whyMatched.length > 0 && (
        <p className="line-clamp-2 px-1 pt-1 text-[12px] leading-4 text-muted-foreground">
          {creative.whyMatched.join(" · ")}
        </p>
      )}
    </Card>
  );
}
