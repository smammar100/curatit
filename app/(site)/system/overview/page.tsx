import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "Overview",
  description: "Every page in Curatit, in one index.",
};

const pages = [
  {
    title: "Product",
    categories: [
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
    ],
  },
  {
    title: "Marketing",
    categories: [
      {
        title: "Pages",
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
      {
        title: "Design system",
        links: [
          { href: "/system/links", text: "Links" },
          { href: "/system/buttons", text: "Buttons" },
          { href: "/system/colors", text: "Colors" },
          { href: "/system/typography", text: "Typography" },
        ],
      },
    ],
  },
];

export default function SystemOverviewPage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
          Overview
        </Text>
        <div className="space-y-12 mt-12">
          {pages.map((section) => (
            <div key={section.title}>
              <Text
                tag="p"
                variant="displayMD"
                className="text-base-900 text-balance font-display font-thin"
              >
                {section.title}
              </Text>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 gap-y-4">
                {section.categories.map((category) => (
                  <div key={category.title} className="flex flex-col gap-2">
                    <Text tag="p" variant="textBase" className="text-base-900 font-medium">
                      {category.title}
                    </Text>
                    <ul>
                      {category.links.map((link) => (
                        <li key={link.href}>
                          <Text
                            tag="a"
                            variant="textSM"
                            href={link.href}
                            className="text-base-600 hover:text-accent-500"
                          >
                            {link.text}
                          </Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Wrapper>
    </section>
  );
}
