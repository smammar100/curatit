"use client";

// The post's creative breakdown, in the post's page (Creative Intelligence 3.0, set in the
// "Document" direction since 2026-10-23: chosen from a six-way prototype at the owner's request,
// after the Spec sheet read as text-heavy; the reading order is headline → traits → decisions →
// checks). Two views of its published analysis, visual first and short, each opening up only on
// request:
// - Breakdown: the strategy as a serif headline and a sentence or two, its traits as a list of
//   label and value, the key creative decisions as numbered rows (the first open on its
//   explanation; each opens to what was observed, its possible effect, the principle and what to
//   watch out for, and shows its slide on the stage), and the caveats. The data checks that followed
//   the decisions were taken off every post on 2026-10-24 at the owner's request; they stay in the
//   analysis and on the editors' review page.
// - Visual DNA: composition, typography, colour (a palette of the post's colours, each hex under its
//   block, copyable), imagery, visual devices, and branding & consistency, each a section with its
//   glyph, one insight and a few attributes; on a carousel, what stays the same and the sequence as
//   a bar. Since 2026-10-24, at the owner's request, no slide tags: where a statement rests is in
//   plain words where it matters, and a section's header is its title alone.
// Beside the tabs, Copy brief puts the reference-led visual adaptation prompt on the clipboard
// (2026-10-14; the Download .md button beside it was taken out on 2026-10-15). The tabs are
// Glaze's Tabs (Base UI), whose ← / → / Home / End are marked handled so PostView's slide arrows
// leave them be. The bar stays in view while the page scrolls, and switching tabs brings the new
// tab's start into view only when the page had scrolled past it. One slide index in PostView
// drives the stage, ← / →, the bar and every slide link, so they never disagree; a single image has
// no slide links at all (it's always on screen).
// Since 2026-10-24 it is built from Glaze: Tabs, the decisions, the data checks and the folds
// Collapsibles, the traits and the reasoning DataLists, the slide links Chips (pressed while their
// slide is on the stage), the swatches, the sequence bar and Copy brief Buttons. Glaze has no icon
// tiles or cards inside a card, so each section's glyph sits inline with its title and the
// decisions' numbers are plain figures.
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { Check, ChevronDown, Copy, FilmStrip, Icon, Palette, Picture, SealCheck, Show, Sparkle, SquaresFour, TextAa } from "@/components/glaze/icon";
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Collapsible, CollapsibleContent, CollapsibleGroup, CollapsibleTrigger } from "@/components/glaze/ui/collapsible";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/glaze/ui/tabs";
import {
  briefMarkdown,
  evidenceGroups,
  type BriefSource,
  type ColourView,
  type DecisionView,
  type EvidenceTarget,
  type PublicAnalysis,
  type VisualSection,
} from "@/lib/creative/publicView";
import { cn } from "@/lib/glaze/utils";

type Props = {
  analysis: PublicAnalysis;
  index: number;
  onSlide: (index: number) => void;
  // One per image: the slide was a video on Instagram, and only its cover was analysed
  videos: boolean[];
  source: BriefSource;
};

type View = "breakdown" | "visual";

// What every part below needs to point at slides
type Stage = { index: number; onSlide: (index: number) => void; carousel: boolean };

type Glyph = ComponentProps<typeof Icon>["icon"];

// The strategy in a few words each, only the parts the analysis has
export function traits(analysis: PublicAnalysis) {
  const label = (name: string) => analysis.labels.find((l) => l.label === name)?.value ?? null;
  return [
    { label: "Archetype", value: label("Type") },
    { label: "Inferred goal", value: label("Inferred goal") },
    { label: "Hook", value: label("Hook") },
    { label: "Format", value: label("Format") },
  ].filter((trait): trait is { label: string; value: string } => !!trait.value);
}

// The pane that scrolls the breakdown: the first ancestor that scrolls vertically
function scrollParent(element: HTMLElement) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
}

export default function CreativeBreakdown({ analysis, index, onSlide, videos, source }: Props) {
  const [view, setView] = useState<View>("breakdown");
  const top = useRef<HTMLDivElement>(null);
  const switched = useRef(false);
  const stage: Stage = { index, onSlide, carousel: analysis.slides.length > 1 };
  const views: { id: View; label: string }[] = [
    { id: "breakdown", label: "Breakdown" },
    ...(analysis.visual.length || stage.carousel ? [{ id: "visual" as const, label: "Visual DNA" }] : []),
  ];

  const choose = (next: View) => {
    if (next === view) return;
    switched.current = true;
    setView(next);
  };

  // After a switch the new tab starts in view: when the pane had scrolled past the top of the
  // tabs, it jumps back to it; when the tabs were in view, nothing moves
  useLayoutEffect(() => {
    if (!switched.current) return;
    switched.current = false;
    const marker = top.current;
    const pane = marker && scrollParent(marker);
    if (!marker || !pane) return;
    const offset = marker.getBoundingClientRect().top - pane.getBoundingClientRect().top;
    if (offset < 0) pane.scrollTop = Math.max(0, pane.scrollTop + offset);
  }, [view]);

  return (
    <div>
      <div ref={top} aria-hidden="true" />
      <Tabs value={view} onValueChange={(next) => choose(next as View)}>
        {/* Sticky over the card's own padding (px-4 in PostView), so content slides under it */}
        <div className="sticky top-0 z-(--z-sticky) -mx-4 flex flex-wrap items-center justify-between gap-2 bg-paper px-4 py-2">
          <TabsList aria-label="Creative breakdown" activateOnFocus>
            {views.map((v) => (
              <TabsTrigger key={v.id} value={v.id}>
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <CopyBrief analysis={analysis} source={source} />
        </div>

        {/* Each view renders only while it's shown, so a switch starts it afresh, as before */}
        <TabsContent value="breakdown">{view === "breakdown" && <Breakdown analysis={analysis} stage={stage} />}</TabsContent>
        {views.some((v) => v.id === "visual") && <TabsContent value="visual">{view === "visual" && <VisualDna analysis={analysis} stage={stage} videos={videos} />}</TabsContent>}
      </Tabs>

      <p className="mt-5 type-caption text-pretty text-text-2">
        AI-written from every slide, checked by Curatit&apos;s editors.{!analysis.complete && " Some slides have no record, so this may be incomplete."}
      </p>
    </div>
  );
}

// ---- Breakdown ----

function Breakdown({ analysis, stage }: { analysis: PublicAnalysis; stage: Stage }) {
  const decisions = analysis.creativeDecisions;
  // The first decision starts open on its explanation; opening one yourself shows its slide
  const [open, setOpen] = useState<number | null>(decisions.length ? 0 : null);
  const choose = (next: number | null) => {
    setOpen(next);
    const first = next == null ? null : decisions[next].evidence.find((target) => target.kind === "slide");
    if (stage.carousel && first?.kind === "slide") stage.onSlide(first.index);
  };

  return (
    <article className="text-pretty">
      <h2 className="type-title text-balance text-text-1">{analysis.headline}</h2>
      {analysis.summary && <p className="mt-2.5 type-body-sm text-pretty text-text-2">{analysis.summary}</p>}
      <Traits analysis={analysis} />

      {decisions.length > 0 ? (
        <section aria-labelledby="decisions-heading" className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <Subhead id="decisions-heading">Key creative decisions</Subhead>
            <span className="data type-caption text-text-2">{decisions.length}</span>
          </div>
          <CollapsibleGroup
            variant="plain"
            render={<ol />}
            value={open == null ? [] : [open]}
            onValueChange={(values) => choose(values.length ? (values[0] as number) : null)}
            className="mt-1"
          >
            {decisions.map((decision, i) => (
              <Decision key={i} n={i + 1} value={i} decision={decision} open={open === i} stage={stage} />
            ))}
          </CollapsibleGroup>
        </section>
      ) : (
        analysis.mechanisms.length > 0 && (
          <section className="mt-6">
            <Subhead>What it does</Subhead>
            <ul className="mt-1">
              {analysis.mechanisms.map((insight, i) => (
                <li key={i} className="rule-row py-2.5">
                  <p className="type-body-sm text-pretty text-text-1">{insight.text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 type-caption">
                    <span className="text-text-2">{insight.kind === "interpretation" ? "Interpretation" : "Observed"}</span>
                    <Evidence evidence={insight.evidence} stage={stage} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      )}

      {/* Data checks (integrity notes) were a section here until 2026-10-24, taken off every post at the
          owner's request. They're still in each analysis, and editors still see them when reviewing */}

      {((!decisions.length && analysis.hypotheses.length > 0) || analysis.caveats.length > 0) && (
        <CollapsibleGroup variant="plain" multiple className="mt-4 border-t border-line-faint">
          {!decisions.length && analysis.hypotheses.length > 0 && (
            <Collapsible value="hypotheses">
              <CollapsibleTrigger summary={analysis.hypotheses.length}>Why it might work</CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="space-y-3">
                  {analysis.hypotheses.map((hypothesis, i) => (
                    <li key={i}>
                      <p className="type-body-sm text-pretty text-text-2">{hypothesis.text}</p>
                      <div className="mt-1 type-caption">
                        <Evidence evidence={hypothesis.evidence} stage={stage} />
                      </div>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}
          {analysis.caveats.length > 0 && (
            <Collapsible value="caveats">
              <CollapsibleTrigger summary={analysis.caveats.length}>Caveats</CollapsibleTrigger>
              <CollapsibleContent>
                <ol className="space-y-2 type-body-sm text-pretty text-text-1">
                  {analysis.caveats.map((item, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="w-3 shrink-0 text-text-2">–</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CollapsibleGroup>
      )}
    </article>
  );
}

// The strategy's traits as label and value pairs
function Traits({ analysis }: { analysis: PublicAnalysis }) {
  const items = traits(analysis);
  if (!items.length) return null;
  return (
    <DataList className="mt-3">
      {items.map((trait) => (
        <DataListItem key={trait.label}>
          <DataListLabel>{trait.label}</DataListLabel>
          <DataListValue>{trait.value}</DataListValue>
        </DataListItem>
      ))}
    </DataList>
  );
}

// A decision as a row: its number, its title and where it shows (marked while the stage is on one
// of those slides); open, its explanation, and on request the reasoning: observed, possible effect,
// principle, watch out. Its content renders only while it's open, so a closed decision's reasoning
// isn't in the page
function Decision({ n, value, decision, open, stage }: { n: number; value: number; decision: DecisionView; open: boolean; stage: Stage }) {
  const [reasoning, setReasoning] = useState(false);
  const id = `decision-${n}`;
  const where = [stage.carousel ? slideList(decision.evidence) : null, decision.evidence.some((target) => target.kind === "caption") ? "Caption" : null].filter(Boolean).join(" · ");
  const here = stage.carousel && decision.evidence.some((target) => target.kind === "slide" && target.index === stage.index);
  return (
    <Collapsible value={value} render={<li />}>
      {/* The caret sits on the title's first line (12px on a 20px line), not centred on the title and
          its slides line together, where it fell under the number */}
      <CollapsibleTrigger className="items-start [&>[data-slot=collapsible-caret]]:mt-1">
        <span className="flex gap-2">
          <span className="data w-4 shrink-0 text-text-2">{n}</span>
          <span className="min-w-0">
            <span className="block text-balance">{decision.title}</span>
            {where && (
              <span className={cn("mt-0.5 flex items-center gap-1 type-caption", here ? "text-text-1" : "text-text-2")}>
                {here && <Icon icon={Show} size={12} />}
                <span className="data">{where}</span>
                {here && <span className="sr-only">, on screen</span>}
              </span>
            )}
          </span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent hiddenUntilFound={false}>
        {open && (
          <div className="ps-6">
            <p className="text-pretty">{decision.explanation}</p>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={reasoning}
              aria-controls={`${id}-reasoning`}
              onClick={() => setReasoning((value) => !value)}
              className="mt-1 -ms-2.5"
            >
              <span>{reasoning ? "Hide the reasoning" : "Show the reasoning"}</span>
              <Icon icon={ChevronDown} className={cn("text-text-2 transition-[rotate] duration-(--dur-state) ease-out", reasoning && "rotate-180")} />
            </Button>
            {reasoning && (
              <DataList id={`${id}-reasoning`} orientation="vertical" className="mt-1 border-t border-line-faint">
                {decision.observation && <Reason label="Observed">{decision.observation}</Reason>}
                <Reason label="Possible effect">{decision.effect}</Reason>
                <Reason label="Reusable principle" strong>
                  {decision.principle}
                </Reason>
                {decision.watchOut && <Reason label="Watch out">{decision.watchOut}</Reason>}
                {/* Where it shows is the line under the title; the slide tags that repeated it here
                    were taken out on 2026-10-24 at the owner's request */}
                {decision.confidence === "low" && (
                  <DataListItem>
                    <DataListLabel className="sr-only">Confidence</DataListLabel>
                    <DataListValue className="type-caption text-text-2">Low confidence</DataListValue>
                  </DataListItem>
                )}
              </DataList>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function Reason({ label, strong, children }: { label: string; strong?: boolean; children: ReactNode }) {
  return (
    <DataListItem>
      <DataListLabel className="type-caption">{label}</DataListLabel>
      <DataListValue className={cn("text-pretty", strong ? "type-label text-text-1" : "type-body-sm text-text-2")}>{children}</DataListValue>
    </DataListItem>
  );
}

// ---- Visual DNA ----

// A glyph per dimension, beside its title
const DNA_ICONS: Record<VisualSection["key"], Glyph> = {
  composition: SquaresFour,
  typography: TextAa,
  colour: Palette,
  imagery: Picture,
  devices: Sparkle,
  branding: SealCheck,
};

function VisualDna({ analysis, stage, videos }: { analysis: PublicAnalysis; stage: Stage; videos: boolean[] }) {
  return (
    <div>
      {analysis.visual.map((section) => (
        <DnaSection key={section.key} icon={DNA_ICONS[section.key]} title={section.title}>
          {/* Colour is the palette alone (2026-10-24, at the owner's request): no note, no chips */}
          {section.key === "colour" && analysis.colours.length > 0 ? (
            <ColourPalette colours={analysis.colours} />
          ) : (
            section.insight && <p className="mt-0.5 text-pretty text-text-2">{section.insight}</p>
          )}
          {section.key !== "colour" && section.chips.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {section.chips.map((chip) => (
                <li key={chip}>
                  <Badge>{chip}</Badge>
                </li>
              ))}
            </ul>
          )}
          {section.key === "branding" && analysis.consistency && <Consistency consistency={analysis.consistency} stage={stage} />}
        </DnaSection>
      ))}
      {stage.carousel && (
        <DnaSection icon={FilmStrip} title="Sequence">
          <Sequence analysis={analysis} stage={stage} videos={videos} />
          {analysis.sequence.arc && <p className="mt-2 text-pretty text-text-2">{analysis.sequence.arc}</p>}
        </DnaSection>
      )}
    </div>
  );
}

// One dimension: its glyph and title, then the rest, ruled from the next. The slides a dimension
// shows on were a tag beside the title until 2026-10-24, taken out at the owner's request
function DnaSection({ icon, title, children }: { icon: Glyph; title: string; children: ReactNode }) {
  return (
    <section className="rule-row py-3 first:pt-0">
      <h3 className="flex items-center gap-1.5 type-label text-text-1">
        <Icon icon={icon} className="text-text-2" />
        {title}
      </h3>
      {children}
    </section>
  );
}

// The post's colours as a palette: one strip of equal blocks, each hex under its block. Pressing a
// block copies its hex, and the hex under it says Copied for a moment
function ColourPalette({ colours }: { colours: ColourView[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = (hex: string) => navigator.clipboard?.writeText(hex).then(() => setCopied(hex), () => setCopied(null));
  return (
    <>
      <ul className="mt-2.5 flex h-12 overflow-hidden rounded-(--corner-xs) border border-line-faint" aria-label="Colours (measured from the image)">
        {colours.map((colour) => (
          <li key={colour.hex} className="min-w-0 flex-1">
            <ButtonPrimitive
              onClick={() => copy(colour.hex)}
              aria-label={`Copy ${colour.hex}${colour.role ? `, ${colour.role}` : ""}`}
              title={colour.role ?? undefined}
              className="block size-full cursor-pointer bg-(--swatch) focus-visible:focus-ring-inset"
              style={{ "--swatch": colour.hex } as CSSProperties}
            />
          </li>
        ))}
      </ul>
      <ul aria-hidden="true" className="mt-1.5 flex">
        {colours.map((colour) => (
          <li key={colour.hex} className="min-w-0 flex-1 truncate type-caption text-text-2">
            <span className="mono">{copied === colour.hex ? "Copied" : colour.hex}</span>
          </li>
        ))}
      </ul>
      <p role="status" className="sr-only">
        {copied ? `Copied ${copied}` : ""}
      </p>
    </>
  );
}

// What every slide shares, and what changes where
function Consistency({ consistency, stage }: { consistency: NonNullable<PublicAnalysis["consistency"]>; stage: Stage }) {
  return (
    <div className="mt-2.5 space-y-1.5 type-caption">
      {consistency.same.length > 0 && (
        <p>
          <span className="mr-2 text-text-2">Same on every slide</span>
          <span className="text-text-1">{consistency.same.join(", ")}</span>
        </p>
      )}
      {consistency.varies.map((change) => (
        <div key={change.label} className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-text-2">{change.label} changes on</span>
          <Evidence evidence={change.evidence} stage={stage} />
        </div>
      ))}
    </div>
  );
}

// The slides as a bar you press, the ones that break the pattern a shade darker, with what the
// current slide changes from the one before
function Sequence({ analysis, stage, videos }: { analysis: PublicAnalysis; stage: Stage; videos: boolean[] }) {
  const { index, onSlide } = stage;
  const roles = analysis.slides.map((slide, i) => analysis.sequence.roles[i] ?? slide?.role ?? null);
  const usual = mostCommon(roles);
  const changes = analysis.slides[index]?.changes ?? [];
  return (
    <div className="mt-1.5">
      <p className="data text-right type-caption text-text-2">
        {index + 1} / {roles.length} · <span className="text-text-1">{roles[index] ?? "Slide"}</span>
        {videos[index] && " · video cover"}
      </p>
      <div role="group" aria-label="Slides" className="mt-1 flex">
        {roles.map((role, i) => (
          <Button
            key={i}
            variant="ghost"
            size="sm"
            aria-pressed={i === index}
            aria-label={`Slide ${i + 1}${role ? `: ${role}` : ""}`}
            title={role ?? undefined}
            onClick={() => onSlide(i)}
            className="min-w-0 flex-1"
          >
            <span
              className={cn(
                "-mx-2 block h-1.5 w-full rounded-pill transition-colors duration-(--dur-state) ease-out",
                i === index ? "bg-ink" : role !== usual ? "bg-(--ink-45) group-hover/button:bg-(--ink-60)" : "bg-(--ink-15) group-hover/button:bg-(--ink-45)",
              )}
            />
          </Button>
        ))}
      </div>
      {analysis.sequence.formula && <p className="mt-1 type-caption text-pretty text-text-2">{analysis.sequence.formula}</p>}
      {changes.length > 0 && (
        <div className="mt-2 type-caption">
          <p className="text-text-2">Changes from slide {index}</p>
          <ul className="mt-0.5 text-text-1">
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </div>
      )}
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

// ---- Copy brief ----

// Resolve /lib links at the time of the click, so the copied brief has absolute image references
// without reading window during server rendering.
function CopyBrief({ analysis, source }: { analysis: PublicAnalysis; source: BriefSource }) {
  const [state, setState] = useState<"copied" | "failed" | null>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(briefMarkdown(analysis, source, window.location.origin));
      setState("copied");
    } catch {
      setState("failed");
    }
  };
  useEffect(() => {
    if (!state) return;
    const timer = setTimeout(() => setState(null), state === "copied" ? 1800 : 3200);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={copy} title="Copy a design brief matching this post’s visual treatment with replacement text, logos and imagery">
        <span>{state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy brief"}</span>
        <Icon icon={state === "copied" ? Check : Copy} />
      </Button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Design brief copied. Paste it into your AI tool." : state === "failed" ? "Couldn't copy the brief here." : ""}
      </span>
    </>
  );
}

// ---- Shared pieces ----

function Subhead({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="type-heading-sm text-text-1">
      {children}
    </h3>
  );
}

// Where a decision shows, in as few characters as reads clearly: "Slide 7", "Slides 1–2, 6"
function slideList(evidence: EvidenceTarget[]) {
  const parts = evidenceGroups(evidence)
    .filter((group) => group.target.kind === "slide")
    .map((group) => group.label.replace(/^Slides? /, ""));
  if (!parts.length) return null;
  return parts.length === 1 && !parts[0].includes("–") ? `Slide ${parts[0]}` : `Slides ${parts.join(", ")}`;
}

// The slides a statement rests on, the caption and the post's details, in plain words: "Slides 4–5 ·
// Caption". They were chips that showed the slide on the stage until 2026-10-24, when the owner
// asked for the tags to go. A single image is always on screen, so it names no slides
function Evidence({ evidence, stage }: { evidence: EvidenceTarget[]; stage: Stage }) {
  const groups = evidenceGroups(evidence).filter((group) => stage.carousel || group.target.kind !== "slide");
  if (!groups.length) return null;
  return <span className="text-text-2">{groups.map((group) => group.label).join(" · ")}</span>;
}
