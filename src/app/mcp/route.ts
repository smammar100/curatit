// The MCP endpoint (Streamable HTTP, stateless): POST carries the protocol; GET and DELETE are
// answered 405 by the SDK, as there's no session stream. Auth and the Origin check happen in
// lib/mcp/http.ts before the SDK sees the request.
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handle = (request: Request) => getRuntime().http.mcp(request);

// A person who opens /mcp in a browser gets the landing page (/agents) instead of a 401: a GET
// that asks for HTML and not for an event stream. Every other request goes to the server as before.
function get(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html") && !accept.includes("text/event-stream")) {
    return Response.redirect(new URL("/agents", request.url), 307);
  }
  return handle(request);
}

export { get as GET, handle as POST, handle as DELETE, handle as OPTIONS };
