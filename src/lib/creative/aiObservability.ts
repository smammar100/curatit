import { randomUUID } from "node:crypto";
import { PostHog } from "posthog-node";
import type { Usage } from "./model";

type ClaudeGeneration = {
  model: string;
  system: string;
  prompt: string;
  output?: unknown;
  usage: Usage;
  readFiles: string[];
  error?: string;
};

function client() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  // Without configuration the worker runs as before, just without traces
  if (!token || !host) return null;
  return new PostHog(token, { host, flushAt: 1, flushInterval: 0, privacyMode: false });
}

export async function captureClaudeGeneration(generation: ClaudeGeneration) {
  const posthog = client();
  if (!posthog) return;

  const traceId = randomUUID();
  const generationId = randomUUID();
  const sessionId = `creative-process-${process.pid}`;
  try {
    posthog.capture({
      distinctId: sessionId,
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_session_id: sessionId,
        $ai_span_id: generationId,
        $ai_span_name: "claude_code_generate",
        $ai_model: generation.model,
        $ai_provider: "anthropic",
        $ai_input: [
          { role: "system", content: generation.system },
          { role: "user", content: generation.prompt },
        ],
        $ai_input_tokens: generation.usage.inputTokens,
        $ai_output_choices: generation.output === undefined ? undefined : [{ role: "assistant", content: generation.output }],
        $ai_output_tokens: generation.usage.outputTokens,
        $ai_cache_read_input_tokens: generation.usage.cacheReadTokens,
        $ai_cache_creation_input_tokens: generation.usage.cacheWriteTokens,
        $ai_latency: generation.usage.durationMs / 1000,
        $ai_is_error: Boolean(generation.error),
        $ai_error: generation.error,
      },
    });
    for (const file of generation.readFiles) {
      posthog.capture({
        distinctId: sessionId,
        event: "$ai_span",
        properties: {
          $ai_trace_id: traceId,
          $ai_session_id: sessionId,
          $ai_span_id: randomUUID(),
          $ai_parent_id: generationId,
          $ai_span_name: "claude_read",
          $ai_input_state: { file },
          $ai_output_state: { opened: true },
          $ai_is_error: false,
        },
      });
    }
  } finally {
    // Flushing waits at most 5 seconds, so an unreachable PostHog can't hold up the queue
    await posthog.shutdown(5000).catch(() => {});
  }
}
