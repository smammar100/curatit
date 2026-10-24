import type { Metadata } from "next";
import Link from "next/link";
// Fundation
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import TextLink from "@/components/fundations/elements/TextLink";
// Glaze
import { ArrowUpRight, Check, Close, Icon, Picture, Plugs } from "@/components/glaze/icon";
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
// Components
import SearchReel from "@/components/mcp/SearchReel";
import { runExampleSearches } from "@/components/mcp/searchExamples";
import ClientInstall from "@/components/mcp/ClientInstall";
import { TOOLS } from "@/components/mcp/tools";
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
// on the left and what it does on the right, then a tab per client over one card whose panel holds
// that client's steps (ClientInstall, the page's only script), then why it helps, shown as example
// searches typed out over rows of their real results (SearchReel, after Mobbin's "one search"
// section), the six tools as a quiet grid under a left label, what a token can and can't do, the
// Beta note and a closing call. Earlier Mobbin references (Higgsfield, Neon, Midday, Bloom) shaped
// the tabs and the before/after. Since 2026-10-24 the page is on Glaze: "Curatit MCP" and its Beta
// badge moved from above the title to under it (Glaze puts no label above a title), the benefit
// icons stand bare (no tinted plates), the "can and can't" lists and the Beta note are grouped by
// space and a hairline rather than cards (nobody acts on them), the tool ids are mono at 0.8 of
// their line, and the closing call is one primary and one secondary Button.

const TOKEN_HREF = "/dashboard/settings/tokens";

export default async function AgentsPage() {
  // If the library can't be reached, the example searches are left out (SearchReel renders nothing without them)
  const posts = await getPublishedPosts().catch(() => []);
  const searches = posts.length ? await runExampleSearches(posts).catch(() => []) : [];
  const count = posts.length ? `${posts.length} ` : "";

  const benefits = [
    {
      icon: Picture,
      title: "Real references, not invented ones",
      body: `Your assistant searches ${count}real brand posts and their editor-approved breakdowns, and says why each one matched.`,
    },
    {
      icon: ArrowUpRight,
      title: "A source for every claim",
      body: "Every answer links to the post on Instagram, so you can open it and check before it goes into a deck.",
    },
    {
      icon: Plugs,
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
              <Text tag="h1" variant="h1" className="text-balance text-text-1">
                Bring Curatit to your AI assistant
              </Text>
              <p className="mt-4 flex items-center gap-2 type-body-sm text-text-2">
                Curatit MCP
                <Badge>Beta</Badge>
              </p>
            </div>
            <Text className="text-pretty text-text-2 lg:col-span-5 lg:pb-1">
              Search real brand posts, read their editor-approved breakdowns and build briefs from inside Claude, Cursor, VS Code or ChatGPT. Every answer comes
              with its source.
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
            <Text tag="h2" id="why" variant="h1" className="text-balance text-text-1">
              <span className="block">Finding references took hours.</span>
              <span className="block">Now it&apos;s one question.</span>
            </Text>
            <Text tag="p" variant="body" className="mt-4 max-w-xl text-pretty text-text-2">
              Ask in plain words and get real brand posts back, not descriptions of ones that don&apos;t exist.
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
                <Icon icon={benefit.icon} size={20} className="text-text-1" />
                <h3 className="mt-3 type-heading text-text-1">{benefit.title}</h3>
                <p className="mt-1 type-body-sm text-pretty text-text-2">{benefit.body}</p>
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
              <Text tag="h2" id="tools" variant="h3" className="text-balance text-text-1">
                Six read-only tools
              </Text>
              <Text variant="bodySM" className="mt-3 max-w-xs text-pretty text-text-2">
                Your assistant picks the one it needs. None of them can change anything.
              </Text>
            </div>
            <ul className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              {TOOLS.map((tool) => (
                <li key={tool.name}>
                  <h3 className="type-label text-text-1">{tool.title}</h3>
                  <p className="mt-1 type-body-sm text-pretty text-text-2">{tool.does}</p>
                  <p className="mt-2 type-body-sm break-all text-text-2">
                    <code className="mono">{tool.name}</code>
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
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8">
            <div className="border-t border-line-faint pt-6">
              <h3 className="type-heading text-text-1">What your tool can do</h3>
              <ul className="mt-4 space-y-3 type-body-sm text-pretty text-text-2">
                {[
                  `Read what you can read: the library's ${count}published posts and their editor-approved analyses.`,
                  "Answer with real Instagram links, so every reference can be opened.",
                  "Draft an original brief grounded in the posts you choose (with the Briefs scope), keeping what was observed apart from what's recommended.",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <Icon icon={Check} size={16} className="mt-0.5 shrink-0 text-text-1" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-line-faint pt-6">
              <h3 className="type-heading text-text-1">What it can&apos;t do</h3>
              <ul className="mt-4 space-y-3 type-body-sm text-pretty text-text-2">
                {[
                  "Post anything, or change your account.",
                  "See your boards.",
                  "Keep working once you disconnect it or revoke its token. Tokens last 30 to 365 days.",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <Icon icon={Close} size={16} className="mt-0.5 shrink-0 text-text-3" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-4 type-body-sm text-text-2">
                Make and revoke tokens in <TextLink href={TOKEN_HREF}>API tokens</TextLink>.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-line-faint pt-6 sm:flex-row sm:items-center">
            <Badge className="w-fit">Beta</Badge>
            <p className="type-body-sm text-pretty text-text-2">
              Things may change while we test it. <TextLink href={SUPPORT_MAILTO}>Tell us what breaks</TextLink>.
            </p>
          </div>
        </Wrapper>
      </section>

      {/* Closing call to action */}
      <section aria-labelledby="start">
        <Wrapper variant="standard" className="section-y">
          <div className="mx-auto max-w-2xl text-center text-balance">
            <Text tag="h2" id="start" variant="h2">
              <span className="block text-text-2">Your next brief starts in a chat.</span>
              <span className="block text-text-1">Bring the library with you.</span>
            </Text>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button size="lg" render={<a href="#install" />} nativeButton={false}>
                Connect your assistant
              </Button>
              <Button size="lg" variant="secondary" render={<Link href={TOKEN_HREF} />} nativeButton={false}>
                Get a token
              </Button>
            </div>
          </div>
        </Wrapper>
      </section>
    </>
  );
}
