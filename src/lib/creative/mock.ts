// Creative Intelligence: a model provider that answers instantly and for free with valid output
// shaped to the request (every requested slide at its position), for tests and dry runs. `script`
// replaces the answer of the nth call, to inject faults: throw a ModelError, or return something
// broken.
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION } from "./fixtures";
import { ModelError, type GenerateRequest, type GenerateResult, type ModelAdapter } from "./model";
import type { CreativeDna, Perception } from "./schema";

export type MockStep = (request: GenerateRequest, answer: unknown) => unknown;

export class MockAdapter implements ModelAdapter {
  readonly provider = "mock";
  readonly model = "mock";
  readonly requests: GenerateRequest[] = [];
  private readonly script: (MockStep | undefined)[];
  private readonly costUsd: number;

  constructor(options: { script?: (MockStep | undefined)[]; costUsd?: number } = {}) {
    this.script = options.script ?? [];
    this.costUsd = options.costUsd ?? 0;
  }

  async preflight() {}

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const call = this.requests.push(request) - 1;
    const answer = request.task === "perception" ? perceive(request) : synthesize(request);
    const step = this.script[call];
    const output = step ? step(request, answer) : answer;
    return {
      output,
      usage: { calls: 1, inputTokens: 1000, outputTokens: 400, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: this.costUsd, durationMs: 1 },
    };
  }
}

export function fail(kind: ConstructorParameters<typeof ModelError>[0], message: string = kind): MockStep {
  return () => {
    throw new ModelError(kind, message);
  };
}

function perceive(request: GenerateRequest): Perception {
  const perception = clone(FIXTURE_PERCEPTION);
  perception.slides = request.images.map((image, i) => ({ ...clone(FIXTURE_PERCEPTION.slides[Math.min(i, 2)]), position: image.position }));
  // The mock can't read the caption, so it quotes nothing from it
  perception.caption.hook_text = null;
  return perception;
}

// The synthesis prompt states the slide count; the mock reads it back from there
function synthesize(request: GenerateRequest): CreativeDna {
  const expected = Number(/expected_slides is (\d+)/.exec(request.prompt)?.[1] ?? 1);
  const processed = Number(/processed_slides is (\d+)/.exec(request.prompt)?.[1] ?? expected);
  const last = `slide:${Math.max(0, expected - 1)}`;
  const dna = clone(FIXTURE_DNA);
  dna.primary_archetype.evidence = ["slide:0"];
  dna.secondary_archetypes = [{ slug: "how-to-use", evidence: ["slide:0"] }];
  dna.marketing_objective.evidence = ["slide:0"];
  dna.hook = { technique: "bold-claim", observed_text: null, location: "image", evidence: ["slide:0"] };
  dna.narrative.pattern = expected === 1 ? "single-image" : "step-by-step";
  dna.narrative.slide_roles = Array.from({ length: expected }, (_, position) => ({ position, role: position === 0 ? "hook" : "step" }));
  dna.attention_mechanisms = [{ ...dna.attention_mechanisms[0], evidence: ["slide:0"] }];
  dna.creative_rationale = [
    { hypothesis: "Opening on one bold line may make the idea readable at a glance.", evidence: ["slide:0"] },
    { hypothesis: "Ending on the same ground colour may make the set feel complete.", evidence: [last] },
  ];
  dna.evidence = [{ ref: "slide:0", observation: "A single headline on a flat ground", quote: null }];
  dna.quality = { image_analysis_complete: processed === expected, expected_slides: expected, processed_slides: processed, needs_review: true, uncertainties: [] };
  dna.creative_decisions = dna.creative_decisions!.map((decision) => ({ ...decision, evidence: ["slide:0"] }));
  // The mock sees no pixels, so its colour roles are the first slide's recorded colours
  dna.colour_roles = (/"hex":\s*\[\s*"(#[0-9a-f]{6})"/i.exec(request.prompt)?.[1] ? [{ hex: /"hex":\s*\[\s*"(#[0-9a-f]{6})"/i.exec(request.prompt)![1], role: "Background" }] : []);
  return dna;
}
