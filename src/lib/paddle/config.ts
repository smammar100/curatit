/** Sandbox scaffold. Live credentials are deliberately refused until fulfillment is built. */
export function getPaddleConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.PADDLE_CHECKOUT_ENABLED !== "true") throw new Error("Paddle checkout is disabled");
  const apiKey = env.PADDLE_SANDBOX_API_KEY ?? "";
  const clientToken = env.PADDLE_SANDBOX_CLIENT_TOKEN ?? "";
  const priceId = env.PADDLE_TEAM_MONTHLY_PRICE_ID ?? "";
  const webhookSecret = env.PADDLE_SANDBOX_WEBHOOK_SECRET ?? "";
  if (!apiKey.startsWith("pdl_sdbx_") || !clientToken.startsWith("test_") ||
      !/^pri_[a-z0-9]{26}$/.test(priceId) || !webhookSecret) {
    throw new Error("Paddle sandbox configuration is incomplete");
  }
  return { apiKey, clientToken, priceId, webhookSecret };
}

export function isPaddleConfigured() {
  try { getPaddleConfig(); return true; } catch { return false; }
}

/** Keep checkout consistent with the existing $9/month pricing card. */
export function isTeamMonthlyPrice(price: {
  status: string;
  unitPrice: { amount: string; currencyCode: string };
  billingCycle: { interval: string; frequency: number } | null;
  trialPeriod: unknown;
  unitPriceOverrides: unknown[];
  quantity: { minimum: number; maximum: number };
}) {
  return price.status === "active" && price.unitPrice.amount === "900" &&
    price.unitPrice.currencyCode === "USD" && price.billingCycle?.interval === "month" &&
    price.billingCycle.frequency === 1 && !price.trialPeriod &&
    price.unitPriceOverrides.length === 0 && price.quantity.minimum <= 1 && price.quantity.maximum >= 1;
}
