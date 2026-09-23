import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
import { Button } from "@/components/ui/button";
import { BlogGrid } from "@/components/blog/BlogCard";
import { formatDate, getCollection, getEntry, getSortedPosts, renderMarkdown } from "@/lib/content";

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
  const pubDate = formatDate(post.data.pubDate);

  return (
    <>
      <Wrapper variant="standard">
        <article className="mx-auto max-w-2xl">
          <PageHeader
            className="pb-6"
            eyebrow={
              <span className="flex items-center gap-3">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors duration-80 hover:text-foreground"
                >
                  <ArrowLeft aria-hidden="true" size={14} strokeWidth={1.5} />
                  Journal
                </Link>
                <time dateTime={pubDate} className="text-[12px] tabular-nums">
                  {pubDate}
                </time>
              </span>
            }
            title={post.data.title}
            description={post.data.description}
          />
          <ul aria-label="Tags" className="flex flex-wrap items-center gap-2">
            {post.data.tags.map((tag) => (
              <li key={tag}>
                <Button asChild size="compact" variant="tertiary" className="capitalize">
                  <Link title={tag} aria-label={tag} href={`/blog/tags/${tag}`}>
                    {tag}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
          <Image
            width={1400}
            height={875}
            priority
            sizes="(min-width: 768px) 672px, 100vw"
            src={post.data.image.url}
            alt={post.data.image.alt || post.data.title}
            className="mt-8 aspect-8/5 w-full rounded-xl object-cover object-top shadow-surface-1"
          />
          <Wrapper variant="prose" className="mt-10">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Wrapper>
        </article>
      </Wrapper>

      <section aria-labelledby="latest-posts">
        <Wrapper variant="standard" className="pt-12 pb-24">
          <div className="border-t border-border pt-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 id="latest-posts" className="heading-section text-foreground">
                Latest posts
              </h2>
              <Button asChild size="compact" variant="tertiary">
                <Link href="/blog">See all posts</Link>
              </Button>
            </div>
            <BlogGrid posts={latest.map(({ id, data }) => ({ id, data }))} className="mt-6" />
          </div>
        </Wrapper>
      </section>
    </>
  );
}
