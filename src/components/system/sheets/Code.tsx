// /system/code: CopyBlock (src/components/mcp/CopyBlock.tsx) in its two tones, its copy
// confirmation and its recipe, then inline <code> in running text and where a token goes in a
// snippet. Every block here is the real component, so each one copies. A server component:
// CopyBlock brings its own script
import type { ReactNode } from "react";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import CopyBlock from "@/components/mcp/CopyBlock";
import { MCP_URL } from "@/components/mcp/tools";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";

// The Claude Code command from /docs/mcp and the install card, long enough to show the two tones
// apart: the dark slab scrolls it, the light field wraps it
const COMMAND = `claude mcp add --transport http curatit ${MCP_URL} --header "Authorization: Bearer $CURATIT_ACCESS_TOKEN"`;

// Cursor's configuration, as /docs/mcp and the install card give it
const CURSOR = `{
  "mcpServers": {
    "curatit": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer \${env:CURATIT_ACCESS_TOKEN}" }
    }
  }
}`;

// What CopyBlock.tsx sets for each tone, and what the two share
const RECIPE: { label: string; dark: ReactNode; light: ReactNode }[] = [
  { label: "fill", dark: <Mono tone="primary">bg-standout</Mono>, light: <Mono tone="primary">bg-card</Mono> },
  {
    label: "text",
    dark: <Mono tone="primary">text-on-standout-primary-foreground</Mono>,
    light: <Mono tone="primary">text-primary-foreground</Mono>,
  },
  {
    label: "edge",
    dark: <Use>None: the slab is its own edge</Use>,
    light: <Mono tone="primary">ring-1 ring-border-default</Mono>,
  },
  {
    label: "long lines",
    dark: <Use>Kept whole: the only tone that ever scrolls sideways</Use>,
    light: (
      <Stack>
        <Use>Wrapped, anywhere a line has to break</Use>
        <Mono>whitespace-pre-wrap [overflow-wrap:anywhere]</Mono>
      </Stack>
    ),
  },
  {
    label: "copy button",
    dark: (
      <Stack>
        <Mono tone="primary">bg-paper/10, hover bg-paper/20</Mono>
        <Mono>icon text-on-standout-primary-foreground</Mono>
      </Stack>
    ),
    light: (
      <Stack>
        <Use>No fill, hover bg-component-hover</Use>
        <Mono>icon text-secondary-foreground, hover text-primary-foreground</Mono>
      </Stack>
    ),
  },
];
const SHARED: { label: string; value: ReactNode }[] = [
  {
    label: "type",
    value: (
      <Stack>
        <Mono tone="primary">font-mono text-body-sm leading-relaxed</Mono>
        <Use>13px on a 21px line, the system monospace stack</Use>
      </Stack>
    ),
  },
  {
    label: "box",
    value: (
      <Stack>
        <Mono tone="primary">overflow-x-auto rounded-lg px-4 py-3.5 pr-14</Mono>
        <Use>
          The 56px on the right keeps wrapped text, and the end of a scrolled line, clear of the button.
          Only the dark tone ever scrolls: the light one wraps first
        </Use>
      </Stack>
    ),
  },
  {
    label: "button",
    value: (
      <Stack>
        <Mono tone="primary">absolute top-2 right-2 size-9 rounded-md</Mono>
        <Use>36px, the icon 16px. Its fill and icon colour tween 150ms ease-out-quint</Use>
      </Stack>
    ),
  },
  {
    label: "focus",
    value: (
      <Stack>
        <Mono tone="primary">
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus
        </Mono>
        <Use>On keyboard focus only</Use>
      </Stack>
    ),
  },
];

const LINK = "underline decoration-border-strong underline-offset-2 hover:text-primary-foreground";
const INLINE = "font-mono text-body-sm text-primary-foreground";

// A name inside one of this sheet's own sentences, set by its own inline-code rule (the
// sentence's size, a step darker). SheetParts' Mono, a step smaller, stays for the tables'
// standalone values
function C({ children }: { children: ReactNode }) {
  return <code className={INLINE}>{children}</code>;
}

function Use({ children }: { children: ReactNode }) {
  return <span className="text-body-sm text-secondary-foreground">{children}</span>;
}

function Stack({ children }: { children: ReactNode }) {
  return <span className="flex flex-col gap-0.5">{children}</span>;
}

// The step above both tone specimens, as the install card on /agents sets it
function Step() {
  return (
    <>
      <p className="text-body-sm/6 font-medium text-primary-foreground">Add the server</p>
      <p className="mt-0.5 text-body-sm text-secondary-foreground">Run this in your terminal:</p>
    </>
  );
}

// The icon a moment shows, drawn from the same two icons CopyBlock swaps
function Glyph({ icon, children }: { icon: "copy" | "check"; children: ReactNode }) {
  return (
    <span className="flex items-start gap-2.5">
      {icon === "copy" ? (
        <Copy size="sm" className="mt-0.5 shrink-0 text-primary-foreground" />
      ) : (
        <Check size="sm" className="mt-0.5 shrink-0 text-primary-foreground" />
      )}
      <Use>{children}</Use>
    </span>
  );
}

export default function CodeSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Code">
        CopyBlock puts a command or a configuration on the page with a copy button that confirms
        itself: a dark slab on the page, a light field inside a white card. A name inside a sentence
        is inline code instead.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                CopyBlock (<C>components/mcp/CopyBlock.tsx</C>) for anything someone pastes somewhere
                else: a terminal command, a client&rsquo;s configuration, Curatit&rsquo;s link. It takes{" "}
                <C>code</C>, <C>label</C> and <C>tone</C> and nothing else. There&rsquo;s no{" "}
                <C>className</C>, so the two tones are the whole set.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A name inside a sentence (a file, a variable, a route): inline <C>&lt;code&gt;</C>. A
                secret shown once, like a new token: the token page&rsquo;s own reveal (<C>ApiTokens.tsx</C>).
                A link to share, like a board&rsquo;s: a read-only field and a Copy button (
                <C>BoardView.tsx</C>). Text built at the click, like the post&rsquo;s brief: a button whose
                words turn to Copied (<C>CopyBrief</C> in <C>CreativeBreakdown.tsx</C>).
              </>
            ),
          },
          {
            term: "Tones",
            text: (
              <>
                Two, and nothing else. <C>tone=&quot;dark&quot;</C> is the default, on the page.{" "}
                <C>tone=&quot;light&quot;</C> goes inside a white card (<C>bg-container</C>), like
                the install card on /agents. The dark slab keeps every line whole and scrolls; the light field
                wraps, because a narrow card would hide most of a command.
              </>
            ),
          },
          {
            term: "Label",
            text: (
              <>
                A noun phrase that reads after Copy: <C>label=&quot;the Cursor configuration&quot;</C>{" "}
                names the button Copy the Cursor configuration, then Copied the Cursor configuration. Say
                what&rsquo;s in it, never &ldquo;code&rdquo; or &ldquo;snippet&rdquo;: a page with three blocks
                would offer Copy code three times.
              </>
            ),
          },
          {
            term: "Secrets",
            text: (
              <>
                Never in a snippet, not even a test one. Name the variable the client reads (
                <C>$CURATIT_ACCESS_TOKEN</C>, <C>{"${env:CURATIT_ACCESS_TOKEN}"}</C>,{" "}
                <C>{"${input:curatit-token}"}</C>), never a value. The pages are static, so what a
                CopyBlock holds is in the HTML for every visitor, and pasted configuration lands in files people
                commit and share.
              </>
            ),
          },
          {
            term: "Values",
            text: (
              <>
                Build addresses from <C>MCP_URL</C> and <C>SITE_URL</C> (
                <C>components/mcp/tools.ts</C>, <C>lib/site.ts</C>), never a typed domain: the
                address changed twice on 2026-10-17. A placeholder is words in the value&rsquo;s place, as
                /docs/mcp writes them: <C>paste-your-token-here</C>, <C>/path/to/curatit</C>.
              </>
            ),
          },
          {
            term: "Confirmation",
            text: (
              <>
                Built in. The icon cross-fades to a check for 1.5s, the button&rsquo;s name turns to Copied
                &hellip;, and a status line says Copied to screen readers. Don&rsquo;t add a toast or a second
                message beside it.
              </>
            ),
          },
          {
            term: "Layout",
            text: (
              <>
                It fills its parent. In a grid or a flex row, give that parent <C>min-w-0</C>, as /docs/mcp
                and the install card do: otherwise a grid&rsquo;s implicit column or a flex item grows to the dark
                slab&rsquo;s longest line, wider than a phone.
              </>
            ),
          },
          {
            term: "Inline code",
            text: (
              <>
                <C>font-mono text-body-sm text-primary-foreground</C> in body-sm copy: the size of the
                sentence it sits in, a step darker than the secondary text round it, and no fill or ring. A URL
                adds <C>break-all</C>, since it has no spaces to wrap at.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A CopyBlock for a word inside a sentence; a hand-built <C>&lt;pre&gt;</C> with its own copy
                button; a token, key or password in <C>code</C>; the dark slab inside a white card.
              </>
            ),
          },
          {
            term: "Older code",
            text: (
              <>
                The client cards on /docs/mcp hold the dark tone inside a white card: they were built on
                2026-10-12, a day before the light tone came with /agents. Don&rsquo;t copy them. The review
                queue&rsquo;s command (<C>ReviewQueue.tsx</C>) is <C>text-micro</C> in a{" "}
                <C>text-caption</C> line, a step smaller than its sentence. This page&rsquo;s examples (
                <C>Code</C> in <C>SheetParts.tsx</C>) and the Icons sheet&rsquo;s commands are light on
                the page, and the sheets set names in their tables with <C>Mono</C>, a step smaller:
                reference, not product.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Showing code or a value? (walk it top to bottom)
 ├── A name inside a sentence: a file, a variable,
 │   a route → inline <code>, the sentence's size
 ├── A secret shown once (a new token) → the token
 │   page's reveal, never a CopyBlock
 ├── A link to share (a board's) → a read-only
 │   field and a Copy button
 ├── Text built at the click (the post's brief)
 │   → a button whose words turn to Copied
 └── A command or a configuration to paste
     → CopyBlock
        ├── Inside a white card → tone="light"
        └── On the page → tone="dark" (the default)`}
        />
        <Flow
          tree={`Where does the token go? (walk it top to bottom)
 ├── The client signs in with OAuth (Claude,
 │   ChatGPT, as /agents sets them up; /docs/mcp
 │   still lists them as Coming) → nowhere: the
 │   snippet is the link
 ├── It reads your shell (Claude Code, curl)
 │   → $CURATIT_ACCESS_TOKEN
 ├── It reads the environment from its file
 │   (Cursor) → \${env:CURATIT_ACCESS_TOKEN}
 ├── It asks once and keeps it (VS Code)
 │   → \${input:curatit-token}, password: true
 └── It reads only its own file (Claude Desktop)
     → its env block, with paste-your-token-here`}
        />
      </div>

      <SheetSection
        id="tones"
        title="Tones"
        description="The same command in both. On the page the dark slab keeps the line whole and scrolls; in a white card the light field wraps it. Below them, each tone's recipe from CopyBlock.tsx."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-10">
              <div className="grid gap-8 lg:grid-cols-2">
                <figure className="min-w-0">
                  {/* The card's padding, so the two steps line up side by side */}
                  <div className="lg:py-6">
                    <Step />
                    <div className="mt-3">
                      <CopyBlock code={COMMAND} label="the Claude Code command in the dark tone" />
                    </div>
                  </div>
                  <figcaption className="mt-3 text-body-sm text-secondary-foreground">
                    <C>tone=&quot;dark&quot;</C>, the default, on the page: this panel stands for the
                    page, with no card inside it. Scroll it sideways.
                  </figcaption>
                </figure>
                <figure className="min-w-0">
                  <div className="rounded-2xl bg-container p-6 shadow-xs">
                    <Step />
                    <div className="mt-3">
                      <CopyBlock tone="light" code={COMMAND} label="the Claude Code command in the light tone" />
                    </div>
                  </div>
                  <figcaption className="mt-3 text-body-sm text-secondary-foreground">
                    <C>tone=&quot;light&quot;</C> inside a white card (<C>bg-container</C>), the framed box
                    within the panel. It wraps.
                  </figcaption>
                </figure>
              </div>
              <Matrix
                first="minmax(7rem,max-content)"
                template="minmax(16rem,1fr) minmax(16rem,1fr)"
                align="start"
                columns={['tone="dark"', 'tone="light"']}
                rows={RECIPE.map((row) => ({ label: row.label, cells: [row.dark, row.light] }))}
              />
              <Matrix
                first="minmax(7rem,max-content)"
                template="minmax(18rem,1fr)"
                align="start"
                columns={["both tones"]}
                rows={SHARED.map((row) => ({ label: row.label, cells: [row.value] }))}
              />
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`import CopyBlock from "@/components/mcp/CopyBlock";

// On the page: the dark default
<CopyBlock code={command} label="the Claude Code command" />

// Inside a white card: the light tone, which wraps
<div className="rounded-2xl bg-container p-6 shadow-xs">
  <CopyBlock tone="light" code={config} label="the Cursor configuration" />
</div>

// In a grid or a flex row: a min-w-0 parent, so a long line can't widen the row
<div className="grid gap-5 lg:grid-cols-12">
  <div className="min-w-0 lg:col-span-8">
    <CopyBlock code={command} label="the Claude Code command" />
  </div>
</div>`}
            incorrect={{
              why: "the dark slab inside a white card (the client cards on /docs/mcp today)",
              code: `<li className="grid gap-5 rounded-2xl bg-container p-5 shadow-xs lg:grid-cols-12">
  <div className="min-w-0 lg:col-span-8">
    <CopyBlock code={client.code} label={\`the \${client.name} configuration\`} />
  </div>
</li>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="confirmation"
        title="Copy confirmation"
        description="CopyBlock's own, so every block on the site answers the same way. Copy this one, or either block above: the icon turns to a check for 1.5s, and a screen reader hears Copied."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-8">
              <div className="max-w-xl">
                <CopyBlock code={MCP_URL} label="Curatit's link" />
              </div>
              <Matrix
                first="minmax(8rem,max-content)"
                template="minmax(18rem,1.6fr) minmax(12rem,1fr) minmax(7rem,max-content)"
                align="start"
                columns={["icon", "button's name", "status line"]}
                rows={[
                  {
                    label: "at rest",
                    cells: [
                      <Glyph key="i" icon="copy">
                        Copy
                      </Glyph>,
                      <Mono key="n">Copy Curatit&rsquo;s link</Mono>,
                      <Use key="s">Empty</Use>,
                    ],
                  },
                  {
                    label: "on a click",
                    sub: "200ms",
                    cells: [
                      <Glyph key="i" icon="check">
                        Check fades in from 60% scale and a 2px blur, on ease-out-quint. Copy only fades,
                        then shrinks back once it&rsquo;s out of sight
                      </Glyph>,
                      <Mono key="n">Copied Curatit&rsquo;s link</Mono>,
                      <Mono key="s">Copied</Mono>,
                    ],
                  },
                  {
                    label: "for 1.5s",
                    cells: [
                      <Glyph key="i" icon="check">
                        Check stays. Another click starts the 1.5s over rather than ending it early
                      </Glyph>,
                      <Mono key="n">Copied Curatit&rsquo;s link</Mono>,
                      <Mono key="s">Copied</Mono>,
                    ],
                  },
                  {
                    label: "after 1.5s",
                    cells: [
                      <Glyph key="i" icon="copy">
                        Copy comes back the same way
                      </Glyph>,
                      <Mono key="n">Copy Curatit&rsquo;s link</Mono>,
                      <Use key="s">Empty</Use>,
                    ],
                  },
                  {
                    label: "blocked",
                    sub: "clipboard refused",
                    cells: [
                      <Glyph key="i" icon="copy">
                        Nothing changes. The text is selectable, so it can be copied by hand
                      </Glyph>,
                      <Mono key="n">Copy Curatit&rsquo;s link</Mono>,
                      <Use key="s">Empty</Use>,
                    ],
                  },
                  {
                    label: "reduced motion",
                    cells: [
                      <Use key="i">The same cross-fade in opacity alone: no scale, no blur</Use>,
                      <Use key="n">As above</Use>,
                      <Use key="s">As above</Use>,
                    ],
                  },
                ]}
              />
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="inline"
        title="Inline code"
        description="A name inside a sentence, set in the sentence's own size and one step darker than the copy round it. Both lines are from the connect page and the install card."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-8">
              <figure>
                <p className="max-w-[65ch] text-body-sm text-pretty text-secondary-foreground">
                  No MCP in your tool? The same six operations are available over plain HTTP at{" "}
                  <code className={INLINE}>/api/v1</code>, described by{" "}
                  <a href="/api/v1/openapi.json" className={LINK}>
                    openapi.json
                  </a>
                  . Guides for each client are in the repository under{" "}
                  <code className={INLINE}>docs/mcp/installation</code>.
                </p>
                <figcaption className="mt-3 text-body-sm text-secondary-foreground">
                  In body-sm copy: <C>font-mono text-body-sm text-primary-foreground</C>
                </figcaption>
              </figure>
              <figure className="max-w-xs">
                <p className="text-body-sm text-pretty text-secondary-foreground">
                  Another AI tool? Give it the same link,{" "}
                  <code className="font-mono text-body-sm break-all text-primary-foreground">{MCP_URL}</code>: it
                  signs in with your Curatit account.
                </p>
                <figcaption className="mt-3 text-body-sm text-secondary-foreground">
                  A URL adds <C>break-all</C>; this column is 20rem wide
                </figcaption>
              </figure>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<p className="text-body-sm text-secondary-foreground">
  The same six tools answer as a REST API under{" "}
  <code className="font-mono text-body-sm text-primary-foreground">/api/v1</code>, with the same token.
</p>

{/* A URL has no spaces to wrap at */}
<code className="font-mono text-body-sm break-all text-primary-foreground">{MCP_URL}</code>`}
            incorrect={{
              why: "a size in brackets and the older grey (the connect page before 2026-10-18)",
              code: `<code className="font-mono text-[13px] text-base-900">/api/v1</code>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="secrets"
        title="Secrets"
        description="A snippet names where the client finds the token; the token itself never appears in one. A new token is shown once, on the token page, in its own field with its own copy button."
      >
        <Code
          correct={CURSOR}
          incorrect={{
            why: "a token in the snippet, shipped in the HTML and then committed",
            code: `{
  "mcpServers": {
    "curatit": {
      "url": "${MCP_URL}",
      "headers": { "Authorization": "Bearer curatit_pat_XXXXXXXXXXXX" }
    }
  }
}`,
          }}
        />
      </SheetSection>
    </div>
  );
}
