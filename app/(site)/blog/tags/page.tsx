import type { Metadata } from "next";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
import { Card, CardGroup, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getCollection, uniqueTags } from "@/lib/content";

export const metadata: Metadata = {
  title: "Explore all tags",
  description: "Every tag used across the Curatit journal.",
};

export default async function BlogTagsPage() {
  const posts = await getCollection("posts");
  const tags = uniqueTags(posts).map((tag) => ({
    tag,
    count: posts.filter((post) => post.data.tags.includes(tag)).length,
  }));

  return (
    <Wrapper variant="standard" className="pb-24">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Explore all tags" description={`${tags.length} tags across the journal.`} />
        <CardGroup orientation="inline" border="outlined">
          {tags.map(({ tag, count }) => (
            <Card key={tag} href={`/blog/tags/${tag}`} label={tag} title={tag}>
              <CardHeader>
                {/* Inline titles trim to cap height and clip overflow, which cuts descenders; let them show. */}
                <CardTitle className="capitalize [&>span]:overflow-visible">{tag}</CardTitle>
              </CardHeader>
              <CardFooter>
                <span className="text-[12px] tabular-nums text-muted-foreground">
                  {count} {count === 1 ? "post" : "posts"}
                </span>
              </CardFooter>
            </Card>
          ))}
        </CardGroup>
      </div>
    </Wrapper>
  );
}
