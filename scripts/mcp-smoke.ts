// The synthetic check for a deployment: initialize, list tools, a small search, a known post,
// as a real authenticated MCP client. Run after a deploy, or on a schedule:
//   CURATIT_ACCESS_TOKEN=… npm run mcp:smoke -- --server https://www.curatit.app
// Exit code 0 when every step passed. The token is read from the environment only.

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

const args = process.argv.slice(2);
const origin = args.includes("--server") ? args[args.indexOf("--server") + 1] : "https://www.curatit.app";
const token = process.env.CURATIT_ACCESS_TOKEN;
if (!token) {
  console.error("Set CURATIT_ACCESS_TOKEN (a personal access token with curatit:read).");
  process.exit(2);
}

const started = Date.now();
const step = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
};

const client = new Client({ name: "curatit-smoke", version: "1.0.0" }, { versionNegotiation: { mode: "auto" } });
const transport = new StreamableHTTPClientTransport(new URL("/mcp", origin), { authProvider: { token: async () => token }, redirectPolicy: "same-origin" });
try {
  await client.connect(transport);
  step("initialize", true, `${origin}/mcp`);
  const { tools } = await client.listTools();
  step("tools/list", tools.length === 6, `${tools.length} tools`);
  const search = await client.callTool({ name: "curatit_search_posts", arguments: { filters: { formats: ["carousel"] }, limit: 2 } });
  const posts = ((search.structuredContent as { data?: { posts?: { post_id: string }[] } })?.data?.posts ?? []) as { post_id: string }[];
  step("curatit_search_posts", !search.isError && posts.length > 0, `${posts.length} posts`);
  if (posts[0]) {
    const post = await client.callTool({ name: "curatit_get_post", arguments: { post_id: posts[0].post_id } });
    const data = (post.structuredContent as { data?: { post?: { short_code: string; media: unknown[] } } })?.data?.post;
    step("curatit_get_post", !post.isError && Boolean(data?.short_code), data ? `${data.short_code}, ${data.media.length} media` : "");
  }
  const meta = await fetch(new URL("/.well-known/oauth-protected-resource/mcp", origin));
  step("protected resource metadata", meta.ok, `${meta.status}`);
  const live = await fetch(new URL("/api/v1/health/live", origin));
  step("health/live", live.ok, `${live.status}`);
} catch (error) {
  step("connection", false, String((error as Error).message ?? error).replace(/curatit_pat_\S+/g, "[redacted]"));
} finally {
  await client.close().catch(() => {});
  console.log(`${Date.now() - started}ms`);
}
