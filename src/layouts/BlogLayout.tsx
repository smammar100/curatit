// Assets
import Image from "next/image";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
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
              <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900">
                {frontmatter.title}
              </Text>
              <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                {frontmatter.description}
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-1 mt-8 justify-center">
              {frontmatter.tags.map((tag) => (
                <Button
                  key={tag}
                  isLink
                  title={tag}
                  size="sm"
                  variant="muted"
                  aria-label={tag}
                  href={`/blog/tags/${tag}`}
                  className="text-accent-500  font-medium text-xs hover:text-base-900   capitalize  "
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
          <div className="p-8 bg-base-50 rounded-lg mt-12">
            <Image
              width={1400}
              height={1400}
              loading="eager"
              src={frontmatter.image.url}
              alt={frontmatter.image.alt}
              sizes="100vw"
              className="size-full aspect-8/5 object-top rounded shadow object-cover"
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
            <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
              Latest posts
            </Text>
            <Button isLink size="sm" variant="muted" href="/blog">
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
