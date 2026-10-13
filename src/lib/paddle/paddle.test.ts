import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPaddleConfig, isTeamMonthlyPrice } from "./config";
import { POST } from "@/app/api/webhooks/paddle/route";

const secret = "test-webhook-secret";
function configure() {
  vi.stubEnv("PADDLE_CHECKOUT_ENABLED", "true");
  vi.stubEnv("PADDLE_SANDBOX_API_KEY", "pdl_sdbx_test_key");
  vi.stubEnv("PADDLE_SANDBOX_CLIENT_TOKEN", "test_client_token");
  vi.stubEnv("PADDLE_TEAM_MONTHLY_PRICE_ID", "pri_01h00000000000000000000000");
  vi.stubEnv("PADDLE_SANDBOX_WEBHOOK_SECRET", secret);
}
const body = JSON.stringify({
  event_id: "evt_test", event_type: "transaction.completed", occurred_at: "2026-10-13T12:00:00Z",
  notification_id: "ntf_test", data: { id: "txn_test", items: [], payments: [] },
});
function request(payload = body, timestamp = Math.floor(Date.now() / 1000), signedBody = payload) {
  const h1 = createHmac("sha256", secret).update(`${timestamp}:${signedBody}`).digest("hex");
  return new Request("https://curatit.test/api/webhooks/paddle", {
    method: "POST", body: payload, headers: { "paddle-signature": `ts=${timestamp};h1=${h1}` },
  });
}
beforeEach(configure);
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("sandbox configuration", () => {
  it("refuses live keys, live tokens, missing secrets and disabled checkout", () => {
    const env = { ...process.env };
    expect(getPaddleConfig(env).clientToken).toBe("test_client_token");
    for (const override of [
      { PADDLE_SANDBOX_API_KEY: "pdl_live_secret" },
      { PADDLE_SANDBOX_CLIENT_TOKEN: "live_token" },
      { PADDLE_SANDBOX_WEBHOOK_SECRET: "" },
      { PADDLE_CHECKOUT_ENABLED: "false" },
      { PADDLE_TEAM_MONTHLY_PRICE_ID: "arbitrary" },
    ]) expect(() => getPaddleConfig({ ...env, ...override })).toThrow();
  });
  it("refuses prices that differ from the advertised plan", () => {
    const price = { status: "active", unitPrice: { amount: "900", currencyCode: "USD" },
      billingCycle: { interval: "month", frequency: 1 }, trialPeriod: null, unitPriceOverrides: [],
      quantity: { minimum: 1, maximum: 1 } };
    expect(isTeamMonthlyPrice(price)).toBe(true);
    expect(isTeamMonthlyPrice({ ...price, unitPrice: { amount: "3000", currencyCode: "USD" } })).toBe(false);
    expect(isTeamMonthlyPrice({ ...price, billingCycle: { interval: "year", frequency: 1 } })).toBe(false);
    expect(isTeamMonthlyPrice({ ...price, status: "archived" })).toBe(false);
    expect(isTeamMonthlyPrice({ ...price, trialPeriod: {} })).toBe(false);
    expect(isTeamMonthlyPrice({ ...price, unitPriceOverrides: [{}] })).toBe(false);
  });
});

describe("webhooks through the real Paddle SDK", () => {
  it("accepts a signed event and logs only identifiers", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    expect((await POST(request())).status).toBe(200);
    expect(JSON.parse(log.mock.calls[0][0])).toEqual({
      event: "paddle.transaction.completed", environment: "sandbox", eventId: "evt_test",
      transactionId: "txn_test", occurredAt: "2026-10-13T12:00:00Z",
    });
  });
  it("rejects modified bodies, stale signatures, invalid JSON and missing signatures", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    expect((await POST(request(body + " ", undefined, body))).status).toBe(400);
    expect((await POST(request(body, Math.floor(Date.now() / 1000) - 60))).status).toBe(400);
    expect((await POST(request("not JSON"))).status).toBe(400);
    expect((await POST(new Request("https://curatit.test/api/webhooks/paddle", { method: "POST", body }))).status).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });
  it("returns a retryable failure when configuration is missing", async () => {
    vi.stubEnv("PADDLE_SANDBOX_WEBHOOK_SECRET", "");
    expect((await POST(request())).status).toBe(503);
  });
});
