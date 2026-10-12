import type { Metadata } from "next";
// Components
import ApiTokens from "@/components/dashboard/ApiTokens";

export const metadata: Metadata = { title: "API tokens · Curatit" };

// Personal access tokens for MCP clients (docs/mcp). A static shell; the tokens load in the
// browser as the signed-in person.
export default function TokensPage() {
  return <ApiTokens />;
}
