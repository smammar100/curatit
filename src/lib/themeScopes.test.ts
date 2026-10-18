import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error: a plain .mjs script with no type declarations
import { buildThemeScopes, SOURCE, TARGET } from "../../scripts/theme-scopes.mjs";

// The design system page shows components in both themes side by side through
// theme-scopes.css, generated from global.css. Changing the tokens without regenerating it
// would make the page show stale colours
describe("theme-scopes.css", () => {
  it("is up to date with the tokens in global.css (run `node scripts/theme-scopes.mjs`)", () => {
    expect(readFileSync(TARGET, "utf8")).toBe(buildThemeScopes(readFileSync(SOURCE, "utf8")));
  });

  it("gives the dark scope every value the dark theme changes", () => {
    const css = buildThemeScopes(readFileSync(SOURCE, "utf8"));
    expect(css).toContain('[data-theme-scope="dark"]');
    expect(css).toMatch(/\[data-theme-scope="dark"\] \{[^}]*--gray-a12: #ffffffed;/);
    expect(css).toMatch(/\[data-theme-scope="light"\] \{[^}]*--gray-a12: #000000df;/);
    expect(css).toMatch(/\[data-theme-scope\] \{[^}]*--color-card: var\(--gray-a2\);/);
  });
});
