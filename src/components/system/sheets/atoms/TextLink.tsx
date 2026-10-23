// /system/text-link: TextLink (src/components/fundations/elements/TextLink.tsx), its two variants
// inside real sentences and on their own, external links, and when a link should be a button.
// Since 2026-10-23 its colours, stroke and focus ring are Fluid Functionalism's tokens: the
// underline in --border (the one stroke colour), the quiet ink --muted-foreground, 80ms colour
// changes and the 1px --focus-ring outline. Every class is written out in full, so Tailwind sees it
import TextLink from "@/components/fundations/elements/TextLink";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

// What TextLink.tsx sets: the base every link carries, then each variant
const PARTS: { part: string; classes: string[]; note: string }[] = [
  {
    part: "base",
    classes: [
      "relative rounded-[4px]",
      "transition-[color,text-decoration-color] duration-80",
      "focus-visible:outline-1 focus-visible:outline-offset-2",
      "focus-visible:outline-[color:var(--focus-ring)]",
    ],
    note: "Every link: a 4px corner for the ring to follow, the colour and the underline's colour fading over 80ms (the library's duration), and the 1px terracotta outline 2px out on keyboard focus.",
  },
  {
    part: "inline",
    classes: [
      "underline decoration-border decoration-1 underline-offset-2",
      "hover:text-brand-foreground hover:decoration-brand-foreground",
    ],
    note: "The sentence's own colour with a 1px underline in --border, the one stroke colour, 2px under the text. On hover the words and the line turn terracotta together.",
  },
  {
    part: "quiet",
    classes: [
      "text-muted-foreground no-underline",
      "hover:text-foreground",
      "pointer-coarse:after:absolute pointer-coarse:after:-inset-x-1 pointer-coarse:after:-inset-y-3",
    ],
    note: "The muted ink, no underline, the ink on hover. On touch screens an invisible ::after reaches 12px above and below (44px tall on a 20px line) and 4px either side.",
  },
  {
    part: "external",
    classes: ['target="_blank" rel="noreferrer"', "ml-0.5 inline size-[0.75em] align-baseline", "sr-only: (opens in a new tab)"],
    note: "The ArrowUpRight glyph at three quarters of the type size, held to the last word by a word joiner in a nowrap span, and the note for screen readers. Your own rel is kept beside noreferrer.",
  },
];

export default function TextLinkSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Text link">
        A link that is words. <Mono>inline</Mono> sits inside a sentence with a hairline underline in the one stroke
        colour that turns terracotta on hover; <Mono>quiet</Mono> stands on its own in the muted ink and brightens to
        the ink. <Mono>external</Mono> opens a new tab and says so. Built on next/link, so internal links navigate in
        place and are prefetched; its tokens are Fluid Functionalism&rsquo;s since 2026-10-23.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                Somewhere to go, named in words: a link inside a sentence (&ldquo;Read the setup guide&rdquo;), a link on
                its own beside a form (&ldquo;Forgot password?&rdquo;), a way back (&ldquo;Back to Saved&rdquo;).
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A page&rsquo;s next step drawn as a button (Create account) is <Mono>{"<Button isLink>"}</Mono>. An action
                (Save, Copy, Sign out) is a <Mono>Button</Mono>, even when it looks quiet:{" "}
                <Mono>{'variant="transparent"'}</Mono>. A whole card that opens is <Mono>CardTitle</Mono>&rsquo;s{" "}
                <Mono>href</Mono>. Markdown bodies keep the prose links (<Mono>{'<Wrapper variant="prose">'}</Mono>). The
                navigation bars have their own links.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{'<TextLink href="/docs/mcp">'}</Mono>: <Mono>inline</Mono>, same tab.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                Variants <Mono>inline</Mono> and <Mono>quiet</Mono>, and <Mono>external</Mono>. Nothing else: no brand
                link at rest, no bold link, no button-looking link. An unlisted variant is a bug.
              </>
            ),
          },
          {
            term: "Inline",
            text: (
              <>
                Takes the colour of its sentence and adds a 1px underline in <Mono>--border</Mono> (12% of the ink, the
                colour of every hairline, ring and divider), 2px below the text. On hover the words and the line turn{" "}
                <Mono>brand-foreground</Mono>, over 80ms. The underline is what tells it from the words around it, so it
                never comes off: colour alone fails anyone who can&rsquo;t tell the two inks apart (WCAG 1.4.1).
              </>
            ),
          },
          {
            term: "Quiet",
            text: (
              <>
                <Mono>text-muted-foreground</Mono>, no underline, <Mono>text-foreground</Mono> on hover: its place
                (alone, beside a form, in a list of links) says it&rsquo;s a link. Never inside a sentence, where nothing
                would mark it. On touch screens an invisible <Mono>::after</Mono> takes it to 44px tall on a 20px line,
                so a list of quiet links is spaced 44px apart (<Mono>min-h-11</Mono> rows) or the targets overlap.
              </>
            ),
          },
          {
            term: "External",
            text: (
              <>
                Another site, in a new tab: <Mono>target=&quot;_blank&quot;</Mono>, <Mono>rel=&quot;noreferrer&quot;</Mono>{" "}
                (your own <Mono>rel</Mono> is kept beside it), the ArrowUpRight glyph held to the last word with a word
                joiner so it never wraps alone, and &ldquo;(opens in a new tab)&rdquo; for screen readers. A link to
                another site that stays in the tab drops <Mono>external</Mono> and its arrow.
              </>
            ),
          },
          {
            term: "Words",
            text: (
              <>
                The link&rsquo;s words name where it goes, and make sense read alone (screen readers list links out of
                context): &ldquo;Read the setup guide&rdquo;, never &ldquo;click here&rdquo; or a bare URL.
              </>
            ),
          },
          {
            term: "Focus",
            text: (
              <>
                The site&rsquo;s 1px ring: an outline in <Mono>--focus-ring</Mono> (terracotta), 2px out, with a 4px
                corner, on keyboard focus only. Hover is a colour change over 80ms and never moves anything: no weight
                change, no underline appearing.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Margins and placement only, and a type size when the link stands alone (<Mono>text-body-sm</Mono>). Never
                a colour or a decoration: TextLink merges with <Mono>cn</Mono> (tailwind-merge), so yours would replace
                the variant&rsquo;s silently.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Which link?
 ├── An action (Save, Sign out) → Button, not a link
 ├── The page's next step (Create account) → Button isLink
 ├── A whole card opens → CardTitle href
 ├── Inside a sentence → TextLink (inline, the default)
 ├── On its own, or in a list of links → variant="quiet"
 └── Another site, in a new tab → add external`}
      />

      <SheetSection
        title="Variants"
        description="Each variant where it belongs: inline inside sentences at two sizes, quiet on its own. Point at them; tab to them for the ring."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="minmax(16rem,1fr) minmax(16rem,1fr)"
              align="start"
              columns={["same tab", "external"]}
              rows={[
                {
                  label: "inline",
                  sub: "text-body-base",
                  cells: [
                    <p key="s" className="text-body-base text-secondary-foreground">
                      Tokens stay in your environment. <TextLink href="/docs/mcp">Read the setup guide</TextLink> for
                      each client.
                    </p>,
                    <p key="e" className="text-body-base text-secondary-foreground">
                      Curatit speaks{" "}
                      <TextLink href="https://modelcontextprotocol.io" external>
                        the Model Context Protocol
                      </TextLink>
                      , so any assistant that does can search it.
                    </p>,
                  ],
                },
                {
                  label: "inline",
                  sub: "text-body-sm",
                  cells: [
                    <p key="s" className="text-body-sm text-secondary-foreground">
                      Shared links never expire. <TextLink href="/pricing">See what&rsquo;s free in beta</TextLink>.
                    </p>,
                    <p key="e" className="text-body-sm text-secondary-foreground">
                      Covers are scraped with{" "}
                      <TextLink href="https://apify.com" external>
                        Apify
                      </TextLink>{" "}
                      and stored by Curatit.
                    </p>,
                  ],
                },
                {
                  label: "quiet",
                  sub: "on its own",
                  cells: [
                    <div key="s" className="flex flex-col items-start gap-3 text-body-sm">
                      <TextLink variant="quiet" href="/forgot-password">
                        Forgot password?
                      </TextLink>
                      <TextLink variant="quiet" href="/dashboard">
                        Back to Saved
                      </TextLink>
                    </div>,
                    <div key="e" className="flex flex-col items-start gap-3 text-body-sm">
                      <TextLink variant="quiet" href="https://www.linkedin.com" external>
                        LinkedIn
                      </TextLink>
                    </div>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Parts"
        description="What TextLink.tsx sets, as it writes it: the base every link carries, then each variant and what external adds. Take it whole: never rebuild a link from these classes."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(6rem,max-content)"
              template="minmax(18rem,max-content) minmax(16rem,1fr)"
              align="start"
              columns={["classes", "notes"]}
              rows={PARTS.map((p) => ({
                label: p.part,
                cells: [
                  <span key="c" className="flex flex-col gap-0.5">
                    {p.classes.map((item) => (
                      <Mono key={item}>{item}</Mono>
                    ))}
                  </span>,
                  <span key="n" className="text-body-sm text-secondary-foreground">
                    {p.note}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Wrapping"
        description="A long external link in a narrow column: the underline follows every line, and the arrow stays with the last word instead of starting a line alone."
      >
        <Sheet split>
          {() => (
            <p className="max-w-56 text-body-base text-secondary-foreground">
              The connect guide follows{" "}
              <TextLink href="https://modelcontextprotocol.io/docs/learn/architecture" external>
                the protocol&rsquo;s architecture overview
              </TextLink>{" "}
              closely.
            </p>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<p className="text-body-sm text-secondary-foreground">
  Tokens stay in your environment.{" "}
  <TextLink href="/docs/mcp">Read the setup guide</TextLink>.
</p>

<TextLink variant="quiet" href="/forgot-password">Forgot password?</TextLink>

<TextLink href="https://modelcontextprotocol.io" external>The MCP spec</TextLink>`}
            incorrect={{
              why: "brand at rest with the underline only on hover; a new tab nobody is told about",
              code: `<Link href="/signin" className="font-medium text-brand-foreground underline-offset-2 hover:underline">
  Sign in
</Link>

<a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-foreground hover:underline">
  {match[0]}
</a>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
