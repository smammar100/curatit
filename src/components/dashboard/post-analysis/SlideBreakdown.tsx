"use client";

// The carousel slide by slide, under the creative breakdown in PostView: the "Storyboard" rows
// from the 2026-10-11 prototype, kept beside the Spec sheet. One row per slide (thumbnail, number,
// role, one line of what's on it, and how many of the analysis's insights point at it); the row
// of the slide on the stage opens with its one observation and its approximate colours. A row
// shows its slide on the stage, and ← / → move the open row, so the two never disagree.
// Since 2026-10-24 each row is Glaze's Item, pressed as a whole (it renders as Base UI's button,
// the one Glaze's Button is built on, since a row of two lines is no one-line Button): the row on
// stage, its details included, sits on one pressed wash (the list item carries it, so the row and
// the details under it never read as two greys), the thumbnail is its image media at the post's
// 4:5, the count a Badge.
import Image from "next/image";
import type { CSSProperties } from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Badge } from "@/components/glaze/ui/badge";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/glaze/ui/item";
import type { PublicAnalysis, SlideDetail } from "@/lib/creative/publicView";

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
    <ol className="-mx-3 mt-2">
      {analysis.slides.map((slide, i) => {
        const active = i === index;
        const role = analysis.sequence.roles[i] ?? slide?.role ?? `Slide ${i + 1}`;
        const cited = citations(analysis, i);
        return (
          <li key={i} className={`overflow-clip rounded-(--corner-xs) transition-[background-color] duration-(--dur-state) ease-out ${active ? "bg-pressed" : "hover:bg-hover-row"}`}>
            <Item render={<ButtonPrimitive />} aria-pressed={active} aria-label={`Slide ${i + 1}: ${role}`} onClick={() => onSlide(i)} className="focus-visible:focus-ring-inset">
              <ItemMedia variant="image" className="h-10 w-8">
                {images[i] && <Image src={images[i]} alt="" width={32} height={40} sizes="32px" />}
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  <span className="data shrink-0 type-caption text-text-2">{i + 1}</span>
                  <span className="min-w-0 truncate">{role}</span>
                  {videos[i] &&<span className="shrink-0 type-caption text-text-2">Video cover</span>}
                </ItemTitle>
                <ItemDescription className="line-clamp-1">{signal(slide)}</ItemDescription>
              </ItemContent>
              {cited > 0 && <Badge count={cited} aria-label={`${cited} insight${cited === 1 ? "" : "s"} point here`} title={`${cited} insight${cited === 1 ? "" : "s"} point here`} />}
            </Item>
            {active && slide && !slide.blank && (slide.observation || slide.colours.length > 0) && (
              <div className="ps-14 pe-3 pb-2">
                {slide.observation && <p className="type-caption text-pretty text-text-2">{slide.observation}</p>}
                {slide.colours.length > 0 && (
                  <div className="mt-2 flex gap-1" role="img" aria-label={`Approximate colours: ${slide.colours.join(", ")}`}>
                    {slide.colours.map((hex) => (
                      <span key={hex} title={hex} className="size-4 rounded-pill border border-line-faint bg-(--swatch)" style={{ "--swatch": hex } as CSSProperties} />
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
