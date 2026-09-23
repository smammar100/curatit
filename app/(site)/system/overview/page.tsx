import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/fundations/containers/PageHeader";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Card, CardDescription, CardGroup, CardHeader, CardTitle } from "@/components/ui/card";
import { fontWeights } from "@/lib/font-weight";

export const metadata: Metadata = {
  title: "Overview",
  description: "Every page in Curatit, in one index.",
};

const principles = [
  {
    title: "Every transition explains a change",
    body: "Motion shows what moved and why. Springs replace durations, and nothing plays on its own.",
  },
  {
    title: "One highlight per list",
    body: "A single hover highlight glides to the row nearest your cursor, so you see where a click lands.",
  },
  {
    title: "Weight without reflow",
    body: "Selected labels get heavier through Inter's variable axes while their width holds still.",
  },
  {
    title: "Borderless by default",
    body: "Groups split with hairlines and spacing. Only floating things rise, and they rise with Elevated.",
  },
  {
    title: "Serif for headings only",
    body: "Hedvig Letters Serif sets page titles and section headings. Inter sets everything you read or press.",
  },
  {
    title: "One brand hue, one job",
    body: "Terracotta marks the saved state and text selection. Buttons, headings and links stay neutral.",
  },
];

const systemPages = [
  { href: "/system/colors", title: "Colors", description: "8 surfaces, their shadows, and every semantic token." },
  { href: "/system/typography", title: "Typography", description: "3 serif heading roles and 4 Inter sizes at 4 weights." },
  { href: "/system/buttons", title: "Buttons", description: "4 variants at 2 sizes, icons, loading and disabled." },
  { href: "/system/links", title: "Links", description: "Prose, quiet and external links." },
];

const index = [
  {
    title: "Research",
    links: [
      { href: "/library", text: "Library" },
      { href: "/library?q=bold+typography+carousels", text: "Search results" },
      { href: "/boards", text: "Boards" },
    ],
  },
  {
    title: "Operations",
    links: [{ href: "/admin", text: "Curation (admin)" }],
  },
  {
    title: "Account",
    links: [
      { href: "/signin", text: "Sign in" },
      { href: "/signup", text: "Sign up" },
    ],
  },
  {
    title: "Marketing",
    links: [
      { href: "/", text: "Home" },
      { href: "/pricing", text: "Pricing" },
      { href: "/about", text: "About" },
      { href: "/404", text: "404" },
    ],
  },
  {
    title: "Journal",
    links: [
      { href: "/blog", text: "Home" },
      { href: "/blog/tags", text: "Tag index" },
      { href: "/rss.xml", text: "RSS" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", text: "Terms" },
      { href: "/legal/privacy", text: "Privacy" },
      { href: "/legal/removal", text: "Content removal" },
    ],
  },
];

export default function SystemOverviewPage() {
  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader
        title="Overview"
        description="Curatit runs on Fluid Functionalism, with its own serif headings and one terracotta hue."
      />

      <section aria-labelledby="principles-heading">
        <h2 id="principles-heading" className="heading-section text-foreground">
          Principles
        </h2>
        <ol className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((principle, i) => (
            <li key={principle.title} className="border-t border-border pt-4">
              <p className="text-[12px] text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</p>
              <p
                className="mt-2 text-[16px] leading-6 text-foreground"
                style={{ fontVariationSettings: fontWeights.semibold }}
              >
                {principle.title}
              </p>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{principle.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="pages-heading" className="mt-12">
        <h2 id="pages-heading" className="heading-section text-foreground">
          The system
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">4 reference pages, each showing live components.</p>
        <CardGroup columns={4} className="mt-6">
          {systemPages.map((page) => (
            <Card key={page.href} href={page.href} label={page.title}>
              <CardHeader>
                <CardTitle>{page.title}</CardTitle>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </CardGroup>
      </section>

      <section aria-labelledby="index-heading" className="mt-12">
        <h2 id="index-heading" className="heading-section text-foreground">
          Every page
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {index.map((group) => (
            <div key={group.title}>
              <p className="text-[13px] text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                {group.title}
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-muted-foreground transition-colors duration-80 hover:text-foreground"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </Wrapper>
  );
}
