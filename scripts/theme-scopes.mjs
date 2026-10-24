// Writes src/app/(site)/system/theme-scopes.css: the light and dark tokens again, scoped to an
// element instead of <html>, so the design system page can show a component in both themes
// side by side whichever theme the site is in.
//
// Why it's needed: a token like --color-card is declared on :root as var(--gray-a2), and a
// custom property's var() is resolved where it's declared, so a descendant that redefines
// --gray-a2 still inherits the light --color-card. A scope has to set the primitives (the
// :root and :root[data-theme="dark"] blocks of global.css) and declare every alias again.
//
// Since 2026-10-24 it also scopes Glaze (src/components/glaze/tokens.css) and the bridge that retunes it for
// Fluid Functionalism's type, motion and surfaces (src/styles/glaze-bridge.css). Glaze's dark tokens match
// `[data-theme="dark"] .glaze`, so on a dark site a light panel would read them too; each panel is a .glaze
// element, and a three-attribute selector gives it its own theme's Glaze values with the bridge on top.
//
// The file is generated from global.css, tokens.css and glaze-bridge.css, never edited by hand: run
//   node scripts/theme-scopes.mjs
// after changing any of them. src/lib/themeScopes.test.ts fails while it's out of date.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
export const SOURCE = `${root}src/styles/global.css`;
export const TARGET = `${root}src/app/(site)/system/theme-scopes.css`;
export const GLAZE_SOURCE = `${root}src/components/glaze/tokens.css`;
export const BRIDGE_SOURCE = `${root}src/styles/glaze-bridge.css`;

const GLAZE_LIGHT = '[data-system="glaze"], .glaze';
const GLAZE_DARK =
  '[data-system="glaze"][data-theme="dark"], .glaze[data-theme="dark"], [data-theme="dark"] [data-system="glaze"], [data-theme="dark"] .glaze';
// The bridge's token block sits on Glaze's own light selector (its dark block repeats the same surfaces)
const BRIDGE = GLAZE_LIGHT;

// The declarations directly inside the first block that opens with `opener` (nested blocks,
// like the keyframes inside @theme, are skipped)
function declarations(css, opener) {
  const start = css.indexOf(`${opener} {`);
  if (start < 0) throw new Error(`global.css has no "${opener} {" block`);
  const out = new Map();
  let depth = 0;
  let i = css.indexOf("{", start);
  let line = "";
  for (; i < css.length; i++) {
    const ch = css[i];
    if (ch === "{") {
      depth++;
      line = "";
      continue;
    }
    if (ch === "}") {
      depth--;
      line = "";
      if (depth === 0) break;
      continue;
    }
    if (depth !== 1) continue;
    if (ch === ";") {
      const text = line.trim();
      const colon = text.indexOf(":");
      if (colon > 0) out.set(text.slice(0, colon).trim(), text.slice(colon + 1).trim());
      line = "";
    } else {
      line += ch;
    }
  }
  return out;
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

export function buildThemeScopes(
  source,
  glazeSource = readFileSync(GLAZE_SOURCE, "utf8"),
  bridgeSource = readFileSync(BRIDGE_SOURCE, "utf8"),
) {
  // Comments can hold semicolons and braces; drop them before reading declarations
  const css = stripComments(source);
  const theme = declarations(css, "@theme");
  const light = declarations(css, ":root");
  const dark = declarations(css, ':root[data-theme="dark"]');

  // Every name the dark theme changes, with its light value: from :root, or from @theme for
  // the scales that are plain values there (white, base, accent, danger, …)
  const lightValues = new Map();
  for (const name of dark.keys()) {
    const value = light.get(name) ?? theme.get(name);
    if (value === undefined) throw new Error(`No light value for ${name}`);
    lightValues.set(name, value);
  }
  // Aliases: @theme tokens built from other properties, re-declared so they resolve in the scope,
  // and (since 2026-10-23) the :root properties built the same way that the dark theme leaves
  // alone because their parts flip (Fluid Functionalism's --foreground is var(--gray-a12), its
  // --border a mix of that); the dark block's own are declared in the dark scope already
  const aliases = [
    ...[...theme].filter(([name, value]) => /var\(--/.test(value) && /^--(color-|shadow)/.test(name)),
    ...[...light].filter(([name, value]) => /var\(--/.test(value) && !dark.has(name)),
  ];

  // Glaze: every role its dark theme changes, in each theme, then the bridge's own values (which read the
  // Fluid Functionalism tokens scoped above, so they resolve to the panel's theme)
  const glaze = stripComments(glazeSource);
  const glazeLight = declarations(glaze, GLAZE_LIGHT);
  const glazeDark = declarations(glaze, GLAZE_DARK);
  const bridge = [...declarations(stripComments(bridgeSource), BRIDGE)];
  const glazeLightValues = [...glazeDark.keys()].map((name) => {
    const value = glazeLight.get(name);
    if (value === undefined) throw new Error(`No light Glaze value for ${name}`);
    return [name, value];
  });

  const block = (selector, entries) =>
    `${selector} {\n${entries.map(([n, v]) => `  ${n}: ${v};`).join("\n")}\n}\n`;
  return [
    "/* Generated by scripts/theme-scopes.mjs from src/styles/global.css, src/components/glaze/tokens.css and",
    "   src/styles/glaze-bridge.css. Do not edit: change the tokens there and run `node scripts/theme-scopes.mjs`.",
    "   Loaded by the design system page only. */",
    block('[data-theme-scope="light"]', [...lightValues]),
    block('[data-theme-scope="dark"]', [...dark]),
    block('[data-theme-scope]', [
      ...aliases,
      ["background-color", "var(--color-page)"],
      ["color", "var(--color-primary-foreground)"],
    ]),
    block('.glaze[data-theme-scope="light"][data-theme="light"]', [
      ["color-scheme", "light"],
      ...glazeLightValues,
      ...bridge,
    ]),
    block('.glaze[data-theme-scope="dark"][data-theme="dark"]', [["color-scheme", "dark"], ...glazeDark, ...bridge]),
  ].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(TARGET, buildThemeScopes(readFileSync(SOURCE, "utf8")));
  console.log(`Wrote ${TARGET}`);
}
