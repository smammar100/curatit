// The email sender: off without a Resend key, never throws, and the welcome email's contents.
// Resend itself is replaced, so nothing is sent.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

const { send, made } = vi.hoisted(() => ({ send: vi.fn(), made: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
    constructor(key: string) {
      made(key);
    }
  },
}));

// The client is made once per module, so each test loads a fresh copy after setting the env
const load = () => import("./email");
const message = () => send.mock.calls[0][0] as { from: string; replyTo: string; to: string; subject: string; react: ReactElement };
const options = () => send.mock.calls[0][1] as { idempotencyKey?: string };

beforeEach(() => {
  vi.resetModules();
  send.mockReset();
  made.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const email = { to: "sara@studio.co", subject: "Hello", react: <p>Hi</p> };

describe("sendEmail", () => {
  it("sends nothing without RESEND_API_KEY", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const { sendEmail } = await load();
    expect(await sendEmail(email)).toBe(false);
    expect(made).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("sends from EMAIL_FROM with replies to EMAIL_REPLY_TO", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Curatit <hello@curatit.test>");
    vi.stubEnv("EMAIL_REPLY_TO", "ammar@curatit.test");
    send.mockResolvedValue({ data: { id: "e1" }, error: null });
    const { sendEmail } = await load();
    expect(await sendEmail({ ...email, idempotencyKey: "k1" })).toBe(true);
    expect(made).toHaveBeenCalledWith("re_test");
    expect(message()).toMatchObject({ from: "Curatit <hello@curatit.test>", replyTo: "ammar@curatit.test", to: "sara@studio.co", subject: "Hello" });
    expect(options()).toEqual({ idempotencyKey: "k1" });
  });

  it("falls back to hello@curatit.app, with replies to the sender rather than a free-mail inbox", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "");
    vi.stubEnv("EMAIL_REPLY_TO", "");
    send.mockResolvedValue({ data: { id: "e1" }, error: null });
    const { sendEmail } = await load();
    await sendEmail(email);
    expect(message()).toMatchObject({ from: "Curatit <hello@curatit.app>" });
    expect(message().replyTo).toBeUndefined();
  });

  it("reports false and logs when Resend refuses the email", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "The domain is not verified" } });
    const { sendEmail } = await load();
    expect(await sendEmail(email)).toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("validation_error"));
  });

  it("never throws, even when the request itself fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    send.mockRejectedValue(new Error("network down"));
    const { sendEmail } = await load();
    expect(await sendEmail(email)).toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("network down"));
  });
});

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CURATIT_PUBLIC_BASE_URL", "https://curatit.test");
    send.mockResolvedValue({ data: { id: "e1" }, error: null });
  });

  it("sends the welcome note once per account, greeting by first name, opening the dashboard", async () => {
    const { sendWelcomeEmail } = await load();
    expect(await sendWelcomeEmail({ id: "u1", email: "sara@studio.co", user_metadata: { full_name: "  Sara Khan " } })).toBe(true);
    expect(message()).toMatchObject({ to: "sara@studio.co", subject: "Welcome to Curatit" });
    expect(options()).toEqual({ idempotencyKey: "welcome/u1" });
    const html = await render(message().react);
    expect(html).toContain("Welcome to Curatit, Sara.");
    expect(html).toContain("See you in the library.");
    expect(html).toContain("signed up for Curatit with <!-- -->sara@studio.co");
    expect(html).toContain('href="https://curatit.test/dashboard"');
    // A transactional email: no unsubscribe link
    expect(html).not.toContain("Unsubscribe");
    // Images come from the deployed site, never the request's origin
    expect(html).toContain("https://curatit.test/email/welcome/hero-scatter.png");
    expect(html).toContain("https://curatit.test/email/signature.png");
    expect(html).not.toContain("localhost");
  });

  it("leaves the name out when the account has none", async () => {
    const { sendWelcomeEmail } = await load();
    await sendWelcomeEmail({ id: "u2", email: "new@studio.co", user_metadata: {} });
    expect(await render(message().react)).toContain("Welcome to Curatit.");
  });

  it("leaves out a name that isn't name-shaped, so a URL can't become a link in the email", async () => {
    const { sendWelcomeEmail } = await load();
    for (const full_name of ["evil.example/verify now", "https://evil.example", "<b>Sara</b>", "x".repeat(41)]) {
      send.mockClear();
      await sendWelcomeEmail({ id: "u4", email: "new@studio.co", user_metadata: { full_name } });
      const html = await render(message().react);
      expect(html).toContain("Welcome to Curatit.");
      expect(html).not.toContain("evil.example");
    }
  });

  it("keeps names with accents, apostrophes and hyphens", async () => {
    const { sendWelcomeEmail } = await load();
    await sendWelcomeEmail({ id: "u5", email: "z@studio.co", user_metadata: { full_name: "Zoë-Anne O’Neil" } });
    expect(await render(message().react)).toContain("Welcome to Curatit, Zoë-Anne.");
  });

  it("sends nothing to an account without an email address", async () => {
    const { sendWelcomeEmail } = await load();
    expect(await sendWelcomeEmail({ id: "u3" })).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});
