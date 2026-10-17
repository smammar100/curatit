// The MCP server's six tools as the marketing pages describe them: the connect page at /docs/mcp
// and the MCP landing page at /agents (which also uses the plain titles). The tools themselves are
// registered in src/lib/mcp/tools.ts; keep these lines in step when one changes.
import { SITE_URL } from "@/lib/site";

export const MCP_URL = `${SITE_URL}/mcp`;

export const TOOLS = [
  { name: "curatit_get_taxonomy", title: "Learn the filters", does: "The values every filter accepts: industries, brands, formats, goals, creative approaches and the visual dimensions." },
  { name: "curatit_search_posts", title: "Search the library", does: "Find real posts by words and filters, with why each one matched. Nothing is relaxed behind your back." },
  { name: "curatit_get_post", title: "Open a post", does: "One post in full: caption, counts as collected, every slide, and its editor-approved analysis." },
  { name: "curatit_get_carousel", title: "Walk through a carousel", does: "A carousel's slides in order, a page at a time, each with its analysis record." },
  { name: "curatit_get_media", title: "See the slides", does: "A slide's image, as a link or inline for tools that can look at pictures." },
  { name: "curatit_create_brief", title: "Draft a brief", does: "An original creative brief grounded in one to eight posts: observed, inferred and recommended, kept apart." },
];
