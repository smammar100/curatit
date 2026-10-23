"use client";

// The install block of the MCP landing page (/agents), after ElevenLabs' MCP page (2026-10-13): a
// row of client tabs, each with its mark, and an MCP / REST switch on the right; under them one
// wide panel washed with a soft gradient (.mcp-gradient in global.css) holding a white card with
// the chosen client's steps under a small connection illustration. Changing tab swaps the card's
// content; every client's steps are in the HTML and only the chosen one shows. Tabs follow the
// ARIA pattern: ← / → move between them, Home and End jump.
// Claude and ChatGPT come first (2026-10-18, at the owner's request: most Curatit members aren't
// developers and the token-and-terminal steps lost them). Both sign in with the visitor's Curatit
// account through OAuth, so their steps are copy a link, add it, sign in, ask: no token, no code.
// Both were connected that way and in use when this was written (their sessions in
// auth.sessions). The developer tools follow, after a hairline in the tab row, still with a
// personal access token; the token stays in the environment wherever the client reads it there.
// (2026-10-15: Gemini CLI, Windsurf and Claude Desktop were taken out; the Claude tab now covers
// the desktop app, since connectors added in Claude show up there too.)

import { Fragment, useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import ClientMark, { MARK_COLORS, MARKS } from "@/components/assets/ClientMarks";
import Symbol from "@/components/assets/Symbol";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import TerminalWindow from "@/components/fundations/icons/TerminalWindow";
import { cx } from "@/lib/cx";
import Segmented from "@/components/fundations/elements/Segmented";
import CopyBlock from "./CopyBlock";
import { SITE_URL } from "@/lib/site";
import { MCP_URL } from "./tools";

const TOKEN_HREF = "/dashboard/settings/tokens";

type Step = {
  title: string;
  body: ReactNode;
  code?: string;
  /** What the copy button names, when it isn't the client's configuration */
  codeLabel?: string;
  token?: boolean;
  /** A button that opens the place in the client where the next move happens */
  open?: { label: string; href: string };
};
type Card = { title: string; intro: ReactNode; steps: Step[]; testing?: boolean };
type Client = Card & { id: string; name: string; mark: keyof typeof MARKS; developer?: boolean };

// A step under the 13px prose it sits in, since the mono face reads larger
const code = "font-mono text-caption-lg text-primary-foreground";
const ui = "font-medium text-primary-foreground";
const link = "underline decoration-border-strong underline-offset-2 transition-colors duration-150 ease-out-quint hover:text-brand-foreground";

// The chat apps' first step: the one thing to copy
const linkStep: Step = {
  title: "Copy Curatit's link",
  body: "You'll paste it in the next step.",
  code: MCP_URL,
  codeLabel: "Curatit's link",
};

// The first step for every client that uses a personal access token; `keep` says where it goes
const tokenStep = (keep: ReactNode): Step => ({
  title: "Create a token",
  body: (
    <>
      Sign in to Curatit and create one under API tokens. It&apos;s shown only once, so {keep}
    </>
  ),
  token: true,
});
const envToken = (
  <>
    save it as an environment variable named <code className={code}>CURATIT_ACCESS_TOKEN</code>.
  </>
);
const askStep: Step = {
  title: "Ask for references",
  body: "Try: Find three finance carousels that launch a feature. Every answer comes with the posts' Instagram links.",
};

const CLIENTS: Client[] = [
  {
    id: "claude",
    name: "Claude",
    mark: "claude",
    title: "Add Curatit to Claude",
    intro: "About a minute, no code: paste one link and sign in with your Curatit account. It works on Claude's free plan too.",
    steps: [
      linkStep,
      {
        title: "Add it to Claude",
        body: (
          <>
            In Claude, open <span className={ui}>Customize → Connectors</span> and click <span className={ui}>Add custom connector</span>. Name it Curatit,
            paste the link and click <span className={ui}>Add</span>.
          </>
        ),
        open: { label: "Open Claude's connectors", href: "https://claude.ai/customize/connectors" },
      },
      {
        title: "Sign in",
        body: (
          <>
            Click <span className={ui}>Connect</span>, sign in to Curatit and choose <span className={ui}>Allow</span>. If Claude asks which OAuth client to
            use, pick <span className={ui}>Register automatically</span>.
          </>
        ),
      },
      {
        title: "Ask for ideas",
        body: "In a new chat, try: Find three finance carousels that launch a feature. You get real posts with their Instagram links.",
      },
    ],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    mark: "chatgpt",
    title: "Add Curatit to ChatGPT",
    intro: "No code: paste one link and sign in with Curatit. Some ChatGPT plans can't add apps; if you don't see the option, use Claude.",
    steps: [
      linkStep,
      {
        title: "Add it to ChatGPT",
        body: (
          <>
            Open <span className={ui}>Plugins</span> in ChatGPT, click <span className={ui}>+</span> and choose <span className={ui}>Add custom MCP server</span>.
            Name it Curatit, paste the link under Connection and choose OAuth.
          </>
        ),
        open: { label: "Open ChatGPT Plugins", href: "https://chatgpt.com/plugins" },
      },
      {
        title: "Sign in",
        body: (
          <>
            Accept the warning, click <span className={ui}>Create as a plugin</span>, then sign in to Curatit and choose <span className={ui}>Allow</span>.
          </>
        ),
      },
      {
        title: "Ask for ideas",
        body: "In a new chat, type @, pick Curatit, then ask: Find three finance carousels that launch a feature.",
      },
    ],
  },
  {
    id: "claude-code",
    name: "Claude Code",
    mark: "claudeCode",
    developer: true,
    title: "Add Curatit to Claude Code",
    intro: "For developers. One command in your terminal; your shell fills the token in. Claude Code keeps it in ~/.claude.json, so treat that file like the token.",
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
    developer: true,
    title: "Add Curatit to Cursor",
    intro: "For developers. One entry in your project's MCP settings; Cursor fills the token in from your environment.",
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
    developer: true,
    title: "Add Curatit to VS Code",
    intro: "For developers. One file in your workspace, for GitHub Copilot's agent mode. VS Code asks for the token once and keeps it for you.",
    steps: [
      tokenStep("keep it to hand: VS Code asks for it the first time it connects."),
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
      code: `curl -X POST ${SITE_URL}/api/v1/posts/search \\
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
        <h2 className="text-body-base font-medium text-primary-foreground">{card.title}</h2>
        {card.testing && <Badge>In testing</Badge>}
      </div>
      <p className="mt-1 text-body-sm text-pretty text-secondary-foreground">{card.intro}</p>
      <ol className="mt-6 space-y-5">
        {card.steps.map((step, n) => (
          <li key={step.title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
            <span className="flex size-6 items-center justify-center rounded-full bg-card text-caption-lg font-medium text-primary-foreground tabular-nums ring-1 ring-border-default" aria-hidden="true">
              {n + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-body-sm/6 font-medium text-primary-foreground">
                <span className="sr-only">Step {n + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-0.5 text-body-sm text-pretty text-secondary-foreground">{step.body}</p>
              {step.code && (
                <div className="mt-3">
                  <CopyBlock code={step.code} label={step.codeLabel ?? label} tone="light" />
                </div>
              )}
              {step.token && (
                <Button isLink size="sm" variant="default" href={TOKEN_HREF} className="mt-3 w-fit">
                  Get a token
                </Button>
              )}
              {step.open && (
                <Button
                  isLink
                  size="sm"
                  variant="secondary"
                  href={step.open.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  rightIcon={<ArrowUpRight className="size-3.5" aria-hidden="true" />}
                  className="mt-3 w-fit"
                >
                  {step.open.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// The marks' tiles match the card, so the hairline (edge, as round the OAuth consent screen's
// marks) is what shows them on the dark site, where the shadow loses its drop
const tile = "grid size-12 place-items-center rounded-xl bg-container text-primary-foreground ring-1 ring-edge shadow-lg";
// The client marks share one cell and cross-fade; after a change made from the keyboard, and
// under reduced motion, they swap at once
const markClass = (shown: boolean, snap: boolean) =>
  cx(
    "size-6 [grid-area:1/1]",
    snap ? "transition-none" : "transition-[opacity,scale] duration-200 ease-out-quint motion-reduce:transition-none",
    shown ? "opacity-100" : "scale-90 opacity-0",
  );

// The top of the card: Curatit's mark and the chosen client's in two tiles, joined by a dashed
// line along which a small post card travels from Curatit to the client (references flowing into
// your assistant). After the mark pairing on the OAuth consent screen. Decorative: the heading
// says it in words. The client's mark cross-fades when the tab changes; the card's travel is
// .mcp-flow-* in global.css (transform and opacity only, still under reduced motion).
function Connection({ current, snap }: { current: number | null; snap: boolean }) {
  return (
    <div className="mb-6 flex items-center justify-center" aria-hidden="true">
      <span className={tile}>
        <Symbol className="size-6" />
      </span>
      <span className="mcp-flow relative mx-2 flex h-12 w-20 items-center [--flow:4.25rem] sm:w-24 sm:[--flow:5.25rem]">
        <span className="h-px w-full border-t border-dashed border-border-strong" />
        <span className="mcp-flow-card absolute top-1/2 left-0 -mt-[7px] h-3.5 w-3 rounded-sm bg-primary-foreground ring-2 ring-container" />
      </span>
      <span className={tile}>
        {CLIENTS.map((client, i) => (
          <ClientMark
            key={client.id}
            path={MARKS[client.mark]}
            style={{ color: MARK_COLORS[client.mark] }}
            className={markClass(i === current, snap)}
          />
        ))}
        <TerminalWindow className={markClass(current === null, snap)} />
      </span>
    </div>
  );
}

export default function ClientInstall() {
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<"mcp" | "rest">("mcp");
  // Whether the last input in the controls was a key: then the tabs' fill and the card's mark
  // switch at once, so arrowing along the row never trails (the switch's thumb snaps the same way)
  const [snap, setSnap] = useState(false);
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

  return (
    <div>
      <div onKeyDown={() => setSnap(true)} onPointerDown={() => setSnap(false)} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        {/* The tab row scrolls sideways when it doesn't fit, bleeding to the gutter below lg; its
            padding leaves room for the focus ring */}
        <div ref={row} style={{ maskImage: fade }} className="-mx-4 min-h-12 min-w-0 overflow-x-auto px-4 py-1 sm:-mx-8 sm:px-8 lg:-mx-1 lg:flex-1 lg:px-1 scrollbar-hide">
          {mode === "mcp" ? (
            <div role="tablist" aria-label="Your AI tool" className="flex w-max items-center gap-1">
              {CLIENTS.map((client, i) => (
                <Fragment key={client.id}>
                  {/* A hairline sets the developer tools apart from the chat apps */}
                  {client.developer && !CLIENTS[i - 1]?.developer && <span className="mx-2 h-5 w-px shrink-0 bg-border-strong" aria-hidden="true" />}
                  <button
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
                      "flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-body-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus",
                      // The chosen tab's ring is a box-shadow, so on a click it fades in with the
                      // fill; from the keyboard both switch at once
                      snap ? "transition-none" : "transition-[color,background-color,box-shadow] duration-150 ease-out-quint",
                      i === current ? "bg-component-on-container-subtle text-primary-foreground ring-1 ring-border-strong" : "text-secondary-foreground hover:text-primary-foreground",
                    )}
                  >
                    <ClientMark path={MARKS[client.mark]} style={{ color: MARK_COLORS[client.mark] }} className="size-4 shrink-0" aria-hidden="true" />
                    {client.name}
                  </button>
                </Fragment>
              ))}
            </div>
          ) : (
            <p className="flex h-10 items-center text-body-sm text-secondary-foreground">For tools without MCP, and your own scripts.</p>
          )}
        </div>
        <Segmented
          aria-label="Connect over"
          size="md"
          shape="pill"
          className="w-fit"
          value={mode}
          onValueChange={setMode}
          options={[
            { value: "mcp", label: "MCP" },
            { value: "rest", label: "REST" },
          ]}
        />
      </div>

      {/* The gradient frame; on phones the card fills it with the wash as a border */}
      <div className="mcp-gradient mt-4 flex min-h-[28rem] items-center justify-center rounded-5xl px-3 py-10 sm:rounded-[2rem] sm:px-10 sm:py-14 lg:min-h-[32rem]">
        <div className="w-full max-w-xl rounded-2xl bg-container p-5 text-left shadow-xl sm:p-7">
          <Connection current={mode === "mcp" ? current : null} snap={snap} />
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
      <p className="mt-4 text-body-sm text-pretty text-secondary-foreground">
        Another AI tool? Give it the same link, <code className={`${code} break-all`}>{MCP_URL}</code>: it signs in with your Curatit account, or sends your
        token in an <code className={code}>Authorization: Bearer</code> header. More in the{" "}
        <Link href="/docs/mcp" className={link}>
          connect guide
        </Link>
        .
      </p>
    </div>
  );
}
