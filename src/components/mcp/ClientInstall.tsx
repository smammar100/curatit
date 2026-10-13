"use client";

// The install section of the MCP landing page: one row of client tabs, each with its mark,
// and the three steps for the chosen one (after Higgsfield's MCP page and Neon's "Get started
// with Neon + AI" on Mobbin, 2026-10-13). Every panel is in the HTML; only the chosen one shows.
// Tabs follow the ARIA pattern: ← / → move between them, Home and End jump.

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import ClientMark, { MARKS } from "@/components/assets/ClientMarks";
import { cx } from "@/lib/cx";
import CopyBlock from "./CopyBlock";

const MCP_URL = "https://curatit.vercel.app/mcp";
const TOKEN_HREF = "/dashboard/settings/tokens";

type Step = { title: string; body: ReactNode; code?: string };
type Client = { id: string; name: string; mark: keyof typeof MARKS; note?: string; steps: Step[] };

const tokenStep: Step = {
  title: "Create a token",
  body: (
    <>
      Sign in, open the account menu and choose{" "}
      <Link href={TOKEN_HREF} className="underline decoration-base-300 underline-offset-2 hover:text-base-900">
        API tokens
      </Link>
      . A token is shown once; keep it like a password and put it in your environment as <code className="font-mono text-[13px] text-base-900">CURATIT_ACCESS_TOKEN</code>.
    </>
  ),
};
const askStep: Step = { title: "Ask for references", body: "Try: Find three finance carousel posts and show their sources. Every answer comes back with real Instagram links." };

const CLIENTS: Client[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    mark: "claudeCode",
    steps: [tokenStep, { title: "Add Curatit", body: "One command in your terminal. Claude Code reads the token from your shell.", code: `claude mcp add --transport http curatit ${MCP_URL} --header "Authorization: Bearer $CURATIT_ACCESS_TOKEN"` }, askStep],
  },
  {
    id: "cursor",
    name: "Cursor",
    mark: "cursor",
    steps: [
      tokenStep,
      {
        title: "Add Curatit",
        body: (
          <>
            Add this to <code className="font-mono text-[13px] text-base-900">.cursor/mcp.json</code> in your project. Cursor fills the token in from your environment.
          </>
        ),
        code: `{
  "mcpServers": {
    "curatit": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer \${env:CURATIT_ACCESS_TOKEN}" }
    }
  }
}`,
      },
      askStep,
    ],
  },
  {
    id: "vscode",
    name: "VS Code",
    mark: "vscode",
    steps: [
      tokenStep,
      {
        title: "Add Curatit",
        body: (
          <>
            Add this to <code className="font-mono text-[13px] text-base-900">.vscode/mcp.json</code>. VS Code asks for the token once and keeps it for you.
          </>
        ),
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
      askStep,
    ],
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    mark: "claude",
    note: "Claude Desktop launches a local command, so it goes through the Curatit bridge (packages/mcp-bridge in the repository; build it once with npm run mcp:bridge:build).",
    steps: [
      tokenStep,
      {
        title: "Add Curatit",
        body: (
          <>
            Add this to <code className="font-mono text-[13px] text-base-900">claude_desktop_config.json</code> (Settings → Developer → Edit config), with the path to your bridge build.
          </>
        ),
        code: `{
  "mcpServers": {
    "curatit": {
      "command": "node",
      "args": ["/path/to/curatit/packages/mcp-bridge/dist/cli.js"],
      "env": { "CURATIT_ACCESS_TOKEN": "paste-your-token-here" }
    }
  }
}`,
      },
      askStep,
    ],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    mark: "chatgpt",
    note: "ChatGPT signs in with your Curatit account instead of a token. This path is in testing: if it fails, use one of the clients above for now.",
    steps: [
      { title: "Turn on developer mode", body: "In ChatGPT, open Settings → Connectors → Advanced and switch on Developer mode." },
      { title: "Create the connector", body: "Choose Create, name it Curatit, paste the server address and pick OAuth for authentication.", code: MCP_URL },
      { title: "Sign in and allow", body: "ChatGPT opens Curatit's sign-in; allow it, and the six tools appear in your chats." },
    ],
  },
];

export default function ClientInstall() {
  const [current, setCurrent] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = CLIENTS.length - 1;
    const next = event.key === "ArrowRight" ? (index === last ? 0 : index + 1) : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : event.key === "Home" ? 0 : event.key === "End" ? last : null;
    if (next === null) return;
    event.preventDefault();
    setCurrent(next);
    tabs.current[next]?.focus();
  };

  return (
    <div>
      {/* The row scrolls sideways on phones and bleeds to the gutter */}
      <div role="tablist" aria-label="Your client" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 scrollbar-hide">
        {CLIENTS.map((client, i) => (
          <button
            key={client.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`install-tab-${client.id}`}
            aria-selected={i === current}
            aria-controls={`install-panel-${client.id}`}
            tabIndex={i === current ? 0 : -1}
            onClick={() => setCurrent(i)}
            onKeyDown={(event) => onKey(event, i)}
            className={cx(
              "flex h-11 shrink-0 items-center gap-2.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color,scale] duration-150 active:scale-[0.96]",
              i === current ? "bg-base-900 text-white" : "bg-base-50 text-base-700 ring-1 ring-base-200 hover:bg-base-100 hover:text-base-900",
            )}
          >
            <ClientMark path={MARKS[client.mark]} className="size-4.5" aria-hidden="true" />
            {client.name}
          </button>
        ))}
      </div>

      {CLIENTS.map((client, i) => (
        <section key={client.id} role="tabpanel" id={`install-panel-${client.id}`} aria-labelledby={`install-tab-${client.id}`} hidden={i !== current} className="mt-6 rounded-2xl bg-base-50 p-5 sm:p-6 lg:p-8">
          <ol className="space-y-6">
            {client.steps.map((step, n) => (
              <li key={step.title} className="grid gap-3 sm:grid-cols-[2.25rem_1fr] sm:gap-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-white text-sm font-medium text-base-900 ring-1 ring-edge tabular-nums" aria-hidden="true">
                  {n + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-base-900">
                    <span className="sr-only">Step {n + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-prose text-sm text-pretty text-base-600">{step.body}</p>
                  {step.code && (
                    <div className="mt-3">
                      <CopyBlock code={step.code} label={`the ${client.name} configuration`} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {client.note && <p className="mt-6 border-t border-base-200 pt-4 text-xs text-pretty text-base-500">{client.note}</p>}
        </section>
      ))}
    </div>
  );
}
