import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for the library code (src/lib/**) and the post page's breakdown components (.tsx,
// in a DOM). `@/` resolves as it does in the app.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Component tests (.test.tsx) opt into a DOM with `// @vitest-environment happy-dom`
  // tests/mcp holds the live integration checks (skipped without a database); packages/* the
  // bridge and the model adapter
  test: { include: ["src/**/*.test.{ts,tsx}", "packages/*/src/**/*.test.ts", "tests/**/*.test.ts"], environment: "node" },
  oxc: { jsx: { runtime: "automatic" } },
});
