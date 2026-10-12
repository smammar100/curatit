// One runtime per process for the route handlers: config, the catalog over Supabase, the
// service_role client for token checks and rate limits, the verifier and the logger. Built on
// first use, so a missing setting surfaces as a clear error on the first request.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createVerifier, type Verifier } from "./auth/verifier";
import { loadConfig } from "./config";
import { createMcpHttp, type McpHttp } from "./http";
import { createLogger } from "./log";
import { createSupabaseLimiter, Throttle } from "./ratelimit";
import { createSupabaseCatalog } from "./repo/supabase";
import type { Runtime } from "./tools";

let instance: { runtime: Runtime; verifier: Verifier; http: McpHttp } | null = null;

export function getRuntime() {
  if (instance) return instance;
  const config = loadConfig();
  const log = createLogger(config.logLevel, { service: "curatit-mcp" });
  const admin = createClient<Database>(config.supabaseUrl, config.supabaseSecretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const runtime: Runtime = {
    config,
    repo: createSupabaseCatalog({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey, secretKey: config.supabaseSecretKey }),
    throttle: new Throttle(createSupabaseLimiter(admin), log),
    log,
    media: {
      // Supabase Storage's resizer for anything over the inline caps
      resizedUrl: (path, width, height) =>
        `${config.supabaseUrl.replace(/\/$/, "")}/storage/v1/render/image/public/library/${path.split("/").map(encodeURIComponent).join("/")}?width=${width}&height=${height}&resize=contain`,
    },
  };
  const verifier = createVerifier(config, admin, log);
  instance = { runtime, verifier, http: createMcpHttp(runtime, verifier) };
  return instance;
}
