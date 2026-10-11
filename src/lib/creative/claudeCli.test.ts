import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ClaudeCliAdapter, failureKind, interpret, parseStream } from "./claudeCli";
import { ModelError } from "./model";

const result = (fields: Record<string, unknown>) => JSON.stringify({ type: "result", subtype: "success", is_error: false, ...fields });
const read = (file: string) => JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Read", input: { file_path: file } }] } });
const images = [
  { position: 0, file: "/tmp/run/slide-00.webp", mimetype: "image/webp", wasVideo: false },
  { position: 1, file: "/tmp/run/slide-01.webp", mimetype: "image/webp", wasVideo: false },
];

function caught(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    return error as ModelError;
  }
  throw new Error("expected a throw");
}

describe("failureKind", () => {
  it("tells usage limits, rate limits, auth, server and network apart", () => {
    expect(failureKind(null, "You've hit your session limit · resets 3:45pm")).toBe("usage_limit");
    expect(failureKind(null, "Weekly limit reached")).toBe("usage_limit");
    expect(failureKind(429, "Too many requests")).toBe("rate_limit");
    expect(failureKind(401, "")).toBe("auth");
    expect(failureKind(null, "Not logged in · Please run /login")).toBe("auth");
    expect(failureKind(529, "Overloaded")).toBe("server");
    expect(failureKind(500, "")).toBe("server");
    expect(failureKind(null, "read ECONNRESET")).toBe("network");
    expect(failureKind(null, "something odd")).toBe("bug");
  });
});

describe("parseStream", () => {
  it("collects the files read and the result, skipping noise", () => {
    const out = ["not json", read("C:\\tmp\\run\\slide-00.webp"), "{broken", read("/tmp/run/slide-01.webp"), result({ structured_output: { a: 1 } })].join("\n");
    const parsed = parseStream(out);
    expect([...parsed.read].sort()).toEqual(["slide-00.webp", "slide-01.webp"]);
    expect(parsed.result?.structured_output).toEqual({ a: 1 });
  });
});

describe("interpret", () => {
  const usage = { input_tokens: 1200, output_tokens: 300, cache_read_input_tokens: 50, cache_creation_input_tokens: 10 };

  it("returns the structured output with its usage when every slide was opened", () => {
    const out = [read(images[0].file), read(images[1].file), result({ structured_output: { ok: true }, usage, total_cost_usd: 0.021, duration_ms: 900 })].join("\n");
    const answer = interpret(out, "", 0, { images });
    expect(answer.output).toEqual({ ok: true });
    expect(answer.usage).toMatchObject({ calls: 1, inputTokens: 1200, outputTokens: 300, cacheReadTokens: 50, cacheWriteTokens: 10, costUsd: 0.021, durationMs: 900 });
  });

  it("refuses an answer for a slide the model never opened", () => {
    const out = [read(images[0].file), result({ structured_output: { ok: true } })].join("\n");
    const error = caught(() => interpret(out, "", 0, { images }));
    expect(error.kind).toBe("invalid_output");
    expect(error.message).toContain("slide 1");
  });

  it("maps the CLI's error results", () => {
    expect(caught(() => interpret(result({ subtype: "error_max_budget_usd", is_error: true }), "", 1, { images: [] })).kind).toBe("budget");
    expect(caught(() => interpret(result({ subtype: "error_max_structured_output_retries", is_error: true }), "", 1, { images: [] })).kind).toBe("invalid_output");
    expect(caught(() => interpret(result({ subtype: "error_during_execution", is_error: true, api_error_status: 429 }), "", 1, { images: [] })).kind).toBe("rate_limit");
    expect(caught(() => interpret(result({ is_error: true, result: "You've hit your weekly limit" }), "", 1, { images: [] })).kind).toBe("usage_limit");
    expect(caught(() => interpret(result({}), "", 0, { images: [] })).kind).toBe("invalid_output");
  });

  it("reports a run with no result at all", () => {
    expect(caught(() => interpret("", "Not logged in · Please run /login", 1, { images: [] })).kind).toBe("auth");
    expect(caught(() => interpret("", "boom", 1, { images: [] })).kind).toBe("bug");
  });
});

describe("ClaudeCliAdapter", () => {
  let dir: string;
  let stub: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "claude-stub-"));
    stub = join(dir, "stub.mjs");
    // Echoes what it was given: the args, stdin, the env's API key, and a Read of each slide in its cwd
    await writeFile(
      stub,
      `import { readdirSync } from "node:fs";
let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  const args = process.argv.slice(2);
  if (args[0] === "auth") { console.log(JSON.stringify({ loggedIn: process.env.STUB_LOGGED_IN !== "0", authMethod: process.env.STUB_AUTH ?? "claude.ai" })); return; }
  if (process.env.STUB_SLEEP) { setTimeout(() => {}, 60000); return; }
  for (const file of readdirSync(process.cwd()).filter((f) => f.startsWith("slide-"))) {
    console.log(JSON.stringify({ type: "assistant", message: { content: [{ type: "tool_use", name: "Read", input: { file_path: process.cwd() + "/" + file } }] } }));
  }
  console.log(JSON.stringify({ type: "result", subtype: "success", is_error: false, total_cost_usd: 0.01, usage: { input_tokens: 10, output_tokens: 5 },
    structured_output: { args, input, apiKey: process.env.ANTHROPIC_API_KEY ?? null, cwd: process.cwd() } }));
});`,
    );
  });
  afterAll(() => rm(dir, { recursive: true, force: true }));

  const adapter = (env: Record<string, string> = {}, timeoutMs = 20_000) =>
    new ClaudeCliAdapter({ model: "sonnet", command: process.execPath, prefixArgs: [stub], timeoutMs, env: { ...process.env, ANTHROPIC_API_KEY: "sk-should-not-pass", ...env } });

  it("runs sandboxed, prompt on stdin, schema and model as flags, never with an API key", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "claude-run-"));
    await writeFile(join(workdir, "slide-00.webp"), "x");
    const { output } = (await adapter().generate({
      task: "perception",
      system: "be careful",
      prompt: "the prompt",
      schema: { type: "object" },
      images: [{ position: 0, file: join(workdir, "slide-00.webp"), mimetype: "image/webp", wasVideo: false }],
      workdir,
      maxUsd: 0.4,
    })) as { output: { args: string[]; input: string; apiKey: string | null; cwd: string } };
    expect(output.input).toBe("the prompt");
    expect(output.apiKey).toBeNull();
    expect(output.args).toEqual(expect.arrayContaining(["-p", "--restricted", "--strict-mcp-config", "--no-session-persistence"]));
    const flag = (name: string) => output.args[output.args.indexOf(name) + 1];
    expect(flag("--model")).toBe("sonnet");
    expect(flag("--json-schema")).toBe('{"type":"object"}');
    expect(flag("--tools")).toBe("Read");
    expect(flag("--output-format")).toBe("stream-json");
    expect(flag("--max-budget-usd")).toBe("0.40");
    expect(flag("--system-prompt")).toBe("be careful");
    await rm(workdir, { recursive: true, force: true });
  });

  it("gives a text-only call no tools at all", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "claude-run-"));
    const { output } = (await adapter().generate({ task: "synthesis", system: "s", prompt: "p", schema: {}, images: [], workdir, maxUsd: 1 })) as { output: { args: string[] } };
    expect(output.args[output.args.indexOf("--tools") + 1]).toBe("");
    expect(output.args).not.toContain("--allowedTools");
    await rm(workdir, { recursive: true, force: true });
  });

  it("times out a call that hangs", async () => {
    const workdir = await mkdtemp(join(tmpdir(), "claude-run-"));
    const error = await adapter({ STUB_SLEEP: "1" }, 1500)
      .generate({ task: "synthesis", system: "s", prompt: "p", schema: {}, images: [], workdir, maxUsd: 1 })
      .catch((e) => e);
    expect(error).toBeInstanceOf(ModelError);
    expect(error.kind).toBe("timeout");
    await rm(workdir, { recursive: true, force: true });
  });

  it("preflight requires a signed-in claude.ai subscription", async () => {
    await expect(adapter().preflight()).resolves.toBeUndefined();
    await expect(adapter({ STUB_AUTH: "oauth_token" }).preflight()).resolves.toBeUndefined();
    await expect(adapter({ STUB_AUTH: "api_key" }).preflight()).rejects.toMatchObject({ kind: "auth" });
    await expect(adapter({ STUB_LOGGED_IN: "0" }).preflight()).rejects.toMatchObject({ kind: "auth" });
  });
});
