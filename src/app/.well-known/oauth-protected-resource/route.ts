// RFC 9728 Protected Resource Metadata, the root fallback clients try after the path-suffixed one
import { getRuntime } from "@/lib/mcp/runtime";

export const dynamic = "force-dynamic";

const handle = (request: Request) => getRuntime().http.protectedResourceMetadata(request);

export { handle as GET, handle as OPTIONS };
