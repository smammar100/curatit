"use client";

// Editing a version's Creative DNA. The edit is checked with the same contract and validator the
// worker uses (no performance claims, quotes really in the caption, every slide given a role…)
// and saved as a new version, so the AI's original stays in the history. Slide roles edited here
// update both the narrative and the slide records.
//
// The fields are the shared Field with Input and Textarea (2026-10-19; hand-built from the auth
// recipe before), with a FieldGroup over each set (the lists, the slide roles). A save the
// validator refuses still lists every problem above the buttons, and now also marks the field
// each one is about (by its path) with the problem under it. Since 2026-10-23 that list and a
// failed save are Notices, the list rows' remove and add are icon Buttons, and the selects stay
// native on the field recipe in parts.tsx (28px pill, the one stroke) until the design system
// has a Select.
import { useMemo, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Input from "@/components/fundations/elements/Input";
import Textarea from "@/components/fundations/elements/Textarea";
import Close from "@/components/fundations/icons/Close";
import Plus from "@/components/fundations/icons/Plus";
import Field, { FieldGroup } from "@/components/fundations/molecules/Field";
import Notice from "@/components/fundations/molecules/Notice";
import { CreativeDna, type SlideObservation } from "@/lib/creative/schema";
import { DIMENSIONS, TAXONOMY_VERSION, type Dimension } from "@/lib/creative/taxonomy";
import { validateDna, type Issue } from "@/lib/creative/validate";
import { track } from "@/lib/analytics";
import { saveEdit, type Version } from "./data";
import { Section, selectClass as select, useBusy } from "./parts";

// The problems the last save attempt found at a path or inside it ("takeaways" holds
// "takeaways.2"), as one line for that field's error; undefined when there are none
function problemsAt(problems: Issue[], path: string) {
  const here = problems.filter((p) => p.path === path || p.path?.startsWith(`${path}.`));
  return here.length ? here.map((p) => p.message).join("; ") : undefined;
}

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

function List({
  label,
  items,
  min,
  max,
  onChange,
  error,
  rows = 2,
}: {
  label: string;
  items: string[];
  min: number;
  max: number;
  onChange: (items: string[]) => void;
  error?: string;
  rows?: number;
}) {
  return (
    <FieldGroup legend={`${label} (${min} to ${max})`} error={error}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <Textarea
              aria-label={`${label} ${i + 1}`}
              rows={rows}
              value={item}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              className="min-w-0 flex-1"
            />
            {items.length > min && (
              <Button variant="transparent" iconOnly aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Close className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {items.length < max && (
        <Button variant="transparent" size="xxs" leftIcon={<Plus className="size-3.5" />} onClick={() => onChange([...items, ""])} className="mt-2 -ml-2">
          Add
        </Button>
      )}
    </FieldGroup>
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
  // Once a save has been refused, each field shows its problems live, so a note clears the moment
  // the field is fixed (the list above the buttons stays as that attempt found it)
  const at = (path: string) => (problems.length ? problemsAt(verdict.errors, path) : undefined);
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
          <Field label="Concept" error={at("concept")}>
            <Input value={dna.concept} maxLength={160} autoComplete="off" onChange={(e) => set({ concept: e.target.value })} />
          </Field>
          {/* Creative Intelligence 3.0: the line the post page leads with */}
          {dna.strategy_headline !== undefined && (
            <>
              <Field label="Strategy headline (8 to 14 words)" error={at("strategy_headline")}>
                <Input value={dna.strategy_headline} maxLength={110} autoComplete="off" onChange={(e) => set({ strategy_headline: e.target.value })} />
              </Field>
              <Field label="Strategy summary (one or two sentences)" error={at("strategy_summary")}>
                <Textarea rows={2} value={dna.strategy_summary ?? ""} maxLength={280} onChange={(e) => set({ strategy_summary: e.target.value })} />
              </Field>
            </>
          )}
          <Field label="Summary" error={at("creative_summary")}>
            <Textarea rows={4} value={dna.creative_summary} maxLength={600} onChange={(e) => set({ creative_summary: e.target.value })} />
          </Field>
          <Field label="Intent" error={at("content_intent")}>
            <Input value={dna.content_intent} maxLength={280} autoComplete="off" onChange={(e) => set({ content_intent: e.target.value })} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary archetype" error={at("primary_archetype")}>
              <select
                value={dna.primary_archetype.slug}
                onChange={(e) => set({ primary_archetype: { ...dna.primary_archetype, slug: e.target.value as CreativeDna["primary_archetype"]["slug"] } })}
                className={select}
              >
                <ArchetypeOptions />
              </select>
            </Field>
            <Field label="Objective" error={at("marketing_objective")}>
              <select
                value={dna.marketing_objective.slug}
                onChange={(e) => set({ marketing_objective: { ...dna.marketing_objective, slug: e.target.value as CreativeDna["marketing_objective"]["slug"] } })}
                className={select}
              >
                <Options dimension="objective" />
              </select>
            </Field>
          </div>

          <FieldGroup legend="Secondary archetypes (up to 3)" error={at("secondary_archetypes")}>
            <div className="grid gap-2 sm:grid-cols-3">
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
          </FieldGroup>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <Field label="Hook technique" error={at("hook.technique")}>
              <select value={dna.hook.technique} onChange={(e) => set({ hook: { ...dna.hook, technique: e.target.value as CreativeDna["hook"]["technique"] } })} className={select}>
                <Options dimension="hook_technique" />
              </select>
            </Field>
            <Field label="Hook as written (exactly)" error={at("hook.observed_text")}>
              <Input
                value={dna.hook.observed_text ?? ""}
                maxLength={240}
                autoComplete="off"
                onChange={(e) => set({ hook: { ...dna.hook, observed_text: e.target.value || null } })}
              />
            </Field>
          </div>

          <div>
            <Field label="Narrative pattern" error={at("narrative.pattern")} className="sm:max-w-56">
              <select value={dna.narrative.pattern} onChange={(e) => set({ narrative: { ...dna.narrative, pattern: e.target.value as CreativeDna["narrative"]["pattern"] } })} className={select}>
                <Options dimension="narrative_pattern" />
              </select>
            </Field>
            <Field label="Arc" error={at("narrative.arc")} className="mt-3">
              <Textarea rows={2} value={dna.narrative.arc} maxLength={400} onChange={(e) => set({ narrative: { ...dna.narrative, arc: e.target.value } })} />
            </Field>
            <FieldGroup legend="Slide roles (by position)" error={at("narrative.slide_roles")} className="mt-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {dna.narrative.slide_roles.map((s, i) => (
                  <label key={s.position} className="flex items-center gap-2">
                    <span className="w-5 text-right font-mono text-micro text-muted-foreground tabular-nums">{s.position}</span>
                    <select
                      aria-label={`Role of position ${s.position}`}
                      value={s.role}
                      onChange={(e) =>
                        set({ narrative: { ...dna.narrative, slide_roles: dna.narrative.slide_roles.map((r, j) => (j === i ? { ...r, role: e.target.value as typeof r.role } : r)) } })
                      }
                      className={select}
                    >
                      <Options dimension="slide_role" />
                    </select>
                  </label>
                ))}
              </div>
            </FieldGroup>
          </div>

          <FieldGroup legend="Why it might work (2 to 4 hypotheses; evidence kept)" error={at("creative_rationale")}>
            <div className="space-y-2">
              {dna.creative_rationale.map((r, i) => (
                <Textarea
                  key={i}
                  aria-label={`Hypothesis ${i + 1}`}
                  rows={2}
                  value={r.hypothesis}
                  maxLength={320}
                  onChange={(e) => set({ creative_rationale: dna.creative_rationale.map((x, j) => (j === i ? { ...x, hypothesis: e.target.value } : x)) })}
                />
              ))}
            </div>
          </FieldGroup>

          <List label="Takeaways" items={dna.takeaways} min={3} max={5} error={at("takeaways")} onChange={(takeaways) => set({ takeaways })} />
          <List label="Adaptation ideas" items={dna.adaptation_ideas} min={1} max={3} error={at("adaptation_ideas")} onChange={(adaptation_ideas) => set({ adaptation_ideas })} />
        </div>

        {/* What the last save attempt refused, then what the validator asks to be checked.
            Notice's words are one paragraph, so each line is a block span inside it */}
        {problems.length > 0 && (
          <Notice tone="danger" live className="mt-4">
            {problems.map((p, i) => (
              <span key={`e${i}`} className="block">
                {p.message}
                {p.path && <span className="font-mono"> ({p.path})</span>}
              </span>
            ))}
          </Notice>
        )}
        {verdict.warnings.length > 0 && (
          <Notice className="mt-4">
            {verdict.warnings.map((w, i) => (
              <span key={`w${i}`} className="block">
                Check: {w.message}
              </span>
            ))}
          </Notice>
        )}
        {error && (
          <Notice tone="danger" live className="mt-3">
            {error}
          </Notice>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="default" size="sm" disabled={!!busy} onClick={() => save(true, true)}>
            {busy === "publish" ? "Publishing…" : "Save, approve and publish"}
          </Button>
          <Button variant="secondary" size="sm" disabled={!!busy} onClick={() => save(true, false)}>
            {busy === "approve" ? "Saving…" : "Save and approve"}
          </Button>
          <Button type="submit" variant="secondary" size="sm" disabled={!!busy}>
            {busy === "save" ? "Saving…" : "Save for review"}
          </Button>
          <Button variant="secondary" size="sm" disabled={!!busy} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Section>
    </form>
  );
}
