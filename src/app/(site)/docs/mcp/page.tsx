import type { Metadata } from "next";
import Link from "next/link";
// Fundation
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import TextLink from "@/components/fundations/elements/TextLink";
// Glaze
import { Icon, Key, Plugs, SealCheck, Terminal } from "@/components/glaze/icon";
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
import { Card, CardContent } from "@/components/glaze/ui/card";
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
// in the file. Server rendered; CopyBlock is the only script. Since 2026-10-24 on Glaze: each
// client is a Card (the one thing on the page a person acts on, its configuration to copy); the
// steps, the tools and the closing note are grouped by space and a hairline instead of grey
// cards, the icons stand bare (no tinted plates), the "Step N" labels over the titles became the
// list's own numbers in outline Badges, and the tool ids are mono at 0.8 of their line.

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

const STEPS = [
  {
    icon: Key,
    title: "Create a token",
    body: "Sign in, open the account menu and choose API tokens. A token is shown once; keep it like a password.",
    action: { label: "Open API tokens", href: "/dashboard/settings/tokens" },
  },
  { icon: Plugs, title: "Add Curatit to your client", body: "Copy the configuration for your tool below. The token lives in your environment, never in a file you share." },
  { icon: Terminal, title: "Ask for references", body: "Try: Find three finance carousel posts and show their sources. The tools come back with real Instagram URLs." },
];

export default function ConnectPage() {
  return (
    <>
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="max-w-2xl">
            <Text tag="h1" variant="h1" className="text-balance text-text-1">
              Use Curatit from your AI tools
            </Text>
            <Text className="mt-6 text-pretty text-text-2">
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
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t border-line-faint pt-6">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" aria-hidden="true" className="data">
                    {i + 1}
                  </Badge>
                  <Icon icon={step.icon} size={20} className="text-text-1" />
                </div>
                <h3 className="mt-4 type-heading text-text-1">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-1 type-body-sm text-pretty text-text-2">{step.body}</p>
                {step.action && (
                  <Button size="sm" variant="secondary" render={<Link href={step.action.href} />} nativeButton={false} className="mt-4">
                    {step.action.label}
                  </Button>
                )}
              </li>
            ))}
          </ol>
        </Wrapper>
      </section>

      {/* One card per client: the words on the left, the configuration on the right */}
      <section aria-labelledby="clients">
        <Wrapper variant="standard" className="section-y">
          <Text tag="h2" id="clients" variant="h3" className="text-text-1">
            Your client
          </Text>
          <ul className="mt-8 space-y-4">
            {CLIENTS.map((client) => (
              <li key={client.name}>
                <Card>
                  <CardContent className="grid gap-5 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="type-heading text-text-1">{client.name}</h3>
                        <Badge>{STATUS[client.status]}</Badge>
                      </div>
                      <p className="mt-2 type-body-sm text-pretty text-text-2">{client.how}</p>
                      {client.note && <p className="mt-2 type-caption text-pretty text-text-2">{client.note}</p>}
                    </div>
                    <div className="min-w-0 lg:col-span-8">
                      {client.status === "soon" ? (
                        <p className="rounded-overlay bg-field px-3 py-3 type-body-sm break-all text-text-2">
                          <code className="mono">{client.code}</code>
                        </p>
                      ) : (
                        <CopyBlock code={client.code} label={`the ${client.name} configuration`} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <p className="mt-6 type-body-sm text-pretty text-text-2">
            No MCP in your tool? The same six operations are available over plain HTTP at <code className="mono text-text-1">/api/v1</code>, described by{" "}
            <TextLink href="/api/v1/openapi.json" external>
              openapi.json
            </TextLink>
            . Guides for each client are in the repository under <code className="mono text-text-1">docs/mcp/installation</code>.
          </p>
        </Wrapper>
      </section>

      {/* What the tools do */}
      <section aria-labelledby="tools">
        <Wrapper variant="standard" className="section-y">
          <Text tag="h2" id="tools" variant="h3" className="text-text-1">
            Six tools, all read-only
          </Text>
          <ul className="mt-8 grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <li key={tool.name} className="border-t border-line-faint pt-4">
                <p className="type-body-sm break-all text-text-1">
                  <code className="mono">{tool.name}</code>
                </p>
                <p className="mt-2 type-body-sm text-pretty text-text-2">{tool.does}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex items-start gap-3 border-t border-line-faint pt-6">
            <Icon icon={SealCheck} size={20} className="mt-0.5 shrink-0 text-text-1" />
            <div>
              <h3 className="type-heading text-text-1">What your tool can and can&apos;t do</h3>
              <p className="mt-1 max-w-measure type-body-sm text-pretty text-text-2">
                A token reads what you can read: published posts and editor-approved analyses. It can&apos;t post, change your account or see your boards. Counts are shown as collected and say nothing about performance. Revoke a token any time from <TextLink href="/dashboard/settings/tokens">API tokens</TextLink>.
              </p>
            </div>
          </div>
        </Wrapper>
      </section>
    </>
  );
}
