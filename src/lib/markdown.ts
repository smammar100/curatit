import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSmartypants from "remark-smartypants";
import { unified } from "unified";

// GFM, smart punctuation, heading ids, and Shiki code highlighting (min-light theme).
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeShiki, { theme: "min-light" })
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdown(markdown: string) {
  return String(await processor.process(markdown));
}
