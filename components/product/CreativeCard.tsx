import Link from "next/link";
import type { CreativeSummary } from "@/lib/services/creatives";
import { termName } from "@/lib/taxonomy";
import SlideArt from "./SlideArt";
import SaveButton from "./SaveButton";

/**
 * Carbon-style card: artwork on a base-50 panel, one quiet caption line.
 * Place inside a grid with the `group` class for Carbon's hover-dim effect.
 */
export default function CreativeCard({ creative, showWhy = true }: { creative: CreativeSummary; showWhy?: boolean }) {
  const href = `/creatives/${creative.id}`;

  return (
    <article className="peer relative duration-300 group-hover:opacity-30 hover:opacity-100 hover:peer-hover:opacity-30 focus-within:opacity-100">
      <div className="relative rounded-lg bg-base-50 p-8">
        <Link
          href={href}
          className="block overflow-hidden rounded shadow focus:outline-2 focus:outline-offset-2 focus:outline-accent-500"
        >
          <SlideArt art={creative.cover} alt={creative.coverAlt} />
        </Link>
        {creative.mediaType === "carousel" && (
          <span className="absolute right-10 top-10 rounded-full bg-base-950/70 px-2 py-0.5 text-[11px] font-medium text-white">
            1 / {creative.slideCount}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm text-base-600">
            <Link href={href} className="hover:text-base-900">
              <span className="text-base-900">{creative.brand.name}</span> — {creative.hook}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-base-500">
            {termName("category", creative.categoryId)} · {termName("objective", creative.objectiveId)}
          </p>
        </div>
        <SaveButton postId={creative.id} compact />
      </div>

      {showWhy && creative.whyMatched.length > 0 && (
        <p className="mt-1 text-xs text-base-500">
          <span className="font-medium text-base-700">Why it matched:</span> {creative.whyMatched.join(" · ")}
        </p>
      )}
    </article>
  );
}
