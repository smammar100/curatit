"use client";

// Personal access tokens for MCP clients and the stdio bridge (/dashboard/settings/tokens). Like
// the rest of the dashboard, the page is a static shell and the data loads in the browser as the
// signed-in person, under Row Level Security: their own rows of public.api_tokens. A new token
// is made here too: the secret is generated in the browser, its SHA-256 goes to the table, and
// the secret is shown once, so the server never holds it. Revoking sets revoked_at.

import { useEffect, useState, type FormEvent } from "react";
import Button from "@/components/fundations/elements/Button";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import { createClient } from "@/utils/supabase/client";
import { cx } from "@/lib/cx";
import { hashToken, mintToken, PAT_DEFAULT_DAYS, PAT_MAX_DAYS } from "@/lib/mcp/auth/pat";
import { SCOPES, type Scope } from "@/lib/mcp/config";

type TokenRow = { id: string; name: string; prefix: string; scopes: string[]; expires_at: string; last_used_at: string | null; revoked_at: string | null; created_at: string };

const SCOPE_HELP: Record<Scope, string> = {
  "curatit:read": "Search the library, read posts, carousels and images",
  "curatit:brief": "Create grounded creative briefs",
};

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null);

export default function ApiTokens() {
  const [tokens, setTokens] = useState<TokenRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Scope[]>(["curatit:read", "curatit:brief"]);
  const [days, setDays] = useState(PAT_DEFAULT_DAYS);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<{ secret: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const { data, error } = await createClient().from("api_tokens").select("id, name, prefix, scopes, expires_at, last_used_at, revoked_at, created_at").order("created_at", { ascending: false });
    if (error) setError("Your tokens couldn't be loaded. Reload the page to try again.");
    else setTokens(data as TokenRow[]);
  };
  useEffect(() => {
    void load();
  }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return setError("Give the token a name, like the app it's for.");
    if (!scopes.length) return setError("Choose at least one scope.");
    setBusy(true);
    try {
      const token = await mintToken();
      const expires = new Date(Date.now() + days * 86_400_000).toISOString();
      const { error } = await createClient().from("api_tokens").insert({ name: trimmed, prefix: token.prefix, token_hash: await hashToken(token.secret), scopes, expires_at: expires });
      if (error) throw error;
      setFresh({ secret: token.secret, name: trimmed });
      setName("");
      await load();
    } catch {
      setError("The token couldn't be created. Try again, and contact support if it keeps happening.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (token: TokenRow) => {
    if (!confirm(`Revoke "${token.name}"? Anything using it stops working at once.`)) return;
    const { error } = await createClient().from("api_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", token.id);
    if (error) setError("The token couldn't be revoked. Try again.");
    else await load();
  };

  const copy = async () => {
    if (!fresh) return;
    await navigator.clipboard.writeText(fresh.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-24 sm:px-6">
      <h1 className="font-display text-display font-light text-base-900">API tokens</h1>
      <p className="mt-2 max-w-prose text-pretty text-base-600">
        A personal access token lets an MCP client or the Curatit bridge search the library as you. Keep it like a password: it&apos;s shown once, and anything with it can read what you can. Tokens expire and can be revoked here.
      </p>

      {fresh && (
        <section aria-live="polite" className="mt-6 rounded-2xl bg-base-50 p-4 ring-1 ring-base-200">
          <p className="text-subtitle font-medium text-base-900">Your new token &ldquo;{fresh.name}&rdquo;</p>
          <p className="mt-1 text-caption text-base-600">Copy it now. It won&apos;t be shown again.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-caption text-base-900 ring-1 ring-base-200">{fresh.secret}</code>
            <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy token"} className="flex size-11 shrink-0 items-center justify-center rounded-full text-base-900 ring-1 ring-base-200 hover:bg-base-50">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
          <button type="button" onClick={() => setFresh(null)} className="mt-3 text-caption text-base-600 underline underline-offset-2 hover:text-base-900">
            I&apos;ve saved it
          </button>
        </section>
      )}

      <form onSubmit={create} className="mt-8 rounded-2xl bg-white p-4 ring-1 ring-base-200 sm:p-5">
        <h2 className="text-title font-medium text-base-900">New token</h2>
        <label htmlFor="token-name" className="mt-4 block text-caption font-medium text-base-600">
          Name
        </label>
        <input id="token-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Claude Desktop on my laptop" autoComplete="off" spellCheck={false} className="mt-1 block h-11 w-full rounded-lg bg-white px-3 text-body text-base-900 ring-1 ring-base-200 placeholder:text-base-400 focus:ring-2 focus:ring-base-400 focus:outline-none pointer-coarse:text-[16px]" />
        <fieldset className="mt-4">
          <legend className="text-caption font-medium text-base-600">Scopes</legend>
          {SCOPES.map((scope) => (
            <label key={scope} className="mt-2 flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={scopes.includes(scope)} onChange={(e) => setScopes((s) => (e.target.checked ? [...s, scope] : s.filter((x) => x !== scope)))} className="mt-1 size-4 rounded border-base-300 text-accent-600 focus:ring-base-400" />
              <span>
                <code className="font-mono text-caption text-base-900">{scope}</code>
                <span className="block text-caption text-base-600">{SCOPE_HELP[scope]}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <label htmlFor="token-days" className="mt-4 block text-caption font-medium text-base-600">
          Expires in
        </label>
        <select id="token-days" value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-1 block h-11 rounded-lg bg-white px-3 text-body text-base-900 ring-1 ring-base-200 focus:ring-2 focus:ring-base-400 focus:outline-none pointer-coarse:text-[16px]">
          {[30, 90, 180, PAT_MAX_DAYS].map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
        </select>
        {error && (
          <p role="alert" className="mt-4 text-caption text-danger-600">
            {error}
          </p>
        )}
        <Button type="submit" size="sm" variant="default" className="mt-5" disabled={busy}>
          {busy ? "Creating…" : "Create token"}
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="text-title font-medium text-base-900">Your tokens</h2>
        {tokens === null && !error && <p className="mt-2 text-caption text-base-600">Loading…</p>}
        {tokens && tokens.length === 0 && <p className="mt-2 text-caption text-base-600">None yet.</p>}
        <ul className="mt-3 space-y-2">
          {tokens?.map((token) => {
            const expired = new Date(token.expires_at).getTime() < Date.now();
            const dead = Boolean(token.revoked_at) || expired;
            return (
              <li key={token.id} className={cx("flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-base-200", dead && "opacity-60")}>
                <div className="min-w-0">
                  <p className="text-subtitle font-medium text-base-900">
                    {token.name} <code className="ml-1 font-mono text-micro text-base-500">{token.prefix}…</code>
                  </p>
                  <p className="text-caption text-base-600">
                    {token.scopes.join(", ")} · {token.revoked_at ? `revoked ${when(token.revoked_at)}` : expired ? `expired ${when(token.expires_at)}` : `expires ${when(token.expires_at)}`}
                    {token.last_used_at ? ` · last used ${when(token.last_used_at)}` : " · never used"}
                  </p>
                </div>
                {!dead && (
                  <Button type="button" size="xs" variant="muted" onClick={() => revoke(token)}>
                    Revoke
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
