import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for the library code (src/lib/**). `@/` resolves as it does in the app.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
