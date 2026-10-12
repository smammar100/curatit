#!/usr/bin/env node
// curatit-mcp: MCP over stdio for local clients, forwarding to the hosted Curatit server.
//   CURATIT_ACCESS_TOKEN=… node dist/cli.js --server https://curatit.vercel.app/mcp
// stdout carries MCP messages only; everything else goes to stderr. Ctrl-C or SIGTERM closes
// the connection and exits.

import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { connectRemote, createBridgeServer, BRIDGE_INFO, sanitize } from "./bridge.js";
import { CredentialError, loadToken } from "./credentials.js";

const log = (line: string) => process.stderr.write(`[${BRIDGE_INFO.name}] ${line}\n`);

export function parseArgs(argv: string[]) {
  const out = { server: "https://curatit.vercel.app/mcp", timeoutMs: 60_000, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--server" && argv[i + 1]) out.server = argv[++i];
    else if (a === "--timeout" && argv[i + 1]) out.timeoutMs = Math.max(1000, Number(argv[++i]) || out.timeoutMs);
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a.startsWith("--")) throw new Error(`Unknown option ${a}`);
  }
  return out;
}

async function main() {
  let args: ReturnType<typeof parseArgs>;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    log((error as Error).message);
    process.exit(2);
  }
  if (args.help) {
    log(`Usage: curatit-mcp [--server <https://host/mcp>] [--timeout <ms>]\nSet CURATIT_ACCESS_TOKEN (or CURATIT_ACCESS_TOKEN_FILE) in the environment.`);
    process.exit(0);
  }
  let token: string;
  try {
    token = loadToken();
  } catch (error) {
    log(error instanceof CredentialError ? error.message : "Couldn't read the token.");
    process.exit(2);
  }
  let serverUrl: URL;
  try {
    serverUrl = new URL(args.server);
  } catch {
    log("--server must be a URL such as https://curatit.vercel.app/mcp");
    process.exit(2);
  }

  let remote: Awaited<ReturnType<typeof connectRemote>>;
  try {
    remote = await connectRemote({ serverUrl, token, timeoutMs: args.timeoutMs, log });
  } catch (error) {
    log(`Couldn't connect to ${serverUrl.origin}: ${sanitize(String((error as Error).message ?? error))}`);
    process.exit(1);
  }
  log(`Connected to ${serverUrl.href}: ${remote.tools.length} tools`);

  const handle = serveStdio(() => createBridgeServer(remote.client, remote.tools, { timeoutMs: args.timeoutMs, log }));
  const shutdown = async (signal: string) => {
    log(`${signal}: closing`);
    try {
      await handle.close();
      await remote.client.close();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

if (process.argv[1] && /cli\.(js|ts)$/.test(process.argv[1])) {
  main().catch((error) => {
    log(sanitize(String((error as Error).message ?? error)));
    process.exit(1);
  });
}
