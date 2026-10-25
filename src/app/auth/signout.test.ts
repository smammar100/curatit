// Logging out of the site ends this browser's session and nothing else: an assistant connected to
// Curatit MCP by OAuth holds its own session for the same account, and must keep it
import { expect, it, vi } from "vitest";

const auth = { signOut: vi.fn() };

vi.mock("next/headers", () => ({ cookies: async () => ({}), headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => ({ auth }) }));
vi.mock("@/lib/analytics-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendWelcomeEmail: vi.fn() }));

const { signOut } = await import("./actions");

it("signs out this browser only, leaving other sessions and connected assistants signed in", async () => {
  auth.signOut.mockResolvedValue({ error: null });
  await expect(signOut()).rejects.toThrow("REDIRECT /signin");
  expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
});
