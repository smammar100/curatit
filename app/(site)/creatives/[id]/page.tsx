import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import { ArrowUpRight } from "@/components/fundations/icons";
import Carousel from "@/components/product/Carousel";
import CommandSearch from "@/components/product/CommandSearch";
import CreativeCard from "@/components/product/CreativeCard";
import SaveButton from "@/components/product/SaveButton";
import Tag from "@/components/product/Tag";
import { formatDate } from "@/components/product/format";
import { requireViewer } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getCreative, quickSearchIndex, relatedCreatives, type CreativeDetail } from "@/lib/services/creatives";
import { track } from "@/lib/services/events";
import { libraryHref } from "@/lib/search/params";
import { termName } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Reference", robots: { index: false } };

/** Carbon detail row: label left, value right, divided list. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt>
        <Text tag="h3" variant="textSM" className="font-medium text-base-900">
          {label}
        </Text>
      </dt>
      <dd className="max-w-xl text-right text-sm text-base-600">{children}</dd>
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

      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="max-w-xl text-balance">
              <p className="flex flex-wrap items-center gap-2 text-xs text-base-500">
                <Link href={libraryHref("", { brand: [creative.brand.id] })} className="font-medium text-base-900 hover:text-accent-600">
                  {creative.brand.name}
                </Link>
                <span aria-hidden="true">·</span>
                <Link href={libraryHref("", { category: [creative.categoryId as never] })} className="hover:text-base-900">
                  {termName("category", creative.categoryId)}
                </Link>
                {creative.brand.isDemo && <Tag tone="warning">Demo brand — fictional</Tag>}
              </p>
              <Text tag="h1" variant="displayMD" className="mt-3 font-display font-thin text-base-900">
                {creative.hook}
              </Text>
              <Text tag="p" variant="textSM" className="mt-4 text-base-600">
                {creative.summary}
              </Text>
            </div>
            <div className="flex items-start gap-2">
              <SaveButton postId={creative.id} />
              <Button
                isLink
                iconOnly
                size="base"
                variant="default"
                href={creative.sourceUrl}
                title="View the original post"
                aria-label="View the original post"
                icon={<ArrowUpRight className="size-4" />}
              />
            </div>
          </div>

          <div className="mt-12 rounded-lg bg-base-50 p-8">
            <div className="mx-auto max-w-md">
              <Carousel slides={creative.slides} label={`${creative.brand.name} ${creative.mediaType}`} />
            </div>
          </div>

          <dl className="mt-4 divide-y divide-base-100">
            <Row label="Objective">{termName("objective", creative.objectiveId)}</Row>
            <Row label="Format">
              {termName("format", creative.formatId)} ·{" "}
              {creative.mediaType === "carousel" ? `Carousel, ${creative.slideCount} slides` : "Static"}
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
                <span className="inline-flex flex-wrap justify-end gap-3">
                  {creative.dominantColors.map((color) => (
                    <span key={color} className="inline-flex items-center gap-1.5">
                      <span className="size-4 rounded ring-1 ring-base-200" style={{ backgroundColor: color }} aria-hidden="true" />
                      <span className="font-mono text-xs">{color}</span>
                    </span>
                  ))}
                </span>
              </Row>
            )}
            {creative.editorialReason && <Row label="Why it’s here">{creative.editorialReason}</Row>}
            {creative.caption && <Row label="Caption">&ldquo;{creative.caption}&rdquo;</Row>}
            <Row label="Posted">{formatDate(creative.publishedAt)}</Row>
            <Row label="Captured · last checked">
              {formatDate(creative.capturedAt)} · {formatDate(creative.lastCheckedAt)}
            </Row>
            <Row label="Market">{creative.market}</Row>
            <Row label="Analysis">
              {creative.analysis.humanReviewed ? "Reviewed by an editor" : "Not yet reviewed"} ·{" "}
              {creative.analysis.modelVersion} · taxonomy {creative.analysis.taxonomyVersion}
            </Row>
          </dl>

          <Text tag="p" variant="textSM" className="mt-4 text-base-600">
            Source: {creative.brand.name} on Instagram (
            <a href={creative.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-base-900">
              original post
            </a>
            ). Brand-feed post; paid distribution unknown. Engagement metrics aren&rsquo;t available. This is reference
            material, not a template — don&rsquo;t reproduce another brand&rsquo;s design.
          </Text>
        </Wrapper>
      </section>

      {related.length > 0 && (
        <section>
          <Wrapper variant="standard" className="pb-32 pt-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Text tag="h2" variant="displaySM" className="font-display font-thin text-base-900">
                Related references
              </Text>
              <Button isLink size="sm" variant="muted" href="/library">
                Back to the library
              </Button>
            </div>
            <div className="group mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <CreativeCard key={item.id} creative={item} />
              ))}
            </div>
          </Wrapper>
        </section>
      )}
    </>
  );
}
