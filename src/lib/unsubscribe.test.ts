import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readUnsubscribeToken, unsubscribeToken, unsubscribeUrl } from "./unsubscribe";

describe("unsubscribe links", () => {
  beforeEach(() => {
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "test-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips an address, lowercased", () => {
    expect(readUnsubscribeToken(unsubscribeToken("Sara@Studio.co"))).toBe("sara@studio.co");
  });

  it("refuses a token for someone else's address or with an edited signature", () => {
    const token = unsubscribeToken("sara@studio.co")!;
    const [, mac] = token.split(".");
    expect(readUnsubscribeToken(`${Buffer.from("kim@studio.co").toString("base64url")}.${mac}`)).toBeNull();
    expect(readUnsubscribeToken(`${token}x`)).toBeNull();
    expect(readUnsubscribeToken(`${token}.extra`)).toBeNull();
    expect(readUnsubscribeToken("")).toBeNull();
    expect(readUnsubscribeToken(null)).toBeNull();
  });

  it("refuses a token signed with another secret", () => {
    const token = unsubscribeToken("sara@studio.co");
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "other-secret");
    expect(readUnsubscribeToken(token)).toBeNull();
  });

  it("builds the footer link with the email it came from", () => {
    const url = new URL(unsubscribeUrl("sara@studio.co", "onboarding")!);
    expect(url.pathname).toBe("/unsubscribe");
    expect(url.searchParams.get("s")).toBe("onboarding");
    expect(readUnsubscribeToken(url.searchParams.get("t"))).toBe("sara@studio.co");
  });

  it("makes no link while no secret is set", () => {
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "");
    vi.stubEnv("CURATIT_MCP_SIGNING_SECRET", "");
    expect(unsubscribeUrl("sara@studio.co")).toBeUndefined();
  });
});
