// The post's public counts as they were when Curatit collected it, and nothing more: not a
// verdict on whether it worked. No ratio against the brand's average or rank in the category:
// a brand has about five posts here, of different ages and formats, too few for a fair
// benchmark. No date either: the scrape runs that carry it aren't readable by the public client.
// A third card names the brand's main category (2026-10-13, at the person's request), with its
// icon, so the row reads Likes, Comments, Category.
import type { ReactNode } from "react";
import ChatCircle from "@/components/fundations/icons/ChatCircle";
import Heart from "@/components/fundations/icons/Heart";
import type { IconProps } from "@/components/fundations/icons/Icon";
import SquaresFour from "@/components/fundations/icons/SquaresFour";
import { CATEGORY_ICONS } from "../categoryIcons";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

// A count, or "Not available" when there isn't one (a hidden like count isn't zero)
export const countLabel = (value: number | null | undefined) => (value == null || !Number.isFinite(value) || value < 0 ? "Not available" : compact.format(value));

export default function ObservedEngagement({ likes, comments, category }: { likes: number | null; comments: number | null; category?: { name: string; slug: string } }) {
  const card = (label: string, Glyph: (props: IconProps) => ReactNode, value: ReactNode, valueClass: string) => (
    <div key={label} className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-card px-3 py-3">
      <dt className="flex min-w-0 items-center gap-1.5 text-caption text-secondary-foreground">
        <Glyph className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  );
  const count = (value: number | null) => (value == null ? "text-body text-secondary-foreground" : "text-title font-medium text-primary-foreground tabular-nums");
  return (
    // The category's column is a little wider, so its longest name ("Travel & Transportation")
    // wraps between words onto two lines and never breaks inside one
    <dl className={category ? "grid grid-cols-[1fr_1fr_1.25fr] gap-2" : "grid grid-cols-2 gap-2"}>
      {card("Likes", Heart, countLabel(likes), count(likes))}
      {card("Comments", ChatCircle, countLabel(comments), count(comments))}
      {category && card("Category", CATEGORY_ICONS[category.slug] ?? SquaresFour, category.name, "text-subtitle font-medium text-balance text-primary-foreground")}
    </dl>
  );
}
