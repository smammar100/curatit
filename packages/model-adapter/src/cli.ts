#!/usr/bin/env node
// curatit-research: run the reference tool loop from a terminal.
//   CURATIT_ACCESS_TOKEN=… ANTHROPIC_API_KEY=… curatit-research --server https://www.curatit.app "Find three finance carousel posts and show their sources."
// The token and the API key come from the environment, never from arguments.

import { createAiObserver } from "./ai-observability.js";
import { anthropicProvider } from "./providers.js";
import { functionsFromOpenApi } from "./schema-adapters.js";
import { runToolLoop } from "./tool-loop.js";

const args = process.argv.slice(2);
const server = args.includes("--server") ? args[args.indexOf("--server") + 1] : "https://www.curatit.app";
const request = args.filter((a, i) => a !== "--server" && args[i - 1] !== "--server").join(" ").trim();
const token = process.env.CURATIT_ACCESS_TOKEN;
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!request || !token || !apiKey) {
  console.error("Usage: CURATIT_ACCESS_TOKEN=<token> ANTHROPIC_API_KEY=<key> curatit-research [--server <origin>] \"<what to research>\"");
  process.exit(2);
}

const observability = createAiObserver(`research-process-${process.pid}`);
try {
  const doc = await (await fetch(new URL("/api/v1/openapi.json", server))).json();
  const functions = functionsFromOpenApi(doc);
  const { answer, trace } = await runToolLoop(anthropicProvider({ apiKey, model: process.env.CURATIT_RESEARCH_MODEL }), { baseUrl: server, token }, functions, request, {
    onEvent: (e) => console.error(`[${e.kind}] ${e.detail}`),
    observability,
  });
  console.log(answer);
  console.error(`\n${trace.length} tool call(s): ${trace.map((t) => `${t.name}:${t.status}`).join(", ")}`);
} finally {
  await observability.shutdown();
}
