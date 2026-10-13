// The onboarding funnel's server steps: the sign-up action records signed_up only for an account
// it just created (and hands that id back so the browser can identify), and the email callback
// records email_confirmed only when the link confirmed the address just now.
import { beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();
const auth = {
  signUp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: async () => ({}),
  headers: async () => new Headers({ host: "localhost:3000", "x-forwarded-proto": "http" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("next/server", async (original) => ({ ...(await original<typeof import("next/server")>()), after: (run: () => unknown) => run() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: () => ({ auth }) }));
vi.mock("@/lib/analytics-server", () => ({ captureServerEvent: (...args: unknown[]) => capture(...args) }));

const { signUp } = await import("./actions");
const { GET } = await import("./callback/route");

const now = () => new Date().toISOString();
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const form = () => {
  const data = new FormData();
  data.set("email", "new@example.com");
  data.set("password", "Strong-pass1");
  return data;
};

beforeEach(() => {
  capture.mockReset();
  for (const fn of Object.values(auth)) fn.mockReset();
});

describe("sign-up", () => {
  it("records a new account that still has to confirm its email, and returns its id", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: "u1", created_at: now(), identities: [{}] }, session: null }, error: null });
    const state = await signUp({}, form());
    expect(state).toEqual({ sent: "new@example.com", userId: "u1" });
    expect(capture).toHaveBeenCalledWith("u1", "signed_up", { confirmation_required: true });
  });

  it("records a new account that's signed in at once, before redirecting", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: "u2", created_at: now(), identities: [{}] }, session: {} }, error: null });
    await expect(signUp({}, form())).rejects.toThrow("REDIRECT /dashboard");
    expect(capture).toHaveBeenCalledWith("u2", "signed_up", { confirmation_required: false });
  });

  it("doesn't count or hand out an older unconfirmed account whose link was just resent", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: "old", created_at: ago(60), identities: [{}] }, session: null }, error: null });
    const state = await signUp({}, form());
    expect(state).toEqual({ sent: "new@example.com", userId: undefined });
    expect(capture).not.toHaveBeenCalled();
  });

  it("doesn't count an address that already has an account", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: "stand-in", created_at: now(), identities: [] }, session: null }, error: null });
    const state = await signUp({}, form());
    expect(state.userId).toBeUndefined();
    expect(capture).not.toHaveBeenCalled();
  });
});

describe("the email link", () => {
  const request = (query: string) => new Request(`http://localhost:3000/auth/callback?${query}`) as unknown as Parameters<typeof GET>[0];
  // NextRequest's nextUrl, which the route reads, built the way Next would
  const withNextUrl = (query: string) => Object.assign(request(query), { nextUrl: new URL(`http://localhost:3000/auth/callback?${query}`) });

  it("records a confirmation made by this link", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { user: { id: "u1", email_confirmed_at: now() } }, error: null });
    const response = await GET(withNextUrl("code=abc&next=%2Fdashboard"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    expect(capture).toHaveBeenCalledWith("u1", "email_confirmed", { via: "code" });
  });

  it("doesn't count a password reset for an address confirmed long ago", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { user: { id: "u1", email_confirmed_at: ago(60 * 24) } }, error: null });
    await GET(withNextUrl("code=abc&next=%2Freset-password"));
    expect(capture).not.toHaveBeenCalled();
  });

  it("records nothing when the link fails", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ data: { user: null, session: null }, error: { code: "otp_expired" } });
    const response = await GET(withNextUrl("code=abc"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/signin?error=otp_expired");
    expect(capture).not.toHaveBeenCalled();
  });

  it("records a confirmation through a token link too", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: { id: "u3", email_confirmed_at: now() } }, error: null });
    await GET(withNextUrl("token_hash=t&type=signup"));
    expect(capture).toHaveBeenCalledWith("u3", "email_confirmed", { via: "signup" });
  });
});
