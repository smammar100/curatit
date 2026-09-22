import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "Overview",
  description: "Every page in the Curatit theme, in one index.",
};

const pages = [
  {
    title: "Static pages",
    categories: [
      {
        title: "Pages",
        links: [
          { href: "/", text: "Home" },
          { href: "/about", text: "About" },
          { href: "/404", text: "404" },
        ],
      },
      {
        title: "Advertise",
        links: [
          { href: "/pricing", text: "Membership" },
          { href: "/advertise", text: "Advertise" },
        ],
      },
      {
        title: "Forms",
        links: [
          { href: "/signin", text: "Sign in" },
          { href: "/signup", text: "Sign up" },
          { href: "/submit", text: "Submit" },
        ],
      },
      {
        title: "System",
        links: [
          { href: "/system/links", text: "Links" },
          { href: "/system/buttons", text: "Buttons" },
          { href: "/system/colors", text: "Colors" },
          { href: "/system/typography", text: "Typography" },
          { href: "https://lexingtonthemes.com/legal/license", text: "License" },
          { href: "https://lexingtonthemes.com/legal/support", text: "Support" },
          { href: "https://lexingtonthemes.com/documentation/", text: "Documentation" },
        ],
      },
    ],
  },
  {
    title: "Content collections",
    categories: [
      {
        title: "Directory",
        links: [
          { href: "/sites", text: "Home" },
          { href: "/sites/site/1", text: "Details" },
          { href: "/sites/tags", text: "Tag index" },
          { href: "/sites/tags/design", text: "Tag category" },
        ],
      },
      {
        title: "Blog",
        links: [
          { href: "/blog", text: "Home" },
          { href: "/blog/posts/1", text: "Details" },
          { href: "/blog/tags", text: "Tag index" },
          { href: "/blog/tags/3d", text: "Tag category" },
          { href: "/rss.xml", text: "RSS" },
        ],
      },
      {
        title: "Store",
        links: [
          { href: "/store", text: "Home" },
          { href: "/store/1", text: "Details" },
        ],
      },
      {
        title: "Legal",
        links: [
          { href: "/legal/terms", text: "Terms" },
          { href: "/legal/privacy", text: "Privacy" },
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
