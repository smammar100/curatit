import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getPaddleConfig, isTeamMonthlyPrice } from "@/lib/paddle/config";
import { createPaddle } from "@/lib/paddle/server";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  // Cookie-authenticated mutation: refuse cross-origin and missing-Origin requests.
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return json({ error: "Invalid request origin." }, 403);
  }
  let config;
  try { config = getPaddleConfig(); } catch {
    return json({ error: "Checkout is not available yet." }, 503);
  }
  try {
    const supabase = createClient(await cookies());
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.is_anonymous) return json({ error: "Sign in to continue." }, 401);

    const paddle = createPaddle();
    const price = await paddle.prices.get(config.priceId);
    if (!isTeamMonthlyPrice(price)) return json({ error: "This plan is temporarily unavailable." }, 503);
    // Never accept a price, quantity, customer ID or user ID from the browser.
    const transaction = await paddle.transactions.create({
      items: [{ priceId: config.priceId, quantity: 1 }],
      currencyCode: "USD",
      collectionMode: "automatic",
      customData: { curatit_user_id: user.id, curatit_plan: "team", integration: "sandbox-scaffold" },
    });
    return json({ transactionId: transaction.id, clientToken: config.clientToken });
  } catch {
    // SDK errors may include account details. Do not send or log the raw exception.
    console.error("paddle.checkout.failed");
    return json({ error: "Checkout could not open. Please try again." }, 502);
  }
}
