// The post's public counts as they were when Curatit collected it, and nothing more: not a
// verdict on whether it worked. No ratio against the brand's average or rank in the category:
// a brand has about five posts here, of different ages and formats, too few for a fair
// benchmark. No date either: the scrape runs that carry it aren't readable by the public client.
import ChatCircle from "@/components/fundations/icons/ChatCircle";
import Heart from "@/components/fundations/icons/Heart";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

// A count, or "Not available" when there isn't one (a hidden like count isn't zero)
export const countLabel = (value: number | null | undefined) => (value == null || !Number.isFinite(value) || value < 0 ? "Not available" : compact.format(value));

export default function ObservedEngagement({ likes, comments }: { likes: number | null; comments: number | null }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {(
        [
          ["Likes", likes, Heart],
          ["Comments", comments, ChatCircle],
        ] as const
      ).map(([label, value, Glyph]) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-base-50 px-3.5 py-3">
          <dt className="flex min-w-0 items-center gap-1.5 text-caption text-base-500">
            <Glyph className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </dt>
          <dd className={value == null ? "text-body text-base-500" : "text-title font-medium text-base-900 tabular-nums"}>{countLabel(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
