import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import BlogCard from "@/components/blog/BlogCard";
import { getCollection, getEntry, getSortedPosts, renderMarkdown } from "@/lib/content";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getCollection("posts");
  return posts.map((post) => ({ slug: post.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getEntry("posts", slug);
  if (!post) return {};

  return {
    title: post.data.title,
    description: post.data.description,
    openGraph: {
      title: post.data.title,
      description: post.data.description,
      images: [post.data.image.url],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getEntry("posts", slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.body);
  const latest = (await getSortedPosts()).slice(0, 3);

  return (
    <>
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="text-balance">
            <div className="text-center max-w-3xl mx-auto text-balance">
              <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
                {post.data.title}
              </Text>
              <Text tag="p" variant="textBase" className="text-base-600 mt-4">
                {post.data.description}
              </Text>
            </div>
            <div className="flex flex-wrap items-center gap-1 mt-8 justify-center">
              {post.data.tags.map((tag) => (
                <Button
                  key={tag}
                  isLink
                  title={tag}
                  size="sm"
                  variant="muted"
                  aria-label={tag}
                  href={`/blog/tags/${tag}`}
                  className="text-accent-500 font-medium text-xs hover:text-base-900 capitalize"
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
              loading="lazy"
              decoding="async"
              src={post.data.image.url}
              alt={post.data.image.alt || post.data.title}
              className="size-full aspect-8/5 object-top rounded shadow object-cover"
            />
          </div>
          <Wrapper variant="narrow" className="mt-12">
            <Wrapper variant="prose">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </Wrapper>
          </Wrapper>
        </Wrapper>
      </section>
      <section>
        <Wrapper variant="standard" className="py-12">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <Text tag="h2" variant="displaySM" className="text-base-900 font-display font-thin">
              Latest posts
            </Text>
            <Button isLink size="sm" variant="muted" href="/blog">
              See all posts
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {latest.map((item) => (
              <BlogCard key={item.id} post={item} />
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
