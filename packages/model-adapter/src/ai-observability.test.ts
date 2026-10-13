// LLM analytics for the research CLI: each model call is a generation with its model, tokens and
// status, each Curatit call it makes is a span under that generation, and the credential never
// reaches either. A failed model call is recorded as an error and still thrown.
import { describe, expect, it } from "vitest";
import type { AiObserver } from "./ai-observability.js";
import { anthropicProvider, scriptedProvider } from "./providers.js";
import { functionsFromOpenApi } from "./schema-adapters.js";
import { runToolLoop } from "./tool-loop.js";

function recorder() {
  const generations: Parameters<AiObserver["captureGeneration"]>[0][] = [];
  const spans: Parameters<AiObserver["captureSpan"]>[0][] = [];
  let n = 0;
  const observer: AiObserver = {
    createTraceId: () => "trace-1",
    createSpanId: () => `span-${++n}`,
    captureGeneration: (generation) => void generations.push(generation),
    captureSpan: (span) => void spans.push(span),
    shutdown: async () => {},
  };
  return { observer, generations, spans };
}

const doc = {
  paths: {
    "/api/v1/posts/search": { post: { operationId: "searchPosts", requestBody: { content: { "application/json": { schema: { type: "object", properties: { query: { type: "string" } } } } } } } },
  },
};

describe("model calls", () => {
  it("records a generation with the model, tokens and status, and hands back its span id", async () => {
    const { observer, generations } = recorder();
    const fetchImpl: typeof fetch = async () =>
      Response.json({
        content: [{ type: "tool_use", id: "t1", name: "searchPosts", input: { query: "cola" } }],
        stop_reason: "tool_use",
        usage: { input_tokens: 120, output_tokens: 30, cache_read_input_tokens: 5 },
      });
    const provider = anthropicProvider({ apiKey: "sk-test", model: "claude-test", fetch: fetchImpl });
    const turn = await provider.turn({ system: "s", messages: [{ role: "user", content: "find cola" }], functions: functionsFromOpenApi(doc), signal: new AbortController().signal, observability: observer, traceId: "trace-1" });
    expect(turn.generationSpanId).toBe("span-1");
    expect(generations).toHaveLength(1);
    expect(generations[0]).toMatchObject({ traceId: "trace-1", spanId: "span-1", model: "claude-test", inputTokens: 120, outputTokens: 30, cacheReadTokens: 5, httpStatus: 200, stopReason: "tool_use" });
    expect(JSON.stringify(generations)).not.toContain("sk-test");
  });

  it("records a failed call as an error and still throws", async () => {
    const { observer, generations } = recorder();
    const provider = anthropicProvider({ apiKey: "sk-test", fetch: async () => new Response("overloaded", { status: 529 }) });
    await expect(provider.turn({ system: "s", messages: [{ role: "user", content: "x" }], functions: [], signal: new AbortController().signal, observability: observer, traceId: "trace-1" })).rejects.toThrow("529");
    expect(generations[0]).toMatchObject({ httpStatus: 529, error: "Model API answered 529" });
  });

  it("records nothing without an observer", async () => {
    const provider = anthropicProvider({ apiKey: "k", fetch: async () => Response.json({ content: [{ type: "text", text: "hi" }], stop_reason: "end_turn" }) });
    const turn = await provider.turn({ system: "s", messages: [{ role: "user", content: "x" }], functions: [], signal: new AbortController().signal });
    expect(turn).toMatchObject({ text: "hi", stop: true, generationSpanId: undefined });
  });
});

describe("tool calls", () => {
  it("records each Curatit call as a span under the generation that asked for it, without the token", async () => {
    const { observer, spans } = recorder();
    const provider = scriptedProvider([
      { text: null, toolCalls: [{ id: "1", name: "searchPosts", arguments: { query: "cola" } }], stop: false, generationSpanId: "gen-1" },
      { text: "Done.", toolCalls: [], stop: true },
    ]);
    const fetchImpl: typeof fetch = async () => Response.json({ data: { posts: [] } });
    await runToolLoop(provider, { baseUrl: "https://curatit.test", token: "curatit_pat_secret", fetch: fetchImpl }, functionsFromOpenApi(doc), "find cola", { observability: observer });
    expect(spans).toHaveLength(1);
    expect(spans[0]).toMatchObject({ traceId: "trace-1", parentId: "gen-1", name: "searchPosts", input: { query: "cola" }, isError: false });
    expect(JSON.stringify(spans)).not.toContain("curatit_pat_secret");
  });
});
