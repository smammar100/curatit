"use client";

// Personal access tokens for MCP clients and the stdio bridge (/dashboard/settings/tokens). Like
// the rest of the dashboard, the page is a static shell and the data loads in the browser as the
// signed-in person, under Row Level Security: their own rows of public.api_tokens. A new token
// is made here too: the secret is generated in the browser, its SHA-256 goes to the table, and
// the secret is shown once, so the server never holds it. Revoking sets revoked_at.
//
// The "Ledger" direction, chosen from a three-way prototype on 2026-10-12 (after Tailscale's keys
// page and Hashnode's token page on Mobbin): the dashboard header on top, the title with the one
// action beside it, "New token" opening an inline panel above the table (name, expiry as a
// segmented control, the scopes as two cards), the new secret taking that panel over as a "Keep
// it safe" banner (after Gamma's reveal), and every token as a row: name and prefix, scope chips,
// expiry (or when it died), last used, Revoke. Dead rows are dimmed. On phones the table scrolls
// sideways. Rejected: "Cards" (each token a card saying in words what it can do, create and
// reveal in one native dialog; tallest with many tokens) and "Setup" (the token beside the client
// configuration it goes into, the new secret written straight into the snippet; one motion, but
// it duplicated /docs/mcp and put the secret inside text that's easy to paste in the wrong place).

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/fundations/elements/Button";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import Key from "@/components/fundations/icons/Key";
import { createClient } from "@/utils/supabase/client";
import { cx } from "@/lib/cx";
import Segmented from "@/components/fundations/elements/Segmented";
import {
  hashToken,
  mintToken,
  PAT_DEFAULT_DAYS,
  PAT_MAX_DAYS,
} from "@/lib/mcp/auth/pat";
import { SCOPES, type Scope } from "@/lib/mcp/config";
import { track } from "@/lib/analytics";
import { feedHref } from "./Feed";
import Header from "./Header";

type TokenRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expires_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const SCOPE_WORDS: Record<Scope, { short: string; long: string }> = {
  "curatit:read": {
    short: "Read",
    long: "Search the library, read posts, carousels and images",
  },
  "curatit:brief": { short: "Briefs", long: "Create grounded creative briefs" },
};
const EXPIRY_DAYS = [30, 90, 180, PAT_MAX_DAYS];

const DAY = 86_400_000;
const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);

type Status = "active" | "expiring" | "expired" | "revoked";
function statusOf(token: TokenRow): Status {
  if (token.revoked_at) return "revoked";
  const days = daysUntil(token.expires_at);
  if (days <= 0) return "expired";
  if (days <= 7) return "expiring";
  return "active";
}
const isDead = (status: Status) => status === "expired" || status === "revoked";

export default function ApiTokens() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tokens, setTokens] = useState<TokenRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState<{ secret: string; name: string } | null>(
    null,
  );

  const load = async () => {
    const { data, error } = await createClient()
      .from("api_tokens")
      .select(
        "id, name, prefix, scopes, expires_at, last_used_at, revoked_at, created_at",
      )
      .order("created_at", { ascending: false });
    if (error)
      setLoadError(
        "Your tokens couldn't be loaded. Reload the page to try again.",
      );
    else setTokens(data as TokenRow[]);
  };
  useEffect(() => {
    void load();
  }, []);

  const create = async (name: string, scopes: Scope[], days: number) => {
    const token = await mintToken();
    const expires = new Date(Date.now() + days * DAY).toISOString();
    const { error } = await createClient()
      .from("api_tokens")
      .insert({
        name,
        prefix: token.prefix,
        token_hash: await hashToken(token.secret),
        scopes,
        expires_at: expires,
      });
    if (error) throw error;
    track("api_token_created", {
      expiry_days: days,
      scope_count: scopes.length,
    });
    setFresh({ secret: token.secret, name });
    setOpen(false);
    await load();
  };

  const revoke = async (token: TokenRow) => {
    if (
      !confirm(
        `Revoke "${token.name}"? Anything using it stops working at once.`,
      )
    )
      return;
    const { error } = await createClient()
      .from("api_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", token.id);
    if (error) setLoadError("The token couldn't be revoked. Try again.");
    else {
      track("api_token_revoked", { scope_count: token.scopes.length });
      await load();
    }
  };

  const live = tokens?.filter((token) => !isDead(statusOf(token))).length ?? 0;

  return (
    <div className="min-h-dvh bg-white">
      <Header
        view={null}
        onView={(view) => router.push(feedHref(view))}
        query={query}
        onQuery={setQuery}
        onSearch={(text) => router.push(feedHref("For you", text))}
      />
      <main className="w-full max-w-5xl px-4 pt-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-display font-light text-base-900">
              API tokens
            </h1>
            <p className="mt-1 max-w-prose text-pretty text-base-600">
              A token lets an MCP client or the Curatit bridge use the library
              as you. It&apos;s shown once; anything with it can read what you
              can.
            </p>
          </div>
          {!open && !fresh && (
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => setOpen(true)}
            >
              New token
            </Button>
          )}
        </div>

        {fresh && (
          <Reveal
            secret={fresh.secret}
            name={fresh.name}
            onClose={() => setFresh(null)}
          />
        )}
        {open && (
          <CreatePanel onCreate={create} onCancel={() => setOpen(false)} />
        )}

        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-title font-medium text-base-900">
              Your tokens
            </h2>
            {tokens && tokens.length > 0 && (
              <p className="text-caption text-base-500 tabular-nums">
                {live} active · {tokens.length - live} inactive
              </p>
            )}
          </div>
          {loadError && (
            <p role="alert" className="mt-3 text-caption text-danger-600">
              {loadError}
            </p>
          )}
          {tokens === null && !loadError ? (
            <p className="mt-3 text-caption text-base-600">Loading…</p>
          ) : tokens && tokens.length === 0 ? (
            <div className="mt-3 rounded-2xl bg-base-50 px-6 py-14 text-center">
              <p className="text-subtitle font-medium text-base-900">
                No tokens yet
              </p>
              <p className="mx-auto mt-1 max-w-sm text-caption text-base-600">
                Make one for each app you connect, so you can revoke them one at
                a time.
              </p>
              {!open && (
                <Button
                  type="button"
                  size="xs"
                  variant="default"
                  className="mt-4"
                  onClick={() => setOpen(true)}
                >
                  New token
                </Button>
              )}
            </div>
          ) : tokens ? (
            <div className="mt-3 overflow-x-auto rounded-2xl ring-1 ring-base-200">
              <table className="w-full min-w-[40rem] border-collapse text-left">
                <thead>
                  <tr className="text-micro font-medium tracking-wide text-base-500 uppercase">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Scopes</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Last used</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <Row
                      key={token.id}
                      token={token}
                      onRevoke={() => revoke(token)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

// The new secret, shown this once in place of the create panel
function Reveal({
  secret,
  name,
  onClose,
}: {
  secret: string;
  name: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the text is selectable
    }
  };
  return (
    <section
      aria-live="polite"
      className="mt-6 rounded-2xl bg-base-50 p-5 ring-1 ring-base-200"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-base-900 ring-1 ring-edge">
          <Key className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-title font-medium text-base-900">Keep it safe</p>
          <p className="mt-0.5 text-caption text-base-600">
            This is your token for <span className="text-base-900">{name}</span>
            . Copy it now; it won&apos;t be shown again.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2.5 font-mono text-caption leading-relaxed break-all text-base-900 ring-1 ring-base-200 select-all">
              {secret}
            </code>
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy token"}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-base-900 ring-1 ring-base-200 transition-[background-color,scale] duration-150 hover:bg-base-50 active:scale-[0.96]"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
            <span role="status" className="sr-only">
              {copied ? "Copied" : ""}
            </span>
          </div>
          <div className="mt-3">
            <Button type="button" size="xs" variant="muted" onClick={onClose}>
              Close and hide forever
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CreatePanel({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string, scopes: Scope[], days: number) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Scope[]>([...SCOPES]);
  const [days, setDays] = useState(PAT_DEFAULT_DAYS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed)
      return setError("Give the token a name, like the app it's for.");
    if (!scopes.length) return setError("Choose at least one scope.");
    setError(null);
    setBusy(true);
    try {
      await onCreate(trimmed, scopes, days);
    } catch {
      setError(
        "The token couldn't be created. Try again, and contact support if it keeps happening.",
      );
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-base-200"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <label
            htmlFor="token-name"
            className="text-caption font-medium text-base-600"
          >
            Name
          </label>
          <input
            id="token-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="The app or machine it's for"
            autoComplete="off"
            spellCheck={false}
            className="mt-1 block h-11 w-full rounded-lg bg-white px-3 text-body text-base-900 ring-1 ring-base-200 placeholder:text-base-400 focus:ring-2 focus:ring-base-400 focus:outline-none pointer-coarse:text-[16px]"
          />
        </div>
        <div>
          <p
            id="token-days-label"
            className="text-caption font-medium text-base-600"
          >
            Expires in
          </p>
          <Segmented
            aria-labelledby="token-days-label"
            size="lg"
            shape="pill"
            className="mt-1"
            value={String(days)}
            onValueChange={(value) => setDays(Number(value))}
            options={EXPIRY_DAYS.map((d) => ({ value: String(d), label: `${d} days` }))}
          />
        </div>
      </div>
      <fieldset className="mt-4">
        <legend className="text-caption font-medium text-base-600">
          Scopes
        </legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {SCOPES.map((scope) => {
            const on = scopes.includes(scope);
            return (
              <label
                key={scope}
                className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 ring-1 transition-colors duration-150",
                  on ? "ring-base-900" : "ring-base-200 hover:ring-base-300",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) =>
                    setScopes((s) =>
                      e.target.checked
                        ? [...s, scope]
                        : s.filter((x) => x !== scope),
                    )
                  }
                  className="mt-0.5 size-4 rounded border-base-300 text-accent-600 focus:ring-base-400"
                />
                <span className="min-w-0">
                  <span className="block text-subtitle font-medium text-base-900">
                    {SCOPE_WORDS[scope].short}
                  </span>
                  <span className="block text-caption text-base-600">
                    {SCOPE_WORDS[scope].long}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="mt-3 text-caption text-danger-600">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <Button type="submit" size="sm" variant="default" disabled={busy}>
          {busy ? "Creating…" : "Create token"}
        </Button>
        <Button type="button" size="sm" variant="muted" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Row({ token, onRevoke }: { token: TokenRow; onRevoke: () => void }) {
  const status = statusOf(token);
  const dead = isDead(status);
  const days = daysUntil(token.expires_at);
  return (
    <tr
      className={cx(
        "border-t border-base-100 text-body",
        dead && "text-base-500",
      )}
    >
      <td className="max-w-[22rem] px-4 py-3">
        <p
          className={cx(
            "truncate font-medium",
            dead ? "text-base-500" : "text-base-900",
          )}
          title={token.name}
        >
          {token.name}
        </p>
        <p className="font-mono text-micro text-base-500">{token.prefix}…</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {token.scopes.map((scope) => (
            <span
              key={scope}
              className="rounded-md bg-base-100 px-1.5 py-0.5 font-mono text-micro text-base-700"
            >
              {scope.replace("curatit:", "")}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
        {status === "revoked" ? (
          `Revoked ${when(token.revoked_at)}`
        ) : status === "expired" ? (
          `Expired ${when(token.expires_at)}`
        ) : status === "expiring" ? (
          <span className="text-accent-700">
            in {days === 1 ? "1 day" : `${days} days`}
          </span>
        ) : (
          when(token.expires_at)
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
        {when(token.last_used_at) ?? "Never"}
      </td>
      <td className="px-4 py-3 text-right">
        {!dead && (
          <Button type="button" size="xs" variant="muted" onClick={onRevoke}>
            Revoke
          </Button>
        )}
      </td>
    </tr>
  );
}
