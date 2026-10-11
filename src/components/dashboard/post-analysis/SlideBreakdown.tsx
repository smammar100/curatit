"use client";

// The carousel slide by slide, under the creative breakdown in PostView: the "Storyboard" rows
// from the 2026-10-11 prototype, kept beside the Spec sheet. One row per slide (thumbnail, number,
// role, one line of what's on it, and how many of the analysis's insights point at it); the row
// of the slide on the stage opens with its one observation and its approximate colours. A row
// shows its slide on the stage, and ← / → move the open row, so the two never disagree.
import Image from "next/image";
import type { PublicAnalysis, SlideDetail } from "@/lib/creative/publicView";
import { cx } from "@/lib/cx";

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
  [...analysis.decisions, ...analysis.hypotheses].filter((insight) => insight.evidence.some((target) => target.kind === "slide" && target.index === index)).length;

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
              className={cx("flex w-full items-center gap-3 rounded-xl p-1.5 pr-3 text-left transition-[background-color] duration-150", active ? "bg-base-100" : "hover:bg-base-50")}
            >
              <span className="relative aspect-4/5 w-10 shrink-0 overflow-hidden rounded-md bg-base-100 outline-1 -outline-offset-1 outline-edge">
                {images[i] && <Image src={images[i]} alt="" fill sizes="40px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-body font-medium text-base-900">
                  <span className="text-caption text-base-400 tabular-nums">{i + 1}</span>
                  <span className="truncate">{role}</span>
                  {videos[i] && <span className="shrink-0 text-micro font-normal text-base-500">Video cover</span>}
                </span>
                <span className="block truncate text-caption text-base-500">{signal(slide)}</span>
              </span>
              {cited > 0 && (
                <span
                  aria-label={`${cited} insight${cited === 1 ? "" : "s"} point here`}
                  title={`${cited} insight${cited === 1 ? "" : "s"} point here`}
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-base-900 text-micro text-white tabular-nums"
                >
                  {cited}
                </span>
              )}
            </button>
            {active && slide && !slide.blank && (slide.observation || slide.colours.length > 0) && (
              <div className="mb-2 ml-[3.25rem] pt-1 pr-3">
                {slide.observation && <p className="text-caption text-pretty text-base-600">{slide.observation}</p>}
                {slide.colours.length > 0 && (
                  <div className="mt-2 flex gap-1" role="img" aria-label={`Approximate colours: ${slide.colours.join(", ")}`}>
                    {slide.colours.map((hex) => (
                      <span key={hex} title={hex} className="size-4 rounded-full outline-1 -outline-offset-1 outline-edge" style={{ background: hex }} />
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
