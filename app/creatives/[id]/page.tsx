import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import Carousel from "@/components/product/Carousel";
import CreativeCard from "@/components/product/CreativeCard";
import SaveButton from "@/components/product/SaveButton";
import Tag from "@/components/product/Tag";
import { formatDate } from "@/components/product/format";
import { requireViewer } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getCreative, relatedCreatives, type CreativeDetail } from "@/lib/services/creatives";
import { track } from "@/lib/services/events";
import { libraryHref } from "@/lib/search/params";
import { termName } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Reference", robots: { index: false } };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 py-3">
      <dt className="text-sm font-medium text-base-900">{label}</dt>
      <dd className="text-sm text-base-600">{children}</dd>
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
      <section>
        <Wrapper variant="standard" className="pt-28 pb-16 lg:pt-32">
          <nav aria-label="Breadcrumb" className="text-xs text-base-500">
            <Link href="/library" className="hover:text-base-900">
              Library
            </Link>{" "}
            /{" "}
            <Link href={libraryHref("", { category: [creative.categoryId as never] })} className="hover:text-base-900">
              {termName("category", creative.categoryId)}
            </Link>
          </nav>

          <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,28rem)_1fr]">
            <div className="p-6 bg-base-50 rounded-lg self-start">
              <Carousel slides={creative.slides} label={`${creative.brand.name} ${creative.mediaType}`} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={libraryHref("", { brand: [creative.brand.id] })}
                  className="text-sm font-medium text-base-900 hover:text-accent-600"
                >
                  {creative.brand.name}
                </Link>
                {creative.brand.isDemo && <Tag tone="warning">Demo brand — fictional</Tag>}
                <Tag>{creative.market}</Tag>
              </div>

              <Text tag="h1" variant="displayMD" className="mt-3 text-base-900 font-display font-light text-balance">
                {creative.hook}
              </Text>
              <p className="mt-4 text-base text-base-600">{creative.summary}</p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <SaveButton postId={creative.id} />
                <a
                  href={creative.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center h-10 px-5 rounded-lg text-sm font-medium bg-base-50 text-base-900 hover:bg-base-100"
                >
                  View original post ↗
                </a>
              </div>

              <dl className="mt-8 divide-y divide-base-100 border-t border-base-100">
                <Row label="Objective">{termName("objective", creative.objectiveId)}</Row>
                <Row label="Format">
                  {termName("format", creative.formatId)} · {creative.mediaType === "carousel" ? `Carousel, ${creative.slideCount} slides` : "Static"}
                </Row>
                <Row label="Visual style">
                  <span className="flex flex-wrap gap-1">
                    {creative.visualStyles.map((style) => (
                      <Tag key={style}>{termName("visualStyle", style)}</Tag>
                    ))}
                  </span>
                </Row>
                <Row label="Structure">{termName("narrative", creative.narrativeId)}</Row>
                {creative.narrativeSequence.length > 0 && (
                  <Row label="Carousel narrative">
                    <ol className="flex flex-wrap gap-x-2 gap-y-1">
                      {creative.narrativeSequence.map((step, index) => (
                        <li key={index}>
                          <span className="text-base-400">{index + 1}.</span> {step}
                          {index < creative.narrativeSequence.length - 1 && <span aria-hidden="true" className="text-base-300"> →</span>}
                        </li>
                      ))}
                    </ol>
                  </Row>
                )}
                {creative.composition && <Row label="Composition">{creative.composition}</Row>}
                <Row label="Text density">{termName("textDensity", creative.textDensity)}</Row>
                {creative.ctaType && <Row label="CTA">{termName("cta", creative.ctaType)}</Row>}
                {creative.dominantColors.length > 0 && (
                  <Row label="Colours">
                    <span className="flex items-center gap-2">
                      {creative.dominantColors.map((color) => (
                        <span key={color} className="inline-flex items-center gap-1.5">
                          <span className="size-4 rounded ring-1 ring-base-200" style={{ backgroundColor: color }} aria-hidden="true" />
                          <span className="font-mono text-xs">{color}</span>
                        </span>
                      ))}
                    </span>
                  </Row>
                )}
                {creative.editorialReason && <Row label="Why it's here">{creative.editorialReason}</Row>}
                {creative.caption && <Row label="Caption">“{creative.caption}”</Row>}
              </dl>

              <div className="mt-8 rounded-lg bg-base-50 p-4 text-xs text-base-600 space-y-1">
                <p>
                  <span className="font-medium text-base-900">Source:</span> {creative.brand.name} on Instagram ·{" "}
                  <a href={creative.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-base-900">
                    original post
                  </a>
                </p>
                <p>
                  Posted {formatDate(creative.publishedAt)} · Captured {formatDate(creative.capturedAt)} · Last checked{" "}
                  {formatDate(creative.lastCheckedAt)}
                </p>
                <p>
                  Brand-feed post; paid distribution unknown. Engagement metrics aren&rsquo;t available for this post.
                </p>
                <p>
                  Analysis {creative.analysis.humanReviewed ? "reviewed by an editor" : "not yet reviewed"} ·{" "}
                  {creative.analysis.modelVersion} / {creative.analysis.promptVersion} · taxonomy {creative.analysis.taxonomyVersion}
                </p>
                <p>This is reference material, not a template. Don&rsquo;t reproduce another brand&rsquo;s design.</p>
              </div>
            </div>
          </div>
        </Wrapper>
      </section>

      {related.length > 0 && (
        <section>
          <Wrapper variant="standard" className="pb-24">
            <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
              Related references
            </Text>
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
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
