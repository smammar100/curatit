// LLM analytics for the Creative Intelligence worker: one $ai_generation per Claude Code call (its
// prompt, output, tokens and any error) with a $ai_span per image it opened, sent only when PostHog
// is configured, and never holding the queue up for more than five seconds.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sent: { event: string; properties: Record<string, unknown> }[] = [];
const shutdown = vi.fn(async (_ms?: number) => {});
vi.mock("posthog-node", () => ({
  PostHog: class {
    capture(message: { event: string; properties: Record<string, unknown> }) {
      sent.push(message);
    }
    shutdown = shutdown;
  },
}));

const { captureClaudeGeneration } = await import("./aiObservability");
const usage = { calls: 1, inputTokens: 100, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0, durationMs: 1500 };
const generation = { model: "sonnet", system: "Look closely.", prompt: "Describe slide 0.", output: { ok: true }, usage, readFiles: ["/tmp/00.webp", "/tmp/01.webp"] };

beforeEach(() => {
  sent.length = 0;
  shutdown.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe("captureClaudeGeneration", () => {
  it("sends a generation and a span per image opened, then flushes for at most 5 seconds", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://posthog.test");
    await captureClaudeGeneration(generation);
    expect(sent.map((m) => m.event)).toEqual(["$ai_generation", "$ai_span", "$ai_span"]);
    const [gen, span] = sent;
    expect(gen.properties).toMatchObject({ $ai_model: "sonnet", $ai_provider: "anthropic", $ai_input_tokens: 100, $ai_output_tokens: 20, $ai_latency: 1.5, $ai_is_error: false });
    expect(span.properties).toMatchObject({ $ai_parent_id: gen.properties.$ai_span_id, $ai_trace_id: gen.properties.$ai_trace_id, $ai_input_state: { file: "/tmp/00.webp" } });
    expect(shutdown).toHaveBeenCalledWith(5000);
  });

  it("marks a failed call as an error", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://posthog.test");
    await captureClaudeGeneration({ ...generation, output: undefined, readFiles: [], error: "claude didn't finish within 300s" });
    expect(sent[0].properties).toMatchObject({ $ai_is_error: true, $ai_error: "claude didn't finish within 300s" });
  });

  it("does nothing without a project token and host", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    await captureClaudeGeneration(generation);
    expect(sent).toEqual([]);
    expect(shutdown).not.toHaveBeenCalled();
  });
});
