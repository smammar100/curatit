import { EventName } from "@paddle/paddle-node-sdk";
import { getPaddleConfig } from "@/lib/paddle/config";
import { createPaddle } from "@/lib/paddle/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let config;
  try { config = getPaddleConfig(); } catch {
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  const signature = request.headers.get("paddle-signature");
  if (!signature) return Response.json({ error: "Missing signature." }, { status: 400 });
  // Do not parse/re-serialize the body before verification: signatures cover the raw text.
  let event;
  try {
    event = await createPaddle().webhooks.unmarshal(await request.text(), config.webhookSecret, signature);
  } catch {
    return Response.json({ error: "Invalid webhook." }, { status: 400 });
  }
  if (event.eventType === EventName.TransactionCompleted) {
    // Scaffold only: no entitlements or user state are changed by this endpoint.
    // Paddle may redeliver this event. Dedupe by eventId when adding durable fulfillment.
    console.info(JSON.stringify({
      event: "paddle.transaction.completed", environment: "sandbox",
      eventId: event.eventId, transactionId: event.data.id, occurredAt: event.occurredAt,
    }));
  }
  return Response.json({ received: true });
}
