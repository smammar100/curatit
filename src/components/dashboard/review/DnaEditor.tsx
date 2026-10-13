"use client";

// Editing a version's Creative DNA. The edit is checked with the same contract and validator the
// worker uses (no performance claims, quotes really in the caption, every slide given a role…)
// and saved as a new version, so the AI's original stays in the history. Slide roles edited here
// update both the narrative and the slide records.
import { useMemo, useState } from "react";
import { cx } from "@/lib/cx";
import { CreativeDna, type SlideObservation } from "@/lib/creative/schema";
import { DIMENSIONS, TAXONOMY_VERSION, type Dimension } from "@/lib/creative/taxonomy";
import { validateDna, type Issue } from "@/lib/creative/validate";
import { track } from "@/lib/analytics";
import { saveEdit, type Version } from "./data";
import { quietButton, Section, solidButton, useBusy } from "./parts";

const field =
  "w-full rounded-2xl border-0 bg-base-50 px-3.5 py-2.5 text-body pointer-coarse:text-[16px] text-base-900 ring-1 ring-base-200 placeholder:text-base-400 focus:ring-2 focus:ring-base-300";
const select =
  "h-9 rounded-full border-0 bg-base-50 py-0 pr-8 pl-3.5 text-body pointer-coarse:text-[16px] text-base-900 ring-1 ring-base-200 focus:ring-2 focus:ring-base-300";

function Options({ dimension }: { dimension: Dimension }) {
  return (
    <>
      {DIMENSIONS[dimension].map((term) => (
        <option key={term.slug} value={term.slug}>
          {term.label}
        </option>
      ))}
    </>
  );
}

function ArchetypeOptions() {
  return (
    <>
      {DIMENSIONS.archetype_family.map((family) => {
        const members = DIMENSIONS.archetype.filter((term) => term.parent === family.slug);
        return members.length ? (
          <optgroup key={family.slug} label={family.label}>
            {members.map((term) => (
              <option key={term.slug} value={term.slug}>
                {term.label}
              </option>
            ))}
          </optgroup>
        ) : null;
      })}
      <option value="other">Other</option>
      <option value="unknown">Unknown</option>
    </>
  );
}

function List({ label, items, min, max, onChange, rows = 2 }: { label: string; items: string[]; min: number; max: number; onChange: (items: string[]) => void; rows?: number }) {
  return (
    <fieldset>
      <legend className="mb-2 text-caption font-medium text-base-500">
        {label} ({min} to {max})
      </legend>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea aria-label={`${label} ${i + 1}`} rows={rows} value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className={field} />
            {items.length > min && (
              <button type="button" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))} className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-base-500 hover:bg-base-50 hover:text-base-900">
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, ""])} className="mt-2 text-caption font-medium text-base-600 hover:text-base-900">
          + Add
        </button>
      )}
    </fieldset>
  );
}

export default function DnaEditor({
  postId,
  caption,
  version,
  slides,
  onCancel,
  onSaved,
}: {
  postId: string;
  caption: string;
  version: Version;
  slides: Map<number, SlideObservation>;
  onCancel: () => void;
  onSaved: (versionId: string) => void;
}) {
  const [dna, setDna] = useState<CreativeDna>(() => ({ ...structuredClone(version.creative_dna), taxonomy_version: TAXONOMY_VERSION }));
  const [problems, setProblems] = useState<Issue[]>([]);
  const { busy, error, run } = useBusy();
  const set = (patch: Partial<CreativeDna>) => setDna((d) => ({ ...d, ...patch }));

  const verdict = useMemo(() => {
    const parsed = CreativeDna.safeParse(dna);
    if (!parsed.success) return { errors: parsed.error.issues.map((i) => ({ code: "schema", message: i.message, path: i.path.join(".") })), warnings: [] as Issue[] };
    return validateDna(parsed.data, { caption, expectedSlides: version.expected_slides }, version.perception ?? undefined);
  }, [dna, caption, version]);

  async function save(approve: boolean, publish: boolean) {
    if (verdict.errors.length) {
      setProblems(verdict.errors);
      return;
    }
    setProblems([]);
    const rolesChanged = dna.narrative.slide_roles.some((s) => slides.get(s.position) && slides.get(s.position)!.role !== s.role);
    const editedSlides = rolesChanged
      ? [...slides.values()].map((slide) => ({ ...slide, role: dna.narrative.slide_roles.find((s) => s.position === slide.position)?.role ?? slide.role }))
      : null;
    let saved: { version_id: string } | null = null;
    const ok = await run(publish ? "publish" : approve ? "approve" : "save", async () => {
      saved = await saveEdit(
        postId,
        version.id,
        {
          summary: dna.creative_summary,
          hook: dna.hook.observed_text ?? dna.concept,
          why_it_works: dna.creative_rationale.map((r) => r.hypothesis).join("\n\n"),
          takeaways: dna.takeaways,
          creative_dna: dna,
          taxonomy_version: TAXONOMY_VERSION,
          validation: { errors: [], warnings: verdict.warnings },
        },
        editedSlides,
        { approve, publish },
      );
    });
    if (ok && saved) {
      track("creative_dna_saved", { approved: approve, published: publish });
      onSaved((saved as { version_id: string }).version_id);
    }
  }

  const secondary = dna.secondary_archetypes;
  return (
    <form
      className="mt-2"
      onSubmit={(e) => {
        e.preventDefault();
        save(false, false);
      }}
    >
      <Section title={`Editing v${version.version_no} (saved as a new version)`}>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-caption font-medium text-base-500">Concept</span>
            <input value={dna.concept} maxLength={160} onChange={(e) => set({ concept: e.target.value })} className={field} />
          </label>
          {/* Creative Intelligence 3.0: the line the post page leads with */}
          {dna.strategy_headline !== undefined && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-caption font-medium text-base-500">Strategy headline (8 to 14 words)</span>
                <input value={dna.strategy_headline} maxLength={110} onChange={(e) => set({ strategy_headline: e.target.value })} className={field} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-caption font-medium text-base-500">Strategy summary (one or two sentences)</span>
                <textarea rows={2} value={dna.strategy_summary ?? ""} maxLength={280} onChange={(e) => set({ strategy_summary: e.target.value })} className={field} />
              </label>
            </>
          )}
          <label className="block">
            <span className="mb-1.5 block text-caption font-medium text-base-500">Summary</span>
            <textarea rows={4} value={dna.creative_summary} maxLength={600} onChange={(e) => set({ creative_summary: e.target.value })} className={field} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-caption font-medium text-base-500">Intent</span>
            <input value={dna.content_intent} maxLength={280} onChange={(e) => set({ content_intent: e.target.value })} className={field} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-caption font-medium text-base-500">Primary archetype</span>
              <select value={dna.primary_archetype.slug} onChange={(e) => set({ primary_archetype: { ...dna.primary_archetype, slug: e.target.value as CreativeDna["primary_archetype"]["slug"] } })} className={cx(select, "w-full")}>
                <ArchetypeOptions />
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-caption font-medium text-base-500">Objective</span>
              <select value={dna.marketing_objective.slug} onChange={(e) => set({ marketing_objective: { ...dna.marketing_objective, slug: e.target.value as CreativeDna["marketing_objective"]["slug"] } })} className={cx(select, "w-full")}>
                <Options dimension="objective" />
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-caption font-medium text-base-500">Secondary archetypes (up to 3)</legend>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2].map((i) => (
                <select
                  key={i}
                  aria-label={`Secondary archetype ${i + 1}`}
                  value={secondary[i]?.slug ?? ""}
                  onChange={(e) => {
                    const next = [...secondary];
                    if (!e.target.value) next.splice(i, 1);
                    else next[i] = { slug: e.target.value as CreativeDna["primary_archetype"]["slug"], evidence: secondary[i]?.evidence ?? dna.primary_archetype.evidence };
                    set({ secondary_archetypes: next.filter(Boolean) });
                  }}
                  disabled={i > secondary.length}
                  className={select}
                >
                  <option value="">None</option>
                  <ArchetypeOptions />
                </select>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <label className="block">
              <span className="mb-1.5 block text-caption font-medium text-base-500">Hook technique</span>
              <select value={dna.hook.technique} onChange={(e) => set({ hook: { ...dna.hook, technique: e.target.value as CreativeDna["hook"]["technique"] } })} className={select}>
                <Options dimension="hook_technique" />
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-caption font-medium text-base-500">Hook as written (exactly)</span>
              <input value={dna.hook.observed_text ?? ""} maxLength={240} onChange={(e) => set({ hook: { ...dna.hook, observed_text: e.target.value || null } })} className={field} />
            </label>
          </div>

          <div>
            <label className="block">
              <span className="mb-1.5 block text-caption font-medium text-base-500">Narrative pattern</span>
              <select value={dna.narrative.pattern} onChange={(e) => set({ narrative: { ...dna.narrative, pattern: e.target.value as CreativeDna["narrative"]["pattern"] } })} className={select}>
                <Options dimension="narrative_pattern" />
              </select>
            </label>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-caption font-medium text-base-500">Arc</span>
              <textarea rows={2} value={dna.narrative.arc} maxLength={400} onChange={(e) => set({ narrative: { ...dna.narrative, arc: e.target.value } })} className={field} />
            </label>
            <fieldset className="mt-3">
              <legend className="mb-1.5 text-caption font-medium text-base-500">Slide roles (by position)</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {dna.narrative.slide_roles.map((s, i) => (
                  <label key={s.position} className="flex items-center gap-2">
                    <span className="w-5 text-right font-mono text-micro text-base-500">{s.position}</span>
                    <select
                      aria-label={`Role of position ${s.position}`}
                      value={s.role}
                      onChange={(e) =>
                        set({ narrative: { ...dna.narrative, slide_roles: dna.narrative.slide_roles.map((r, j) => (j === i ? { ...r, role: e.target.value as typeof r.role } : r)) } })
                      }
                      className={cx(select, "min-w-0 flex-1")}
                    >
                      <Options dimension="slide_role" />
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset>
            <legend className="mb-2 text-caption font-medium text-base-500">Why it might work (2 to 4 hypotheses; evidence kept)</legend>
            <div className="space-y-2">
              {dna.creative_rationale.map((r, i) => (
                <textarea
                  key={i}
                  aria-label={`Hypothesis ${i + 1}`}
                  rows={2}
                  value={r.hypothesis}
                  maxLength={320}
                  onChange={(e) => set({ creative_rationale: dna.creative_rationale.map((x, j) => (j === i ? { ...x, hypothesis: e.target.value } : x)) })}
                  className={field}
                />
              ))}
            </div>
          </fieldset>

          <List label="Takeaways" items={dna.takeaways} min={3} max={5} onChange={(takeaways) => set({ takeaways })} />
          <List label="Adaptation ideas" items={dna.adaptation_ideas} min={1} max={3} onChange={(adaptation_ideas) => set({ adaptation_ideas })} />
        </div>

        {(problems.length > 0 || verdict.warnings.length > 0) && (
          <div className="mt-4 space-y-1 text-caption">
            {problems.map((p, i) => (
              <p key={`e${i}`} className="text-danger-600">
                {p.message}
                {p.path && <span className="font-mono"> ({p.path})</span>}
              </p>
            ))}
            {verdict.warnings.map((w, i) => (
              <p key={`w${i}`} className="text-base-600">
                Check: {w.message}
              </p>
            ))}
          </div>
        )}
        {error && <p className="mt-3 text-caption text-danger-600">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={solidButton} disabled={!!busy} onClick={() => save(true, true)}>
            {busy === "publish" ? "Publishing…" : "Save, approve and publish"}
          </button>
          <button type="button" className={quietButton} disabled={!!busy} onClick={() => save(true, false)}>
            {busy === "approve" ? "Saving…" : "Save and approve"}
          </button>
          <button type="submit" className={quietButton} disabled={!!busy}>
            {busy === "save" ? "Saving…" : "Save for review"}
          </button>
          <button type="button" className={quietButton} disabled={!!busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </Section>
    </form>
  );
}
