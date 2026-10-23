import { describe, expect, it } from "vitest";
import { isDisposableEmail } from "./auth-guard";
import { emailProblem } from "./auth";

describe("isDisposableEmail", () => {
  it("refuses throwaway inboxes, subdomains included, in any case", () => {
    expect(isDisposableEmail("someone@mailinator.com")).toBe(true);
    expect(isDisposableEmail("Someone@YOPMAIL.com")).toBe(true);
    expect(isDisposableEmail("x@inbox.guerrillamail.com")).toBe(true);
  });

  it("lets ordinary addresses through", () => {
    expect(isDisposableEmail("sara@studio.co")).toBe(false);
    expect(isDisposableEmail("me@gmail.com")).toBe(false);
    // A domain that only ends with a listed name's letters isn't one of its subdomains
    expect(isDisposableEmail("me@notmailinator.com")).toBe(false);
    expect(isDisposableEmail("not-an-email")).toBe(false);
  });
});

describe("emailProblem", () => {
  it("refuses an address longer than mail servers accept", () => {
    expect(emailProblem(`${"a".repeat(250)}@x.co`)).toMatch(/too long/);
    expect(emailProblem("sara@studio.co")).toBeNull();
  });
});
