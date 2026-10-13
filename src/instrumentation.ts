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
