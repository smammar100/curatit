// The post's public counts as they were when Curatit collected it, and nothing more: not a
// verdict on whether it worked. No ratio against the brand's average or rank in the category:
// a brand has about five posts here, of different ages and formats, too few for a fair
// benchmark. No date either: the scrape runs that carry it aren't readable by the public client.
// A third row names the brand's main category (2026-10-13, at the person's request), with its
// icon, so the list reads Likes, Comments, Category. Since 2026-10-24 it is Glaze's DataList (a
// label and its value per row; Glaze has no row of equal number cards): each label with its
// glyph in text-2, the value in text-1.
import type { ReactNode } from "react";
import { ChatCircle, Heart, Icon, SquaresFour } from "@/components/glaze/icon";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
import { CATEGORY_ICONS } from "../categoryIcons";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

// A count, or "Not available" when there isn't one (a hidden like count isn't zero)
export const countLabel = (value: number | null | undefined) => (value == null || !Number.isFinite(value) || value < 0 ? "Not available" : compact.format(value));

export default function ObservedEngagement({ likes, comments, category }: { likes: number | null; comments: number | null; category?: { name: string; slug: string } }) {
  const CategoryGlyph = category ? CATEGORY_ICONS[category.slug] : undefined;
  const row = (label: string, glyph: ReactNode, value: ReactNode, missing: boolean) => (
    <DataListItem key={label}>
      <DataListLabel className="flex items-center gap-1.5">
        {glyph}
        {label}
      </DataListLabel>
      {/* A missing count is said in words, in text-2, never as a number */}
      <DataListValue className={missing ? "type-body-sm text-text-2" : undefined}>{value}</DataListValue>
    </DataListItem>
  );
  return (
    <DataList>
      {row("Likes", <Icon icon={Heart} />, countLabel(likes), likes == null)}
      {row("Comments", <Icon icon={ChatCircle} />, countLabel(comments), comments == null)}
      {category && row("Category", CategoryGlyph ? <CategoryGlyph className="size-3.5 shrink-0" aria-hidden="true" /> : <Icon icon={SquaresFour} />, category.name, false)}
    </DataList>
  );
}
