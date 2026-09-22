import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { getCollection, uniqueTags } from "@/lib/content";

export const metadata: Metadata = {
  title: "Explore all tags",
  description: "Every tag used across the Curatit magazine.",
};

export default async function BlogTagsPage() {
  const posts = await getCollection("posts");
  const tags = uniqueTags(posts);

  return (
    <section>
      <Wrapper variant="narrow" className="py-24 lg:pt-48">
        <Text
          tag="h1"
          variant="displayLG"
          className="text-base-900 font-display font-thin text-center"
        >
          Explore all tags
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
                href={`/blog/tags/${tag}`}
                className="capitalize"
              >
                {tag}
              </Button>
            </li>
          ))}
        </ul>
      </Wrapper>
    </section>
  );
}
