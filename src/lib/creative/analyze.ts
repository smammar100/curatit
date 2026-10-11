// Creative Intelligence: one post through the model. Perception looks at every slide (in chunks
// for long carousels, each chunk answering for exactly its own positions), then synthesis writes
// the Creative DNA from those notes, the caption and the metadata. Every answer goes through the
// zod contract and the deterministic validator; one that fails gets a single repair attempt with
// the problems spelled out, and then the post fails as invalid output for a person to look at.
// Nothing here writes to the database: the worker saves the result.
import { z } from "zod";
import { fingerprint } from "./fingerprint";
import { addUsage, ModelError, NO_USAGE, type GenerateRequest, type ImageInput, type ModelAdapter, type Usage } from "./model";
import { PROMPT_VERSION } from "./pipeline";
import { perceptionPrompt, PERCEPTION_SYSTEM, repairPrompt, synthesisPrompt, SYNTHESIS_SYSTEM, type Manifest } from "./prompt";
import { CreativeDna, Perception, type SlideObservation } from "./schema";
import { TAXONOMY_VERSION } from "./taxonomy";
import { validateDna, validatePerception, type Issue, type Verdict } from "./validate";

const PERCEPTION_SCHEMA = z.toJSONSchema(Perception, { target: "draft-7" });
const DNA_SCHEMA = z.toJSONSchema(CreativeDna, { target: "draft-7" });

export type VersionPayload = {
  summary: string;
  hook: string | null;
  why_it_works: string;
  takeaways: string[];
  creative_dna: CreativeDna;
  perception: Perception;
  input_fingerprint: string;
  model_id: string;
  prompt_version: string;
  taxonomy_version: string;
  validation: { errors: Issue[]; warnings: Issue[] };
  image_analysis_complete: boolean;
  expected_slides: number;
  processed_slides: number;
  review_status: "needs_review";
};

export type Analysis = {
  version: VersionPayload;
  slides: SlideObservation[];
  verdict: Verdict;
  usage: Usage;
  // Every structured answer, for the run's audit record
  outputs: unknown[];
};

// The post can't be analysed now (or ever, as far as this pipeline goes)
export function gate(manifest: Manifest) {
  if (!manifest.is_published) throw new ModelError("unsupported", "The post isn't published");
  if (manifest.format === "video") throw new ModelError("unsupported", "Video posts aren't analysed yet (no frame extraction)");
  if (!manifest.media.complete || manifest.images.length !== manifest.media.expected) {
    throw new ModelError("missing_media", `${manifest.media.image_files} of ${manifest.media.expected} images are saved`);
  }
}

export function inputFingerprint(manifest: Manifest, model: string) {
  return fingerprint({
    postId: manifest.id,
    caption: manifest.caption,
    brand: manifest.brand.slug ?? "",
    category: manifest.category.slug ?? "",
    images: manifest.images.map((image) => ({ position: image.position, path: `${image.bucket}/${image.path}`, tag: image.etag ?? `${image.size}` })),
    model,
    promptVersion: PROMPT_VERSION,
    taxonomyVersion: TAXONOMY_VERSION,
  });
}

// Split into as few chunks as the limit allows, as even as possible (13 at 10 a call: 7 and 6)
export function chunks<T>(list: T[], size: number): T[][] {
  if (!list.length) return [];
  const count = Math.ceil(list.length / Math.max(1, size));
  const per = Math.ceil(list.length / count);
  return Array.from({ length: count }, (_, i) => list.slice(i * per, (i + 1) * per)).filter((part) => part.length);
}

const describe = (issues: Issue[]) => issues.map((issue) => `${issue.path ? `${issue.path}: ` : ""}${issue.message}`);
const zodIssues = (error: z.ZodError): Issue[] => error.issues.slice(0, 20).map((issue) => ({ code: "schema", message: issue.message, path: issue.path.join(".") }));

type Meter = { usage: Usage; outputs: unknown[]; maxUsd: number };

async function call(adapter: ModelAdapter, meter: Meter, request: Omit<GenerateRequest, "maxUsd">) {
  const remaining = meter.maxUsd - meter.usage.costUsd;
  if (remaining <= 0) throw new ModelError("budget", `The post reached its $${meter.maxUsd.toFixed(2)} budget`, meter.usage);
  try {
    const result = await adapter.generate({ ...request, maxUsd: remaining });
    meter.usage = addUsage(meter.usage, result.usage);
    meter.outputs.push(result.output);
    return result.output;
  } catch (error) {
    if (error instanceof ModelError) {
      meter.usage = addUsage(meter.usage, error.usage);
      throw new ModelError(error.kind, error.message, meter.usage, error.output);
    }
    throw error;
  }
}

// Ask, check, and if the checks fail ask once more with the problems
async function ask<T>(
  adapter: ModelAdapter,
  meter: Meter,
  request: Omit<GenerateRequest, "maxUsd">,
  schema: z.ZodType<T>,
  check: (value: T) => Verdict,
): Promise<{ value: T; verdict: Verdict }> {
  let prompt = request.prompt;
  for (let attempt = 0; ; attempt++) {
    const output = await call(adapter, meter, { ...request, prompt });
    const parsed = schema.safeParse(output);
    const verdict = parsed.success ? check(parsed.data) : { errors: zodIssues(parsed.error), warnings: [] };
    if (parsed.success && !verdict.errors.length) return { value: parsed.data, verdict };
    if (attempt >= 1) {
      throw new ModelError("invalid_output", `The ${request.task} still failed its checks: ${describe(verdict.errors).slice(0, 5).join("; ")}`, meter.usage, output);
    }
    prompt = repairPrompt(request.prompt, output, describe(verdict.errors));
  }
}

function sameSlides(output: Perception, positions: number[]): Verdict {
  const got = output.slides.map((slide) => slide.position).sort((a, b) => a - b);
  const want = [...positions].sort((a, b) => a - b);
  if (JSON.stringify(got) === JSON.stringify(want)) return { errors: [], warnings: [] };
  return { errors: [{ code: "wrong_slides", message: `Answered for slides [${got.join(", ")}]; expected exactly [${want.join(", ")}]`, path: "slides" }], warnings: [] };
}

export async function analyzePost(options: {
  manifest: Manifest;
  images: ImageInput[];
  adapter: ModelAdapter;
  maxUsd: number;
  slidesPerCall: number;
  workdir: string;
}): Promise<Analysis> {
  const { manifest, images, adapter, workdir } = options;
  gate(manifest);
  const expected = manifest.media.expected;
  if (images.length !== expected) throw new ModelError("missing_media", `${images.length} of ${expected} images were prepared`);
  const post = { caption: manifest.caption, expectedSlides: expected };
  const meter: Meter = { usage: NO_USAGE, outputs: [], maxUsd: options.maxUsd };

  // Perception, chunk by chunk
  const parts = chunks(images, options.slidesPerCall);
  const answers: Perception[] = [];
  for (const [index, part] of parts.entries()) {
    const positions = part.map((image) => image.position);
    const { value } = await ask(
      adapter,
      meter,
      {
        task: "perception",
        system: PERCEPTION_SYSTEM,
        prompt: perceptionPrompt(manifest, part, { index, count: parts.length }),
        schema: PERCEPTION_SCHEMA,
        images: part,
        workdir,
      },
      Perception,
      (output) => sameSlides(output, positions),
    );
    answers.push(value);
  }
  const perception: Perception = {
    ...answers[0],
    slides: answers.flatMap((answer) => answer.slides).sort((a, b) => a.position - b.position),
    conflicts: [...new Set(answers.flatMap((answer) => answer.conflicts))].slice(0, 6),
  };
  const perceived = validatePerception(perception, post);
  if (perceived.errors.length) {
    throw new ModelError("invalid_output", `The slide notes don't add up: ${describe(perceived.errors).join("; ")}`, meter.usage, perception);
  }

  // Synthesis. The slide counts are facts, not the model's to decide
  const { value: dna, verdict } = await ask(
    adapter,
    meter,
    { task: "synthesis", system: SYNTHESIS_SYSTEM, prompt: synthesisPrompt(manifest, perception), schema: DNA_SCHEMA, images: [], workdir },
    CreativeDna.transform((value) => ({
      ...value,
      quality: { ...value.quality, expected_slides: expected, processed_slides: perception.slides.length, image_analysis_complete: perception.slides.length === expected },
    })),
    (value) => validateDna(value, post, perception),
  );

  const warnings = [...perceived.warnings, ...verdict.warnings];
  return {
    version: {
      summary: dna.creative_summary,
      hook: dna.hook.observed_text ?? dna.concept,
      why_it_works: dna.creative_rationale.map((item) => item.hypothesis).join("\n\n"),
      takeaways: dna.takeaways,
      creative_dna: dna,
      perception,
      input_fingerprint: inputFingerprint(manifest, adapter.model),
      model_id: adapter.model,
      prompt_version: PROMPT_VERSION,
      taxonomy_version: TAXONOMY_VERSION,
      validation: { errors: [], warnings },
      image_analysis_complete: dna.quality.image_analysis_complete,
      expected_slides: expected,
      processed_slides: perception.slides.length,
      review_status: "needs_review",
    },
    slides: perception.slides,
    verdict: { errors: [], warnings },
    usage: meter.usage,
    outputs: meter.outputs,
  };
}
