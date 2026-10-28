import { getCollection, sortByPubDate } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// Curatit's own name (2026-10-28, from a QA run: the feed still said "Lexington Themes", the
// template's publisher)
const title = "Curatit";
const description = "Find ideas for your next social media post: a library of real brand posts, each with a breakdown of how it's made.";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const items = sortByPubDate(getCollection("posts"))
    .map((post) => {
      const link = `${SITE_URL}/blog/posts/${post.id}`;
      return `<item><title>${escapeXml(post.data.title)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><description>${escapeXml(post.data.description)}</description><pubDate>${post.data.pubDate.toUTCString()}</pubDate></item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(title)}</title><description>${escapeXml(description)}</description><link>${SITE_URL}/</link>${items}</channel></rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
