"use client";

// The post's creative breakdown, beside the image in PostView (Creative Intelligence 3.0). Three
// views of its published analysis, visual first and short, each opening up only on request:
// - Breakdown: the strategy in a line and a sentence or two, its traits as chips, the key creative
//   decisions (the first open on its explanation; each opens to what was observed, its possible
//   effect, the principle and what to watch out for, and shows its slide on the stage), the data
//   checks summed up in one line, and the caveats.
// - Visual DNA: composition, typography, colour (the post's colours with their jobs, copyable),
//   imagery, visual devices, and branding & consistency, each one insight, a few attributes and
//   the slides that show them; on a carousel, what stays the same and the sequence as a bar.
// Beside the tabs, Copy brief puts the reference-led reconstruction prompt on the clipboard
// (2026-10-14; the Download .md button beside it was taken out on 2026-10-15). Both are the panel's own pieces: the tabs as they always were,
// the button the same as the Instagram link above it. The bar stays in view while the panel scrolls, and switching tabs brings the new tab's
// start into view. One slide index in PostView drives the stage, ← / →, the bar and every slide
// link, so they never disagree; a single image has no slide links at all (it's always on screen).
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import Eye from "@/components/fundations/icons/Eye";
import Question from "@/components/fundations/icons/Question";
import SealCheck from "@/components/fundations/icons/SealCheck";
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
} from "@/lib/creative/publicView";
import { cx } from "@/lib/cx";

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

// The panel that scrolls the breakdown: the first ancestor that scrolls vertically
function scrollParent(element: HTMLElement) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
}

export default function CreativeBreakdown({ analysis, index, onSlide, videos, source }: Props) {
  const [view, setView] = useState<View>("breakdown");
  const tabs = useRef<Partial<Record<View, HTMLButtonElement | null>>>({});
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

  // After a switch the new tab starts in view: when the panel had scrolled past the top of the
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

  // ← / → (Home, End) move between tabs, and are marked handled so the stage's arrows leave them be.
  // A key snaps the selection (data-keys on the row turns the tabs' fade off); a pointer brings it back
  const unkey = (event: { currentTarget: HTMLElement }) => {
    delete event.currentTarget.dataset.keys;
  };
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = views.findIndex((v) => v.id === view);
    const next =
      event.key === "ArrowRight" ? (at + 1) % views.length : event.key === "ArrowLeft" ? (at - 1 + views.length) % views.length : event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.dataset.keys = "";
    choose(views[next].id);
    tabs.current[views[next].id]?.focus();
  };

  return (
    <div>
      <div ref={top} aria-hidden="true" />
      {/* Sticky over the panel's own padding (px-6 in PostView), so content slides under it */}
      <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center justify-between gap-2 bg-white px-6 py-1.5">
        <div role="tablist" aria-label="Creative breakdown" onKeyDown={onTabKey} onPointerDown={unkey} onPointerMove={unkey} className="group/tabs -mx-1 flex min-w-0 scrollbar-hide gap-1 overflow-x-auto px-1 py-1">
          {views.map((v) => (
            <button
              key={v.id}
              ref={(element) => {
                tabs.current[v.id] = element;
              }}
              id={`breakdown-tab-${v.id}`}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              aria-controls="breakdown-panel"
              tabIndex={view === v.id ? 0 : -1}
              onClick={() => choose(v.id)}
              className="relative inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-body font-medium whitespace-nowrap text-base-600 transition-[background-color,color] duration-150 group-data-keys/tabs:transition-none before:absolute before:inset-x-0 before:-inset-y-1 hover:bg-base-50 hover:text-base-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus aria-selected:bg-base-900 aria-selected:text-white"
            >
              {v.label}
            </button>
          ))}
        </div>
        <CopyBrief analysis={analysis} source={source} />
      </div>

      <div id="breakdown-panel" role="tabpanel" aria-labelledby={`breakdown-tab-${view}`} className="mt-3">
        {view === "breakdown" && <Breakdown analysis={analysis} stage={stage} />}
        {view === "visual" && <VisualDna analysis={analysis} stage={stage} videos={videos} />}
      </div>

      <p className="mt-5 text-micro text-pretty text-base-400">
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
  const folds = (!decisions.length && analysis.hypotheses.length > 0) || analysis.caveats.length > 0;

  return (
    <div>
      <p className="text-subtitle font-medium text-balance text-base-900">{analysis.headline}</p>
      {analysis.summary && <p className="mt-1.5 text-body text-pretty text-base-600">{analysis.summary}</p>}
      <Chips analysis={analysis} />

      {decisions.length > 0 ? (
        <section aria-labelledby="decisions-heading" className="mt-6">
          <Subhead id="decisions-heading">Key creative decisions</Subhead>
          <ol className="mt-2 space-y-1">
            {decisions.map((decision, i) => (
              <DecisionCard key={i} n={i + 1} decision={decision} open={open === i} onToggle={() => toggle(i)} stage={stage} />
            ))}
          </ol>
        </section>
      ) : (
        analysis.mechanisms.length > 0 && (
          <>
            <Subhead>What it does</Subhead>
            <ul className="mt-2 space-y-3">
              {analysis.mechanisms.map((insight, i) => (
                <li key={i}>
                  <p className="text-body text-pretty text-base-800">{insight.text}</p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2.5 text-caption">
                    <span className="text-base-500">{insight.kind === "interpretation" ? "Interpretation" : "Observed"}</span>
                    <Evidence evidence={insight.evidence} stage={stage} />
                  </p>
                </li>
              ))}
            </ul>
          </>
        )
      )}

      {analysis.integrity.length > 0 && <DataChecks checks={analysis.integrity} stage={stage} />}

      {folds && (
        <div className="mt-5 divide-y divide-base-100 border-y border-base-100">
          {!decisions.length && (
            <Fold title="Why it might work" count={analysis.hypotheses.length}>
              <ul className="space-y-3 pb-4">
                {analysis.hypotheses.map((hypothesis, i) => (
                  <li key={i}>
                    <p className="text-body text-pretty text-base-700">{hypothesis.text}</p>
                    <p className="mt-1 text-caption">
                      <Evidence evidence={hypothesis.evidence} stage={stage} />
                    </p>
                  </li>
                ))}
              </ul>
            </Fold>
          )}
          <Fold title="Caveats" count={analysis.caveats.length}>
            <List items={analysis.caveats} className="mt-0 pb-4 text-base-600" />
          </Fold>
        </div>
      )}
    </div>
  );
}

function Chips({ analysis }: { analysis: PublicAnalysis }) {
  const items = traits(analysis);
  if (!items.length) return null;
  return (
    <dl className="mt-3 flex flex-wrap gap-1.5">
      {items.map((trait) => (
        <div key={trait.label} className="flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-full bg-base-50 px-2.5 text-caption">
          <dt className="shrink-0 text-base-500">{trait.label}</dt>
          <dd className="truncate font-medium text-base-900" title={trait.value}>
            {trait.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// A decision: its number, title and where it shows (marked while the stage is on one of those
// slides); open, its explanation, and on request the reasoning: observed, possible effect,
// principle, watch out
function DecisionCard({ n, decision, open, onToggle, stage }: { n: number; decision: DecisionView; open: boolean; onToggle: () => void; stage: Stage }) {
  const [reasoning, setReasoning] = useState(false);
  const id = `decision-${n}`;
  const where = [stage.carousel ? slideList(decision.evidence) : null, decision.evidence.some((target) => target.kind === "caption") ? "Caption" : null].filter(Boolean).join(" · ");
  const here = stage.carousel && decision.evidence.some((target) => target.kind === "slide" && target.index === stage.index);
  return (
    <li className={cx("rounded-xl transition-[background-color] duration-150", open ? "bg-base-50" : "hover:bg-base-50")}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left">
        <span className="mt-px w-5 shrink-0 text-caption text-base-400 tabular-nums">{String(n).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium text-pretty text-base-900">{decision.title}</span>
          {where && (
            <span className={cx("mt-0.5 flex items-center gap-1.5 text-caption tabular-nums", here ? "text-base-900" : "text-base-500")}>
              {here && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-base-900" />}
              {where}
              {here && <span className="sr-only">, on screen</span>}
            </span>
          )}
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div id={id} className="px-3 pb-3 pl-11">
          <p className="text-body text-pretty text-base-700">{decision.explanation}</p>
          <button
            type="button"
            aria-expanded={reasoning}
            aria-controls={`${id}-reasoning`}
            onClick={() => setReasoning((value) => !value)}
            className="relative mt-1.5 flex h-8 items-center gap-1 text-caption font-medium text-base-700 transition-[color] duration-150 before:absolute before:-inset-x-2 before:-inset-y-1.5 hover:text-base-900"
          >
            {reasoning ? "Hide the reasoning" : "Show the reasoning"}
            <Chevron open={reasoning} />
          </button>
          {reasoning && (
            <dl id={`${id}-reasoning`} className="mt-1 space-y-2.5">
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
                    {decision.confidence === "low" && <span className="ml-2.5 text-base-500">Low confidence</span>}
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
      <dt className="text-micro text-base-500">{label}</dt>
      <dd className={cx("mt-0.5 text-body text-pretty", strong ? "font-medium text-base-900" : "text-base-700")}>{children}</dd>
    </div>
  );
}

// The data checks summed up in a line; open, each with what kind of statement it is, in words and
// an icon, never by colour alone
const STATUS_ICON: Record<IntegrityStatus, typeof Eye> = { concern: WarningCircle, observed: Eye, cannot_verify: Question, verified: SealCheck };

function DataChecks({ checks, stage }: { checks: IntegrityView[]; stage: Stage }) {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="checks-heading" className="mt-6">
      <Subhead id="checks-heading">Data checks</Subhead>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="checks-list"
        onClick={() => setOpen((value) => !value)}
        className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl bg-base-50 px-3 py-2.5 text-left transition-[background-color] duration-150 hover:bg-base-100"
      >
        <span className="text-body text-pretty text-base-900">{integritySummary(checks)}</span>
        <span className="flex shrink-0 items-center gap-1.5 text-caption text-base-500">
          {open ? "Hide" : "Show"}
          <Chevron open={open} />
        </span>
      </button>
      {open && (
        <div id="checks-list">
          <ul className="mt-3 space-y-3">
            {checks.map((check, i) => {
              const Icon = STATUS_ICON[check.status];
              return (
                <li key={i} className="flex gap-2.5">
                  <Icon size="sm" aria-hidden="true" className={cx("mt-0.5 shrink-0", check.status === "concern" ? "text-base-900" : "text-base-400")} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-body">
                      <span className="font-medium text-base-900">{check.aspect}</span>
                      <span className={cx("text-caption", check.status === "concern" ? "font-medium text-base-900" : "text-base-500")}>{STATUS_LABEL[check.status]}</span>
                    </p>
                    <p className="mt-0.5 text-body text-pretty text-base-700">{check.note}</p>
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
          <p className="mt-3 text-micro text-pretty text-base-400">Read from the post itself. No figure here was checked against its sources.</p>
        </div>
      )}
    </section>
  );
}

// ---- Visual DNA ----

function VisualDna({ analysis, stage, videos }: { analysis: PublicAnalysis; stage: Stage; videos: boolean[] }) {
  return (
    <div>
      {analysis.visual.map((section) => (
        <section key={section.key} className="mt-6 first:mt-0">
          <Subhead>{section.title}</Subhead>
          {section.insight && <p className="mt-1.5 text-body text-pretty text-base-800">{section.insight}</p>}
          {section.key === "colour" && analysis.colours.length > 0 && <Swatches colours={analysis.colours} />}
          {section.chips.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {section.chips.map((chip) => (
                <li key={chip} className="rounded-full bg-base-50 px-2.5 py-1 text-caption text-base-800">
                  {chip}
                </li>
              ))}
            </ul>
          )}
          {section.key === "branding" && analysis.consistency && <Consistency consistency={analysis.consistency} stage={stage} />}
          {stage.carousel && section.key !== "branding" && section.evidence.length > 0 && (
            <p className="mt-1.5 text-caption">
              <span className="mr-2 text-base-500">Seen on</span>
              <Evidence evidence={section.evidence} stage={stage} />
            </p>
          )}
        </section>
      ))}
      {stage.carousel && (
        <section className="mt-6">
          <Subhead>Sequence</Subhead>
          <Sequence analysis={analysis} stage={stage} videos={videos} />
          {analysis.sequence.arc && <p className="mt-2 text-body text-pretty text-base-700">{analysis.sequence.arc}</p>}
        </section>
      )}
    </div>
  );
}

// The post's colours as tiles: the swatch, the job it does and its hex. Tapping one copies the hex
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
      <ul className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-1.5" aria-label="Colours (measured from the image)">
        {colours.map((colour) => (
          <li key={colour.hex} className="min-w-0">
            <button
              type="button"
              onClick={() => copy(colour.hex)}
              aria-label={`Copy ${colour.hex}${colour.role ? `, ${colour.role}` : ""}`}
              className="group flex w-full items-center gap-2.5 rounded-xl bg-base-50 p-1.5 pr-2.5 text-left transition-[background-color] duration-150 hover:bg-base-100"
            >
              <span aria-hidden="true" className="size-8 shrink-0 rounded-lg outline-1 -outline-offset-1 outline-edge" style={{ background: colour.hex }} />
              <span className="min-w-0 flex-1">
                {colour.role && (
                  <span className="block truncate text-caption text-base-900" title={colour.role}>
                    {colour.role}
                  </span>
                )}
                <span className="block font-mono text-micro text-base-500 uppercase">{colour.hex}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-base-400 transition-[color] duration-150 group-hover:text-base-700">
                {copied === colour.hex ? <Check size="xs" /> : <Copy size="xs" />}
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
          <span className="mr-2 text-base-500">Same on every slide</span>
          <span className="text-base-900">{consistency.same.join(", ")}</span>
        </p>
      )}
      {consistency.varies.map((change) => (
        <p key={change.label}>
          <span className="mr-2 text-base-500">{change.label} changes on</span>
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
    <div className="mt-2">
      <p className="text-right text-micro text-base-500 tabular-nums">
        {index + 1} / {roles.length} · <span className="text-base-900">{roles[index] ?? "Slide"}</span>
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
            className="group relative h-6 min-w-0 flex-1 before:absolute before:inset-x-0 before:-inset-y-2.5"
          >
            <span className={cx("block h-1.5 w-full rounded-full transition-[background-color] duration-150", i === index ? "bg-base-900" : role !== usual ? "bg-base-400 group-hover:bg-base-500" : "bg-base-200 group-hover:bg-base-300")} />
          </button>
        ))}
      </div>
      {analysis.sequence.formula && <p className="mt-1 text-caption text-pretty text-base-600">{analysis.sequence.formula}</p>}
      {changes.length > 0 && (
        <div className="mt-2 text-caption">
          <p className="text-base-500">Changes from slide {index}</p>
          <ul className="mt-0.5 text-base-800">
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
      <button
        type="button"
        onClick={copy}
        title="Copy a Markdown prompt to reconstruct this post from its reference images"
        className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-base-50 pr-3 pl-3.5 text-body font-medium whitespace-nowrap text-base-900 transition-[background-color,scale] duration-150 hover:bg-base-100 active:scale-[0.96]"
      >
        {state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy brief"}
        {state === "copied" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Replica brief copied. Paste it into your AI tool." : state === "failed" ? "Couldn't copy the brief here." : ""}
      </span>
    </>
  );
}

// ---- Shared pieces ----

function Subhead({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className="mt-6 text-caption font-medium text-base-500 first:mt-0">
      {children}
    </h3>
  );
}

function List({ items, numbered, className }: { items: string[]; numbered?: boolean; className?: string }) {
  return (
    <ol className={cx("mt-2 space-y-2 text-body text-pretty text-base-800", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="w-3 shrink-0 text-base-400 tabular-nums">{numbered ? i + 1 : "–"}</span>
          {item}
        </li>
      ))}
    </ol>
  );
}

function Fold({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  if (!count) return null;
  return (
    <details className="group">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-between text-body font-medium text-base-900 [&::-webkit-details-marker]:hidden">
        {title}
        <span className="flex items-center gap-2 text-caption font-normal text-base-500 tabular-nums">
          {count}
          <Chevron open={false} group />
        </span>
      </summary>
      {children}
    </details>
  );
}

function Chevron({ open, group }: { open: boolean; group?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cx("mt-0.5 size-3.5 shrink-0 text-base-400 transition-transform duration-200 ease-out motion-reduce:transition-none", open && "rotate-180", group && "group-open:rotate-180")}
    >
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
            className="relative font-medium text-base-700 underline decoration-base-300 underline-offset-2 transition-[color,text-decoration-color] duration-150 before:absolute before:-inset-x-1 before:-inset-y-2 hover:text-base-900 hover:decoration-base-500 aria-pressed:text-base-900 aria-pressed:decoration-base-900"
          >
            {group.label}
          </button>
        ) : (
          <span key={group.label} className="text-base-500">
            {group.label}
          </span>
        ),
      )}
    </span>
  );
}
