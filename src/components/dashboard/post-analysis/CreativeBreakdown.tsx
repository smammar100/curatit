"use client";

// The post's creative breakdown, beside the image in PostView (Creative Intelligence 2.0): the
// "Spec sheet" direction, chosen from a four-way prototype on 2026-10-11 (after OpenSea's traits
// and Higgsfield's info rows, found on Mobbin). The post as short label/value tiles you read in
// seconds, its approximate colours, its sequence as a bar you can tap, and every list of sentences
// (why it might work, how to apply, adapting it, caveats) folded behind a count. The image is the
// hero and this is its annotation: one slide index in PostView drives the stage, ← / → and the
// bar, so they never disagree.
import { useEffect, useState } from "react";
import { recipeText, type PublicAnalysis } from "@/lib/creative/publicView";
import { cx } from "@/lib/cx";

type Props = {
  analysis: PublicAnalysis;
  index: number;
  onSlide: (index: number) => void;
  // One per image: the slide was a video on Instagram, and only its cover was analysed
  videos: boolean[];
  source: { brand: string; url: string };
};

const sectionValues = (analysis: PublicAnalysis, title: string, skip: string[] = []) =>
  (analysis.visual.find((section) => section.title === title)?.rows ?? []).map((row) => row.value).filter((value) => !skip.includes(value));

// Two-to-four-word facts about the whole post, only the ones it has
export function traits(analysis: PublicAnalysis) {
  const label = (name: string) => analysis.labels.find((l) => l.label === name)?.value ?? null;
  return [
    { label: "Archetype", value: label("Type") },
    { label: "Inferred goal", value: label("Inferred goal") },
    { label: "Hook", value: label("Hook") },
    { label: "Format", value: label("Format") },
    { label: "Typography", value: sectionValues(analysis, "Typography").join(" · ") || null },
    { label: "Imagery", value: sectionValues(analysis, "Imagery", ["People lead", "Product leads"]).join(" · ") || null },
    { label: "Layout", value: sectionValues(analysis, "Composition").slice(0, 2).join(" · ") || null },
    { label: "Devices", value: sectionValues(analysis, "Devices and texture").join(" · ") || null },
  ].filter((trait): trait is { label: string; value: string } => !!trait.value);
}

// The post's colours across its slides, first seen first, no repeats
export const palette = (analysis: PublicAnalysis, max = 6) => [...new Set(analysis.slides.flatMap((slide) => slide?.colours ?? []))].slice(0, max);

export default function CreativeBreakdown({ analysis, index, onSlide, videos, source }: Props) {
  const count = analysis.slides.length;
  const roles = analysis.slides.map((slide, i) => analysis.sequence.roles[i] ?? slide?.role ?? null);
  // The slides that break the pattern (the hook, the close) stand out in the bar
  const usual = mostCommon(roles);
  const colours = palette(analysis);

  return (
    <div>
      <p className="text-subtitle font-medium text-pretty text-base-900">{analysis.concept}</p>

      <dl className="mt-4 grid grid-cols-2 gap-1.5">
        {traits(analysis).map((trait) => (
          <div key={trait.label} className="min-w-0 rounded-xl bg-base-50 px-3 py-2.5">
            <dt className="text-micro text-base-500">{trait.label}</dt>
            <dd className="mt-0.5 line-clamp-2 text-body font-medium text-base-900" title={trait.value}>
              {trait.value}
            </dd>
          </div>
        ))}
        {colours.length > 0 && (
          <div className="col-span-2 rounded-xl bg-base-50 px-3 py-2.5">
            <dt className="text-micro text-base-500">Colours (approximate)</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {colours.map((hex) => (
                <span key={hex} role="img" title={hex} aria-label={hex} className="size-6 rounded-full outline-1 -outline-offset-1 outline-edge" style={{ background: hex }} />
              ))}
            </dd>
          </div>
        )}
      </dl>

      {count > 1 && (
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3 text-micro text-base-500">
            <p>Sequence</p>
            <p className="tabular-nums">
              {index + 1} / {count} · <span className="text-base-900">{roles[index] ?? "Slide"}</span>
              {videos[index] && " · video cover"}
            </p>
          </div>
          <div role="group" aria-label="Slides" className="mt-2 flex gap-1">
            {roles.map((role, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={i === index}
                aria-label={`Slide ${i + 1}${role ? `: ${role}` : ""}`}
                title={role ?? undefined}
                onClick={() => onSlide(i)}
                className="group relative h-6 min-w-0 flex-1 before:absolute before:inset-x-0 before:-inset-y-2.5"
              >
                <span
                  className={cx(
                    "block h-1.5 w-full rounded-full transition-[background-color] duration-150",
                    i === index ? "bg-base-900" : role !== usual ? "bg-base-400 group-hover:bg-base-500" : "bg-base-200 group-hover:bg-base-300",
                  )}
                />
              </button>
            ))}
          </div>
          {analysis.sequence.formula && <p className="mt-1 text-caption text-pretty text-base-600">{analysis.sequence.formula}</p>}
        </div>
      )}

      <div className="mt-5 divide-y divide-base-100 border-y border-base-100">
        <Fold title="Why it might work" items={analysis.hypotheses.map((h) => h.text)} />
        <Fold title="How to apply" items={analysis.takeaways} numbered />
        <Fold title="Adapt it elsewhere" items={analysis.adaptations} />
        <Fold title="Caveats" items={analysis.caveats} />
      </div>

      <CopyRecipe analysis={analysis} source={source} />
      <p className="mt-5 text-micro text-pretty text-base-400">
        AI-written from every slide, checked by Curatit&apos;s editors.{!analysis.complete && " Some slides have no record, so this may be incomplete."}
      </p>
    </div>
  );
}

// The role most slides share, or null when none is shared by more than one
function mostCommon(roles: (string | null)[]) {
  const tally = new Map<string, number>();
  for (const role of roles) if (role) tally.set(role, (tally.get(role) ?? 0) + 1);
  const [role, n] = [...tally].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  return n > 1 ? role : null;
}

function Fold({ title, items, numbered }: { title: string; items: string[]; numbered?: boolean }) {
  if (!items.length) return null;
  return (
    <details className="group">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-between text-body font-medium text-base-900 [&::-webkit-details-marker]:hidden">
        {title}
        <span className="flex items-center gap-2 text-caption text-base-500 tabular-nums">
          {items.length}
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <ol className="space-y-2 pb-4 text-body text-pretty text-base-700">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="w-3 shrink-0 text-base-400 tabular-nums">{numbered ? i + 1 : "–"}</span>
            {item}
          </li>
        ))}
      </ol>
    </details>
  );
}

// Puts the recipe on the clipboard (the concept, technique, steps, ideas, caveats and a credit to
// the post), and says so
function CopyRecipe({ analysis, source }: { analysis: PublicAnalysis; source: { brand: string; url: string } }) {
  const [state, setState] = useState<"done" | "failed" | null>(null);
  useEffect(() => {
    if (state !== "done") return;
    const timer = setTimeout(() => setState(null), 1800);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <div className="mt-5 flex items-center gap-3">
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(recipeText(analysis, source)).then(() => setState("done"), () => setState("failed"))}
        className="flex h-11 items-center rounded-full bg-base-900 px-5 text-body font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96]"
      >
        {state === "done" ? "Copied" : "Copy recipe"}
      </button>
      <p role="status" className="text-caption text-base-500">
        {state === "done" ? "With a credit to the original post." : state === "failed" ? "Couldn't copy here. Select the text instead." : ""}
      </p>
    </div>
  );
}
