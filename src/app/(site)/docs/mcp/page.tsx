import type { Metadata } from "next";
import Link from "next/link";
// Fundation
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
// Icons
import Key from "@/components/fundations/icons/Key";
import Plugs from "@/components/fundations/icons/Plugs";
import TerminalWindow from "@/components/fundations/icons/TerminalWindow";
import SealCheck from "@/components/fundations/icons/SealCheck";
// Components
import CopyBlock from "@/components/mcp/CopyBlock";
import { MCP_URL, TOOLS } from "@/components/mcp/tools";

export const metadata: Metadata = {
  title: "Connect your AI tools | Curatit",
  description: "Use Curatit's library from Claude, Cursor, VS Code or any MCP client: six research tools, a personal access token, and a brief built from real posts.",
};

// The connect page (2026-10-12), where the MCP server's resource metadata points
// (resource_documentation). After Hume AI's deploy page and Hashnode's token page (Mobbin
// references): three steps down the page, then one card per client with its configuration
// ready to copy, then what the tools do. Every snippet puts the token in the environment, never
// in the file. Server rendered; CopyBlock is the only script.

const TOKEN = "paste-your-token-here";

const CLIENTS: { name: string; status: "remote" | "bridge" | "soon"; how: string; code: string; note?: string }[] = [
  {
    name: "Claude Code",
    status: "remote",
    how: "One command in your terminal, with the token read from your shell.",
    code: `claude mcp add --transport http curatit ${MCP_URL} --header "Authorization: Bearer $CURATIT_ACCESS_TOKEN"`,
  },
  {
    name: "Cursor",
    status: "remote",
    how: "Add to .cursor/mcp.json in your project. Cursor fills the token in from your environment.",
    code: `{
  "mcpServers": {
    "curatit": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer \${env:CURATIT_ACCESS_TOKEN}" }
    }
  }
}`,
  },
  {
    name: "VS Code",
    status: "remote",
    how: "Add to .vscode/mcp.json. VS Code asks for the token once and keeps it for you.",
    code: `{
  "inputs": [
    { "id": "curatit-token", "type": "promptString", "description": "Curatit personal access token", "password": true }
  ],
  "servers": {
    "curatit": {
      "type": "http",
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer \${input:curatit-token}" }
    }
  }
}`,
  },
  {
    name: "Claude Desktop",
    status: "bridge",
    how: "Claude Desktop launches a local command, so it uses the Curatit bridge, which forwards to the server with your token.",
    code: `{
  "mcpServers": {
    "curatit": {
      "command": "node",
      "args": ["/path/to/curatit/packages/mcp-bridge/dist/cli.js"],
      "env": { "CURATIT_ACCESS_TOKEN": "${TOKEN}" }
    }
  }
}`,
    note: "The bridge is in the Curatit repository (packages/mcp-bridge). Build it once with npm run mcp:bridge:build.",
  },
  {
    name: "ChatGPT and Claude.ai connectors",
    status: "soon",
    how: "These sign in with OAuth rather than a token. Curatit's OAuth sign-in is switched on and being tested; until it's confirmed, use one of the clients above.",
    code: MCP_URL,
  },
];


const STATUS: Record<(typeof CLIENTS)[number]["status"], string> = { remote: "Connects directly", bridge: "Through the bridge", soon: "Coming" };

export default function ConnectPage() {
  return (
    <>
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="max-w-2xl">
            <Text tag="h1" variant="displayLG" className="text-balance text-base-900">
              Use Curatit from your AI tools
            </Text>
            <Text className="mt-6 text-pretty text-base-600">
              Curatit is an MCP server. Connect it once and your assistant can search the library, read a post slide by slide, and build a brief from real work, with every claim tied to something it can show you.
            </Text>
          </div>
        </Wrapper>
      </section>

      {/* Three steps, read across on wide screens */}
      <section aria-labelledby="steps">
        <Wrapper variant="standard" className="section-y">
          <h2 id="steps" className="sr-only">
            Three steps
          </h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              { icon: <Key className="size-5" />, title: "Create a token", body: "Sign in, open the account menu and choose API tokens. A token is shown once; keep it like a password.", action: <Button isLink size="xs" variant="muted" href="/dashboard/settings/tokens">Open API tokens</Button> },
              { icon: <Plugs className="size-5" />, title: "Add Curatit to your client", body: "Copy the configuration for your tool below. The token lives in your environment, never in a file you share." },
              { icon: <TerminalWindow className="size-5" />, title: "Ask for references", body: "Try: Find three finance carousel posts and show their sources. The tools come back with real Instagram URLs." },
            ].map((step, i) => (
              <li key={step.title} className="rounded-2xl bg-base-50 p-5 lg:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-white text-base-900 ring-1 ring-edge">{step.icon}</span>
                  <p className="text-xs font-medium tracking-wide text-base-500 uppercase">Step {i + 1}</p>
                </div>
                <h3 className="mt-4 text-base font-medium text-base-900">{step.title}</h3>
                <p className="mt-1 text-sm text-pretty text-base-600">{step.body}</p>
                {step.action && <div className="mt-4">{step.action}</div>}
              </li>
            ))}
          </ol>
        </Wrapper>
      </section>

      {/* One card per client: the words on the left, the configuration on the right */}
      <section aria-labelledby="clients">
        <Wrapper variant="standard" className="section-y">
          <Text tag="h2" id="clients" variant="displaySM" className="text-base-900">
            Your client
          </Text>
          <ul className="mt-8 space-y-4">
            {CLIENTS.map((client) => (
              <li key={client.name} className="grid gap-5 rounded-2xl bg-white p-5 ring-1 ring-edge lg:grid-cols-12 lg:gap-8 lg:p-6">
                <div className="lg:col-span-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-base-900">{client.name}</h3>
                    <span className="rounded-md bg-base-50 px-2 py-0.5 text-xs text-base-600 ring-1 ring-base-200">{STATUS[client.status]}</span>
                  </div>
                  <p className="mt-2 text-sm text-pretty text-base-600">{client.how}</p>
                  {client.note && <p className="mt-2 text-xs text-pretty text-base-500">{client.note}</p>}
                </div>
                <div className="min-w-0 lg:col-span-8">
                  {client.status === "soon" ? (
                    <p className="rounded-lg bg-base-50 px-4 py-3.5 font-mono text-[13px] text-base-600 ring-1 ring-base-200">{client.code}</p>
                  ) : (
                    <CopyBlock code={client.code} label={`the ${client.name} configuration`} />
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-pretty text-base-600">
            No MCP in your tool? The same six operations are available over plain HTTP at <code className="font-mono text-[13px] text-base-900">/api/v1</code>, described by{" "}
            <a href="/api/v1/openapi.json" className="underline decoration-base-300 underline-offset-2 hover:text-base-900">
              openapi.json
            </a>
            . Guides for each client are in the repository under <code className="font-mono text-[13px] text-base-900">docs/mcp/installation</code>.
          </p>
        </Wrapper>
      </section>

      {/* What the tools do */}
      <section aria-labelledby="tools">
        <Wrapper variant="standard" className="section-y">
          <Text tag="h2" id="tools" variant="displaySM" className="text-base-900">
            Six tools, all read-only
          </Text>
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <li key={tool.name} className="rounded-2xl bg-base-50 p-5">
                <p className="font-mono text-[13px] text-base-900">{tool.name}</p>
                <p className="mt-2 text-sm text-pretty text-base-600">{tool.does}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex items-start gap-3 rounded-2xl bg-base-50 p-5 lg:p-6">
            <SealCheck className="mt-0.5 size-5 shrink-0 text-base-900" />
            <div>
              <p className="text-base font-medium text-base-900">What your tool can and can&apos;t do</p>
              <p className="mt-1 max-w-prose text-sm text-pretty text-base-600">
                A token reads what you can read: published posts and editor-approved analyses. It can&apos;t post, change your account or see your boards. Counts are shown as collected and say nothing about performance. Revoke a token any time from{" "}
                <Link href="/dashboard/settings/tokens" className="underline decoration-base-300 underline-offset-2 hover:text-base-900">
                  API tokens
                </Link>
                .
              </p>
            </div>
          </div>
        </Wrapper>
      </section>
    </>
  );
}
