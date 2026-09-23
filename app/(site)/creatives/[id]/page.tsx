import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Button } from "@/components/ui/button";
import { CardGroup } from "@/components/ui/card";
import Carousel from "@/components/product/Carousel";
import CommandSearch from "@/components/product/CommandSearch";
import CreativeCard from "@/components/product/CreativeCard";
import SaveButton from "@/components/product/SaveButton";
import Tag from "@/components/product/Tag";
import { formatDate } from "@/components/product/format";
import { requireViewer } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { fontWeights } from "@/lib/font-weight";
import { getCreative, quickSearchIndex, relatedCreatives, type CreativeDetail } from "@/lib/services/creatives";
import { track } from "@/lib/services/events";
import { libraryHref } from "@/lib/search/params";
import { termName } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Reference", robots: { index: false } };

const proseLink =
  "text-foreground underline decoration-border underline-offset-[3px] transition-colors duration-80 hover:decoration-foreground";

/** One metadata row: label left, value right, split by hairlines. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] items-baseline gap-4 py-2.5 sm:grid-cols-[11rem_1fr]">
      <dt className="text-[13px] leading-5 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[13px] leading-5 text-foreground">{children}</dd>
    </div>
  );
}

export default async function CreativePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer(`/creatives/${id}`);

  let creative: CreativeDetail;
  try {
    creative = getCreative(id);
  } catch (error) {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  }
  track("creative_opened", { viewer, resourceId: creative.id });
  const related = relatedCreatives(creative);

  return (
    <>
      <CommandSearch items={quickSearchIndex()} />

      <Wrapper variant="standard" className="pb-12">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-8 pt-24 sm:pt-28">
          <div className="min-w-0 max-w-2xl">
            <p className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              <Link
                href={libraryHref("", { brand: [creative.brand.id] })}
                className="text-foreground underline decoration-transparent underline-offset-[3px] transition-colors duration-80 hover:decoration-foreground"
                style={{ fontVariationSettings: fontWeights.medium }}
              >
                {creative.brand.name}
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href={libraryHref("", { category: [creative.categoryId as never] })}
                className="underline decoration-transparent underline-offset-[3px] transition-colors duration-80 hover:text-foreground hover:decoration-foreground"
              >
                {termName("category", creative.categoryId)}
              </Link>
              {creative.brand.isDemo && <Tag tone="warning">Demo brand, fictional</Tag>}
            </p>
            <h1 className="heading-display text-balance break-words text-foreground">{creative.hook}</h1>
            <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{creative.summary}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SaveButton postId={creative.id} />
            <Button asChild size="icon" variant="tertiary">
              <a
                href={creative.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View the original post"
                aria-label="View the original post"
              >
                <ArrowUpRight />
              </a>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="w-full max-w-md lg:max-w-none">
            <Carousel slides={creative.slides} label={`${creative.brand.name} ${creative.mediaType}`} />
          </div>

          <div className="min-w-0">
            {creative.editorialReason && (
              <div className="mb-6">
                <h2 className="text-[13px] text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
                  Why it&rsquo;s here
                </h2>
                <p className="mt-1 text-[14px] leading-6 text-foreground">{creative.editorialReason}</p>
              </div>
            )}

            <dl className="divide-y divide-border border-y border-border">
              <Row label="Objective">{termName("objective", creative.objectiveId)}</Row>
              <Row label="Format">
                {termName("format", creative.formatId)} ·{" "}
                {creative.mediaType === "carousel" ? (
                  <span className="tabular-nums">Carousel, {creative.slideCount} slides</span>
                ) : (
                  "Static"
                )}
              </Row>
              <Row label="Visual style">
                {creative.visualStyles.map((style) => termName("visualStyle", style)).join(", ")}
              </Row>
              <Row label="Structure">{termName("narrative", creative.narrativeId)}</Row>
              {creative.narrativeSequence.length > 0 && (
                <Row label="Carousel narrative">{creative.narrativeSequence.join(" → ")}</Row>
              )}
              {creative.composition && <Row label="Composition">{creative.composition}</Row>}
              <Row label="Text density">{termName("textDensity", creative.textDensity)}</Row>
              {creative.ctaType && <Row label="CTA">{termName("cta", creative.ctaType)}</Row>}
              {creative.dominantColors.length > 0 && (
                <Row label="Colours">
                  <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
                    {creative.dominantColors.map((color) => (
                      <span key={color} className="inline-flex items-center gap-1.5">
                        <span
                          className="size-3.5 rounded-[4px] shadow-surface-1"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        <span className="font-mono text-[12px]">{color}</span>
                      </span>
                    ))}
                  </span>
                </Row>
              )}
              {creative.caption && <Row label="Caption">&ldquo;{creative.caption}&rdquo;</Row>}
              <Row label="Posted">
                <span className="tabular-nums">{formatDate(creative.publishedAt)}</span>
              </Row>
              <Row label="Captured · last checked">
                <span className="tabular-nums">
                  {formatDate(creative.capturedAt)} · {formatDate(creative.lastCheckedAt)}
                </span>
              </Row>
              <Row label="Market">{creative.market}</Row>
              <Row label="Analysis">
                {creative.analysis.humanReviewed ? "Reviewed by an editor" : "Not yet reviewed"} ·{" "}
                {creative.analysis.modelVersion} · taxonomy {creative.analysis.taxonomyVersion}
              </Row>
            </dl>

            <p className="mt-4 text-[12px] leading-5 text-muted-foreground">
              Source: {creative.brand.name} on Instagram (
              <a href={creative.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className={proseLink}>
                original post
              </a>
              ). Brand-feed post; paid distribution unknown. Engagement metrics aren&rsquo;t available. This is reference
              material, not a template: don&rsquo;t reproduce another brand&rsquo;s design.
            </p>
          </div>
        </div>
      </Wrapper>

      {related.length > 0 && (
        <section>
          <Wrapper variant="standard" className="pb-24 pt-12">
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-12">
              <h2 className="heading-section text-foreground">Related references</h2>
              <Button asChild variant="secondary" size="compact">
                <Link href="/library">Back to the library</Link>
              </Button>
            </div>
            <div className="mt-6">
              {/* Fixed-column CardGroup; the grid template collapses on small screens. */}
              <CardGroup columns={4} separated className="max-lg:grid-cols-2! max-sm:grid-cols-1!">
                {related.map((item) => (
                  <CreativeCard key={item.id} creative={item} />
                ))}
              </CardGroup>
            </div>
          </Wrapper>
        </section>
      )}
    </>
  );
}
