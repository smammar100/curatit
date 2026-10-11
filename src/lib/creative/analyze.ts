// Creative Intelligence: one post through the model. Perception looks at every slide (in chunks
// for long carousels, each chunk answering for exactly its own positions), then synthesis opens
// the slides again and writes the Creative DNA, checking those records, the caption and the
// metadata against the images. Every answer goes through the zod contract and the deterministic
// validator; one that fails gets a single repair attempt with the problems spelled out, and then
// the post fails as invalid output for a person to look at. Three things are settled here rather
// than by the model: a blank frame is recorded the same way every time, a slide's hex colours are
// the ones measured from its pixels, and each slide's role is the one the narrative gives it.
// Nothing here writes to the database: the worker saves the result.
import { z } from "zod";
import type { Swatch } from "./colours";
import { fingerprint } from "./fingerprint";
import { addUsage, ModelError, NO_USAGE, type GenerateRequest, type ImageInput, type ModelAdapter, type Usage } from "./model";
import { PROMPT_VERSION } from "./pipeline";
import { perceptionPrompt, PERCEPTION_SYSTEM, repairPrompt, synthesisPrompt, SYNTHESIS_SYSTEM, type Manifest } from "./prompt";
import { CreativeDnaOutput, Perception, type CreativeDna, type SlideObservation } from "./schema";
import { TAXONOMY_VERSION } from "./taxonomy";
import { validateDna, validatePerception, type Issue, type Verdict } from "./validate";

const PERCEPTION_SCHEMA = z.toJSONSchema(Perception, { target: "draft-7" });
const DNA_SCHEMA = z.toJSONSchema(CreativeDnaOutput, { target: "draft-7" });

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

// A blank frame has nothing on it to read, whatever the model made of it
export function blankSlide(slide: SlideObservation, wasVideo: boolean): SlideObservation {
  return {
    ...slide,
    visible_text: { headline: null, body: null },
    legibility: "no-text",
    text_density: "none",
    typography: { classes: ["none"], weight: "none" },
    imagery: [wasVideo ? "video-frame" : "unknown"],
    devices: ["none"],
    product_prominence: "unknown",
    people_prominence: "unknown",
    objects: [],
    brand_treatment: null,
    observation: wasVideo
      ? "Blank: the saved cover frame of this video slide is one flat colour, so what the video shows can't be told."
      : "Blank: one flat colour with nothing on it.",
    confidence: "low",
  };
}

// The slide's hex values are the colours measured from its pixels, largest share first; the
// model's colour families (words) stay. Without a measurement the model's own values are kept
export function withMeasuredColours(slide: SlideObservation, colours: Swatch[] | undefined): SlideObservation {
  if (!colours?.length) return slide;
  return { ...slide, palette: { ...slide.palette, hex: colours.slice(0, 5).map((colour) => colour.hex) } };
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
  const blank = new Map(images.filter((image) => image.blank).map((image) => [image.position, image.wasVideo]));
  const measured = new Map(images.map((image) => [image.position, image.colours]));
  const perceived: Perception = {
    ...answers[0],
    slides: answers
      .flatMap((answer) => answer.slides)
      .sort((a, b) => a.position - b.position)
      .map((slide) => (blank.has(slide.position) ? blankSlide(slide, blank.get(slide.position)!) : slide))
      .map((slide) => withMeasuredColours(slide, measured.get(slide.position))),
    conflicts: [...new Set(answers.flatMap((answer) => answer.conflicts))].slice(0, 6),
  };
  const read = validatePerception(perceived, post);
  if (read.errors.length) {
    throw new ModelError("invalid_output", `The slide records don't add up: ${describe(read.errors).join("; ")}`, meter.usage, perceived);
  }
  // A blank slide says so once, rather than also as a low-confidence reading
  const blankWarnings = [...blank.keys()].map((position) => ({ code: "blank_slide", message: `Slide ${position} is blank (one flat colour), so nothing on it was analysed`, path: `slides.${position}` }));
  const readWarnings = [...read.warnings.filter((issue) => !(issue.code === "low_confidence_slide" && blank.has(Number(issue.path?.split(".")[1])))), ...blankWarnings];

  // Synthesis looks at every slide again. The slide counts are facts, not the model's to decide
  const { value: dna, verdict } = await ask(
    adapter,
    meter,
    { task: "synthesis", system: SYNTHESIS_SYSTEM, prompt: synthesisPrompt(manifest, perceived, images), schema: DNA_SCHEMA, images, workdir },
    CreativeDnaOutput.transform((value) => ({
      ...value,
      quality: { ...value.quality, expected_slides: expected, processed_slides: perceived.slides.length, image_analysis_complete: perceived.slides.length === expected },
    })),
    (value) => validateDna(value, post, perceived),
  );

  // The narrative judges each slide in the whole sequence (perception may only have seen part of
  // it), so its role is the one kept, and the slide records and the DNA never disagree
  const roles = new Map(dna.narrative.slide_roles.map((entry) => [entry.position, entry.role]));
  const perception: Perception = { ...perceived, slides: perceived.slides.map((slide) => ({ ...slide, role: roles.get(slide.position) ?? slide.role })) };

  const warnings = [...readWarnings, ...verdict.warnings];
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
