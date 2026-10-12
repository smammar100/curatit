// Building the response envelope every surface returns: the same `data` / `error` object goes
// out as MCP structured content and as a REST body, with a request id for support and a
// provenance block saying when and against which taxonomy the catalog was read.

import { SCHEMA_VERSION } from "./contracts";
import { CuratitError } from "./errors";

export type Provenance = { retrieved_at: string; taxonomy_version: string | null; catalog: string };
export type Envelope<T> = {
  schema_version: typeof SCHEMA_VERSION;
  request_id: string;
  data?: T;
  error?: { code: CuratitError["code"]; message: string; retryable: boolean; retry_after_seconds?: number; details?: Record<string, unknown> };
  warnings: string[];
  provenance?: Provenance;
};

export const CATALOG = "Curatit library (published posts and editor-approved analyses)";

export function provenance(taxonomyVersion: string | null): Provenance {
  return { retrieved_at: new Date().toISOString(), taxonomy_version: taxonomyVersion, catalog: CATALOG };
}

export function success<T>(requestId: string, data: T, warnings: string[], taxonomyVersion: string | null): Envelope<T> {
  return { schema_version: SCHEMA_VERSION, request_id: requestId, data, warnings, provenance: provenance(taxonomyVersion) };
}

export function failure(requestId: string, error: CuratitError): Envelope<never> {
  return {
    schema_version: SCHEMA_VERSION,
    request_id: requestId,
    error: {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      ...(error.retryAfterSeconds !== undefined && { retry_after_seconds: error.retryAfterSeconds }),
      ...(error.details && { details: error.details }),
    },
    warnings: [],
  };
}

export const newRequestId = () => crypto.randomUUID();
