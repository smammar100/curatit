import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for the library code (src/lib/**) and the post page's breakdown components (.tsx,
// in a DOM). `@/` resolves as it does in the app.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Component tests (.test.tsx) opt into a DOM with `// @vitest-environment happy-dom`
  test: { include: ["src/**/*.test.{ts,tsx}"], environment: "node" },
  oxc: { jsx: { runtime: "automatic" } },
});
