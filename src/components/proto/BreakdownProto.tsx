"use client";

// Prototype (2026-10-23): five directions for the post panel's creative breakdown (the Breakdown
// and Visual DNA tabs, the tab row included), behind a picker, on the fixture analysis. For
// review only; the chosen direction is then built into post-analysis/CreativeBreakdown.tsx and
// this file goes.
import { useState, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import Segmented from "@/components/fundations/elements/Segmented";
import Tabs, { Tab, TabList, TabPanel } from "@/components/fundations/molecules/Tabs";
import CaretDown from "@/components/fundations/icons/CaretDown";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
import Copy from "@/components/fundations/icons/Copy";
import ListChecks from "@/components/fundations/icons/ListChecks";
import PaintBrush from "@/components/fundations/icons/PaintBrush";
import { ThemePanel } from "@/components/system/SheetParts";
import { fontWeights } from "@/lib/font-weight";
import { evidenceGroups, integritySummary, STATUS_LABEL, type DecisionView, type EvidenceTarget, type PublicAnalysis } from "@/lib/creative/publicView";
import { cn } from "@/lib/utils";

type View = "breakdown" | "visual";
type Stage = { index: number; onSlide: (index: number) => void; count: number };

const DIRECTIONS = [
  { value: "ledger", label: "Ledger" },
  { value: "cards", label: "Cards" },
  { value: "spec", label: "Spec sheet" },
  { value: "storyboard", label: "Storyboard" },
  { value: "editorial", label: "Editorial" },
] as const;
type Direction = (typeof DIRECTIONS)[number]["value"];

export default function BreakdownProto({ analysis, initial }: { analysis: PublicAnalysis; initial?: { direction?: string; view?: string } }) {
  const [direction, setDirection] = useState<Direction>(DIRECTIONS.some((d) => d.value === initial?.direction) ? (initial!.direction as Direction) : "ledger");
  const [view, setView] = useState<View>(initial?.view === "visual" ? "visual" : "breakdown");
  const [index, setIndex] = useState(0);
  const stage: Stage = { index, onSlide: setIndex, count: analysis.slides.length };
  const Variant = VARIANTS[direction];
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <Segmented aria-label="Direction" value={direction} onValueChange={setDirection} options={[...DIRECTIONS]} />
          <Segmented
            aria-label="Tab"
            value={view}
            onValueChange={setView}
            options={[
              { value: "breakdown", label: "Breakdown" },
              { value: "visual", label: "Visual DNA" },
            ]}
          />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {(["light", "dark"] as const).map((theme) => (
            <ThemePanel key={theme} theme={theme} className="p-4 sm:p-6">
              <p className="mb-4 text-caption-lg tracking-wider text-secondary-foreground uppercase">{theme}</p>
              <Frame stage={stage} analysis={analysis}>
                <Variant analysis={analysis} stage={stage} view={view} onView={setView} />
              </Frame>
            </ThemePanel>
          ))}
        </div>
      </div>
    </MotionConfig>
  );
}

// PostView in miniature: a stand-in stage on the left, the 27rem panel on the right
function Frame({ stage, analysis, children }: { stage: Stage; analysis: PublicAnalysis; children: ReactNode }) {
  const role = analysis.sequence.roles[stage.index] ?? analysis.slides[stage.index]?.role ?? "Slide";
  return (
    <div className="grid overflow-hidden rounded-[24px] bg-surface-5 shadow-surface-6 md:grid-cols-[minmax(0,1fr)_27rem]">
      <div className="relative flex min-h-64 min-w-0 items-center justify-center overflow-hidden bg-[#0b0a10] p-6 text-white">
        <div className="flex aspect-4/5 w-full max-w-[16rem] flex-col justify-end rounded-[12px] bg-[linear-gradient(160deg,#2a2a33,#d9453d_140%)] p-4">
          <span className="text-[length:var(--fs-micro,11px)] tracking-[0.2em] uppercase opacity-70">Slide {stage.index + 1}</span>
          <span className="font-display text-2xl">{role}</span>
        </div>
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[length:var(--fs-micro,11px)] text-white/70 tabular-nums">
          {stage.index + 1} / {stage.count} · {role}
        </span>
        <div className="absolute inset-y-0 left-2 flex items-center">
          <button type="button" aria-label="Previous slide" onClick={() => stage.onSlide(Math.max(0, stage.index - 1))} className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <CaretLeft className="size-3.5" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button type="button" aria-label="Next slide" onClick={() => stage.onSlide(Math.min(stage.count - 1, stage.index + 1))} className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <CaretRight className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="max-h-[36rem] min-w-0 overflow-y-auto px-6 pb-5 text-body">{children}</div>
    </div>
  );
}

type VariantProps = { analysis: PublicAnalysis; stage: Stage; view: View; onView: (view: View) => void };

// ---- Shared pieces ----

const traits = (analysis: PublicAnalysis) =>
  [
    ["Archetype", "Type"],
    ["Goal", "Inferred goal"],
    ["Hook", "Hook"],
    ["Format", "Format"],
  ]
    .map(([label, name]) => ({ label, value: analysis.labels.find((l) => l.label === name)?.value ?? null }))
    .filter((t): t is { label: string; value: string } => !!t.value);

function slideIndexes(evidence: EvidenceTarget[]) {
  return evidence.filter((e): e is { kind: "slide"; index: number } => e.kind === "slide").map((e) => e.index);
}

function where(evidence: EvidenceTarget[]) {
  const parts = evidenceGroups(evidence)
    .filter((g) => g.target.kind === "slide")
    .map((g) => g.label.replace(/^Slides? /, ""));
  if (!parts.length) return null;
  return parts.length === 1 && !parts[0].includes("–") ? `Slide ${parts[0]}` : `Slides ${parts.join(", ")}`;
}

// The slides a statement rests on, as links that show them on the stage
function Evidence({ evidence, stage }: { evidence: EvidenceTarget[]; stage: Stage }) {
  const groups = evidenceGroups(evidence);
  if (!groups.length) return null;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {groups.map((group) =>
        group.target.kind === "slide" ? (
          <button
            key={group.label}
            type="button"
            aria-pressed={group.target.index === stage.index}
            onClick={() => group.target.kind === "slide" && stage.onSlide(group.target.index)}
            className="rounded-[4px] text-muted-foreground underline decoration-border underline-offset-2 transition-colors duration-80 hover:text-foreground aria-pressed:text-foreground aria-pressed:decoration-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
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

// Seven tiny bars, the slides a thing rests on filled, the stage's slide in the ink
function Ticks({ slides, stage, onPick }: { slides: number[]; stage: Stage; onPick?: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden={!onPick}>
      {Array.from({ length: stage.count }, (_, i) => {
        const on = slides.includes(i);
        const here = i === stage.index;
        const cls = cn("block h-2.5 w-1.5 rounded-full transition-colors duration-80", here ? "bg-foreground" : on ? "bg-muted-foreground" : "bg-[var(--accent)]");
        return onPick ? (
          <button key={i} type="button" aria-label={`Slide ${i + 1}`} aria-pressed={here} onClick={() => stage.onSlide(i)} className="p-0.5">
            <span className={cls} />
          </button>
        ) : (
          <span key={i} className={cls} />
        );
      })}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return <CaretDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />;
}

const semibold = { fontVariationSettings: fontWeights.semibold };

function Reasoning({ decision, stage }: { decision: DecisionView; stage: Stage }) {
  const rows: [string, string | null][] = [
    ["Observed", decision.observation],
    ["Possible effect", decision.effect],
    ["Reusable principle", decision.principle],
    ["Watch out", decision.watchOut],
  ];
  return (
    <dl className="mt-2 space-y-2">
      {rows.map(([label, text]) =>
        text ? (
          <div key={label}>
            <dt className="text-micro text-muted-foreground">{label}</dt>
            <dd className={cn("mt-0.5 text-pretty", label === "Reusable principle" ? "text-foreground" : "text-muted-foreground")} style={label === "Reusable principle" ? semibold : undefined}>
              {text}
            </dd>
          </div>
        ) : null,
      )}
      <div className="text-caption">
        <Evidence evidence={decision.evidence} stage={stage} />
        {decision.confidence === "low" && <span className="ml-2 text-muted-foreground">Low confidence</span>}
      </div>
    </dl>
  );
}

function useOpen(decisions: DecisionView[], stage: Stage) {
  const [open, setOpen] = useState<number | null>(decisions.length ? 0 : null);
  const [reason, setReason] = useState<number | null>(null);
  const toggle = (i: number) => {
    const next = open === i ? null : i;
    setOpen(next);
    setReason(null);
    const first = next == null ? undefined : slideIndexes(decisions[next].evidence)[0];
    if (first !== undefined) stage.onSlide(first);
  };
  return { open, toggle, reason, setReason };
}

function CopyBriefButton({ variant = "muted" }: { variant?: "muted" | "transparent" | "secondary" }) {
  return (
    <Button variant={variant} size="sm" rightIcon={<Copy className="size-3.5" />}>
      Copy brief
    </Button>
  );
}

// ---- 1. Ledger: ruled rows, a serif headline, pill tabs ----

function Ledger({ analysis, stage, view, onView }: VariantProps) {
  const { open, toggle, reason, setReason } = useOpen(analysis.creativeDecisions, stage);
  const [checks, setChecks] = useState(false);
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-2 border-b border-border bg-surface-5 px-6 py-2">
        <Tabs value={view} onValueChange={onView}>
          <TabList aria-label="Creative breakdown">
            <Tab value="breakdown">Breakdown</Tab>
            <Tab value="visual">Visual DNA</Tab>
          </TabList>
          <TabPanel value="breakdown" className="hidden">{null}</TabPanel>
          <TabPanel value="visual" className="hidden">{null}</TabPanel>
        </Tabs>
        <CopyBriefButton variant="transparent" />
      </div>
      {view === "breakdown" ? (
        <div className="pt-4">
          <h3 className="font-display text-[22px] leading-7 text-balance text-foreground">{analysis.headline}</h3>
          {analysis.summary && <p className="mt-2 text-pretty text-muted-foreground">{analysis.summary}</p>}
          <dl className="mt-4 divide-y divide-border border-y border-border">
            {traits(analysis).map((t) => (
              <div key={t.label} className="grid grid-cols-[6rem_1fr] gap-3 py-1.5">
                <dt className="text-caption text-muted-foreground">{t.label}</dt>
                <dd className="text-foreground" style={semibold}>
                  {t.value}
                </dd>
              </div>
            ))}
          </dl>
          <h4 className="mt-6 text-caption text-muted-foreground">Key creative decisions</h4>
          <ol className="mt-1 divide-y divide-border border-y border-border">
            {analysis.creativeDecisions.map((d, i) => (
              <li key={i}>
                <button type="button" aria-expanded={open === i} onClick={() => toggle(i)} className="grid w-full grid-cols-[1.75rem_1fr_auto] items-baseline gap-3 py-2.5 text-left">
                  <span className="text-micro text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-foreground" style={open === i ? semibold : undefined}>
                    {d.title}
                  </span>
                  <span className="flex items-center gap-2 text-caption text-muted-foreground tabular-nums">
                    {where(d.evidence)}
                    <Chevron open={open === i} />
                  </span>
                </button>
                {open === i && (
                  <div className="pb-3 pl-[2.5rem]">
                    <p className="text-pretty text-muted-foreground">{d.explanation}</p>
                    <button type="button" onClick={() => setReason(reason === i ? null : i)} className="mt-1.5 flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground">
                      {reason === i ? "Hide the reasoning" : "Show the reasoning"}
                      <Chevron open={reason === i} />
                    </button>
                    {reason === i && <Reasoning decision={d} stage={stage} />}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {analysis.integrity.length > 0 && (
            <>
              <h4 className="mt-6 text-caption text-muted-foreground">Data checks</h4>
              <button type="button" aria-expanded={checks} onClick={() => setChecks((v) => !v)} className="mt-1 flex w-full items-center justify-between gap-3 border-y border-border py-2.5 text-left text-foreground">
                {integritySummary(analysis.integrity)}
                <Chevron open={checks} />
              </button>
              {checks && (
                <ul className="divide-y divide-border">
                  {analysis.integrity.map((c, i) => (
                    <li key={i} className="grid grid-cols-[6rem_1fr] gap-3 py-2">
                      <span className="text-caption text-muted-foreground">{STATUS_LABEL[c.status]}</span>
                      <span>
                        <span className="text-foreground" style={semibold}>
                          {c.aspect}
                        </span>
                        <span className="mt-0.5 block text-pretty text-muted-foreground">{c.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {analysis.caveats.length > 0 && (
            <p className="mt-6 text-caption text-pretty text-muted-foreground">
              <span className="text-foreground">Caveats · </span>
              {analysis.caveats.join(" ")}
            </p>
          )}
        </div>
      ) : (
        <div className="pt-2">
          <dl className="divide-y divide-border">
            {analysis.visual.map((s) => (
              <div key={s.key} className="grid grid-cols-[6rem_1fr] gap-3 py-3">
                <dt className="text-caption text-muted-foreground">{s.title}</dt>
                <dd>
                  {s.insight && <p className="text-pretty text-foreground">{s.insight}</p>}
                  {s.key === "colour" && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {analysis.colours.map((c) => (
                        <li key={c.hex} className="flex items-center gap-1.5 text-micro text-muted-foreground">
                          <span className="size-5 rounded-full outline-1 -outline-offset-1 outline-border" style={{ background: c.hex }} />
                          <span className="font-mono uppercase">{c.hex}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.chips.length > 0 && <p className="mt-1 text-caption text-muted-foreground">{s.chips.join(" · ")}</p>}
                  {s.evidence.length > 0 && (
                    <p className="mt-1 text-caption">
                      <Evidence evidence={s.evidence} stage={stage} />
                    </p>
                  )}
                </dd>
              </div>
            ))}
            <div className="grid grid-cols-[6rem_1fr] gap-3 py-3">
              <dt className="text-caption text-muted-foreground">Sequence</dt>
              <dd>
                <Ticks slides={[]} stage={stage} onPick />
                {analysis.sequence.formula && <p className="mt-1 text-caption text-muted-foreground">{analysis.sequence.formula}</p>}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

// ---- 2. Cards: a full-width segmented switch, each decision a raised card with its slide ----

function Cards({ analysis, stage, view, onView }: VariantProps) {
  const { open, toggle, reason, setReason } = useOpen(analysis.creativeDecisions, stage);
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 bg-surface-5 px-6 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <Segmented
            aria-label="Creative breakdown"
            value={view}
            onValueChange={onView}
            className="flex-1 [&>*]:flex-1"
            options={[
              { value: "breakdown", label: "Breakdown" },
              { value: "visual", label: "Visual DNA" },
            ]}
          />
          <CopyBriefButton variant="secondary" />
        </div>
      </div>
      {view === "breakdown" ? (
        <div>
          <p className="text-subtitle text-balance text-foreground" style={semibold}>
            {analysis.headline}
          </p>
          {analysis.summary && <p className="mt-1.5 text-pretty text-muted-foreground">{analysis.summary}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {traits(analysis).map((t) => (
              <Badge key={t.label}>
                <span className="text-muted-foreground">{t.label}</span>&nbsp;{t.value}
              </Badge>
            ))}
          </div>
          <h4 className="mt-6 text-caption text-muted-foreground">Key creative decisions</h4>
          <ol className="mt-2 space-y-2">
            {analysis.creativeDecisions.map((d, i) => {
              const slides = slideIndexes(d.evidence);
              return (
                <li key={i} className={cn("rounded-[20px] transition-colors duration-80", open === i ? "bg-surface-3 shadow-surface-2" : "bg-muted hover:bg-active")}>
                  <button type="button" aria-expanded={open === i} onClick={() => toggle(i)} className="flex w-full items-center gap-3 p-2 text-left">
                    <span className="flex h-11 w-9 shrink-0 flex-col items-center justify-end rounded-[12px] bg-[linear-gradient(160deg,#2a2a33,#d9453d_140%)] pb-1 text-[10px] text-white/80 tabular-nums">
                      {slides[0] !== undefined ? slides[0] + 1 : "·"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-foreground" style={semibold}>
                        {d.title}
                      </span>
                      <span className="mt-0.5 block text-caption text-muted-foreground">{where(d.evidence) ?? "Caption"}</span>
                    </span>
                    <Chevron open={open === i} />
                  </button>
                  {open === i && (
                    <div className="px-3 pb-3">
                      <p className="text-pretty text-muted-foreground">{d.explanation}</p>
                      <button type="button" onClick={() => setReason(reason === i ? null : i)} className="mt-2 flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground">
                        {reason === i ? "Hide the reasoning" : "Show the reasoning"}
                        <Chevron open={reason === i} />
                      </button>
                      {reason === i && (
                        <div className="mt-2 rounded-[14px] bg-muted p-3">
                          <Reasoning decision={d} stage={stage} />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          {analysis.integrity.length > 0 && (
            <div className="mt-4 rounded-[20px] bg-muted p-3">
              <p className="text-caption text-muted-foreground">Data checks</p>
              <p className="mt-0.5 text-foreground">{integritySummary(analysis.integrity)}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {analysis.visual.map((s) => (
            <section key={s.key} className="rounded-[20px] bg-muted p-3">
              <h4 className="text-caption text-muted-foreground">{s.title}</h4>
              {s.insight && <p className="mt-1 text-pretty text-foreground">{s.insight}</p>}
              {s.key === "colour" && (
                <ul className="mt-2 grid grid-cols-2 gap-1.5">
                  {analysis.colours.map((c) => (
                    <li key={c.hex} className="flex items-center gap-2 rounded-[14px] bg-surface-3 p-1.5 shadow-surface-1">
                      <span className="size-6 rounded-full outline-1 -outline-offset-1 outline-border" style={{ background: c.hex }} />
                      <span className="min-w-0">
                        <span className="block truncate text-caption text-foreground">{c.role ?? "Measured"}</span>
                        <span className="block font-mono text-micro text-muted-foreground uppercase">{c.hex}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {s.chips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.chips.map((chip) => (
                    <Badge key={chip} variant="outline">
                      {chip}
                    </Badge>
                  ))}
                </div>
              )}
              {s.evidence.length > 0 && (
                <p className="mt-2 text-caption">
                  <span className="mr-1.5 text-muted-foreground">Seen on</span>
                  <Evidence evidence={s.evidence} stage={stage} />
                </p>
              )}
            </section>
          ))}
          <section className="rounded-[20px] bg-muted p-3">
            <h4 className="text-caption text-muted-foreground">Sequence</h4>
            <div className="mt-2">
              <Ticks slides={[]} stage={stage} onPick />
            </div>
            {analysis.sequence.formula && <p className="mt-1 text-caption text-muted-foreground">{analysis.sequence.formula}</p>}
          </section>
        </div>
      )}
    </div>
  );
}

// ---- 3. Spec sheet: an underlined tab row and one key/value grid for everything ----

function Spec({ analysis, stage, view, onView }: VariantProps) {
  const [open, setOpen] = useState<number | null>(0);
  const Row = ({ label, children }: { label: ReactNode; children: ReactNode }) => (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 py-2">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 flex items-end justify-between gap-2 border-b border-border bg-surface-5 px-6">
        <div role="tablist" className="flex gap-5">
          {(["breakdown", "visual"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => onView(v)}
              className={cn("-mb-px py-2.5 transition-colors duration-80", view === v ? "text-foreground shadow-[inset_0_-1px_0_var(--foreground)]" : "text-muted-foreground hover:text-foreground")}
              style={view === v ? semibold : undefined}
            >
              {v === "breakdown" ? "Breakdown" : "Visual DNA"}
            </button>
          ))}
        </div>
        <div className="pb-1.5">
          <CopyBriefButton variant="transparent" />
        </div>
      </div>
      {view === "breakdown" ? (
        <dl className="mt-2 divide-y divide-border">
          <Row label="Strategy">
            <p className="text-foreground" style={semibold}>
              {analysis.headline}
            </p>
            {analysis.summary && <p className="mt-1 text-pretty text-muted-foreground">{analysis.summary}</p>}
          </Row>
          {traits(analysis).map((t) => (
            <Row key={t.label} label={t.label}>
              <span className="text-foreground">{t.value}</span>
            </Row>
          ))}
          {analysis.creativeDecisions.map((d, i) => (
            <Row
              key={i}
              label={
                <span className="block">
                  <span className="text-foreground tabular-nums">Decision {String(i + 1).padStart(2, "0")}</span>
                  <span className="mt-0.5 block tabular-nums">{where(d.evidence)}</span>
                </span>
              }
            >
              <p className="text-foreground" style={semibold}>
                {d.title}
              </p>
              <p className="mt-0.5 text-pretty text-muted-foreground">{d.explanation}</p>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="mt-1 flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground">
                Reasoning <Chevron open={open === i} />
              </button>
              {open === i && <Reasoning decision={d} stage={stage} />}
            </Row>
          ))}
          {analysis.integrity.map((c, i) => (
            <Row key={`c${i}`} label={i === 0 ? "Data checks" : ""}>
              <p>
                <span className="text-foreground">{c.aspect}</span>
                <span className="ml-2 text-caption text-muted-foreground">{STATUS_LABEL[c.status]}</span>
              </p>
              <p className="mt-0.5 text-pretty text-muted-foreground">{c.note}</p>
            </Row>
          ))}
          {analysis.caveats.length > 0 && (
            <Row label="Caveats">
              <ul className="space-y-1 text-muted-foreground">
                {analysis.caveats.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Row>
          )}
        </dl>
      ) : (
        <dl className="mt-2 divide-y divide-border">
          {analysis.visual.map((s) => (
            <Row key={s.key} label={s.title}>
              {s.insight && <p className="text-pretty text-foreground">{s.insight}</p>}
              {s.key === "colour" && (
                <ul className="mt-1.5 space-y-1">
                  {analysis.colours.map((c) => (
                    <li key={c.hex} className="flex items-center gap-2 text-caption">
                      <span className="size-3 rounded-full outline-1 -outline-offset-1 outline-border" style={{ background: c.hex }} />
                      <span className="font-mono text-muted-foreground uppercase">{c.hex}</span>
                      <span className="text-foreground">{c.role}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.chips.length > 0 && <p className="mt-1 text-caption text-muted-foreground">{s.chips.join(", ")}</p>}
              {s.evidence.length > 0 && (
                <p className="mt-1 text-caption">
                  <Evidence evidence={s.evidence} stage={stage} />
                </p>
              )}
            </Row>
          ))}
          <Row label="Sequence">
            <Ticks slides={[]} stage={stage} onPick />
            {analysis.sequence.formula && <p className="mt-1 text-caption text-muted-foreground">{analysis.sequence.formula}</p>}
          </Row>
        </dl>
      )}
    </div>
  );
}

// ---- 4. Storyboard: icon tabs, a slide rail, every decision anchored to its slides ----

function Storyboard({ analysis, stage, view, onView }: VariantProps) {
  const { open, toggle, reason, setReason } = useOpen(analysis.creativeDecisions, stage);
  const roles = analysis.sequence.roles;
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-2 bg-surface-5 px-6 py-2">
        <Tabs value={view} onValueChange={onView}>
          <TabList aria-label="Creative breakdown">
            <Tab value="breakdown" icon={<ListChecks />}>
              Breakdown
            </Tab>
            <Tab value="visual" icon={<PaintBrush />}>
              Visual DNA
            </Tab>
          </TabList>
          <TabPanel value="breakdown" className="hidden">{null}</TabPanel>
          <TabPanel value="visual" className="hidden">{null}</TabPanel>
        </Tabs>
        <CopyBriefButton />
      </div>
      {/* The rail: every slide as a small tile, the stage's slide ringed in the ink */}
      <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 pt-1 pb-3">
        {Array.from({ length: stage.count }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={i === stage.index}
            aria-label={`Slide ${i + 1}${roles[i] ? `: ${roles[i]}` : ""}`}
            onClick={() => stage.onSlide(i)}
            className={cn("flex h-12 w-9 shrink-0 flex-col items-center justify-end rounded-[10px] bg-[linear-gradient(160deg,#2a2a33,#d9453d_140%)] pb-1 text-[10px] text-white/80 tabular-nums transition-[outline-color] duration-80 outline-2 -outline-offset-2", i === stage.index ? "outline-foreground" : "outline-transparent")}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {view === "breakdown" ? (
        <div>
          <p className="text-subtitle text-balance text-foreground" style={semibold}>
            {analysis.headline}
          </p>
          <p className="mt-1 text-caption text-muted-foreground">{traits(analysis).map((t) => t.value).join(" · ")}</p>
          <ol className="mt-4 space-y-1">
            {analysis.creativeDecisions.map((d, i) => (
              <li key={i} className={cn("rounded-[16px] transition-colors duration-80", open === i ? "bg-muted" : "hover:bg-hover")}>
                <button type="button" aria-expanded={open === i} onClick={() => toggle(i)} className="flex w-full items-center gap-3 px-3 py-2 text-left">
                  <Ticks slides={slideIndexes(d.evidence)} stage={stage} />
                  <span className="min-w-0 flex-1 text-foreground" style={open === i ? semibold : undefined}>
                    {d.title}
                  </span>
                  <Chevron open={open === i} />
                </button>
                {open === i && (
                  <div className="px-3 pb-3 pl-[4.25rem]">
                    <p className="text-pretty text-muted-foreground">{d.explanation}</p>
                    <button type="button" onClick={() => setReason(reason === i ? null : i)} className="mt-1.5 flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground">
                      {reason === i ? "Hide the reasoning" : "Show the reasoning"}
                      <Chevron open={reason === i} />
                    </button>
                    {reason === i && <Reasoning decision={d} stage={stage} />}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {analysis.integrity.length > 0 && (
            <p className="mt-4 flex items-center gap-3 px-3 text-caption text-muted-foreground">
              <Ticks slides={analysis.integrity.flatMap((c) => slideIndexes(c.evidence))} stage={stage} />
              {integritySummary(analysis.integrity)}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {analysis.visual.map((s) => (
            <section key={s.key} className="flex gap-3">
              <div className="w-[3.75rem] shrink-0 pt-0.5">
                <Ticks slides={slideIndexes(s.evidence)} stage={stage} />
              </div>
              <div className="min-w-0">
                <h4 className="text-caption text-muted-foreground">{s.title}</h4>
                {s.insight && <p className="mt-0.5 text-pretty text-foreground">{s.insight}</p>}
                {s.key === "colour" && (
                  <div className="mt-1.5 flex gap-1">
                    {analysis.colours.map((c) => (
                      <span key={c.hex} title={`${c.hex} ${c.role ?? ""}`} className="h-6 flex-1 rounded-[6px] outline-1 -outline-offset-1 outline-border first:rounded-l-[12px] last:rounded-r-[12px]" style={{ background: c.hex }} />
                    ))}
                  </div>
                )}
                {s.chips.length > 0 && <p className="mt-1 text-caption text-muted-foreground">{s.chips.join(" · ")}</p>}
              </div>
            </section>
          ))}
          {analysis.sequence.formula && (
            <section className="flex gap-3">
              <div className="w-[3.75rem] shrink-0 pt-0.5">
                <Ticks slides={[]} stage={stage} />
              </div>
              <p className="text-caption text-muted-foreground">{analysis.sequence.formula}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ---- 5. Editorial: quiet text tabs, a large serif title, decisions as numbered prose ----

function Editorial({ analysis, stage, view, onView }: VariantProps) {
  const [why, setWhy] = useState<number | null>(null);
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-4 bg-surface-5 px-6 py-3">
        <div role="tablist" className="flex gap-4">
          {(["breakdown", "visual"] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => onView(v)} className={cn("flex items-center gap-1.5 transition-colors duration-80", view === v ? "text-foreground" : "text-muted-foreground hover:text-foreground")} style={view === v ? semibold : undefined}>
              <span className={cn("size-1.5 rounded-full transition-colors duration-80", view === v ? "bg-brand-solid" : "bg-transparent")} />
              {v === "breakdown" ? "Breakdown" : "Visual DNA"}
            </button>
          ))}
        </div>
        <CopyBriefButton variant="transparent" />
      </div>
      {view === "breakdown" ? (
        <div className="pt-1">
          <h3 className="font-display text-[26px] leading-8 text-balance text-foreground">{analysis.headline}</h3>
          {analysis.summary && <p className="mt-2.5 text-pretty text-muted-foreground">{analysis.summary}</p>}
          <p className="mt-3 text-caption text-muted-foreground">{traits(analysis).map((t) => t.value).join(" · ")}</p>
          <ol className="mt-6 space-y-5">
            {analysis.creativeDecisions.map((d, i) => (
              <li key={i} className="grid grid-cols-[2.25rem_1fr] gap-2">
                <span className="font-display text-[22px] leading-6 text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="text-subtitle text-foreground" style={semibold}>
                    {d.title}
                  </p>
                  <p className="mt-1 text-pretty text-muted-foreground">{d.explanation}</p>
                  <p className="mt-1.5 text-caption">
                    <Evidence evidence={d.evidence} stage={stage} />
                  </p>
                  <button type="button" aria-expanded={why === i} onClick={() => setWhy(why === i ? null : i)} className="mt-1.5 flex items-center gap-1 text-caption text-muted-foreground underline decoration-border underline-offset-2 hover:text-foreground">
                    Why it works
                  </button>
                  {why === i && (
                    <blockquote className="mt-2 border-l border-border pl-3">
                      <Reasoning decision={d} stage={stage} />
                    </blockquote>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {analysis.integrity.length > 0 && (
            <ol className="mt-6 space-y-1.5 border-t border-border pt-3 text-caption text-muted-foreground">
              {analysis.integrity.map((c, i) => (
                <li key={i} className="grid grid-cols-[1.25rem_1fr] gap-1">
                  <span className="tabular-nums">{i + 1}.</span>
                  <span>
                    <span className="text-foreground">{c.aspect}</span> ({STATUS_LABEL[c.status].toLowerCase()}): {c.note}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {analysis.caveats.length > 0 && <p className="mt-3 text-micro text-pretty text-muted-foreground">{analysis.caveats.join(" ")}</p>}
        </div>
      ) : (
        <div className="pt-1">
          <div className="flex h-7 overflow-hidden rounded-[14px]">
            {analysis.colours.map((c) => (
              <span key={c.hex} title={`${c.hex} ${c.role ?? ""}`} className="flex-1" style={{ background: c.hex }} />
            ))}
          </div>
          <p className="mt-1.5 text-micro text-muted-foreground">{analysis.colours.map((c) => `${c.hex.toUpperCase()}${c.role ? ` ${c.role}` : ""}`).join(" · ")}</p>
          {analysis.visual.map((s) => (
            <section key={s.key} className="mt-5">
              <h4 className="font-display text-[18px] leading-6 text-foreground">{s.title}</h4>
              {s.insight && <p className="mt-1 text-pretty text-muted-foreground">{s.insight}</p>}
              {s.chips.length > 0 && (
                <p className="mt-1 text-caption text-foreground">
                  {s.chips.join(" · ")}
                  {s.evidence.length > 0 && (
                    <>
                      <span className="text-muted-foreground"> — </span>
                      <Evidence evidence={s.evidence} stage={stage} />
                    </>
                  )}
                </p>
              )}
            </section>
          ))}
          {analysis.sequence.formula && (
            <section className="mt-5">
              <h4 className="font-display text-[18px] leading-6 text-foreground">Sequence</h4>
              <p className="mt-1 text-caption text-muted-foreground">{analysis.sequence.formula}</p>
              <div className="mt-2">
                <Ticks slides={[]} stage={stage} onPick />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

const VARIANTS: Record<Direction, (props: VariantProps) => ReactNode> = {
  ledger: Ledger,
  cards: Cards,
  spec: Spec,
  storyboard: Storyboard,
  editorial: Editorial,
};
