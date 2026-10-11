// Creative Intelligence: the model provider that runs the local Claude Code CLI (`claude -p`) on
// the signed-in person's own claude.ai subscription. No API key: any ANTHROPIC_API_KEY /
// ANTHROPIC_AUTH_TOKEN is removed from the child's environment so it can't silently bill an API
// account, and preflight refuses unless `claude auth status` says claude.ai or an OAuth token.
//
// Anthropic's terms keep subscription use to ordinary individual use; deployed or scheduled
// services must use an API key. So this runs only when a person starts it on their own machine:
// preflight refuses on Vercel, and nothing schedules it.
//
// Each call is sandboxed: --restricted with only the Read tool (or no tools), no MCP servers, no
// settings or hooks, nothing saved, run inside a temporary folder that holds just the images.
// Images are read by the model with the Read tool, and the stream of tool calls is checked so a
// slide it never opened can't be passed off as analysed.
import { spawn } from "node:child_process";
import { basename } from "node:path";
import { ModelError, NO_USAGE, type GenerateRequest, type GenerateResult, type ModelAdapter, type Usage } from "./model";
import type { FailureKind } from "./states";

export type ClaudeCliOptions = {
  model: string;
  // The executable; tests point it at a stub
  command?: string;
  prefixArgs?: string[];
  timeoutMs?: number;
  effort?: "low" | "medium" | "high";
  env?: NodeJS.ProcessEnv;
};

const LIMIT_TEXT = /(usage|session|weekly|rate)[ -]limit|hit your .*limit|limit (reached|exceeded)|too many requests/i;
const AUTH_TEXT = /not (logged|signed) in|please run .*login|authentication|invalid api key|oauth token (has )?expired|unauthori[sz]ed/i;

// Classify a failed run from its status code and text
export function failureKind(status: number | null | undefined, text: string): FailureKind {
  if (status === 401 || status === 403 || AUTH_TEXT.test(text)) return "auth";
  if (status === 429 || LIMIT_TEXT.test(text)) return /usage|session|weekly|hit your/i.test(text) ? "usage_limit" : "rate_limit";
  if (status === 529 || (status != null && status >= 500) || /overloaded|internal server error|service unavailable/i.test(text)) return "server";
  if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|network/i.test(text)) return "network";
  return "bug";
}

type StreamEvent = Record<string, unknown> & { type?: string };

// Read --output-format stream-json: the files the model opened with Read, and the final result
export function parseStream(stdout: string) {
  const read = new Set<string>();
  let result: StreamEvent | null = null;
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim().startsWith("{")) continue;
    let event: StreamEvent;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type === "result") result = event;
    if (event.type === "assistant") {
      const content = (event.message as { content?: unknown[] } | undefined)?.content ?? [];
      for (const block of content as { type?: string; name?: string; input?: { file_path?: string } }[]) {
        if (block?.type === "tool_use" && block.name === "Read" && typeof block.input?.file_path === "string") {
          read.add(basename(block.input.file_path.replace(/\\/g, "/")));
        }
      }
    }
  }
  return { read, result };
}

export function usageOf(result: StreamEvent | null): Usage {
  if (!result) return NO_USAGE;
  const usage = (result.usage ?? {}) as Record<string, number | undefined>;
  return {
    calls: 1,
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
    costUsd: typeof result.total_cost_usd === "number" ? result.total_cost_usd : 0,
    durationMs: typeof result.duration_ms === "number" ? result.duration_ms : 0,
  };
}

// Turn a finished process into the structured output, or a ModelError that says what to do next
export function interpret(stdout: string, stderr: string, exitCode: number | null, request: Pick<GenerateRequest, "images">): GenerateResult {
  const { read, result } = parseStream(stdout);
  const usage = usageOf(result);
  const text = [typeof result?.result === "string" ? result.result : "", JSON.stringify(result?.errors ?? ""), stderr].join("\n");

  if (!result) {
    throw new ModelError(failureKind(null, `${stderr}\n${stdout}`), `claude exited ${exitCode} without a result: ${(stderr || stdout).slice(0, 500)}`);
  }
  if (result.is_error || result.subtype !== "success") {
    const subtype = String(result.subtype ?? "");
    if (subtype === "error_max_budget_usd") throw new ModelError("budget", "The call reached its budget", usage);
    if (subtype === "error_max_structured_output_retries") throw new ModelError("invalid_output", "The model couldn't produce output matching the schema", usage);
    const status = typeof result.api_error_status === "number" ? result.api_error_status : null;
    throw new ModelError(failureKind(status, text), `claude reported ${subtype || "an error"}: ${text.trim().slice(0, 500)}`, usage);
  }
  if (result.structured_output == null) {
    throw new ModelError("invalid_output", "The model returned no structured output", usage, result.result);
  }
  const unread = request.images.filter((image) => !read.has(basename(image.file)));
  if (unread.length) {
    throw new ModelError(
      "invalid_output",
      `The model didn't open slide ${unread.map((image) => image.position).join(", ")}`,
      usage,
      result.structured_output,
    );
  }
  return { output: result.structured_output, usage };
}

export class ClaudeCliAdapter implements ModelAdapter {
  readonly provider = "claude-cli";
  readonly model: string;
  private readonly command: string;
  private readonly prefixArgs: string[];
  private readonly timeoutMs: number;
  private readonly effort?: string;
  private readonly env: NodeJS.ProcessEnv;

  constructor(options: ClaudeCliOptions) {
    this.model = options.model;
    this.command = options.command ?? "claude";
    this.prefixArgs = options.prefixArgs ?? [];
    this.timeoutMs = options.timeoutMs ?? 5 * 60_000;
    this.effort = options.effort;
    // Subscription only: never let an API key in the environment take over
    const env = { ...(options.env ?? process.env) };
    delete env.ANTHROPIC_API_KEY;
    delete env.ANTHROPIC_AUTH_TOKEN;
    this.env = env;
  }

  async preflight() {
    if (process.env.VERCEL) {
      throw new ModelError("auth", "The subscription provider only runs on a person's own machine, not on Vercel");
    }
    const { stdout, code } = await this.exec(["auth", "status"], "", 30_000);
    let status: { loggedIn?: boolean; authMethod?: string } = {};
    try {
      status = JSON.parse(stdout);
    } catch {
      // older CLIs print text
    }
    if (code !== 0 || !status.loggedIn) throw new ModelError("auth", "Claude Code isn't signed in; run `claude` and log in first");
    if (status.authMethod && !["claude.ai", "oauth_token"].includes(status.authMethod)) {
      throw new ModelError("auth", `Claude Code is using ${status.authMethod}, not a claude.ai subscription`);
    }
  }

  args(request: GenerateRequest) {
    const tools = request.images.length ? ["--tools", "Read", "--allowedTools", "Read"] : ["--tools", ""];
    return [
      "-p",
      "--output-format", "stream-json",
      "--verbose",
      "--json-schema", JSON.stringify(request.schema),
      "--model", this.model,
      ...tools,
      "--restricted",
      "--strict-mcp-config",
      "--no-session-persistence",
      "--permission-mode", "dontAsk",
      "--system-prompt", request.system,
      "--max-budget-usd", request.maxUsd.toFixed(2),
      ...(this.effort ? ["--effort", this.effort] : []),
    ];
  }

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const started = Date.now();
    const { stdout, stderr, code, timedOut } = await this.exec(this.args(request), request.prompt, this.timeoutMs, request.workdir);
    if (timedOut) throw new ModelError("timeout", `claude didn't finish within ${Math.round(this.timeoutMs / 1000)}s`);
    const result = interpret(stdout, stderr, code, request);
    if (!result.usage.durationMs) result.usage.durationMs = Date.now() - started;
    return result;
  }

  private exec(args: string[], input: string, timeoutMs: number, cwd?: string) {
    return new Promise<{ stdout: string; stderr: string; code: number | null; timedOut: boolean }>((resolve, reject) => {
      const child = spawn(this.command, [...this.prefixArgs, ...args], { cwd, env: this.env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => (stdout += chunk));
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk));
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(new ModelError("bug", `Couldn't start ${this.command}: ${error.message}`));
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, code, timedOut });
      });
      child.stdin.on("error", () => {});
      child.stdin.end(input);
    });
  }
}
