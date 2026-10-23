import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Server logs go to PostHog over OpenTelemetry. Without a project token and host this is off,
// and logPostHogIntegration() does nothing.

export const posthogLoggerProvider =
  projectToken && posthogHost
    ? new LoggerProvider({
        resource: resourceFromAttributes({
          "service.name": "curatit",
          "deployment.environment": process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        }),
        processors: [
          new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: `${posthogHost.replace(/\/$/, "")}/i/v1/logs`,
              headers: {
                Authorization: `Bearer ${projectToken}`,
                "Content-Type": "application/json",
              },
            }),
          }),
        ],
      })
    : null;

const posthogIntegrationLogger = posthogLoggerProvider?.getLogger("curatit-posthog-integration");

export function logPostHogIntegration(message: string, attributes: Record<string, string> = {}) {
  posthogIntegrationLogger?.emit({
    body: message,
    severityNumber: SeverityNumber.INFO,
    attributes,
  });
}

export async function flushPostHogLogs() {
  await posthogLoggerProvider?.forceFlush();
}

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && posthogLoggerProvider) {
    logs.setGlobalLoggerProvider(posthogLoggerProvider);
  }
}

// Errors thrown while the server renders a page or runs a server action or route handler
// (2026-10-18). The browser only ever sees a digest for these, so without this they reached
// nothing but Vercel's logs. Sent to PostHog as exceptions, with the path and the kind of
// request; off without a project token and host, and it never throws.
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !projectToken || !posthogHost) return;
  try {
    const { PostHog } = await import("posthog-node");
    const posthog = new PostHog(projectToken, { host: posthogHost, flushAt: 1, flushInterval: 0 });
    posthog.captureException(error, undefined, {
      path: request.path,
      method: request.method,
      route: context.routePath,
      route_type: context.routeType,
      router: context.routerKind,
    });
    await posthog.shutdown(2_000);
  } catch {
    // Monitoring must never break the request it's reporting on
  }
}
