import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Search from "@/components/sites/Search";
import { getCollection, uniqueTags } from "@/lib/content";

export const metadata: Metadata = {
  title: "We got tags!",
  description: "Browse the directory by tag.",
};

export default async function SitesTagsPage() {
  const sites = await getCollection("sites");
  const tags = uniqueTags(sites);

  return (
    <>
      <Search />
      <section>
        <Wrapper variant="narrow" className="py-24 lg:pt-48">
          <Text
            tag="h1"
            variant="displayLG"
            className="text-base-900 font-display font-thin text-center"
          >
            We got tags!
          </Text>
          <ul className="flex flex-col gap-1 mt-12">
            {tags.map((tag) => (
              <li key={tag}>
                <Button
                  isLink
                  size="sm"
                  variant="muted"
                  title={tag}
                  aria-label={tag}
                  href={`/sites/tags/${tag}`}
                  className="capitalize"
                >
                  {tag}
                </Button>
              </li>
            ))}
          </ul>
        </Wrapper>
      </section>
    </>
  );
}
