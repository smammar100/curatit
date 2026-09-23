"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Entry } from "@/lib/content";
import { Card, CardGroup, CardHeader, CardTitle } from "@/components/ui/card";

/** What a journal card needs: the post without its markdown body. */
export type BlogCardPost = Pick<Entry<"posts">, "id" | "data">;

/** `2026-01-01`, the same as `formatDate` in lib/content (server-only). */
function isoDate(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

/** One journal post on the FF Card: cover, date and tags, title. Render inside `BlogGrid`. */
export default function BlogCard({ post, index }: { post: BlogCardPost; /** Injected by CardGroup. */ index?: number }) {
  const pubDate = isoDate(post.data.pubDate);

  return (
    <Card href={`/blog/posts/${post.id}`} label={post.data.title} title={post.data.title} index={index}>
      <Image
        width={640}
        height={400}
        sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
        src={post.data.image.url}
        alt={post.data.image.alt || post.data.title}
        className="aspect-8/5 w-full rounded-[2px] object-cover object-top shadow-surface-1"
      />
      <CardHeader>
        <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <time dateTime={pubDate} className="tabular-nums">
            {pubDate}
          </time>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{post.data.tags.join(", ")}</span>
        </p>
        <CardTitle className="text-balance">{post.data.title}</CardTitle>
      </CardHeader>
    </Card>
  );
}

/** Journal posts in one fluid-hover CardGroup: 3 columns from 1024px, 2 from 640px, else 1. */
export function BlogGrid({ posts, className }: { posts: BlogCardPost[]; className?: string }) {
  const columns = useColumns();
  return (
    <CardGroup columns={columns} separated className={className}>
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </CardGroup>
  );
}

/** The fluid hover needs a real column count, so read it from the viewport. */
function useColumns() {
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)");
    const mid = window.matchMedia("(min-width: 640px)");
    const update = () => setColumns(wide.matches ? 3 : mid.matches ? 2 : 1);
    update();
    wide.addEventListener("change", update);
    mid.addEventListener("change", update);
    return () => {
      wide.removeEventListener("change", update);
      mid.removeEventListener("change", update);
    };
  }, []);
  return columns;
}
