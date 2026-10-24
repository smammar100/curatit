import Link from "next/link";
// Assets
import Image from "next/image";
// Fundation
import Text from "@/components/fundations/elements/Text";
// Glaze
import { Button } from "@/components/glaze/ui/button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import BlogCard from "@/components/blog/BlogCard";
// Content
import { getCollection, sortByPubDate, type CollectionEntry } from "@/lib/content";

export default function BlogLayout({
  frontmatter,
  html,
}: {
  frontmatter: CollectionEntry<"posts">["data"];
  html: string;
}) {
  // Newest to oldest
  const allPosts = sortByPubDate(getCollection("posts"));
  return (
    <>
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="text-balance">
            <div className="text-center max-w-3xl mx-auto text-balance">
              <Text tag="h1" variant="h1" className="text-text-1">
                {frontmatter.title}
              </Text>
              <Text tag="p" variant="body" className="mt-4 text-text-2">
                {frontmatter.description}
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-1 mt-8 justify-center">
              {frontmatter.tags.map((tag) => (
                <Button key={tag} title={tag} size="sm" variant="secondary" aria-label={tag} render={<Link href={`/blog/tags/${tag}`} />} nativeButton={false}>
                  {tag}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-12 rounded-shell bg-shell p-8">
            <Image
              width={1400}
              height={1400}
              loading="eager"
              src={frontmatter.image.url}
              alt={frontmatter.image.alt}
              sizes="100vw"
              className="aspect-8/5 size-full rounded-panel object-cover object-top outline-1 -outline-offset-1 outline-line-faint"
            />
          </div>
          <div className="mx-auto mt-12 max-w-xl sm:px-8">
            <Wrapper variant="prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="section-y">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text tag="h2" variant="h3" className="text-text-1">
              Latest posts
            </Text>
            <Button size="sm" variant="secondary" render={<Link href="/blog" />} nativeButton={false}>
              See all posts
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {allPosts.slice(0, 3).map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
