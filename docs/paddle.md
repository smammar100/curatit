# Paddle sandbox integration

This branch implements the first checkout/webhook scaffold from Paddle's Codex guide.
It keeps Curatit's existing Free and Team ($9 USD/month) plans. The guide's
Starter/Pro/Enterprise prices are examples, not changes to Curatit's pricing.
Only the displayed monthly plan is wired; annual billing is not enabled.

## What is ready

- Official Node SDK and Paddle.js, pinned in package.json and package-lock.json.
- Project-scoped Codex MCP definitions in `.codex/config.toml`: docs, sandbox,
  and a disabled live connection. These do not complete authentication.
- `/pricing`: Free goes to signup; Team opens a sandbox overlay when configured.
- `POST /api/paddle/checkout`: verifies the Supabase user, rejects cross-origin
  requests, validates the allowlisted $9/month price, and creates a transaction.
  The browser cannot supply the account ID, price ID or quantity.
- `POST /api/webhooks/paddle`: verifies the untouched request body with
  `paddle.webhooks.unmarshal()` before logging `transaction.completed` identifiers.
  The proxy excludes this route so webhook delivery never depends on a cookie session.
- Checkout is off by default and rejects live keys/tokens.

No product, price or notification destination has been created in a Paddle account.
No real payment has been taken. The official Paddle skills plugin still needs to
be installed in your own Codex client; repository configuration is not installation.

## Connect Codex on your machine

From your Curatit checkout on `paddle-payment-integration`:

```sh
codex plugin marketplace add PaddleHQ/paddle-agent-skills
```

Open Codex and install `paddle` from the plugin directory. Follow the installed
plugin's setup if it supplies the same servers; use either its server definitions
or the project definitions to avoid duplicate tool connections.

Set `PADDLE_SANDBOX_API_KEY` securely in the shell that launches Codex, then restart
Codex. Do not paste the key into a chat, commit, or MCP configuration file.
Next.js reads `.env.local`; Codex's MCP process needs the shell environment instead.
Confirm the project is trusted so Codex loads project-scoped configuration.
Run `codex mcp list` to inspect which connections are configured.

The docs server requires a separate Google/GitHub sign-in:

```sh
codex mcp login paddle-docs --scopes openid
```

If authentication fails, Paddle currently documents appending
`&resource=https%3A%2F%2Fpaddle-docs.mcp.kapa.ai%2F` to the authorization URL before
opening it. Consult the current docs-MCP guide below; the workaround can change.
Confirm a read-only docs search and a read-only sandbox catalog call actually
succeed before asking the agent to create anything.

Live MCP is explicitly disabled in this project's config. When you intentionally
need production account access, enable it and run `codex mcp login paddle-live`.
This does not enable live checkout in the application, which is sandbox-only.

## Configure the application

1. Run `npm ci`. Copy the Paddle entries from `.env.example` to `.env.local`.
2. Create a sandbox API key with **price read** and **transaction write** permissions.
   Set `PADDLE_SANDBOX_API_KEY`. Catalog creation through MCP additionally needs
   product/price read and write permissions; keep that separate from the runtime key
   if you want the runtime to have fewer privileges.
3. Create a sandbox client-side token and set `PADDLE_SANDBOX_CLIENT_TOKEN` (`test_…`).
4. Create or reuse a **Curatit Team** product with an active recurring price:
   USD 9.00, every month, quantity 1, no trial, no regional price overrides.
   Set its `pri_…` ID as `PADDLE_TEAM_MONTHLY_PRICE_ID`.
5. In sandbox Checkout settings, set the default payment link to your testing
   origin's `/pricing` page. Paddle requires a default payment link for automatically
   collected transactions. Use a publicly accessible preview/tunnel for webhook tests.
6. Add a sandbox notification destination for
   `https://<your-preview-origin>/api/webhooks/paddle`, subscribe to
   `transaction.completed`, and put its secret in `PADDLE_SANDBOX_WEBHOOK_SECRET`.
   Ensure the preview's access protection allows Paddle webhook requests.
7. Set `PADDLE_CHECKOUT_ENABLED=true`, restart the app, and open `/pricing`.
   Existing Supabase URL/publishable-key settings are also required for sign-in.

Suggested prompt after connecting the sandbox MCP:

> Use paddle-sandbox to find an existing Curatit Team product and its USD 9/month
> price. Reuse matching active records. If they do not exist, create the product
> and monthly price with quantity 1, no trial and no regional overrides. Return
> the price ID. Do not modify existing prices or use the live account.

## Verify before continuing

```sh
npm test -- src/lib/paddle
npm run typecheck
npm run build
```

Then perform the account-dependent checks:

- Signed out: Team sends you to sign in, with `/pricing` as the return path.
- Signed in: Team opens a clearly labeled sandbox checkout for USD 9/month;
  Paddle displays any tax. Close it and reopen it to check cancellation handling.
- Complete checkout with a test payment method from Paddle's current sandbox docs.
  The UI says the test succeeded, but never claims account access changed.
- In Paddle's delivery log, confirm the matching `transaction.completed` reached
  the webhook with HTTP 200. App logs should contain the event and transaction IDs,
  not the customer's email, payload, card data or credentials.
- Replay it: another identifier log is harmless because this scaffold has no
  fulfillment side effects. Invalid signatures must return 400; missing server
  configuration must return 503 so Paddle can retry.

## Before live payments

This is deliberately a sandbox scaffold, not a completed subscription service.
It does not persist subscriptions, grant paid access, prevent multiple subscriptions,
or provide billing management. Browser callbacks and custom data are not authority
to grant paid access.

Before enabling real charges, implement durable event storage with unique event IDs,
atomic/idempotent processing, trusted transaction-to-user mapping, subscription
lifecycle handling (including cancellation/past-due), out-of-order delivery handling,
server-side entitlement checks and customer-portal access. Add persistent checkout
rate limiting and duplicate-subscription protection. Keep a retry/reconciliation path
for webhook failures. Review the pricing page's inherited Team feature claims against
what the application actually offers before selling it.

## Official references

- https://developer.paddle.com/get-started/ai/codex/
- https://developer.paddle.com/sdks/ai/docs-mcp/
- https://developer.paddle.com/sdks/ai/paddle-mcp/
- https://developer.paddle.com/paddle-js/methods/paddle-checkout-open/
- https://developer.paddle.com/build/transactions/pass-transaction-checkout/
- https://developer.paddle.com/build/transactions/default-payment-link/
- https://developer.paddle.com/webhooks/about/signature-verification/
- https://developer.paddle.com/llms.txt

## Validation of this scaffold

- Paddle suite: 10/10 tests passed using the real SDK for webhook signatures.
- TypeScript and both MCP workspace builds passed.
- Full suite: 271 tests passed; the existing live MCP suite could not initialize
  without the Supabase environment settings.
- Next.js compiled and passed its TypeScript stage; page-data collection stopped
  because the existing dashboard requires the Supabase URL and publishable key.
- No sandbox transaction or remote webhook delivery was tested without credentials.
