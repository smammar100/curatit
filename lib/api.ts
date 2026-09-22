import "server-only";

import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "./errors";

type Handler<P> = (request: NextRequest, context: { params: P; requestId: string }) => Promise<unknown> | unknown;

/**
 * Wraps a route handler with the shared API contract (plan §26):
 * request IDs, safe error codes (no stack traces), no-store caching, and a
 * same-origin check on cookie-authenticated mutations (CSRF).
 */
export function api<P = Record<string, string>>(handler: Handler<P>) {
  return async (request: NextRequest, context: { params: Promise<P> }) => {
    const requestId = randomUUID();
    const headers = { "Cache-Control": "private, no-store", "X-Request-Id": requestId };

    try {
      if (request.method !== "GET" && request.method !== "HEAD") assertSameOrigin(request);
      const params = await context.params;
      const body = await handler(request, { params, requestId });
      if (body === undefined) return new NextResponse(null, { status: 204, headers });
      return NextResponse.json({ ...(body as object), requestId }, { headers });
    } catch (error) {
      if (error instanceof AppError) {
        const extra: Record<string, string> = {};
        if (error.code === "rate_limited" && typeof error.details?.retryAfter === "number") {
          extra["Retry-After"] = String(error.details.retryAfter);
        }
        return NextResponse.json(
          { error: { code: error.code, message: error.message, details: error.details ?? null }, requestId },
          { status: error.status, headers: { ...headers, ...extra } }
        );
      }

      console.error(`[api] ${requestId}`, error instanceof Error ? error.message : "unknown error");
      return NextResponse.json(
        { error: { code: "unavailable", message: "Something went wrong. Try again.", details: null }, requestId },
        { status: 503, headers }
      );
    }
  };
}

function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) throw new AppError("forbidden", "Cross-site request blocked.");
  try {
    if (new URL(origin).host !== host) throw new AppError("forbidden", "Cross-site request blocked.");
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("forbidden", "Cross-site request blocked.");
  }
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("invalid_input", "Request body must be valid JSON.");
  }
}
