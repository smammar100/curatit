"use client";

// Editing a version's Creative DNA. The edit is checked with the same contract and validator the
// worker uses (no performance claims, quotes really in the caption, every slide given a role…)
// and saved as a new version, so the AI's original stays in the history. Slide roles edited here
// update both the narrative and the slide records.
//
// Since 2026-10-24 every field is Glaze's: a Field with its FieldLabel around an Input, a Textarea
// or a NativeSelect (the platform select on the field pill, which keeps the archetypes' optgroups),
// and a FieldSet with a label-sized legend over each set (the lists, the slide roles). A save the
// validator refuses lists every problem above the buttons in a fail Alert, and marks the field
// each one is about (by its path) with the problem in its FieldError. The textareas take a soft
// `limit` (a counter near the end, invalid past it) where they had a hard maxLength; the contract
// refuses anything longer on save as before.
import { useMemo, useState, type ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/glaze/ui/alert";
import { Button } from "@/components/glaze/ui/button";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/glaze/ui/field";
import { Input } from "@/components/glaze/ui/input";
import { NativeSelect } from "@/components/glaze/ui/select";
import { Textarea } from "@/components/glaze/ui/textarea";
import { Add, Close, Icon } from "@/components/glaze/icon";
import { CreativeDna, type SlideObservation } from "@/lib/creative/schema";
import { DIMENSIONS, TAXONOMY_VERSION, type Dimension } from "@/lib/creative/taxonomy";
import { validateDna, type Issue } from "@/lib/creative/validate";
import { track } from "@/lib/analytics";
import { saveEdit, type Version } from "./data";
import { Section, useBusy } from "./parts";

// The problems the last save attempt found at a path or inside it ("takeaways" holds
// "takeaways.2"), as one line for that field's error; undefined when there are none
function problemsAt(problems: Issue[], path: string) {
  const here = problems.filter((p) => p.path === path || p.path?.startsWith(`${path}.`));
  return here.length ? here.map((p) => p.message).join("; ") : undefined;
}

// The last refused save's problem with a field, under it
function Problem({ error }: { error?: string }) {
  return error ? <FieldError>{error}</FieldError> : null;
}

// A set of controls under one question, each named with its own aria-label
function Set({ legend, error, className, children }: { legend: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <FieldSet className={className}>
      <FieldLegend variant="label">{legend}</FieldLegend>
      {children}
      <Problem error={error} />
    </FieldSet>
  );
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
    <Set legend={`${label} (${min} to ${max})`} error={error}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <Textarea
              aria-label={`${label} ${i + 1}`}
              rows={rows}
              value={item}
              onValueChange={(value) => onChange(items.map((x, j) => (j === i ? value : x)))}
              className="min-w-0 flex-1"
            />
            {items.length > min && (
              <Button variant="ghost" size="icon-sm" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Icon icon={Close} />
              </Button>
            )}
          </div>
        ))}
      </div>
      {items.length < max && (
        <Button variant="ghost" size="sm" onClick={() => onChange([...items, ""])} className="-ms-2 self-start">
          <Icon icon={Add} />
          Add
        </Button>
      )}
    </Set>
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
  // While one save runs the other buttons wait; the running one keeps its name and shows its arc
  const waiting = (name: string) => !!busy && busy !== name;
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
          <Field invalid={!!at("concept")}>
            <FieldLabel>Concept</FieldLabel>
            <Input value={dna.concept} maxLength={160} autoComplete="off" onValueChange={(concept) => set({ concept })} />
            <Problem error={at("concept")} />
          </Field>
          {/* Creative Intelligence 3.0: the line the post page leads with */}
          {dna.strategy_headline !== undefined && (
            <>
              <Field invalid={!!at("strategy_headline")}>
                <FieldLabel>Strategy headline (8 to 14 words)</FieldLabel>
                <Input value={dna.strategy_headline} maxLength={110} autoComplete="off" onValueChange={(strategy_headline) => set({ strategy_headline })} />
                <Problem error={at("strategy_headline")} />
              </Field>
              <Field invalid={!!at("strategy_summary")}>
                <FieldLabel>Strategy summary (one or two sentences)</FieldLabel>
                <Textarea rows={2} value={dna.strategy_summary ?? ""} limit={280} onValueChange={(strategy_summary) => set({ strategy_summary })} />
                <Problem error={at("strategy_summary")} />
              </Field>
            </>
          )}
          <Field invalid={!!at("creative_summary")}>
            <FieldLabel>Summary</FieldLabel>
            <Textarea rows={4} value={dna.creative_summary} limit={600} onValueChange={(creative_summary) => set({ creative_summary })} />
            <Problem error={at("creative_summary")} />
          </Field>
          <Field invalid={!!at("content_intent")}>
            <FieldLabel>Intent</FieldLabel>
            <Input value={dna.content_intent} maxLength={280} autoComplete="off" onValueChange={(content_intent) => set({ content_intent })} />
            <Problem error={at("content_intent")} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field invalid={!!at("primary_archetype")}>
              <FieldLabel>Primary archetype</FieldLabel>
              <NativeSelect
                value={dna.primary_archetype.slug}
                onChange={(e) => set({ primary_archetype: { ...dna.primary_archetype, slug: e.target.value as CreativeDna["primary_archetype"]["slug"] } })}
              >
                <ArchetypeOptions />
              </NativeSelect>
              <Problem error={at("primary_archetype")} />
            </Field>
            <Field invalid={!!at("marketing_objective")}>
              <FieldLabel>Objective</FieldLabel>
              <NativeSelect
                value={dna.marketing_objective.slug}
                onChange={(e) => set({ marketing_objective: { ...dna.marketing_objective, slug: e.target.value as CreativeDna["marketing_objective"]["slug"] } })}
              >
                <Options dimension="objective" />
              </NativeSelect>
              <Problem error={at("marketing_objective")} />
            </Field>
          </div>

          <Set legend="Secondary archetypes (up to 3)" error={at("secondary_archetypes")}>
            <div className="grid gap-2 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <NativeSelect
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
                >
                  <option value="">None</option>
                  <ArchetypeOptions />
                </NativeSelect>
              ))}
            </div>
          </Set>

          {/* The technique a fixed column wide from sm, the hook's words the rest of the row */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Field invalid={!!at("hook.technique")} className="sm:w-56 sm:flex-none">
              <FieldLabel>Hook technique</FieldLabel>
              <NativeSelect value={dna.hook.technique} onChange={(e) => set({ hook: { ...dna.hook, technique: e.target.value as CreativeDna["hook"]["technique"] } })}>
                <Options dimension="hook_technique" />
              </NativeSelect>
              <Problem error={at("hook.technique")} />
            </Field>
            <Field invalid={!!at("hook.observed_text")} className="sm:flex-1">
              <FieldLabel>Hook as written (exactly)</FieldLabel>
              <Input
                value={dna.hook.observed_text ?? ""}
                maxLength={240}
                autoComplete="off"
                onValueChange={(text) => set({ hook: { ...dna.hook, observed_text: text || null } })}
              />
              <Problem error={at("hook.observed_text")} />
            </Field>
          </div>

          <div>
            <Field invalid={!!at("narrative.pattern")} className="sm:max-w-56">
              <FieldLabel>Narrative pattern</FieldLabel>
              <NativeSelect value={dna.narrative.pattern} onChange={(e) => set({ narrative: { ...dna.narrative, pattern: e.target.value as CreativeDna["narrative"]["pattern"] } })}>
                <Options dimension="narrative_pattern" />
              </NativeSelect>
              <Problem error={at("narrative.pattern")} />
            </Field>
            <Field invalid={!!at("narrative.arc")} className="mt-3">
              <FieldLabel>Arc</FieldLabel>
              <Textarea rows={2} value={dna.narrative.arc} limit={400} onValueChange={(arc) => set({ narrative: { ...dna.narrative, arc } })} />
              <Problem error={at("narrative.arc")} />
            </Field>
            <Set legend="Slide roles (by position)" error={at("narrative.slide_roles")} className="mt-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {dna.narrative.slide_roles.map((s, i) => (
                  <label key={s.position} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-end type-caption text-text-2 tabular-nums">{s.position}</span>
                    <NativeSelect
                      aria-label={`Role of position ${s.position}`}
                      value={s.role}
                      onChange={(e) =>
                        set({ narrative: { ...dna.narrative, slide_roles: dna.narrative.slide_roles.map((r, j) => (j === i ? { ...r, role: e.target.value as typeof r.role } : r)) } })
                      }
                    >
                      <Options dimension="slide_role" />
                    </NativeSelect>
                  </label>
                ))}
              </div>
            </Set>
          </div>

          <Set legend="Why it might work (2 to 4 hypotheses; evidence kept)" error={at("creative_rationale")}>
            <div className="space-y-2">
              {dna.creative_rationale.map((r, i) => (
                <Textarea
                  key={i}
                  aria-label={`Hypothesis ${i + 1}`}
                  rows={2}
                  value={r.hypothesis}
                  limit={320}
                  onValueChange={(hypothesis) => set({ creative_rationale: dna.creative_rationale.map((x, j) => (j === i ? { ...x, hypothesis } : x)) })}
                />
              ))}
            </div>
          </Set>

          <List label="Takeaways" items={dna.takeaways} min={3} max={5} error={at("takeaways")} onChange={(takeaways) => set({ takeaways })} />
          <List label="Adaptation ideas" items={dna.adaptation_ideas} min={1} max={3} error={at("adaptation_ideas")} onChange={(adaptation_ideas) => set({ adaptation_ideas })} />
        </div>

        {/* What the last save attempt refused (announced), then what the validator asks to be
            checked (part of the form, read in order with it) */}
        {problems.length > 0 && (
          <Alert status="fail" className="mt-4">
            <AlertDescription>
              {problems.map((p, i) => (
                <span key={`e${i}`} className="block">
                  {p.message}
                  {p.path && <span className="mono"> ({p.path})</span>}
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}
        {verdict.warnings.length > 0 && (
          <Alert announce={false} className="mt-4">
            <AlertDescription>
              {verdict.warnings.map((w, i) => (
                <span key={`w${i}`} className="block">
                  Check: {w.message}
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert status="fail" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" pending={busy === "publish"} pendingLabel="Publishing" disabled={waiting("publish")} onClick={() => save(true, true)}>
            Save, approve and publish
          </Button>
          <Button variant="secondary" size="sm" pending={busy === "approve"} pendingLabel="Saving" disabled={waiting("approve")} onClick={() => save(true, false)}>
            Save and approve
          </Button>
          <Button type="submit" variant="secondary" size="sm" pending={busy === "save"} pendingLabel="Saving" disabled={waiting("save")}>
            Save for review
          </Button>
          <Button variant="secondary" size="sm" disabled={!!busy} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Section>
    </form>
  );
}
