import { getSortedPosts } from "@/lib/content";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

function escape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = await getSortedPosts();

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escape(post.data.title)}</title>
      <description>${escape(post.data.description)}</description>
      <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
      <link>${SITE}/blog/posts/${post.id}</link>
      <guid>${SITE}/blog/posts/${post.id}</guid>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Curatit</title>
    <description>A curated collection of production websites worth studying.</description>
    <link>${SITE}</link>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
