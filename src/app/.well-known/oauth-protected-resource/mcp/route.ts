// RFC 9728 Protected Resource Metadata for https://<host>/mcp (the path-suffixed well-known URL
// the 401 challenge names)
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";

const handle = (request: Request) => getRuntime().http.protectedResourceMetadata(request);

export { handle as GET, handle as OPTIONS };
