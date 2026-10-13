import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getPrice: vi.fn(), createTransaction: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({}) }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("./server", () => ({ createPaddle: () => ({ prices: { get: mocks.getPrice }, transactions: { create: mocks.createTransaction } }) }));
import { POST } from "@/app/api/paddle/checkout/route";

beforeEach(() => {
  vi.stubEnv("PADDLE_CHECKOUT_ENABLED", "true");
  vi.stubEnv("PADDLE_SANDBOX_API_KEY", "pdl_sdbx_test_key");
  vi.stubEnv("PADDLE_SANDBOX_CLIENT_TOKEN", "test_client_token");
  vi.stubEnv("PADDLE_TEAM_MONTHLY_PRICE_ID", "pri_01h00000000000000000000000");
  vi.stubEnv("PADDLE_SANDBOX_WEBHOOK_SECRET", "test-secret");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "authenticated-user" } }, error: null });
  mocks.getPrice.mockResolvedValue({ status: "active", unitPrice: { amount: "900", currencyCode: "USD" },
    billingCycle: { interval: "month", frequency: 1 }, trialPeriod: null, unitPriceOverrides: [],
    quantity: { minimum: 1, maximum: 1 } });
  mocks.createTransaction.mockResolvedValue({ id: "txn_test" });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); vi.restoreAllMocks(); });
function request(origin = "https://curatit.test") {
  return new Request("https://curatit.test/api/paddle/checkout", { method: "POST", headers: { origin },
    body: JSON.stringify({ userId: "victim", priceId: "free-price", quantity: 100 }) });
}
it("uses verified account and allowlisted price regardless of browser payload", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(mocks.createTransaction).toHaveBeenCalledWith({
    items: [{ priceId: "pri_01h00000000000000000000000", quantity: 1 }], currencyCode: "USD",
    collectionMode: "automatic", customData: { curatit_user_id: "authenticated-user", curatit_plan: "team", integration: "sandbox-scaffold" },
  });
  expect(await response.json()).toEqual({ transactionId: "txn_test", clientToken: "test_client_token" });
});
it("rejects other origins before authentication or Paddle calls", async () => {
  expect((await POST(request("https://attacker.test"))).status).toBe(403);
  expect((await POST(request(""))).status).toBe(403);
  expect(mocks.getUser).not.toHaveBeenCalled();
  expect(mocks.createTransaction).not.toHaveBeenCalled();
});
it("rejects signed-out and anonymous accounts", async () => {
  for (const user of [null, { id: "anonymous", is_anonymous: true }]) {
    mocks.getUser.mockResolvedValue({ data: { user }, error: null });
    expect((await POST(request())).status).toBe(401);
  }
  expect(mocks.createTransaction).not.toHaveBeenCalled();
});
it("refuses a misconfigured price before transaction creation", async () => {
  mocks.getPrice.mockResolvedValue({ status: "archived" });
  expect((await POST(request())).status).toBe(503);
  expect(mocks.createTransaction).not.toHaveBeenCalled();
});
it("does not leak an SDK error or API key", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.createTransaction.mockRejectedValue(new Error("pdl_sdbx_secret account details"));
  const response = await POST(request());
  expect(response.status).toBe(502);
  expect(await response.text()).not.toContain("pdl_sdbx");
});
