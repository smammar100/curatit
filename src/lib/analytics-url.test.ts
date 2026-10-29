import { describe, expect, it } from "vitest";
import { analyticsUrl } from "./analytics-url";

const site = "https://www.curatit.app";

describe("analyticsUrl", () => {
  it("replaces a shared board's token with its route", () => {
    expect(analyticsUrl(`${site}/s/9f2c4e1a7b`)).toBe(`${site}/s/[token]`);
    expect(analyticsUrl(`${site}/s/9f2c4e1a7b/`)).toBe(`${site}/s/[token]/`);
  });

  it("drops one-time tokens, codes, email addresses and search words", () => {
    expect(analyticsUrl(`${site}/auth/confirm?token_hash=pkce_abc&type=signup`)).toBe(`${site}/auth/confirm`);
    expect(analyticsUrl(`${site}/code#482913`)).toBe(`${site}/code`);
    expect(analyticsUrl(`${site}/unsubscribe?email=ana%40example.com&sig=f00d`)).toBe(`${site}/unsubscribe`);
    expect(analyticsUrl(`${site}/dashboard?view=discover&q=summer+launch`)).toBe(`${site}/dashboard`);
  });

  it("keeps campaign parameters", () => {
    expect(analyticsUrl(`${site}/?utm_source=newsletter&utm_campaign=beta&email=a%40b.c`)).toBe(
      `${site}/?utm_source=newsletter&utm_campaign=beta`,
    );
    expect(analyticsUrl(`${site}/agents?ref=producthunt`)).toBe(`${site}/agents?ref=producthunt`);
  });

  it("leaves other paths alone, including ones that start with s", () => {
    for (const path of ["/", "/signup", "/sites/tags/saas", "/dashboard/p/DdcI8NLmY21", "/dashboard/b/0b7e"]) {
      expect(analyticsUrl(`${site}${path}`)).toBe(`${site}${path}`);
    }
  });
});
