"use client";

// The carousel slide by slide, under the creative breakdown in PostView: the "Storyboard" rows
// from the 2026-10-11 prototype, kept beside the Spec sheet. One row per slide (thumbnail, number,
// role, one line of what's on it, and how many of the analysis's insights point at it); the row
// of the slide on the stage opens with its one observation and its approximate colours. A row
// shows its slide on the stage, and ← / → move the open row, so the two never disagree. Since
// 2026-10-23 the rows are set like the breakdown's cards (the Document direction): the one on
// stage on the muted tile with the ladder's hairline, the others taking the hover tint, the
// thumbnail a 10px tile with the one stroke inside its edge, the count an inverted Badge, the
// focus the one ring.
import Image from "next/image";
import Badge from "@/components/fundations/elements/Badge";
import type { PublicAnalysis, SlideDetail } from "@/lib/creative/publicView";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";

type Props = {
  analysis: PublicAnalysis;
  index: number;
  onSlide: (index: number) => void;
  images: string[];
  videos: boolean[];
};

// One line that says what's on a slide: its words if it has some, else its plainest facts
export function signal(slide: SlideDetail | null) {
  if (!slide) return "Not recorded";
  if (slide.blank) return "Blank frame";
  if (slide.headline) return `“${slide.headline}”`;
  const facts = slide.facts.filter((fact) => fact.label === "Imagery" || fact.label === "Layout").map((fact) => fact.value);
  return facts.join(" · ") || slide.observation || "";
}

// How many of the analysis's insights (what it does, why it might work) rest on this slide
export const citations = (analysis: PublicAnalysis, index: number) =>
  [...analysis.creativeDecisions, ...analysis.mechanisms, ...analysis.hypotheses].filter((insight) => insight.evidence.some((target) => target.kind === "slide" && target.index === index)).length;

export default function SlideBreakdown({ analysis, index, onSlide, images, videos }: Props) {
  return (
    <ol className="-mx-1.5 space-y-1">
      {analysis.slides.map((slide, i) => {
        const active = i === index;
        const role = analysis.sequence.roles[i] ?? slide?.role ?? `Slide ${i + 1}`;
        const cited = citations(analysis, i);
        return (
          <li key={i}>
            <button
              type="button"
              aria-pressed={active}
              aria-label={`Slide ${i + 1}: ${role}`}
              onClick={() => onSlide(i)}
              className={cx(
                "flex w-full items-center gap-3 rounded-[14px] p-1.5 pr-3 text-left transition-[background-color,box-shadow] duration-80 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
                active ? "bg-muted shadow-surface-1" : "hover:bg-hover",
              )}
            >
              <span className="relative aspect-4/5 w-10 shrink-0 overflow-hidden rounded-[10px] bg-muted outline-1 -outline-offset-1 outline-border">
                {images[i] && <Image src={images[i]} alt="" fill sizes="40px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-body text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
                  <span className="text-caption text-muted-foreground tabular-nums" style={{ fontVariationSettings: fontWeights.normal }}>
                    {i + 1}
                  </span>
                  <span className="truncate">{role}</span>
                  {videos[i] && (
                    <span className="shrink-0 text-micro text-muted-foreground" style={{ fontVariationSettings: fontWeights.normal }}>
                      Video cover
                    </span>
                  )}
                </span>
                <span className="block truncate text-caption text-muted-foreground" style={{ fontVariationSettings: fontWeights.normal }}>
                  {signal(slide)}
                </span>
              </span>
              {cited > 0 && (
                <Badge
                  variant="inverted"
                  aria-label={`${cited} insight${cited === 1 ? "" : "s"} point here`}
                  title={`${cited} insight${cited === 1 ? "" : "s"} point here`}
                  className="min-w-5 justify-center tabular-nums"
                >
                  {cited}
                </Badge>
              )}
            </button>
            {active && slide && !slide.blank && (slide.observation || slide.colours.length > 0) && (
              <div className="mb-2 ml-[3.25rem] pt-1 pr-3">
                {slide.observation && <p className="text-caption text-pretty text-muted-foreground">{slide.observation}</p>}
                {slide.colours.length > 0 && (
                  <div className="mt-2 flex gap-1" role="img" aria-label={`Approximate colours: ${slide.colours.join(", ")}`}>
                    {slide.colours.map((hex) => (
                      <span key={hex} title={hex} className="size-4 rounded-full outline-1 -outline-offset-1 outline-border" style={{ background: hex }} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
