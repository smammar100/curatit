import type { Metadata } from "next";
// Fundation
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import TextLink from "@/components/fundations/elements/TextLink";
import Card from "@/components/fundations/molecules/Card";
// Icons
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import Check from "@/components/fundations/icons/Check";
import Close from "@/components/fundations/icons/Close";
import Picture from "@/components/fundations/icons/Picture";
import Plugs from "@/components/fundations/icons/Plugs";
// Components
import SearchReel from "@/components/mcp/SearchReel";
import { runExampleSearches } from "@/components/mcp/searchExamples";
import Badge from "@/components/fundations/elements/Badge";
import ClientInstall from "@/components/mcp/ClientInstall";
import { TOOLS } from "@/components/mcp/tools";
import { fontWeights } from "@/lib/font-weight";
import { getPublishedPosts } from "@/lib/posts";
import { SUPPORT_MAILTO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Curatit MCP (beta)",
  description:
    "Use Curatit's library of real brand posts from Claude, Cursor, VS Code and ChatGPT: search it, read a post slide by slide and draft a brief, with every answer linked to its source.",
};

export const revalidate = 3600;

// The MCP landing page (2026-10-13), at /agents because /mcp is the server itself (a browser that
// opens /mcp is sent here). Laid out after ElevenLabs' MCP page, at the person's request: the title
// on the left and what it does on the right, then a tab per client over one gradient panel whose
// white card holds that client's steps (ClientInstall, the page's only script), then why it helps,
// shown as example searches typed out over rows of their real results (SearchReel, after Mobbin's "one search" section), the six
// tools as a quiet grid under a left label, what a token can and can't do, the Beta note and a
// closing call. Earlier Mobbin references (Higgsfield, Neon, Midday, Bloom) shaped the tabs and the
// before/after. Since 2026-10-23 the page is set on the system: the two "can and can't" panels
// are raised Cards and the Beta note a grey one, the benefit icons sit on muted plates, every
// link in running text is a TextLink, and the small headings take the library's semibold.

const TOKEN_HREF = "/dashboard/settings/tokens";

const semibold = { fontVariationSettings: fontWeights.semibold };

export default async function AgentsPage() {
  // If the library can't be reached, the example searches are left out (SearchReel renders nothing without them)
  const posts = await getPublishedPosts().catch(() => []);
  const searches = posts.length
    ? await runExampleSearches(posts).catch(() => [])
    : [];
  const count = posts.length ? `${posts.length} ` : "";

  const benefits = [
    {
      icon: <Picture className="size-5" aria-hidden="true" />,
      title: "Real references, not invented ones",
      body: `Your assistant searches ${count}real brand posts and their editor-approved breakdowns, and says why each one matched.`,
    },
    {
      icon: <ArrowUpRight className="size-5" aria-hidden="true" />,
      title: "A source for every claim",
      body: "Every answer links to the post on Instagram, so you can open it and check before it goes into a deck.",
    },
    {
      icon: <Plugs className="size-5" aria-hidden="true" />,
      title: "In the tool you already use",
      body: "Ask in Claude, Cursor or VS Code, mid-task, and turn what comes back into a brief without switching tabs.",
    },
  ];

  return (
    <>
      {/* Header: the title on the left, what it does on the right; then the install block */}
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-8">
            <div className="lg:col-span-7">
              <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
                Curatit MCP
                <Badge>Beta</Badge>
              </p>
              <Text
                tag="h1"
                variant="h1"
                className="mt-4 text-balance text-foreground"
              >
                Bring Curatit to your AI assistant
              </Text>
            </div>
            <Text className="text-pretty text-muted-foreground lg:col-span-5 lg:pb-1">
              Search real brand posts, read their editor-approved breakdowns and
              build briefs from inside Claude, Cursor, VS Code or ChatGPT. Every
              answer comes with its source.
            </Text>
          </div>
          <div id="install" className="mt-10 scroll-mt-24 lg:mt-12">
            <ClientInstall />
          </div>
        </Wrapper>
      </section>

      {/* Why: a left-set statement, then example searches typed out over their real results, then the three benefits */}
      <section aria-labelledby="why" className="overflow-x-clip">
        <Wrapper variant="standard" className="section-y">
          <div className="max-w-3xl">
            <Text
              tag="h2"
              id="why"
              variant="h1"
              className="text-balance text-foreground"
            >
              <span className="block">Finding references took hours.</span>
              <span className="block">Now it&apos;s one question.</span>
            </Text>
            <Text
              tag="p"
              variant="body"
              className="mt-4 max-w-xl text-pretty text-muted-foreground"
            >
              Ask in plain words and get real brand posts back, not descriptions
              of ones that don&apos;t exist.
            </Text>
          </div>
          {searches.length > 0 && (
            <div className="mt-14">
              <SearchReel searches={searches} />
            </div>
          )}
          <ul className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {benefits.map((benefit) => (
              <li key={benefit.title}>
                <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
                  {benefit.icon}
                </span>
                <h3 className="mt-4 text-body-base text-foreground" style={semibold}>
                  {benefit.title}
                </h3>
                <p className="mt-1 text-body-sm text-pretty text-muted-foreground">
                  {benefit.body}
                </p>
              </li>
            ))}
          </ul>
        </Wrapper>
      </section>

      {/* The six tools: a label on the left, a quiet grid on the right */}
      <section aria-labelledby="tools">
        <Wrapper variant="standard" className="section-y">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Text
                tag="h2"
                id="tools"
                variant="h3"
                className="text-balance text-foreground"
              >
                Six read-only tools
              </Text>
              <Text
                variant="bodySM"
                className="mt-3 max-w-xs text-pretty text-muted-foreground"
              >
                Your assistant picks the one it needs. None of them can change
                anything.
              </Text>
            </div>
            <ul className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              {TOOLS.map((tool) => (
                <li key={tool.name}>
                  <h3 className="text-body-sm text-foreground" style={semibold}>
                    {tool.title}
                  </h3>
                  <p className="mt-1 text-body-sm text-pretty text-muted-foreground">
                    {tool.does}
                  </p>
                  <p className="mt-2 font-mono text-caption-lg break-all text-muted-foreground">
                    {tool.name}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Wrapper>
      </section>

      {/* What a token can and can't do, then the Beta note */}
      <section aria-label="What your tool can and can't do">
        <Wrapper variant="standard" className="section-y">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card variant="raised" padding="lg">
              <h3 className="text-body-base text-foreground" style={semibold}>
                What your tool can do
              </h3>
              <ul className="mt-4 space-y-3 text-body-sm text-pretty text-muted-foreground">
                {[
                  `Read what you can read: the library's ${count}published posts and their editor-approved analyses.`,
                  "Answer with real Instagram links, so every reference can be opened.",
                  "Draft an original brief grounded in the posts you choose (with the Briefs scope), keeping what was observed apart from what's recommended.",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-foreground"
                      aria-hidden="true"
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </Card>
            <Card variant="raised" padding="lg">
              <h3 className="text-body-base text-foreground" style={semibold}>
                What it can&apos;t do
              </h3>
              <ul className="mt-4 space-y-3 text-body-sm text-pretty text-muted-foreground">
                {[
                  "Post anything, or change your account.",
                  "See your boards.",
                  "Keep working once you disconnect it or revoke its token. Tokens last 30 to 365 days.",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <Close
                      className="mt-0.5 size-4 shrink-0 text-tertiary-foreground"
                      aria-hidden="true"
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-body-sm text-muted-foreground">
                Make and revoke tokens in <TextLink href={TOKEN_HREF}>API tokens</TextLink>.
              </p>
            </Card>
          </div>

          <Card variant="mat" padding="lg" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Badge className="w-fit">Beta</Badge>
            <p className="text-body-sm text-pretty text-muted-foreground">
              Things may change while we test it. <TextLink href={SUPPORT_MAILTO}>Tell us what breaks</TextLink>.
            </p>
          </Card>
        </Wrapper>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="start">
        <Wrapper variant="standard" className="section-y">
          <div className="mx-auto max-w-2xl text-center text-balance">
            <Text tag="h2" id="start" variant="h2">
              <span className="block text-muted-foreground">
                Your next brief starts in a chat.
              </span>
              <span className="block text-foreground">
                Bring the library with you.
              </span>
            </Text>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button isLink size="base" variant="default" href="#install">
                Connect your assistant
              </Button>
              <Button isLink size="base" variant="muted" href={TOKEN_HREF}>
                Get a token
              </Button>
            </div>
          </div>
        </Wrapper>
      </section>
    </>
  );
}
