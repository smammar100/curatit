// The MCP endpoint (Streamable HTTP, stateless): POST carries the protocol; GET and DELETE are
// answered 405 by the SDK, as there's no session stream. Auth and the Origin check happen in
// lib/mcp/http.ts before the SDK sees the request.
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handle = (request: Request) => getRuntime().http.mcp(request);

export { handle as GET, handle as POST, handle as DELETE, handle as OPTIONS };
