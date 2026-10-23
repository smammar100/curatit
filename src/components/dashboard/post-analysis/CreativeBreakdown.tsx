"use client";

// The post's creative breakdown, in the post's page (Creative Intelligence 3.0, set in the
// "Document" direction since 2026-10-23: chosen from a six-way prototype at the owner's request,
// after the Spec sheet read as text-heavy; the sections are cards, each thing the breakdown says
// has an icon or a number tile, and the reading order is headline → traits → decisions → checks).
// Two views of its published analysis, visual first and short, each opening up only on request:
// - Breakdown: the strategy as a serif headline and a sentence or two, its traits as tiles, the key
//   creative decisions as numbered cards (the first open on its explanation; each opens to what was
//   observed, its possible effect, the principle and what to watch out for, and shows its slide on
//   the stage), the data checks summed up in one callout, and the caveats.
// - Visual DNA: composition, typography, colour (the post's colours with their jobs, copyable),
//   imagery, visual devices, and branding & consistency, each a card with its icon, one insight, a
//   few attributes and the slides that show them; on a carousel, what stays the same and the
//   sequence as a bar.
// Beside the tabs, Copy brief puts the reference-led visual adaptation prompt on the clipboard
// (2026-10-14; the Download .md button beside it was taken out on 2026-10-15). The tabs are the
// shared Tabs, whose ← / → / Home / End are marked handled so PostView's slide arrows leave them be.
// The bar stays in view while the page scrolls, and switching tabs brings the new tab's start
// into view only when the page had scrolled past it. One slide index in PostView drives the
// stage, ← / →, the bar and every slide link, so they never disagree; a single image has no slide
// links at all (it's always on screen).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import Tabs, { Tab, TabList, TabPanel } from "@/components/fundations/molecules/Tabs";
import CaretDown from "@/components/fundations/icons/CaretDown";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import Eye from "@/components/fundations/icons/Eye";
import FilmStrip from "@/components/fundations/icons/FilmStrip";
import type { IconProps } from "@/components/fundations/icons/Icon";
import Info from "@/components/fundations/icons/Info";
import Palette from "@/components/fundations/icons/Palette";
import Picture from "@/components/fundations/icons/Picture";
import Question from "@/components/fundations/icons/Question";
import SealCheck from "@/components/fundations/icons/SealCheck";
import Sparkle from "@/components/fundations/icons/Sparkle";
import SquaresFour from "@/components/fundations/icons/SquaresFour";
import TextAa from "@/components/fundations/icons/TextAa";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import {
  briefMarkdown,
  evidenceGroups,
  integritySummary,
  STATUS_LABEL,
  type BriefSource,
  type ColourView,
  type DecisionView,
  type EvidenceTarget,
  type IntegrityStatus,
  type IntegrityView,
  type PublicAnalysis,
  type VisualSection,
} from "@/lib/creative/publicView";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";

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

const semibold = { fontVariationSettings: fontWeights.semibold };

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
      <Tabs value={view} onValueChange={choose}>
        {/* Sticky over the card's own padding (px-6 in PostView), so content slides under it */}
        <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center justify-between gap-2 bg-surface-3 px-6 py-2">
          <TabList aria-label="Creative breakdown" variant="pill">
            {views.map((v) => (
              <Tab key={v.id} value={v.id}>
                {v.label}
              </Tab>
            ))}
          </TabList>
          <CopyBrief analysis={analysis} source={source} />
        </div>

        {/* Each view renders only while it's shown, so a switch starts it afresh, as before */}
        <TabPanel value="breakdown" className="mt-2">
          {view === "breakdown" && <Breakdown analysis={analysis} stage={stage} />}
        </TabPanel>
        {views.some((v) => v.id === "visual") && (
          <TabPanel value="visual" className="mt-2">
            {view === "visual" && <VisualDna analysis={analysis} stage={stage} videos={videos} />}
          </TabPanel>
        )}
      </Tabs>

      <p className="mt-5 text-micro text-pretty text-muted-foreground">
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
  const toggle = (i: number) => {
    const next = open === i ? null : i;
    setOpen(next);
    const first = next == null ? null : decisions[next].evidence.find((target) => target.kind === "slide");
    if (stage.carousel && first?.kind === "slide") stage.onSlide(first.index);
  };

  return (
    <article className="text-pretty">
      <h2 className="font-display text-[22px] leading-7 text-balance text-foreground">{analysis.headline}</h2>
      {analysis.summary && <p className="mt-2.5 text-body text-pretty text-muted-foreground">{analysis.summary}</p>}
      <Traits analysis={analysis} />

      {decisions.length > 0 ? (
        <section aria-labelledby="decisions-heading" className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <Subhead id="decisions-heading">Key creative decisions</Subhead>
            <span className="text-caption text-muted-foreground tabular-nums">{decisions.length}</span>
          </div>
          <ol className="mt-2 space-y-2">
            {decisions.map((decision, i) => (
              <DecisionCard key={i} n={i + 1} decision={decision} open={open === i} onToggle={() => toggle(i)} stage={stage} />
            ))}
          </ol>
        </section>
      ) : (
        analysis.mechanisms.length > 0 && (
          <section className="mt-6">
            <Subhead>What it does</Subhead>
            <ul className="mt-2 space-y-2">
              {analysis.mechanisms.map((insight, i) => (
                <li key={i} className="rounded-[20px] bg-muted p-3.5 shadow-surface-1">
                  <p className="text-body text-pretty text-foreground">{insight.text}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 text-caption">
                    <span className="text-muted-foreground">{insight.kind === "interpretation" ? "Interpretation" : "Observed"}</span>
                    <Evidence evidence={insight.evidence} stage={stage} />
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )
      )}

      {analysis.integrity.length > 0 && <DataChecks checks={analysis.integrity} stage={stage} />}

      {!decisions.length && analysis.hypotheses.length > 0 && (
        <Fold title="Why it might work" count={analysis.hypotheses.length}>
          <ul className="space-y-3 pb-4">
            {analysis.hypotheses.map((hypothesis, i) => (
              <li key={i}>
                <p className="text-body text-pretty text-muted-foreground">{hypothesis.text}</p>
                <p className="mt-1 text-caption">
                  <Evidence evidence={hypothesis.evidence} stage={stage} />
                </p>
              </li>
            ))}
          </ul>
        </Fold>
      )}
      {analysis.caveats.length > 0 && (
        <Fold title="Caveats" count={analysis.caveats.length}>
          <ol className="space-y-2 pb-4 text-body text-pretty text-foreground">
            {analysis.caveats.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="w-3 shrink-0 text-muted-foreground">–</span>
                {item}
              </li>
            ))}
          </ol>
        </Fold>
      )}
    </article>
  );
}

// The strategy's traits as tiles, two across
function Traits({ analysis }: { analysis: PublicAnalysis }) {
  const items = traits(analysis);
  if (!items.length) return null;
  return (
    <dl className="mt-4 grid grid-cols-2 gap-1.5">
      {items.map((trait) => (
        <div key={trait.label} className="min-w-0 rounded-[14px] bg-muted px-3 py-2 shadow-surface-1">
          <dt className="text-micro text-muted-foreground">{trait.label}</dt>
          <dd className="mt-0.5 truncate text-body text-foreground" style={semibold} title={trait.value}>
            {trait.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// A decision as a card: its number in a tile, its title and where it shows (marked while the
// stage is on one of those slides); open, its explanation, and on request the reasoning:
// observed, possible effect, principle, watch out
function DecisionCard({ n, decision, open, onToggle, stage }: { n: number; decision: DecisionView; open: boolean; onToggle: () => void; stage: Stage }) {
  const [reasoning, setReasoning] = useState(false);
  const id = `decision-${n}`;
  const where = [stage.carousel ? slideList(decision.evidence) : null, decision.evidence.some((target) => target.kind === "caption") ? "Caption" : null].filter(Boolean).join(" · ");
  const here = stage.carousel && decision.evidence.some((target) => target.kind === "slide" && target.index === stage.index);
  return (
    <li className="rounded-[20px] bg-muted shadow-surface-1">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full items-start gap-3 rounded-[20px] p-3.5 text-left focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-3 text-caption text-foreground tabular-nums shadow-surface-1" style={semibold}>
          {String(n).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-subtitle text-balance text-foreground" style={semibold}>
            {decision.title}
          </span>
          {where && (
            <span className={cx("mt-0.5 flex items-center gap-1.5 text-caption tabular-nums", here ? "text-foreground" : "text-muted-foreground")}>
              {here && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-foreground" />}
              {where}
              {here && <span className="sr-only">, on screen</span>}
            </span>
          )}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div id={id} className="px-3.5 pb-3.5 pl-[3.875rem]">
          <p className="text-body text-pretty text-muted-foreground">{decision.explanation}</p>
          <button
            type="button"
            aria-expanded={reasoning}
            aria-controls={`${id}-reasoning`}
            onClick={() => setReasoning((value) => !value)}
            className="relative mt-1.5 flex h-7 items-center gap-1 text-caption text-muted-foreground transition-colors duration-150 ease-out-quint before:absolute before:-inset-x-2 before:-inset-y-1.5 hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
            style={semibold}
          >
            {reasoning ? "Hide the reasoning" : "Show the reasoning"}
            <Chevron open={reasoning} />
          </button>
          {reasoning && (
            <dl id={`${id}-reasoning`} className="mt-2 grid gap-2.5 border-t border-border pt-3">
              {decision.observation && <Field label="Observed">{decision.observation}</Field>}
              <Field label="Possible effect">{decision.effect}</Field>
              <Field label="Reusable principle" strong>
                {decision.principle}
              </Field>
              {decision.watchOut && <Field label="Watch out">{decision.watchOut}</Field>}
              {stage.carousel && (
                <div className="text-caption">
                  <dt className="sr-only">Evidence</dt>
                  <dd>
                    <Evidence evidence={decision.evidence} stage={stage} />
                    {decision.confidence === "low" && <span className="ml-2.5 text-muted-foreground">Low confidence</span>}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
    </li>
  );
}

function Field({ label, strong, children }: { label: string; strong?: boolean; children: ReactNode }) {
  return (
    <div>
      <dt className="text-micro text-muted-foreground">{label}</dt>
      <dd className={cx("mt-0.5 text-body text-pretty", strong ? "text-foreground" : "text-muted-foreground")} style={strong ? semibold : undefined}>
        {children}
      </dd>
    </div>
  );
}

// The data checks summed up in one callout; open, each with what kind of statement it is, in
// words and an icon, never by colour alone
const STATUS_ICON: Record<IntegrityStatus, (props: IconProps) => ReactNode> = { concern: WarningCircle, observed: Eye, cannot_verify: Question, verified: SealCheck };

function DataChecks({ checks, stage }: { checks: IntegrityView[]; stage: Stage }) {
  const [open, setOpen] = useState(false);
  return (
    <aside aria-labelledby="checks-heading" className="mt-4 rounded-[20px] bg-muted p-3.5 shadow-surface-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="checks-list"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-2.5 rounded-[12px] text-left focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-3 text-muted-foreground shadow-surface-1">
          <Info className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span id="checks-heading" className="block text-caption text-muted-foreground">
            Data checks
          </span>
          <span className="block text-body text-pretty text-foreground">{integritySummary(checks)}</span>
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div id="checks-list" className="mt-3 border-t border-border pt-3 pl-[2.625rem]">
          <ul className="space-y-2.5">
            {checks.map((check, i) => {
              const Icon = STATUS_ICON[check.status];
              return (
                <li key={i} className="flex gap-2">
                  <Icon aria-hidden="true" className={cx("mt-0.5 size-3.5 shrink-0", check.status === "concern" ? "text-foreground" : "text-muted-foreground")} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-body">
                      <span className="text-foreground" style={semibold}>
                        {check.aspect}
                      </span>
                      <span className={cx("text-caption", check.status === "concern" ? "text-foreground" : "text-muted-foreground")} style={check.status === "concern" ? semibold : undefined}>
                        {STATUS_LABEL[check.status]}
                      </span>
                    </p>
                    <p className="text-body text-pretty text-muted-foreground">{check.note}</p>
                    {stage.carousel && check.evidence.some((target) => target.kind === "slide") && (
                      <p className="mt-1 text-caption">
                        <Evidence evidence={check.evidence} stage={stage} />
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-micro text-pretty text-muted-foreground">Read from the post itself. No figure here was checked against its sources.</p>
        </div>
      )}
    </aside>
  );
}

// ---- Visual DNA ----

// An icon per dimension, on the card's tile
const DNA_ICONS: Record<VisualSection["key"], (props: IconProps) => ReactNode> = {
  composition: SquaresFour,
  typography: TextAa,
  colour: Palette,
  imagery: Picture,
  devices: Sparkle,
  branding: SealCheck,
};

function VisualDna({ analysis, stage, videos }: { analysis: PublicAnalysis; stage: Stage; videos: boolean[] }) {
  return (
    <div className="space-y-2">
      {analysis.visual.map((section) => (
        <DnaCard key={section.key} icon={DNA_ICONS[section.key]} title={section.title} evidence={stage.carousel && section.key !== "branding" ? section.evidence : []} stage={stage}>
          {section.insight && <p className="mt-0.5 text-body text-pretty text-muted-foreground">{section.insight}</p>}
          {section.key === "colour" && analysis.colours.length > 0 && <Swatches colours={analysis.colours} />}
          {section.chips.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {section.chips.map((chip) => (
                <li key={chip}>
                  <Badge variant="outline">{chip}</Badge>
                </li>
              ))}
            </ul>
          )}
          {section.key === "branding" && analysis.consistency && <Consistency consistency={analysis.consistency} stage={stage} />}
        </DnaCard>
      ))}
      {stage.carousel && (
        <DnaCard icon={FilmStrip} title="Sequence" evidence={[]} stage={stage}>
          <Sequence analysis={analysis} stage={stage} videos={videos} />
          {analysis.sequence.arc && <p className="mt-2 text-body text-pretty text-muted-foreground">{analysis.sequence.arc}</p>}
        </DnaCard>
      )}
    </div>
  );
}

// One dimension as a card: its icon in a tile, its title, the slides that show it, and the rest
function DnaCard({ icon: Icon, title, evidence, stage, children }: { icon: (props: IconProps) => ReactNode; title: string; evidence: EvidenceTarget[]; stage: Stage; children: ReactNode }) {
  return (
    <section className="flex gap-3 rounded-[20px] bg-muted p-3.5 shadow-surface-1">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-surface-3 text-muted-foreground shadow-surface-1">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-body text-foreground" style={semibold}>
            {title}
          </h3>
          {evidence.length > 0 && (
            <span className="shrink-0 text-caption">
              <span className="sr-only">Seen on </span>
              <Evidence evidence={evidence} stage={stage} />
            </span>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

// The post's colours as a row: the swatch, the job it does and its hex. Tapping one copies the hex
function Swatches({ colours }: { colours: ColourView[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = (hex: string) => navigator.clipboard?.writeText(hex).then(() => setCopied(hex), () => setCopied(null));
  return (
    <>
      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-2" aria-label="Colours (measured from the image)">
        {colours.map((colour) => (
          <li key={colour.hex} className="min-w-0">
            <button
              type="button"
              onClick={() => copy(colour.hex)}
              aria-label={`Copy ${colour.hex}${colour.role ? `, ${colour.role}` : ""}`}
              className="group flex items-center gap-2 rounded-full pr-1.5 text-left transition-colors duration-150 ease-out-quint hover:bg-hover focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
            >
              <span aria-hidden="true" className="size-7 shrink-0 rounded-full outline-1 -outline-offset-1 outline-border" style={{ background: colour.hex }} />
              <span className="min-w-0">
                {colour.role && (
                  <span className="block truncate text-caption text-foreground" title={colour.role}>
                    {colour.role}
                  </span>
                )}
                <span className="block font-mono text-micro text-muted-foreground uppercase">{colour.hex}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-muted-foreground opacity-0 transition-opacity duration-150 ease-out-quint group-hover:opacity-100 group-focus-visible:opacity-100">
                {copied === colour.hex ? <Check className="size-3" /> : <Copy className="size-3" />}
              </span>
            </button>
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
    <div className="mt-2.5 space-y-1.5 text-caption">
      {consistency.same.length > 0 && (
        <p>
          <span className="mr-2 text-muted-foreground">Same on every slide</span>
          <span className="text-foreground">{consistency.same.join(", ")}</span>
        </p>
      )}
      {consistency.varies.map((change) => (
        <p key={change.label}>
          <span className="mr-2 text-muted-foreground">{change.label} changes on</span>
          <Evidence evidence={change.evidence} stage={stage} />
        </p>
      ))}
    </div>
  );
}

// The slides as a bar you tap, the ones that break the pattern a shade darker, with what the
// current slide changes from the one before
function Sequence({ analysis, stage, videos }: { analysis: PublicAnalysis; stage: Stage; videos: boolean[] }) {
  const { index, onSlide } = stage;
  const roles = analysis.slides.map((slide, i) => analysis.sequence.roles[i] ?? slide?.role ?? null);
  const usual = mostCommon(roles);
  const changes = analysis.slides[index]?.changes ?? [];
  return (
    <div className="mt-1.5">
      <p className="text-right text-micro text-muted-foreground tabular-nums">
        {index + 1} / {roles.length} · <span className="text-foreground">{roles[index] ?? "Slide"}</span>
        {videos[index] && " · video cover"}
      </p>
      <div role="group" aria-label="Slides" className="mt-1.5 flex gap-1">
        {roles.map((role, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={i === index}
            aria-label={`Slide ${i + 1}${role ? `: ${role}` : ""}`}
            title={role ?? undefined}
            onClick={() => onSlide(i)}
            className="group relative h-6 min-w-0 flex-1 before:absolute before:inset-x-0 before:-inset-y-2.5 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
          >
            <span className={cx("block h-1.5 w-full rounded-full transition-colors duration-150 ease-out-quint", i === index ? "bg-foreground" : role !== usual ? "bg-muted-foreground/60 group-hover:bg-muted-foreground" : "bg-[var(--accent)] group-hover:bg-muted-foreground/60")} />
          </button>
        ))}
      </div>
      {analysis.sequence.formula && <p className="mt-1 text-caption text-pretty text-muted-foreground">{analysis.sequence.formula}</p>}
      {changes.length > 0 && (
        <div className="mt-2 text-caption">
          <p className="text-muted-foreground">Changes from slide {index}</p>
          <ul className="mt-0.5 text-foreground">
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
      <Button
        variant="muted"
        size="sm"
        onClick={copy}
        title="Copy a design brief matching this post’s visual treatment with replacement text, logos and imagery"
        rightIcon={state === "copied" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      >
        {state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy brief"}
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
    <h3 id={id} className="text-subtitle text-foreground" style={semibold}>
      {children}
    </h3>
  );
}

function Fold({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (!count) return null;
  return (
    <details className="group mt-4 border-t border-border">
      <summary className="flex h-10 cursor-pointer list-none items-center justify-between text-body text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] [&::-webkit-details-marker]:hidden" style={semibold}>
        {title}
        <span className="flex items-center gap-2 text-caption text-muted-foreground tabular-nums" style={{ fontVariationSettings: fontWeights.normal }}>
          {count}
          <Chevron open={false} group />
        </span>
      </summary>
      {children}
    </details>
  );
}

// Phosphor's caret, as in the dashboard header's menu trigger
function Chevron({ open, group }: { open: boolean; group?: boolean }) {
  return (
    <CaretDown
      className={cx("mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out-quint motion-reduce:transition-none", open && "rotate-180", group && "group-open:rotate-180")}
    />
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

// The slides a statement rests on, as links that show them on the stage ("Slide 1", "Slides 4–5");
// the caption and the post's details as plain words. A single image is always on screen, so it
// gets no slide links
function Evidence({ evidence, stage }: { evidence: EvidenceTarget[]; stage: Stage }) {
  const groups = evidenceGroups(evidence).filter((group) => stage.carousel || group.target.kind !== "slide");
  if (!groups.length) return null;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      {groups.map((group) =>
        group.target.kind === "slide" ? (
          <button
            key={group.label}
            type="button"
            aria-pressed={group.target.index === stage.index}
            onClick={() => group.target.kind === "slide" && stage.onSlide(group.target.index)}
            className="relative rounded-[4px] text-muted-foreground underline decoration-border underline-offset-2 transition-colors duration-150 ease-out-quint before:absolute before:-inset-x-1 before:-inset-y-2 hover:text-foreground hover:decoration-muted-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] aria-pressed:text-foreground aria-pressed:decoration-foreground"
            style={semibold}
          >
            {group.label}
          </button>
        ) : (
          <span key={group.label} className="text-muted-foreground">
            {group.label}
          </span>
        ),
      )}
    </span>
  );
}
