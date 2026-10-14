"use client";

// The install block of the MCP landing page (/agents), after ElevenLabs' MCP page (2026-10-13): a
// row of client tabs, each with its mark, and an MCP / REST switch on the right; under them one
// wide panel washed with a soft gradient (.mcp-gradient in global.css) holding a white card with
// the chosen client's steps under a small connection illustration. Changing tab swaps the card's
// content; every client's steps are in the HTML and only the chosen one shows. Tabs follow the
// ARIA pattern: ← / → move between them, Home and End jump.
// Only the four most-used clients have a tab (2026-10-15, at the person's request: Gemini CLI,
// Windsurf and Claude Desktop were taken out; the connect guide at /docs/mcp still covers Claude
// Desktop). The token stays in the environment wherever the client can read it from there.

import { useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import ClientMark, { MARK_COLORS, MARKS } from "@/components/assets/ClientMarks";
import Symbol from "@/components/assets/Symbol";
import Button from "@/components/fundations/elements/Button";
import TerminalWindow from "@/components/fundations/icons/TerminalWindow";
import { cx } from "@/lib/cx";
import CopyBlock from "./CopyBlock";
import { MCP_URL } from "./tools";

const TOKEN_HREF = "/dashboard/settings/tokens";

type Step = { title: string; body: ReactNode; code?: string; token?: boolean };
type Card = { title: string; intro: ReactNode; steps: Step[]; testing?: boolean };
type Client = Card & { id: string; name: string; mark: keyof typeof MARKS };

const code = "font-mono text-[13px] text-base-900";
const link = "underline decoration-base-300 underline-offset-2 transition-colors duration-150 hover:text-accent-600";

// The first step for every client that uses a personal access token; `keep` says where it goes
const tokenStep = (keep: ReactNode): Step => ({
  title: "Create a token",
  body: (
    <>
      Sign in and make one in API tokens. It&apos;s shown once; {keep}
    </>
  ),
  token: true,
});
const envToken = (
  <>
    put it in your environment as <code className={code}>CURATIT_ACCESS_TOKEN</code>.
  </>
);
const askStep: Step = {
  title: "Ask for references",
  body: "Try: Find three fintech carousels that launch a feature, with their sources. Every answer comes back with real Instagram links.",
};

const CLIENTS: Client[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    mark: "claudeCode",
    title: "Add Curatit to Claude Code",
    intro: "One command in your terminal. Claude Code reads the token from your shell.",
    steps: [
      tokenStep(envToken),
      { title: "Add the server", body: "Run this in your terminal:", code: `claude mcp add --transport http curatit ${MCP_URL} --header "Authorization: Bearer $CURATIT_ACCESS_TOKEN"` },
      askStep,
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    mark: "cursor",
    title: "Add Curatit to Cursor",
    intro: "One entry in your project's MCP settings. Cursor fills the token in from your environment.",
    steps: [
      tokenStep(envToken),
      {
        title: "Add the server",
        body: (
          <>
            Add this to <code className={code}>.cursor/mcp.json</code> in your project:
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
    name: "VS Code & Copilot",
    mark: "vscode",
    title: "Add Curatit to VS Code",
    intro: "One file in your workspace, for GitHub Copilot's agent mode. VS Code asks for the token once and keeps it for you.",
    steps: [
      tokenStep("VS Code asks for it the first time it connects."),
      {
        title: "Add the server",
        body: (
          <>
            Add this to <code className={code}>.vscode/mcp.json</code>:
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
    id: "chatgpt",
    name: "ChatGPT",
    mark: "chatgpt",
    testing: true,
    title: "Add Curatit to ChatGPT",
    intro: "ChatGPT signs in with your Curatit account instead of a token. This path is still being tested: if it fails, use one of the other clients for now.",
    steps: [
      { title: "Turn on developer mode", body: "In ChatGPT, open Settings → Connectors → Advanced and switch on Developer mode." },
      { title: "Create the connector", body: "Choose Create, name it Curatit, paste the server address and pick OAuth for authentication.", code: MCP_URL },
      { title: "Sign in and allow", body: "ChatGPT opens Curatit's sign-in. Allow it, and the six tools appear in your chats." },
    ],
  },
];

const REST: Card = {
  title: "Call Curatit over HTTP",
  intro: (
    <>
      No MCP in your tool, or writing your own script? The same six tools answer as a REST API under <code className={code}>/api/v1</code>, with the same token.
    </>
  ),
  steps: [
    tokenStep(envToken),
    {
      title: "Call a tool",
      body: "A search, for example:",
      code: `curl -X POST https://curatit.vercel.app/api/v1/posts/search \\
  -H "Authorization: Bearer $CURATIT_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "launch", "filters": {"industries": ["fintech"], "formats": ["carousel"]}}'`,
    },
    {
      title: "Read the spec",
      body: (
        <>
          Every route and field is described in{" "}
          <a href="/api/v1/openapi.json" className={link}>
            openapi.json
          </a>
          .
        </>
      ),
    },
  ],
};

// What the card says for one client (or for REST); the white card around it is shared
function CardBody({ card, label, ...rest }: { card: Card; label: string } & HTMLAttributes<HTMLElement>) {
  return (
    <section {...rest}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-medium text-base-900">{card.title}</h2>
        {card.testing && <span className="rounded-md bg-base-50 px-2 py-0.5 text-xs text-base-600 ring-1 ring-base-200">In testing</span>}
      </div>
      <p className="mt-1 text-sm text-pretty text-base-600">{card.intro}</p>
      <ol className="mt-6 space-y-5">
        {card.steps.map((step, n) => (
          <li key={step.title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
            <span className="flex size-6 items-center justify-center rounded-full bg-base-50 text-xs font-medium text-base-900 tabular-nums ring-1 ring-base-200" aria-hidden="true">
              {n + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm/6 font-medium text-base-900">
                <span className="sr-only">Step {n + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-0.5 text-sm text-pretty text-base-600">{step.body}</p>
              {step.code && (
                <div className="mt-3">
                  <CopyBlock code={step.code} label={label} tone="light" />
                </div>
              )}
              {step.token && (
                <Button isLink size="sm" variant="default" href={TOKEN_HREF} className="mt-3 w-fit">
                  Get a token
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const tile = "grid size-12 place-items-center rounded-xl bg-white text-base-900 ring-1 ring-edge shadow-[0_10px_24px_-12px_rgb(0_0_0/0.3)]";

// The top of the card: Curatit's mark and the chosen client's in two tiles, joined by a dashed
// line along which a small post card travels from Curatit to the client (references flowing into
// your assistant). After the mark pairing on the OAuth consent screen. Decorative: the heading
// says it in words. The client's mark cross-fades when the tab changes; the card's travel is
// .mcp-flow-* in global.css (transform and opacity only, still under reduced motion).
function Connection({ current }: { current: number | null }) {
  return (
    <div className="mb-6 flex items-center justify-center" aria-hidden="true">
      <span className={tile}>
        <Symbol className="size-6" />
      </span>
      <span className="mcp-flow relative mx-2 flex h-12 w-20 items-center [--flow:4.25rem] sm:w-24 sm:[--flow:5.25rem]">
        <span className="h-px w-full border-t border-dashed border-base-300" />
        <span className="mcp-flow-card absolute top-1/2 left-0 -mt-[7px] h-3.5 w-3 rounded-[3px] bg-base-900 ring-2 ring-white" />
      </span>
      <span className={tile}>
        {CLIENTS.map((client, i) => (
          <ClientMark
            key={client.id}
            path={MARKS[client.mark]}
            style={{ color: MARK_COLORS[client.mark] }}
            className={cx("size-6 transition-[opacity,scale] duration-200 ease-out [grid-area:1/1]", i === current ? "opacity-100" : "scale-90 opacity-0")}
          />
        ))}
        <TerminalWindow className={cx("size-6 transition-[opacity,scale] duration-200 ease-out [grid-area:1/1]", current === null ? "opacity-100" : "scale-90 opacity-0")} />
      </span>
    </div>
  );
}

export default function ClientInstall() {
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<"mcp" | "rest">("mcp");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  // The tab row fades the edge that has more tabs beyond it, only while it does
  const row = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ start: false, end: false });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const update = () => {
      const start = el.scrollLeft > 1;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setMore((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, [mode]);
  const fade =
    more.start || more.end
      ? `linear-gradient(to right, ${more.start ? "transparent, black 2.5rem" : "black"}, ${more.end ? "black calc(100% - 2.5rem), transparent" : "black"})`
      : undefined;

  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = CLIENTS.length - 1;
    const next = event.key === "ArrowRight" ? (index === last ? 0 : index + 1) : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1) : event.key === "Home" ? 0 : event.key === "End" ? last : null;
    if (next === null) return;
    event.preventDefault();
    setCurrent(next);
    tabs.current[next]?.focus();
  };

  const switchClass = (on: boolean) =>
    cx(
      "flex h-8 items-center rounded-full px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
      on ? "bg-white text-base-900 ring-1 ring-base-200" : "text-base-500 hover:text-base-900",
    );

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        {/* The tab row scrolls sideways when it doesn't fit, bleeding to the gutter below lg; its
            padding leaves room for the focus ring */}
        <div ref={row} style={{ maskImage: fade }} className="-mx-4 min-h-12 min-w-0 overflow-x-auto px-4 py-1 sm:-mx-8 sm:px-8 lg:-mx-1 lg:flex-1 lg:px-1 scrollbar-hide">
          {mode === "mcp" ? (
            <div role="tablist" aria-label="Your AI tool" className="flex w-max gap-1">
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
                    "flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
                    i === current ? "bg-white text-base-900 ring-1 ring-base-200" : "text-base-500 hover:text-base-900",
                  )}
                >
                  <ClientMark path={MARKS[client.mark]} style={{ color: MARK_COLORS[client.mark] }} className="size-4 shrink-0" aria-hidden="true" />
                  {client.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="flex h-10 items-center text-sm text-base-600">For tools without MCP, and your own scripts.</p>
          )}
        </div>
        <div role="group" aria-label="Connect over" className="flex w-fit shrink-0 gap-1 rounded-full bg-base-50 p-1 ring-1 ring-base-200">
          <button type="button" aria-pressed={mode === "mcp"} onClick={() => setMode("mcp")} className={switchClass(mode === "mcp")}>
            MCP
          </button>
          <button type="button" aria-pressed={mode === "rest"} onClick={() => setMode("rest")} className={switchClass(mode === "rest")}>
            REST
          </button>
        </div>
      </div>

      {/* The gradient frame; on phones the card fills it with the wash as a border */}
      <div className="mcp-gradient mt-4 flex min-h-[28rem] items-center justify-center rounded-[1.5rem] px-3 py-10 sm:rounded-[2rem] sm:px-10 sm:py-14 lg:min-h-[32rem]">
        <div className="w-full max-w-xl rounded-2xl bg-white p-5 text-left shadow-[0_24px_60px_-20px_rgb(0_0_0/0.25)] sm:p-7 dark:ring-1 dark:ring-edge">
          <Connection current={mode === "mcp" ? current : null} />
          {CLIENTS.map((client, i) => (
            <CardBody
              key={client.id}
              card={client}
              label={`the ${client.name} configuration`}
              role="tabpanel"
              id={`install-panel-${client.id}`}
              aria-labelledby={`install-tab-${client.id}`}
              hidden={mode !== "mcp" || i !== current}
            />
          ))}
          <CardBody card={REST} label="the REST example" aria-label="Call Curatit over HTTP" hidden={mode !== "rest"} />
        </div>
      </div>
      <p className="mt-4 text-sm text-pretty text-base-600">
        Another MCP client? Point it at <code className={`${code} break-all`}>{MCP_URL}</code> (Streamable HTTP) with your token in an{" "}
        <code className={code}>Authorization: Bearer</code> header. The{" "}
        <Link href="/docs/mcp" className={link}>
          connect guide
        </Link>{" "}
        covers Claude Desktop too.
      </p>
    </div>
  );
}
