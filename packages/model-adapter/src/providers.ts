// Model providers for the tool loop: the Anthropic Messages API over fetch (no SDK), and a
// scripted provider for tests. Vendor envelopes stay in here; the loop sees ModelTurns.

import type { Message, ModelProvider, ModelTurn } from "./tool-loop.js";
import { toAnthropicTools } from "./schema-adapters.js";

type AnthropicContent = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown } | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

function toAnthropicMessages(messages: Message[]) {
  return messages.map((m) => {
    if (m.role === "user") return { role: "user", content: m.content };
    if (m.role === "assistant") {
      const content: AnthropicContent[] = [];
      if (m.content) content.push({ type: "text", text: m.content });
      for (const c of m.toolCalls) content.push({ type: "tool_use", id: c.id, name: c.name, input: c.arguments ?? {} });
      return { role: "assistant", content };
    }
    return { role: "user", content: m.results.map((r): AnthropicContent => ({ type: "tool_result", tool_use_id: r.id, content: r.result, is_error: r.isError || undefined })) };
  });
}

export function anthropicProvider(options: { apiKey: string; model?: string; fetch?: typeof fetch; maxTokens?: number }): ModelProvider {
  const f = options.fetch ?? fetch;
  return {
    async turn({ system, messages, functions, signal, observability, traceId }) {
      const model = options.model ?? "claude-sonnet-5-5";
      const tools = toAnthropicTools(functions);
      const input = [{ role: "system", content: system }, ...toAnthropicMessages(messages)];
      const started = Date.now();
      const generationSpanId = observability?.createSpanId();
      let status: number | undefined;
      try {
        const res = await f("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal,
          headers: { "content-type": "application/json", "x-api-key": options.apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model, max_tokens: options.maxTokens ?? 2048, system, tools, messages: toAnthropicMessages(messages) }),
        });
        status = res.status;
        if (!res.ok) throw new Error(`Model API answered ${res.status}`);
        const body = (await res.json()) as { content: AnthropicContent[]; stop_reason: string; usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number } };
        const text = body.content.filter((c): c is { type: "text"; text: string } => c.type === "text").map((c) => c.text).join("\n") || null;
        const toolCalls = body.content.filter((c): c is { type: "tool_use"; id: string; name: string; input: unknown } => c.type === "tool_use").map((c) => ({ id: c.id, name: c.name, arguments: c.input }));
        if (observability && traceId && generationSpanId) {
          observability.captureGeneration({
            traceId,
            spanId: generationSpanId,
            model,
            input,
            output: body.content,
            inputTokens: body.usage?.input_tokens,
            outputTokens: body.usage?.output_tokens,
            cacheReadTokens: body.usage?.cache_read_input_tokens,
            cacheWriteTokens: body.usage?.cache_creation_input_tokens,
            latencySeconds: (Date.now() - started) / 1000,
            httpStatus: status,
            stopReason: body.stop_reason,
            tools,
          });
        }
        return { text, toolCalls, stop: body.stop_reason !== "tool_use", generationSpanId };
      } catch (error) {
        if (observability && traceId && generationSpanId) {
          observability.captureGeneration({
            traceId,
            spanId: generationSpanId,
            model,
            input,
            latencySeconds: (Date.now() - started) / 1000,
            httpStatus: status,
            tools,
            error: String((error as Error).message ?? error),
          });
        }
        throw error;
      }
    },
  };
}

// Plays back a script of turns; for tests and for exercising the loop without a model
export function scriptedProvider(turns: ModelTurn[]): ModelProvider & { seen: Message[][] } {
  let i = 0;
  const seen: Message[][] = [];
  return {
    seen,
    async turn({ messages }) {
      seen.push([...messages]);
      const turn = turns[Math.min(i, turns.length - 1)];
      i++;
      return turn;
    },
  };
}
