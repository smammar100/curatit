"use client";

// The install block of the MCP landing page (/agents), after ElevenLabs' MCP page (2026-10-13): a
// row of client tabs, each with its mark, and an MCP / REST switch on the right; under them one
// wide card holding the chosen client's steps under a small connection illustration. Changing tab swaps the card's
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
// Since 2026-10-24 it is Glaze's: the row is Tabs (Base UI owns the roles and the arrow keys; the
// chosen tab sits on the paper pill that slides under it, every tab with its mark), the MCP / REST
// switch a SegmentedControl, the step numbers outline Badges, the actions Buttons, the snippets
// CodeBlocks (CopyBlock). The gradient wash is gone (Glaze has no gradients): the frame is the
// card's grey shell and the steps sit on its panel. The row stays inside the gutter, scrolls
// sideways and fades the edge with more beyond it (a mask, which paints nothing); the hairline
// before the developer tools is drawn on the first of them.

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import ClientMark, { MARK_COLORS, MARKS } from "@/components/assets/ClientMarks";
import Symbol from "@/components/assets/Symbol";
import TextLink from "@/components/fundations/elements/TextLink";
import { ArrowUpRight, Icon, Terminal } from "@/components/glaze/icon";
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
import { Card, CardContent } from "@/components/glaze/ui/card";
import { SegmentedControl, SegmentedControlItem } from "@/components/glaze/ui/segmented-control";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/glaze/ui/tabs";
import { cx } from "@/lib/cx";
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
type Guide = { title: string; intro: ReactNode; steps: Step[]; testing?: boolean };
type Client = Guide & { id: string; name: string; mark: keyof typeof MARKS; developer?: boolean };

// Mono inside the prose at 0.8 of its size, since the mono face reads larger; an interface's own
// words in the label weight
const code = "mono text-text-1";
const ui = "font-medium text-text-1";

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

const REST: Guide = {
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

// What the card says for one client (or for REST); the panel around it is shared
function CardBody({ card, label, ...rest }: { card: Guide; label: string } & HTMLAttributes<HTMLElement>) {
  return (
    <section {...rest}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="type-heading text-text-1">{card.title}</h2>
        {card.testing && <Badge>In testing</Badge>}
      </div>
      <p className="mt-1 type-body-sm text-pretty text-text-2">{card.intro}</p>
      <ol className="mt-6 space-y-5">
        {card.steps.map((step, n) => (
          <li key={step.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
            <Badge variant="outline" aria-hidden="true" className="data self-start">
              {n + 1}
            </Badge>
            <div className="min-w-0">
              <h3 className="type-label text-text-1">
                <span className="sr-only">Step {n + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-0.5 type-body-sm text-pretty text-text-2">{step.body}</p>
              {step.code && (
                <div className="mt-3">
                  <CopyBlock code={step.code} label={step.codeLabel ?? label} tone="light" />
                </div>
              )}
              {step.token && (
                <Button size="sm" render={<Link href={TOKEN_HREF} />} nativeButton={false} className="mt-3">
                  Get a token
                </Button>
              )}
              {step.open && (
                <Button
                  size="sm"
                  variant="secondary"
                  render={<a href={step.open.href} target="_blank" rel="noopener noreferrer" />}
                  nativeButton={false}
                  className="mt-3"
                >
                  {step.open.label}
                  <Icon icon={ArrowUpRight} />
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

// The marks' tiles are an illustration's cards, raised a step above the panel on the surface ladder
// (its shadow carries the ring, so they show on the dark site too, as round the OAuth consent
// screen's marks)
const tile = "grid size-12 place-items-center rounded-panel bg-surface-4 text-text-1 shadow-surface-4";
// The client marks share one cell and cross-fade; after a change made from the keyboard, and
// under reduced motion, they swap at once
const markClass = (shown: boolean, snap: boolean) =>
  cx(
    "col-start-1 row-start-1 size-6",
    snap ? "transition-none" : "transition-[opacity,scale] duration-(--dur-slide) ease-out motion-reduce:transition-none",
    shown ? "opacity-100" : "scale-90 opacity-0",
  );
// A mark's own brand colour, read by text-(--mark); the black marks have none and take the text's
const markColor = (mark: keyof typeof MARKS) => ({ "--mark": MARK_COLORS[mark] }) as CSSProperties;

// The top of the card: Curatit's mark and the chosen client's in two tiles, joined by a dashed
// line along which a small post card travels from Curatit to the client (references flowing into
// your assistant). After the mark pairing on the OAuth consent screen. Decorative: the heading
// says it in words. The client's mark cross-fades when the tab changes; the card's travel is
// .mcp-flow-* in global.css (transform and opacity only, still under reduced motion), over --flow,
// the line's length less the card's width.
function Connection({ current, snap }: { current: number | null; snap: boolean }) {
  return (
    <div className="mb-6 flex items-center justify-center" aria-hidden="true">
      <span className={tile}>
        <Symbol className="size-6" />
      </span>
      <span className="mcp-flow relative mx-2 flex h-12 w-20 items-center [--flow:--spacing(17)] sm:w-24 sm:[--flow:--spacing(21)]">
        <span className="h-px w-full border-t border-dashed border-line" />
        <span className="mcp-flow-card absolute top-1/2 left-0 -mt-1.75 h-3.5 w-3 rounded-tag bg-ink ring-2 ring-paper" />
      </span>
      <span className={tile}>
        {CLIENTS.map((client, i) => (
          <ClientMark key={client.id} path={MARKS[client.mark]} style={markColor(client.mark)} className={cx("text-(--mark)", markClass(i === current, snap))} />
        ))}
        <span className={cx("grid place-items-center", markClass(current === null, snap))}>
          <Icon icon={Terminal} size={24} />
        </span>
      </span>
    </div>
  );
}

// The first developer tool carries the hairline that sets the developer tools apart from the
// chat apps (a tab is the only thing a tab list holds)
const firstDeveloper = CLIENTS.findIndex((client) => client.developer);
const divider = "ml-4 before:absolute before:top-1/2 before:-left-2.5 before:h-4 before:w-px before:-translate-y-1/2 before:bg-line";

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
  // The edge fade is a mask (it paints nothing), handed to the row as --fade
  const fade =
    more.start || more.end
      ? `linear-gradient(to right, ${more.start ? "transparent, black 2.5rem" : "black"}, ${more.end ? "black calc(100% - 2.5rem), transparent" : "black"})`
      : "none";

  const index = CLIENTS.findIndex((client) => client.id === current);

  return (
    <Tabs value={current} onValueChange={(next) => setCurrent(String(next))} className="gap-0">
      <div onKeyDown={() => setSnap(true)} onPointerDown={() => setSnap(false)} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
        {/* The tab row scrolls sideways when it doesn't fit */}
        {mode === "mcp" ? (
          <TabsList
            ref={row}
            aria-label="Your AI tool"
            style={{ "--fade": fade } as CSSProperties}
            className="[mask-image:var(--fade)] lg:min-w-0 lg:flex-1"
          >
            {CLIENTS.map((client, i) => (
              <TabsTrigger key={client.id} value={client.id} className={cx(i === firstDeveloper && divider)}>
                <ClientMark path={MARKS[client.mark]} style={markColor(client.mark)} className="text-(--mark)" aria-hidden="true" />
                {client.name}
              </TabsTrigger>
            ))}
          </TabsList>
        ) : (
          <p className="flex min-h-(--control) items-center type-body-sm text-text-2 lg:flex-1">For tools without MCP, and your own scripts.</p>
        )}
        <SegmentedControl aria-label="Connect over" value={mode} onValueChange={(next) => setMode(next as "mcp" | "rest")} className="w-fit">
          <SegmentedControlItem value="mcp">MCP</SegmentedControlItem>
          <SegmentedControlItem value="rest">REST</SegmentedControlItem>
        </SegmentedControl>
      </div>

      {/* Glaze's card: the grey shell is the frame, the chosen client's steps sit on its panel */}
      <Card className="mt-4">
        <CardContent className="flex min-h-112 items-center justify-center px-3 py-10 sm:px-10 sm:py-14 lg:min-h-128">
          <div className="w-full max-w-xl min-w-0 text-left">
            <Connection current={mode === "mcp" ? index : null} snap={snap} />
            {mode === "mcp" ? (
              CLIENTS.map((client) => (
                <TabsContent key={client.id} value={client.id}>
                  <CardBody card={client} label={`the ${client.name} configuration`} />
                </TabsContent>
              ))
            ) : (
              <CardBody card={REST} label="the REST example" aria-label="Call Curatit over HTTP" />
            )}
          </div>
        </CardContent>
      </Card>
      <p className="mt-4 type-body-sm text-pretty text-text-2">
        Another AI tool? Give it the same link, <code className={`${code} break-all`}>{MCP_URL}</code>: it signs in with your Curatit account, or sends your
        token in an <code className={code}>Authorization: Bearer</code> header. More in the{" "}
        <TextLink href="/docs/mcp">connect guide</TextLink>.
      </p>
    </Tabs>
  );
}
