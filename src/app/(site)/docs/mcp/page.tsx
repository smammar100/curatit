import type { Metadata } from "next";
// Fundation
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Badge from "@/components/fundations/elements/Badge";
import TextLink from "@/components/fundations/elements/TextLink";
import Card from "@/components/fundations/molecules/Card";
// Icons
import Key from "@/components/fundations/icons/Key";
import Plugs from "@/components/fundations/icons/Plugs";
import TerminalWindow from "@/components/fundations/icons/TerminalWindow";
import SealCheck from "@/components/fundations/icons/SealCheck";
// Components
import CopyBlock from "@/components/mcp/CopyBlock";
import { MCP_URL, TOOLS } from "@/components/mcp/tools";
import { fontWeights } from "@/lib/font-weight";

export const metadata: Metadata = {
  title: "Connect your AI tools | Curatit",
  description: "Use Curatit's library from Claude, Cursor, VS Code or any MCP client: six research tools, a personal access token, and a brief built from real posts.",
};

// The connect page (2026-10-12), where the MCP server's resource metadata points
// (resource_documentation). After Hume AI's deploy page and Hashnode's token page (Mobbin
// references): three steps down the page, then one card per client with its configuration
// ready to copy, then what the tools do. Every snippet puts the token in the environment, never
// in the file. Server rendered; CopyBlock is the only script. Since 2026-10-23 the page is set
// on the system: the steps and the tools are grey Cards, each client a raised one, the icons sit
// on muted plates, the links are TextLinks and the small headings take the library's semibold.

const TOKEN = "paste-your-token-here";
const semibold = { fontVariationSettings: fontWeights.semibold };
const codeClass = "font-mono text-caption-lg text-foreground";

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
            <Text tag="h1" variant="h1" className="text-balance text-foreground">
              Use Curatit from your AI tools
            </Text>
            <Text className="mt-6 text-pretty text-muted-foreground">
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
              <li key={step.title}>
                <Card variant="mat" padding="lg" className="h-full">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">{step.icon}</span>
                    <p className="text-caption-lg text-muted-foreground" style={semibold}>Step {i + 1}</p>
                  </div>
                  <h3 className="mt-4 text-body-base text-foreground" style={semibold}>{step.title}</h3>
                  <p className="mt-1 text-body-sm text-pretty text-muted-foreground">{step.body}</p>
                  {step.action && <div className="mt-4">{step.action}</div>}
                </Card>
              </li>
            ))}
          </ol>
        </Wrapper>
      </section>

      {/* One card per client: the words on the left, the configuration on the right */}
      <section aria-labelledby="clients">
        <Wrapper variant="standard" className="section-y">
          <Text tag="h2" id="clients" variant="h3" className="text-foreground">
            Your client
          </Text>
          <ul className="mt-8 space-y-4">
            {CLIENTS.map((client) => (
              <li key={client.name}>
                <Card variant="raised" padding="lg" className="grid gap-5 lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-body-base text-foreground" style={semibold}>{client.name}</h3>
                    <Badge>{STATUS[client.status]}</Badge>
                  </div>
                  <p className="mt-2 text-body-sm text-pretty text-muted-foreground">{client.how}</p>
                  {client.note && <p className="mt-2 text-caption-lg text-pretty text-muted-foreground">{client.note}</p>}
                </div>
                <div className="min-w-0 lg:col-span-8">
                  {client.status === "soon" ? (
                    <p className="rounded-[12px] bg-muted px-4 py-3.5 font-mono text-body-sm text-muted-foreground shadow-surface-1">{client.code}</p>
                  ) : (
                    <CopyBlock code={client.code} label={`the ${client.name} configuration`} />
                  )}
                </div>
                </Card>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-body-sm text-pretty text-muted-foreground">
            No MCP in your tool? The same six operations are available over plain HTTP at <code className={codeClass}>/api/v1</code>, described by{" "}
            <TextLink href="/api/v1/openapi.json" external>
              openapi.json
            </TextLink>
            . Guides for each client are in the repository under <code className={codeClass}>docs/mcp/installation</code>.
          </p>
        </Wrapper>
      </section>

      {/* What the tools do */}
      <section aria-labelledby="tools">
        <Wrapper variant="standard" className="section-y">
          <Text tag="h2" id="tools" variant="h3" className="text-foreground">
            Six tools, all read-only
          </Text>
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <li key={tool.name}>
                <Card variant="mat" padding="lg" className="h-full">
                  <p className="font-mono text-body-sm text-foreground">{tool.name}</p>
                  <p className="mt-2 text-body-sm text-pretty text-muted-foreground">{tool.does}</p>
                </Card>
              </li>
            ))}
          </ul>
          <Card variant="mat" padding="lg" className="mt-10 flex items-start gap-3">
            <SealCheck className="mt-0.5 size-5 shrink-0 text-foreground" />
            <div>
              <p className="text-body-base text-foreground" style={semibold}>What your tool can and can&apos;t do</p>
              <p className="mt-1 max-w-prose text-body-sm text-pretty text-muted-foreground">
                A token reads what you can read: published posts and editor-approved analyses. It can&apos;t post, change your account or see your boards. Counts are shown as collected and say nothing about performance. Revoke a token any time from <TextLink href="/dashboard/settings/tokens">API tokens</TextLink>.
              </p>
            </div>
          </Card>
        </Wrapper>
      </section>
    </>
  );
}
