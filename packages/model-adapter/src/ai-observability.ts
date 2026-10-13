import { randomUUID } from "node:crypto";
import { PostHog } from "posthog-node";

type Generation = {
  traceId: string;
  spanId: string;
  model: string;
  input: unknown;
  output?: unknown;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  latencySeconds: number;
  httpStatus?: number;
  stopReason?: string;
  tools?: unknown;
  error?: string;
};

type Span = {
  traceId: string;
  spanId: string;
  parentId?: string;
  name: string;
  input: unknown;
  output: unknown;
  latencySeconds: number;
  isError: boolean;
};

export type AiObserver = {
  createTraceId(): string;
  createSpanId(): string;
  captureGeneration(generation: Generation): void;
  captureSpan(span: Span): void;
  shutdown(): Promise<void>;
};

function client() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  // Off unless both are set, so the CLI behaves as before for anyone without a PostHog project
  if (!token || !host) return null;
  return new PostHog(token, { host, flushAt: 1, flushInterval: 0, privacyMode: false });
}

export function createAiObserver(sessionId: string): AiObserver {
  const posthog = client();
  const sessionDistinctId = sessionId;
  return {
    createTraceId: randomUUID,
    createSpanId: randomUUID,
    captureGeneration(generation) {
      posthog?.capture({
        distinctId: sessionDistinctId,
        event: "$ai_generation",
        properties: {
          $ai_trace_id: generation.traceId,
          $ai_session_id: sessionId,
          $ai_span_id: generation.spanId,
          $ai_span_name: "anthropic_messages",
          $ai_model: generation.model,
          $ai_provider: "anthropic",
          $ai_input: generation.input,
          $ai_input_tokens: generation.inputTokens,
          $ai_output_choices: generation.output === undefined ? undefined : [{ role: "assistant", content: generation.output }],
          $ai_output_tokens: generation.outputTokens,
          $ai_cache_read_input_tokens: generation.cacheReadTokens,
          $ai_cache_creation_input_tokens: generation.cacheWriteTokens,
          $ai_latency: generation.latencySeconds,
          $ai_http_status: generation.httpStatus,
          $ai_stop_reason: generation.stopReason,
          $ai_tools: generation.tools,
          $ai_is_error: Boolean(generation.error),
          $ai_error: generation.error,
        },
      });
    },
    captureSpan(span) {
      posthog?.capture({
        distinctId: sessionDistinctId,
        event: "$ai_span",
        properties: {
          $ai_trace_id: span.traceId,
          $ai_session_id: sessionId,
          $ai_span_id: span.spanId,
          $ai_parent_id: span.parentId,
          $ai_span_name: span.name,
          $ai_input_state: span.input,
          $ai_output_state: span.output,
          $ai_latency: span.latencySeconds,
          $ai_is_error: span.isError,
        },
      });
    },
    async shutdown() {
      await posthog?.shutdown(5000);
    },
  };
}
