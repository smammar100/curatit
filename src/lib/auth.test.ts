import { describe, expect, it } from "vitest";
import { emailProblem, linkMessage, passwordProblem, safeNext } from "./auth";

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/dashboard/settings/tokens")).toBe("/dashboard/settings/tokens");
    expect(safeNext("/dashboard?view=saved&q=launch")).toBe("/dashboard?view=saved&q=launch");
  });

  it("falls back for anything a browser would read as another site", () => {
    for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "/\t/evil.example", "/\n/evil.example", "/\r\\evil.example", "evil.example"]) {
      expect(safeNext(next)).toBe("/dashboard");
    }
    expect(safeNext(null)).toBe("/dashboard");
    expect(safeNext("//evil.example", "/reset-password")).toBe("/reset-password");
  });
});

describe("linkMessage", () => {
  it("explains a known code and never blames the server for an unknown one", () => {
    expect(linkMessage("otp_expired")).toMatch(/expired/);
    expect(linkMessage("garbage")).not.toMatch(/our side/);
  });
});

describe("emailProblem", () => {
  it("refuses what the browser's own email check refuses, with a message", () => {
    expect(emailProblem("qa​@example.com")).toMatch(/valid email/);
    expect(emailProblem("😀qa@example.com")).toMatch(/valid email/);
    expect(emailProblem("qa@exаmple.com")).toMatch(/valid email/);
    expect(emailProblem("qa@example")).toMatch(/valid email/);
    expect(emailProblem("  sara+brief@studio.co ")).toBeNull();
  });
});

describe("passwordProblem", () => {
  it("says when a password is longer than Supabase accepts", () => {
    expect(passwordProblem(`Aa1!${"x".repeat(69)}`)).toMatch(/at most 72/);
    expect(passwordProblem(`Aa1!${"x".repeat(68)}`)).toBeNull();
  });
});
