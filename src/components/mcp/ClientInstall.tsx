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
//
// Since 2026-10-23 the row is the system's Tabs (Radix owns the roles and the arrow keys; the
// chosen tab sits on the pressed pill that travels on the spring, with its mark as the tab's
// icon), the MCP / REST switch the Segmented, the card the raised surface with the container
// corner, the step numbers Badges, the links TextLinks and the snippets CopyBlocks with the
// ghost Button. The row still bleeds to the gutter, scrolls sideways and fades the edge with more
// beyond it; the hairline before the developer tools is drawn on the first of them.

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import ClientMark, { MARK_COLORS, MARKS } from "@/components/assets/ClientMarks";
import Symbol from "@/components/assets/Symbol";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import Segmented from "@/components/fundations/elements/Segmented";
import TextLink from "@/components/fundations/elements/TextLink";
import Tabs, { Tab, TabList, TabPanel } from "@/components/fundations/molecules/Tabs";
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import TerminalWindow from "@/components/fundations/icons/TerminalWindow";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";
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
const code = "font-mono text-caption-lg text-foreground";
const ui = "text-foreground";
const semibold = { fontVariationSettings: fontWeights.semibold };

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
            In Claude, open <span className={ui} style={semibold}>Customize → Connectors</span> and click <span className={ui} style={semibold}>Add custom connector</span>. Name it Curatit,
            paste the link and click <span className={ui} style={semibold}>Add</span>.
          </>
        ),
        open: { label: "Open Claude's connectors", href: "https://claude.ai/customize/connectors" },
      },
      {
        title: "Sign in",
        body: (
          <>
            Click <span className={ui} style={semibold}>Connect</span>, sign in to Curatit and choose <span className={ui} style={semibold}>Allow</span>. If Claude asks which OAuth client to
            use, pick <span className={ui} style={semibold}>Register automatically</span>.
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
            Open <span className={ui} style={semibold}>Plugins</span> in ChatGPT, click <span className={ui} style={semibold}>+</span> and choose <span className={ui} style={semibold}>Add custom MCP server</span>.
            Name it Curatit, paste the link under Connection and choose OAuth.
          </>
        ),
        open: { label: "Open ChatGPT Plugins", href: "https://chatgpt.com/plugins" },
      },
      {
        title: "Sign in",
        body: (
          <>
            Accept the warning, click <span className={ui} style={semibold}>Create as a plugin</span>, then sign in to Curatit and choose <span className={ui} style={semibold}>Allow</span>.
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
          <TextLink href="/api/v1/openapi.json" external>
            openapi.json
          </TextLink>
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
        <h2 className="text-body-base text-foreground" style={semibold}>
          {card.title}
        </h2>
        {card.testing && <Badge>In testing</Badge>}
      </div>
      <p className="mt-1 text-body-sm text-pretty text-muted-foreground">{card.intro}</p>
      <ol className="mt-6 space-y-5">
        {card.steps.map((step, n) => (
          <li key={step.title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
            <Badge variant="outline" className="size-6 justify-center px-0 tabular-nums" aria-hidden="true">
              {n + 1}
            </Badge>
            <div className="min-w-0">
              <h3 className="text-body-sm/6 text-foreground" style={semibold}>
                <span className="sr-only">Step {n + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-0.5 text-body-sm text-pretty text-muted-foreground">{step.body}</p>
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

// The marks' tiles are raised a step above the card (the ladder's shadow carries the ring, so
// they show on the dark site too, as round the OAuth consent screen's marks)
const tile = "grid size-12 place-items-center rounded-[12px] bg-surface-4 text-foreground shadow-surface-4";
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
        <span className="h-px w-full border-t border-dashed border-border" />
        <span className="mcp-flow-card absolute top-1/2 left-0 -mt-[7px] h-3.5 w-3 rounded-[4px] bg-foreground ring-2 ring-surface-3" />
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

// The first developer tool carries the hairline that sets the developer tools apart from the
// chat apps (a Tab is the only thing a TabList can hold)
const firstDeveloper = CLIENTS.findIndex((client) => client.developer);
const divider = "ml-4 before:absolute before:top-1/2 before:-left-2 before:h-4 before:w-px before:-translate-y-1/2 before:bg-border";

export default function ClientInstall() {
  const [current, setCurrent] = useState(CLIENTS[0].id);
  const [mode, setMode] = useState<"mcp" | "rest">("mcp");
  // Whether the last input in the controls was a key: then the card's mark switches at once, so
  // arrowing along the row never trails
  const [snap, setSnap] = useState(false);
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

  const index = CLIENTS.findIndex((client) => client.id === current);

  return (
    <Tabs value={current} onValueChange={setCurrent}>
      <div onKeyDown={() => setSnap(true)} onPointerDown={() => setSnap(false)} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        {/* The tab row scrolls sideways when it doesn't fit, bleeding to the gutter below lg */}
        {mode === "mcp" ? (
          <TabList ref={row} aria-label="Your AI tool" bleed style={{ maskImage: fade }} className="min-h-12 min-w-0 lg:-mx-1 lg:flex-1 lg:px-1">
            {CLIENTS.map((client, i) => (
              <Tab
                key={client.id}
                value={client.id}
                icon={<ClientMark path={MARKS[client.mark]} style={{ color: MARK_COLORS[client.mark] }} aria-hidden="true" />}
                className={cx(i === firstDeveloper && divider)}
              >
                {client.name}
              </Tab>
            ))}
          </TabList>
        ) : (
          <p className="flex min-h-12 items-center text-body-sm text-muted-foreground lg:flex-1">For tools without MCP, and your own scripts.</p>
        )}
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
      <div className="mcp-gradient mt-4 flex min-h-[28rem] items-center justify-center rounded-[24px] px-3 py-10 sm:rounded-[32px] sm:px-10 sm:py-14 lg:min-h-[32rem]">
        <div className="w-full max-w-xl rounded-[24px] bg-surface-3 p-5 text-left shadow-surface-6 sm:p-7">
          <Connection current={mode === "mcp" ? index : null} snap={snap} />
          {mode === "mcp" ? (
            CLIENTS.map((client) => (
              <TabPanel key={client.id} value={client.id}>
                <CardBody card={client} label={`the ${client.name} configuration`} />
              </TabPanel>
            ))
          ) : (
            <CardBody card={REST} label="the REST example" aria-label="Call Curatit over HTTP" />
          )}
        </div>
      </div>
      <p className="mt-4 text-body-sm text-pretty text-muted-foreground">
        Another AI tool? Give it the same link, <code className={`${code} break-all`}>{MCP_URL}</code>: it signs in with your Curatit account, or sends your
        token in an <code className={code}>Authorization: Bearer</code> header. More in the{" "}
        <TextLink href="/docs/mcp">connect guide</TextLink>.
      </p>
    </Tabs>
  );
}
