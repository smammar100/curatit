"use client";

// The post's creative breakdown, beside the image in PostView (Creative Intelligence 2.1). Three
// views of its published analysis, each kept short so the creative stays the hero:
// - Breakdown: the idea, the strategy in four tiles, the creative decisions (the specific choices
//   that make the post work, each opening to what was done, why it might work, the principle and
//   when to use it or not, and showing its slide on the stage), why it might work, and the
//   caveats, data checks first.
// - Visual DNA: how it's built (composition, type, colour, imagery, devices, branding,
//   consistency), each in a sentence with the slides that show it, and the sequence as a bar.
// - Apply: the formula, the steps, ideas for other categories, when it's useful, the pitfalls,
//   and a creative brief to copy.
// The "Spec sheet" tiles and folds came from the four-way prototype of 2026-10-11; the tabs and the
// decisions from the 2.1 brief. One slide index in PostView drives the stage, ← / →, the bar and
// every slide link, so they never disagree.
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { briefText, evidenceGroups, type BriefSource, type DecisionView, type EvidenceTarget, type PublicAnalysis } from "@/lib/creative/publicView";
import { cx } from "@/lib/cx";

type Props = {
  analysis: PublicAnalysis;
  index: number;
  onSlide: (index: number) => void;
  // One per image: the slide was a video on Instagram, and only its cover was analysed
  videos: boolean[];
  source: BriefSource;
};

type View = "breakdown" | "visual" | "apply";

const DECISIONS_SHOWN = 3;

// The strategy in four words or so each, only the parts the analysis has
export function traits(analysis: PublicAnalysis) {
  const label = (name: string) => analysis.labels.find((l) => l.label === name)?.value ?? null;
  return [
    { label: "Archetype", value: label("Type") },
    { label: "Inferred goal", value: label("Inferred goal") },
    { label: "Hook", value: label("Hook") },
    { label: "Format", value: label("Format") },
  ].filter((trait): trait is { label: string; value: string } => !!trait.value);
}

// The post's colours across its slides, first seen first, no repeats
export const palette = (analysis: PublicAnalysis, max = 6) => [...new Set(analysis.slides.flatMap((slide) => slide?.colours ?? []))].slice(0, max);

export default function CreativeBreakdown({ analysis, index, onSlide, videos, source }: Props) {
  const [view, setView] = useState<View>("breakdown");
  const tabs = useRef<Partial<Record<View, HTMLButtonElement | null>>>({});
  const carousel = analysis.slides.length > 1;
  const views: { id: View; label: string }[] = [
    { id: "breakdown", label: "Breakdown" },
    ...(analysis.visual.length || carousel ? [{ id: "visual" as const, label: "Visual DNA" }] : []),
    ...(analysis.takeaways.length || analysis.adaptations.length || analysis.creativeDecisions.length ? [{ id: "apply" as const, label: "Apply" }] : []),
  ];

  // ← / → (Home, End) move between tabs, and are marked handled so the stage's arrows leave them be
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = views.findIndex((v) => v.id === view);
    const next =
      event.key === "ArrowRight" ? (at + 1) % views.length : event.key === "ArrowLeft" ? (at - 1 + views.length) % views.length : event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    event.stopPropagation();
    setView(views[next].id);
    tabs.current[views[next].id]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Creative breakdown" onKeyDown={onTabKey} className="-mx-1 flex scrollbar-hide gap-1 overflow-x-auto px-1 py-1">
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
            onClick={() => setView(v.id)}
            className="relative inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-body font-medium whitespace-nowrap text-base-600 transition-[background-color,color] duration-150 before:absolute before:inset-x-0 before:-inset-y-1 hover:bg-base-50 hover:text-base-900 aria-selected:bg-base-900 aria-selected:text-white"
          >
            {v.label}
          </button>
        ))}
      </div>

      <div id="breakdown-panel" role="tabpanel" aria-labelledby={`breakdown-tab-${view}`} className="mt-4">
        {view === "breakdown" && <Breakdown analysis={analysis} index={index} onSlide={onSlide} />}
        {view === "visual" && <VisualDna analysis={analysis} index={index} onSlide={onSlide} videos={videos} />}
        {view === "apply" && <Apply analysis={analysis} source={source} />}
      </div>

      <p className="mt-5 text-micro text-pretty text-base-400">
        AI-written from every slide, checked by Curatit&apos;s editors.{!analysis.complete && " Some slides have no record, so this may be incomplete."}
      </p>
    </div>
  );
}

// ---- Breakdown ----

function Breakdown({ analysis, index, onSlide }: { analysis: PublicAnalysis; index: number; onSlide: (index: number) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const decisions = all ? analysis.creativeDecisions : analysis.creativeDecisions.slice(0, DECISIONS_SHOWN);
  const hidden = analysis.creativeDecisions.length - decisions.length;
  const checks = analysis.integrity;
  const flagged = checks.filter((check) => check.status !== "sound");

  const select = (i: number) => {
    const next = open === i ? null : i;
    setOpen(next);
    const first = next == null ? null : analysis.creativeDecisions[next].evidence.find((target) => target.kind === "slide");
    if (first?.kind === "slide") onSlide(first.index);
  };

  return (
    <div>
      <p className="text-subtitle font-medium text-pretty text-base-900">{analysis.concept}</p>
      <Tiles analysis={analysis} />

      {analysis.creativeDecisions.length > 0 ? (
        <>
          <Subhead>Creative decisions</Subhead>
          <ol className="mt-2 space-y-1.5">
            {decisions.map((decision, i) => (
              <DecisionCard key={i} n={i + 1} decision={decision} open={open === i} onToggle={() => select(i)} index={index} onSlide={onSlide} />
            ))}
          </ol>
          {hidden > 0 && (
            <button type="button" onClick={() => setAll(true)} className="mt-2 flex h-9 items-center text-body font-medium text-base-700 hover:text-base-900">
              {hidden === 1 ? "1 more decision" : `${hidden} more decisions`}
            </button>
          )}
        </>
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
                    <Evidence evidence={insight.evidence} index={index} onSlide={onSlide} />
                  </p>
                </li>
              ))}
            </ul>
          </>
        )
      )}

      <div className="mt-5 divide-y divide-base-100 border-y border-base-100">
        <Fold title="Why it might work" count={analysis.hypotheses.length}>
          <ul className="space-y-3 pb-4">
            {analysis.hypotheses.map((hypothesis, i) => (
              <li key={i}>
                <p className="text-body text-pretty text-base-700">{hypothesis.text}</p>
                <p className="mt-1 text-caption">
                  <Evidence evidence={hypothesis.evidence} index={index} onSlide={onSlide} />
                </p>
              </li>
            ))}
          </ul>
        </Fold>
        {checks.length > 0 && (
          <Fold title="Data checks" count={checks.length} note={flagged.length ? `${flagged.length} to note` : "all sound"}>
            <ul className="space-y-3 pb-4">
              {checks.map((check, i) => (
                <li key={i}>
                  <p className="flex items-baseline justify-between gap-3 text-body">
                    <span className="font-medium text-base-900">{check.aspect}</span>
                    <span className={cx("shrink-0 text-caption", check.status === "concern" ? "font-medium text-base-900" : "text-base-500")}>{STATUS[check.status]}</span>
                  </p>
                  <p className="mt-0.5 text-body text-pretty text-base-700">{check.note}</p>
                </li>
              ))}
            </ul>
          </Fold>
        )}
      </div>

      {analysis.caveats.length > 0 && (
        <>
          <Subhead>Caveats</Subhead>
          <List items={analysis.caveats} className="text-base-600" />
        </>
      )}
    </div>
  );
}

const STATUS = { sound: "Sound", concern: "Concern", unverified: "Unverified" } as const;

function Tiles({ analysis }: { analysis: PublicAnalysis }) {
  const items = traits(analysis);
  if (!items.length) return null;
  return (
    <dl className="mt-4 grid grid-cols-2 gap-1.5">
      {items.map((trait) => (
        <div key={trait.label} className="min-w-0 rounded-xl bg-base-50 px-3 py-2.5">
          <dt className="text-micro text-base-500">{trait.label}</dt>
          <dd className="mt-0.5 line-clamp-2 text-body font-medium text-base-900" title={trait.value}>
            {trait.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// A decision: its number, title and the slides that show it; open, what was done, why it might
// work, the principle, and when to use it or not. Opening it shows its first slide on the stage
function DecisionCard({ n, decision, open, onToggle, index, onSlide }: { n: number; decision: DecisionView; open: boolean; onToggle: () => void; index: number; onSlide: (index: number) => void }) {
  const id = `decision-${n}`;
  return (
    <li className={cx("rounded-xl transition-[background-color] duration-150", open ? "bg-base-50" : "hover:bg-base-50")}>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left">
        <span className="mt-px w-5 shrink-0 text-caption text-base-400 tabular-nums">{String(n).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium text-pretty text-base-900">{decision.title}</span>
          <span className="mt-0.5 block text-caption text-base-500">
            {evidenceGroups(decision.evidence)
              .map((group) => group.label)
              .join(" · ")}
            {decision.confidence === "low" && " · low confidence"}
          </span>
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div id={id} className="space-y-3 px-3 pb-3.5 pl-11">
          <Field label="What they did">{decision.observation}</Field>
          <Field label="Why it might work">{decision.rationale}</Field>
          <p className="border-l-2 border-base-900 pl-3 text-body font-medium text-pretty text-base-900">{decision.principle}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Use it when">{decision.useWhen}</Field>
            <Field label="Avoid it when">{decision.avoidWhen}</Field>
          </div>
          <p className="text-caption">
            <span className="mr-2 text-base-500">Evidence</span>
            <Evidence evidence={decision.evidence} index={index} onSlide={onSlide} />
          </p>
        </div>
      )}
    </li>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-micro text-base-500">{label}</p>
      <p className="mt-0.5 text-body text-pretty text-base-700">{children}</p>
    </div>
  );
}

// ---- Visual DNA ----

function VisualDna({ analysis, index, onSlide, videos }: { analysis: PublicAnalysis; index: number; onSlide: (index: number) => void; videos: boolean[] }) {
  const colours = palette(analysis);
  return (
    <div>
      {analysis.visual.map((section) => (
        <section key={section.title} className="mt-6 first:mt-0">
          <Subhead>{section.title}</Subhead>
          {section.text && <p className="mt-1.5 text-body text-pretty text-base-800">{section.text}</p>}
          {section.title === "Colour" && colours.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-2" aria-label="Approximate colours">
              {colours.map((hex) => (
                <li key={hex} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-5 rounded-full outline-1 -outline-offset-1 outline-edge" style={{ background: hex }} />
                  <span className="font-mono text-micro text-base-500">{hex.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          )}
          {section.rows.length > 0 && (
            <ul className="mt-2 divide-y divide-base-100">
              {section.rows.map((row, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4 py-1.5 text-body">
                  <span className="min-w-0 flex-1 text-pretty text-base-900">{row.value}</span>
                  <span className="max-w-[45%] text-right text-caption">
                    <Evidence evidence={row.evidence} index={index} onSlide={onSlide} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {analysis.slides.length > 1 && (
        <section className="mt-6">
          <Subhead>Sequence</Subhead>
          <Sequence analysis={analysis} index={index} onSlide={onSlide} videos={videos} />
          {analysis.sequence.arc && <p className="mt-2 text-body text-pretty text-base-700">{analysis.sequence.arc}</p>}
        </section>
      )}
    </div>
  );
}

// The slides as a bar you tap, the ones that break the pattern a shade darker
function Sequence({ analysis, index, onSlide, videos }: { analysis: PublicAnalysis; index: number; onSlide: (index: number) => void; videos: boolean[] }) {
  const roles = analysis.slides.map((slide, i) => analysis.sequence.roles[i] ?? slide?.role ?? null);
  const usual = mostCommon(roles);
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

// ---- Apply ----

function Apply({ analysis, source }: { analysis: PublicAnalysis; source: BriefSource }) {
  const formula = analysis.formula ?? analysis.sequence.formula;
  const useWhen = [...new Set(analysis.creativeDecisions.map((d) => d.useWhen))];
  const pitfalls = [...new Set([...analysis.creativeDecisions.map((d) => d.avoidWhen), ...analysis.integrity.filter((n) => n.status === "concern").map((n) => `${n.aspect}: ${n.note}`)])];
  return (
    <div>
      {formula && (
        <>
          <Subhead>Formula</Subhead>
          <p className="mt-1.5 text-subtitle font-medium text-pretty text-base-900">{formula}</p>
        </>
      )}
      {analysis.takeaways.length > 0 && (
        <>
          <Subhead>How to apply</Subhead>
          <List items={analysis.takeaways} numbered />
        </>
      )}
      {analysis.adaptations.length > 0 && (
        <>
          <Subhead>Adapt it elsewhere</Subhead>
          <List items={analysis.adaptations} />
        </>
      )}
      {useWhen.length > 0 && (
        <>
          <Subhead>When it&apos;s useful</Subhead>
          <List items={useWhen} />
        </>
      )}
      {pitfalls.length > 0 && (
        <>
          <Subhead>Pitfalls</Subhead>
          <List items={pitfalls} className="text-base-600" />
        </>
      )}
      <CopyBrief analysis={analysis} source={source} />
    </div>
  );
}

// Puts a creative brief built from this analysis on the clipboard, and says so
function CopyBrief({ analysis, source }: { analysis: PublicAnalysis; source: BriefSource }) {
  const [state, setState] = useState<"done" | "failed" | null>(null);
  useEffect(() => {
    if (state !== "done") return;
    const timer = setTimeout(() => setState(null), 1800);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(briefText(analysis, source)).then(() => setState("done"), () => setState("failed"))}
        className="flex h-11 items-center rounded-full bg-base-900 px-5 text-body font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96]"
      >
        {state === "done" ? "Copied" : "Copy creative brief"}
      </button>
      <p role="status" className="text-caption text-pretty text-base-500">
        {state === "done" ? "Paste it into your brief and fill in the concept." : state === "failed" ? "Couldn't copy here." : ""}
      </p>
    </div>
  );
}

// ---- Shared pieces ----

function Subhead({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-caption font-medium text-base-500 first:mt-0">{children}</h3>;
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

function Fold({ title, count, note, children }: { title: string; count: number; note?: string; children: ReactNode }) {
  if (!count) return null;
  return (
    <details className="group">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-between text-body font-medium text-base-900 [&::-webkit-details-marker]:hidden">
        {title}
        <span className="flex items-center gap-2 text-caption font-normal text-base-500 tabular-nums">
          {note ?? count}
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

// The slides a statement rests on, as links that show them on the stage ("Slide 1", "Slides 4–5");
// the caption and the post's details as plain words
function Evidence({ evidence, index, onSlide }: { evidence: EvidenceTarget[]; index: number; onSlide: (index: number) => void }) {
  const groups = evidenceGroups(evidence);
  if (!groups.length) return null;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      {groups.map((group) =>
        group.target.kind === "slide" ? (
          <button
            key={group.label}
            type="button"
            aria-pressed={group.target.index === index}
            onClick={() => group.target.kind === "slide" && onSlide(group.target.index)}
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
