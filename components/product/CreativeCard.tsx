import type { CreativeSummary } from "@/lib/services/creatives";
import { termName } from "@/lib/taxonomy";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import SlideArt from "./SlideArt";
import SaveButton from "./SaveButton";

/**
 * One library post on the FF Card. Render inside a `CardGroup columns separated`
 * so one highlight glides across the grid; the artwork itself never moves.
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
  const meta = `${termName("category", creative.categoryId)} · ${termName("objective", creative.objectiveId)}`;

  return (
    <Card href={`/creatives/${creative.id}`} label={`${creative.brand.name}: ${creative.hook}`} index={index}>
      <div className="relative overflow-hidden rounded-[2px] shadow-surface-1">
        <SlideArt art={creative.cover} alt={creative.coverAlt} />
        {creative.mediaType === "carousel" && (
          <span className="absolute right-2 top-2 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[11px] tabular-nums text-white">
            1/{creative.slideCount}
          </span>
        )}
      </div>
      <CardHeader>
        <CardTitle>{creative.brand.name}</CardTitle>
        <CardDescription>{creative.hook}</CardDescription>
        {showWhy && creative.whyMatched.length > 0 && (
          <p className="text-[12px] leading-4 text-muted-foreground">Why it matched: {creative.whyMatched.join(" · ")}</p>
        )}
      </CardHeader>
      <CardFooter className="justify-between gap-3">
        <span className="min-w-0 truncate text-[12px] text-muted-foreground">{meta}</span>
        <SaveButton postId={creative.id} compact />
      </CardFooter>
    </Card>
  );
}
