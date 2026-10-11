// Creative Intelligence: what a model provider has to do, whichever it is. The pipeline asks for
// one structured answer at a time (a JSON Schema, optionally with images to look at) and gets back
// the parsed output and what it cost. Providers: the local Claude Code CLI on the person's own
// subscription (claudeCli.ts) and a deterministic mock for tests and dry runs (mock.ts); an
// API-key provider can be added behind the same interface.
import type { Swatch } from "./colours";
import type { FailureKind } from "./states";

export type ImageInput = {
  position: number;
  // A local file the provider can read; never a credentialed URL
  file: string;
  mimetype: string;
  // The slide was a video on Instagram; only its cover frame is saved
  wasVideo: boolean;
  // One flat colour with nothing on it (usually a video's black cover frame), measured from the
  // pixels in media.ts: there's nothing on it to read
  blank?: boolean;
  // Its main colours and their share of the image, measured from the pixels (colours.ts)
  colours?: Swatch[];
};

export type Usage = {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  // The provider's own estimate at list prices; on a subscription it is not what's billed
  costUsd: number;
  durationMs: number;
};

export const NO_USAGE: Usage = { calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0, durationMs: 0 };

export function addUsage(a: Usage, b: Usage): Usage {
  return {
    calls: a.calls + b.calls,
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
    costUsd: Math.round((a.costUsd + b.costUsd) * 1e6) / 1e6,
    durationMs: a.durationMs + b.durationMs,
  };
}

export type GenerateRequest = {
  // Which step this is, for the mock and for logs
  task: "perception" | "synthesis";
  system: string;
  prompt: string;
  // JSON Schema (draft-07) the answer must match
  schema: object;
  images: ImageInput[];
  // A private temporary folder holding the images; the provider may read nothing outside it
  workdir: string;
  // Stop if this call alone would cost more (the provider's estimate)
  maxUsd: number;
};

export type GenerateResult = { output: unknown; usage: Usage; raw?: string };

export interface ModelAdapter {
  readonly provider: string;
  readonly model: string;
  // Throws a ModelError when the provider can't be used here (signed out, wrong credentials…)
  preflight(): Promise<void>;
  generate(request: GenerateRequest): Promise<GenerateResult>;
}

// A failure with what it means for retrying (states.ts)
export class ModelError extends Error {
  constructor(
    readonly kind: FailureKind,
    message: string,
    readonly usage: Usage = NO_USAGE,
    readonly output?: unknown,
  ) {
    super(message);
    this.name = "ModelError";
  }
}
