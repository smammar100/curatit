// The bridge: an MCP client to the hosted Curatit server, and an MCP server over stdio that
// mirrors the remote tools. tools/list comes from the remote at start-up and is registered
// locally with the remote's own schemas and annotations; every tools/call is forwarded with the
// bearer token and its result, isError included, is returned as received. Redirects to another
// origin are refused by the transport, so the token never travels elsewhere, and there is no
// unauthenticated fallback: no token, no bridge.

import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { fromJsonSchema, McpServer, type CallToolResult, type ToolAnnotations } from "@modelcontextprotocol/server";

export const BRIDGE_INFO = { name: "curatit-mcp-bridge", version: "0.1.0" } as const;

export type BridgeOptions = {
  serverUrl: URL;
  token: string;
  // Per-call deadline for forwarded tool calls
  timeoutMs?: number;
  log?: (line: string) => void;
  // For tests: route the remote transport through a fetch of your own
  fetch?: typeof fetch;
};

export type RemoteTool = { name: string; title?: string; description?: string; inputSchema: Record<string, unknown>; outputSchema?: Record<string, unknown>; annotations?: ToolAnnotations };

export async function connectRemote(options: BridgeOptions) {
  if (options.serverUrl.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(options.serverUrl.hostname)) {
    throw new Error("The server must be https (or localhost for development).");
  }
  const client = new Client({ name: BRIDGE_INFO.name, version: BRIDGE_INFO.version }, { versionNegotiation: { mode: "auto" } });
  const transport = new StreamableHTTPClientTransport(options.serverUrl, {
    authProvider: { token: async () => options.token },
    redirectPolicy: "same-origin",
    requestInit: { headers: { "User-Agent": `${BRIDGE_INFO.name}/${BRIDGE_INFO.version}` } },
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
  await client.connect(transport);
  const { tools } = await client.listTools();
  return { client, tools: tools as RemoteTool[] };
}

// A local McpServer whose tools forward to the remote client
export function createBridgeServer(client: Client, tools: RemoteTool[], options: { timeoutMs?: number; log?: (line: string) => void } = {}): McpServer {
  const server = new McpServer({ name: BRIDGE_INFO.name, version: BRIDGE_INFO.version }, { capabilities: { tools: {} }, instructions: "Curatit's research tools, via the hosted server. Results are the hosted server's own." });
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: fromJsonSchema(tool.inputSchema),
        ...(tool.outputSchema ? { outputSchema: fromJsonSchema(tool.outputSchema) } : {}),
        annotations: tool.annotations,
      },
      async (args: unknown) => {
        const started = Date.now();
        try {
          const result = (await client.callTool({ name: tool.name, arguments: (args ?? {}) as Record<string, unknown> }, { timeout: options.timeoutMs ?? 60_000 })) as CallToolResult;
          options.log?.(`${tool.name} ${result.isError ? "error" : "ok"} ${Date.now() - started}ms`);
          return result;
        } catch (error) {
          options.log?.(`${tool.name} failed ${Date.now() - started}ms: ${sanitize(String((error as Error).message ?? error))}`);
          return { content: [{ type: "text", text: `The Curatit server couldn't be reached or refused the call: ${sanitize(String((error as Error).message ?? error))}` }], isError: true } satisfies CallToolResult;
        }
      },
    );
  }
  return server;
}

// Never let a token or Authorization header into an error message
export function sanitize(text: string) {
  return text.replace(/curatit_pat_[A-Za-z0-9_-]+/g, "[redacted]").replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 300);
}
