import Link from "next/link";
import type { CreativeSummary } from "@/lib/services/creatives";
import { termName } from "@/lib/taxonomy";
import SlideArt from "./SlideArt";
import SaveButton from "./SaveButton";
import Tag from "./Tag";
import { formatDate } from "./format";

export default function CreativeCard({ creative, showWhy = true }: { creative: CreativeSummary; showWhy?: boolean }) {
  const href = `/creatives/${creative.id}`;

  return (
    <article className="group flex flex-col">
      <div className="relative p-4 bg-base-50 rounded-lg">
        <Link href={href} className="block rounded overflow-hidden shadow focus:outline-2 focus:outline-offset-2 focus:outline-accent-500">
          <SlideArt art={creative.cover} alt={creative.coverAlt} />
        </Link>
        {creative.mediaType === "carousel" && (
          <span className="absolute top-6 right-6 rounded-full bg-base-950/70 px-2 py-0.5 text-[11px] font-medium text-white">
            1 / {creative.slideCount}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-base-500 flex flex-wrap items-center gap-x-1.5">
            <span className="font-medium text-base-900">{creative.brand.name}</span>
            <span aria-hidden="true">·</span>
            <span>{termName("category", creative.categoryId)}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={creative.publishedAt ?? undefined}>{formatDate(creative.publishedAt)}</time>
          </p>
          <h3 className="mt-1 text-sm text-base-900 text-balance">
            <Link href={href} className="hover:text-accent-600">
              {creative.hook}
            </Link>
          </h3>
        </div>
        <SaveButton postId={creative.id} compact />
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <Tag>{termName("objective", creative.objectiveId)}</Tag>
        <Tag>{creative.mediaType === "carousel" ? "Carousel" : "Static"}</Tag>
        <Tag>{termName("format", creative.formatId)}</Tag>
        {creative.visualStyles.slice(0, 1).map((style) => (
          <Tag key={style}>{termName("visualStyle", style)}</Tag>
        ))}
      </div>

      {showWhy && creative.whyMatched.length > 0 && (
        <p className="mt-2 text-xs text-base-500">
          <span className="font-medium text-base-700">Why it matched:</span> {creative.whyMatched.join(" · ")}
        </p>
      )}
    </article>
  );
}
