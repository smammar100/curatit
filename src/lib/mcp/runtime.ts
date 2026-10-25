// One runtime per process for the route handlers: config, the catalog over Supabase, the
// service_role client for token checks and rate limits, the verifier and the logger. Built on
// first use, so a missing setting surfaces as a clear error on the first request.

import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createLocalModels } from "@/lib/search/semantic/models";
import { createVerifier, type Verifier } from "./auth/verifier";
import { loadConfig } from "./config";
import { createMcpHttp, type McpHttp } from "./http";
import { createLogger } from "./log";
import { createSupabaseLimiter, Throttle } from "./ratelimit";
import { catalogClient, createSupabaseCatalog } from "./repo/supabase";
import type { Runtime } from "./tools";

// Token checks and the rate-limit counter sit in front of every call, so the service_role
// client answers within 2 s or gives up, and never retries
const ADMIN_TIMEOUT_MS = 2_000;

export type RuntimeInstance = { runtime: Runtime; verifier: Verifier; http: McpHttp; admin: SupabaseClient<Database> };

let instance: RuntimeInstance | null = null;

export function getRuntime(): RuntimeInstance {
  if (instance) return instance;
  const config = loadConfig();
  const log = createLogger(config.logLevel, { service: "curatit-mcp" });
  const admin = catalogClient(config.supabaseUrl, config.supabaseSecretKey, ADMIN_TIMEOUT_MS);
  const runtime: Runtime = {
    config,
    repo: createSupabaseCatalog({ url: config.supabaseUrl, publishableKey: config.supabasePublishableKey, secretKey: config.supabaseSecretKey }),
    throttle: new Throttle(createSupabaseLimiter(admin), log),
    log,
    // Loaded on the first search that needs them, from the ./models the build fetched; the server
    // never downloads them (scripts/fetch-search-models.mjs)
    semantic: config.hybridSearch ? createLocalModels({ modelDir: join(process.cwd(), "models"), download: false }) : null,
    media: {
      // Supabase Storage's resizer for anything over the inline caps
      resizedUrl: (path, width, height) =>
        `${config.supabaseUrl.replace(/\/$/, "")}/storage/v1/render/image/public/library/${path.split("/").map(encodeURIComponent).join("/")}?width=${width}&height=${height}&resize=contain`,
    },
  };
  const verifier = createVerifier(config, admin, log);
  instance = { runtime, verifier, http: createMcpHttp(runtime, verifier), admin };
  return instance;
}
