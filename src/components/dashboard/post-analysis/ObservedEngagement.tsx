// The post's public counts as they were when Curatit collected it, and nothing more: not a
// verdict on whether it worked. No ratio against the brand's average or rank in the category:
// a brand has about five posts here, of different ages and formats, too few for a fair
// benchmark. No date either: the scrape runs that carry it aren't readable by the public client.
// A third card names the brand's main category (2026-10-13, at the person's request), with its
// icon, so the row reads Likes, Comments, Category. Since 2026-10-23 the cards are the
// breakdown's trait tiles (14px corners on the muted tint with the ladder's hairline), the
// label in the muted ink and the value in the ink, semibold.
import type { ReactNode } from "react";
import ChatCircle from "@/components/fundations/icons/ChatCircle";
import Heart from "@/components/fundations/icons/Heart";
import type { IconProps } from "@/components/fundations/icons/Icon";
import SquaresFour from "@/components/fundations/icons/SquaresFour";
import { fontWeights } from "@/lib/font-weight";
import { CATEGORY_ICONS } from "../categoryIcons";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

// A count, or "Not available" when there isn't one (a hidden like count isn't zero)
export const countLabel = (value: number | null | undefined) => (value == null || !Number.isFinite(value) || value < 0 ? "Not available" : compact.format(value));

export default function ObservedEngagement({ likes, comments, category }: { likes: number | null; comments: number | null; category?: { name: string; slug: string } }) {
  const card = (label: string, Glyph: (props: IconProps) => ReactNode, value: ReactNode, valueClass: string, strong: boolean) => (
    <div key={label} className="flex min-w-0 flex-col gap-0.5 rounded-[14px] bg-muted px-3 py-2.5 shadow-surface-1">
      <dt className="flex min-w-0 items-center gap-1.5 text-caption text-muted-foreground">
        <Glyph className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className={valueClass} style={{ fontVariationSettings: strong ? fontWeights.semibold : fontWeights.normal }}>
        {value}
      </dd>
    </div>
  );
  // A missing count is said in words, in the muted ink, never as a number
  const count = (value: number | null) => (value == null ? "text-body text-muted-foreground" : "text-title text-foreground tabular-nums");
  return (
    // The category's column is a little wider, so its longest name ("Travel & Transportation")
    // wraps between words onto two lines and never breaks inside one
    <dl className={category ? "grid grid-cols-[1fr_1fr_1.25fr] gap-2" : "grid grid-cols-2 gap-2"}>
      {card("Likes", Heart, countLabel(likes), count(likes), likes != null)}
      {card("Comments", ChatCircle, countLabel(comments), count(comments), comments != null)}
      {category && card("Category", CATEGORY_ICONS[category.slug] ?? SquaresFour, category.name, "text-subtitle text-balance text-foreground", true)}
    </dl>
  );
}
