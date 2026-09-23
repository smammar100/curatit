import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
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
    <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4 py-2.5 sm:grid-cols-[10rem_1fr]">
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
      <Wrapper variant="standard" className="pb-12">
        <div className="flex items-center justify-between gap-4 pb-4 pt-20 sm:pt-24">
          <Button asChild variant="ghost" size="compact" className="-ml-2">
            <Link href="/library">
              <span className="inline-flex items-center gap-1">
                <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
                Library
              </span>
            </Link>
          </Button>
          <CommandSearch items={quickSearchIndex()} variant="button" />
        </div>

        <article className="grid overflow-hidden rounded-2xl bg-card shadow-surface-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex items-start justify-center bg-muted/60 p-6 sm:p-10">
            <div className="w-full max-w-[26rem] lg:sticky lg:top-24">
              <Carousel slides={creative.slides} label={`${creative.brand.name} ${creative.mediaType}`} />
            </div>
          </div>

          <div className="min-w-0 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Link
                href={libraryHref("", { brand: [creative.brand.id] })}
                className="group/brand flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-serif text-[16px] text-foreground"
                >
                  {creative.brand.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[14px] text-foreground underline decoration-transparent underline-offset-[3px] transition-colors duration-80 group-hover/brand:decoration-foreground"
                    style={{ fontVariationSettings: fontWeights.medium }}
                  >
                    {creative.brand.name}
                  </span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {termName("category", creative.categoryId)} · {formatDate(creative.publishedAt)}
                  </span>
                </span>
              </Link>
              <div className="ml-auto flex shrink-0 items-center gap-2">
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
                <SaveButton postId={creative.id} />
              </div>
            </div>

            <h1 className="heading-display mt-8 text-balance break-words text-foreground">{creative.hook}</h1>
            <p className="mt-3 text-pretty text-[15px] leading-6 text-muted-foreground">{creative.summary}</p>
            {creative.brand.isDemo && (
              <div className="mt-4">
                <Tag tone="warning">Demo brand, fictional</Tag>
              </div>
            )}

            {creative.editorialReason && (
              <div className="mt-6 rounded-xl bg-muted/70 p-4">
                <h2 className="text-[12px] text-muted-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                  Why it&rsquo;s here
                </h2>
                <p className="mt-1 text-pretty text-[15px] leading-6 text-foreground">{creative.editorialReason}</p>
              </div>
            )}

            <dl className="mt-6 divide-y divide-border/60">
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

            <p className="mt-6 text-[12px] leading-5 text-muted-foreground">
              Source: {creative.brand.name} on Instagram (
              <a href={creative.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className={proseLink}>
                original post
              </a>
              ). Brand-feed post; paid distribution unknown. Engagement metrics aren&rsquo;t available. This is reference
              material, not a template: don&rsquo;t reproduce another brand&rsquo;s design.
            </p>
          </div>
        </article>
      </Wrapper>

      {related.length > 0 && (
        <section>
          <Wrapper variant="standard" className="pb-24 pt-10">
            <h2 className="heading-section text-foreground">More like this</h2>
            <div className="-mx-2 mt-4">
              {/* Fixed-column CardGroup; the grid template collapses on small screens. */}
              <CardGroup columns={4} separated className="gap-x-2 gap-y-3 max-lg:grid-cols-2!">
                {related.map((item) => (
                  <CreativeCard key={item.id} creative={item} showWhy={false} />
                ))}
              </CardGroup>
            </div>
          </Wrapper>
        </section>
      )}
    </>
  );
}
