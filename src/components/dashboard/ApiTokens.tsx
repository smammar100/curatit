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
// it safe" card (after Gamma's reveal), and every token as a row: name and prefix, scope badges,
// expiry (or when it died), last used, Revoke. Dead rows are dimmed. On phones the table scrolls
// sideways. Rejected: "Cards" (each token a card saying in words what it can do, create and
// reveal in one native dialog; tallest with many tokens) and "Setup" (the token beside the client
// configuration it goes into, the new secret written straight into the snippet; one motion, but
// it duplicated /docs/mcp and put the secret inside text that's easy to paste in the wrong place).
//
// Since 2026-10-24 it is built from Glaze: the panels are Cards (the create form's actions in its
// footer), the name a Field round an Input, the expiry a SegmentedControl, the scopes labelled
// Checkboxes on bordered tiles, errors fail Alerts, the wait Skeleton lines, no tokens an Empty,
// the secret a code well beside a CopyButton, Revoke asks in an alertdialog, and Create token
// shows the Button's pending arc. The table stays hand-built (Glaze's Table isn't installed) on
// Glaze's tokens.

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle } from "@/components/glaze/ui/alert";
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/glaze/ui/card";
import { Checkbox } from "@/components/glaze/ui/checkbox";
import { CopyButton } from "@/components/glaze/ui/copy-button";
import { Dialog, DialogAction, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/glaze/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/glaze/ui/empty-state";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/glaze/ui/field";
import { Input } from "@/components/glaze/ui/input";
import { SegmentedControl, SegmentedControlItem } from "@/components/glaze/ui/segmented-control";
import { Skeleton } from "@/components/glaze/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { cx } from "@/lib/cx";
import { hashToken, mintToken, PAT_DEFAULT_DAYS, PAT_MAX_DAYS } from "@/lib/mcp/auth/pat";
import { SCOPES, type Scope } from "@/lib/mcp/config";
import { track } from "@/lib/analytics";
import { feedHref } from "./Feed";
import Header from "./Header";
import { TokensArt } from "./EmptyArt";

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
const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);

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
  const [fresh, setFresh] = useState<{ secret: string; name: string } | null>(null);
  // The token Revoke is asking about: kept while the question closes, so its name doesn't blank
  const [target, setTarget] = useState<TokenRow | null>(null);
  const [asking, setAsking] = useState(false);

  const load = async () => {
    const { data, error } = await createClient()
      .from("api_tokens")
      .select("id, name, prefix, scopes, expires_at, last_used_at, revoked_at, created_at")
      .order("created_at", { ascending: false });
    if (error) setLoadError("Your tokens couldn't be loaded. Reload the page to try again.");
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
    <div className="min-h-dvh bg-page">
      <Header
        view={null}
        onView={(view) => router.push(feedHref(view))}
        query={query}
        onQuery={setQuery}
        onSearch={(text) => router.push(feedHref("For you", text))}
      />
      <main className="w-full px-4 pt-4 pb-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="type-title text-text-1">API tokens</h1>
            <p className="mt-1 max-w-measure type-body text-pretty text-text-2">
              A token lets an MCP client or the Curatit bridge use the library as you. It&apos;s shown once; anything with it can read what you can.
            </p>
          </div>
          {!open && !fresh && <Button onClick={() => setOpen(true)}>New token</Button>}
        </div>

        {fresh && <Reveal secret={fresh.secret} name={fresh.name} onClose={() => setFresh(null)} />}
        {open && <CreatePanel onCreate={create} onCancel={() => setOpen(false)} />}

        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="type-heading text-text-1">Your tokens</h2>
            {tokens && tokens.length > 0 && (
              <p className="type-caption text-text-2 tabular-nums">
                {live} active · {tokens.length - live} inactive
              </p>
            )}
          </div>
          {loadError && (
            <Alert status="fail" className="mt-3">
              <AlertTitle>{loadError}</AlertTitle>
            </Alert>
          )}
          {tokens === null && !loadError ? (
            <div role="status" aria-label="Loading your tokens" className="mt-3 space-y-2.5">
              <Skeleton className="h-3.5 w-1/3 rounded-pill" />
              <Skeleton className="h-3.5 w-1/2 rounded-pill" />
              <Skeleton className="h-3.5 w-1/4 rounded-pill" />
            </div>
          ) : tokens && tokens.length === 0 ? (
            <Empty className="mt-3">
              <TokensArt className="w-60" />
              <EmptyHeader>
                <EmptyTitle icon={false}>No tokens yet</EmptyTitle>
                <EmptyDescription>Make one for each app you connect, so you can revoke them one at a time.</EmptyDescription>
              </EmptyHeader>
              {!open && (
                <EmptyContent>
                  <Button size="sm" onClick={() => setOpen(true)}>
                    New token
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : tokens ? (
            <div className="mt-3 overflow-x-auto rounded-panel border border-line-faint">
              <table className="w-full min-w-160 border-collapse text-left">
                <thead>
                  <tr className="type-label-sm text-text-2">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Scopes</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Last used</th>
                    <th className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <Row
                      key={token.id}
                      token={token}
                      onRevoke={() => {
                        setTarget(token);
                        setAsking(true);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>

      {/* Revoke asks first: Cancel takes focus, so Enter can't revoke by accident */}
      <Dialog open={asking} onOpenChange={setAsking} role="alertdialog">
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{`Revoke "${target?.name ?? ""}"?`}</DialogTitle>
            <DialogDescription>Anything using it stops working at once.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <DialogAction
              variant="destructive"
              onAction={() => {
                if (target) void revoke(target);
              }}
            >
              Revoke
            </DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// The new secret, shown this once in place of the create panel: a Card with the secret in a code
// well beside its CopyButton, and the one way to close it in the footer
function Reveal({ secret, name, onClose }: { secret: string; name: string; onClose: () => void }) {
  return (
    <Card aria-live="polite" className="mt-6">
      <CardHeader>
        <CardTitle>Keep it safe</CardTitle>
        <CardDescription>
          This is your token for <span className="text-text-1">{name}</span>. Copy it now; it won&apos;t be shown again.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 rounded-panel well px-3 py-2.5 type-code-block break-all text-text-1 select-all">{secret}</code>
          <CopyButton value={secret} label="token" variant="secondary" size="icon" />
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close and hide forever
        </Button>
      </CardFooter>
    </Card>
  );
}

function CreatePanel({ onCreate, onCancel }: { onCreate: (name: string, scopes: Scope[], days: number) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Scope[]>([...SCOPES]);
  const [days, setDays] = useState(PAT_DEFAULT_DAYS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Give the token a name, like the app it's for.");
    if (!scopes.length) return setError("Choose at least one scope.");
    setError(null);
    setBusy(true);
    try {
      await onCreate(trimmed, scopes, days);
    } catch {
      setError("The token couldn't be created. Try again, and contact support if it keeps happening.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6">
      <Card role="group" aria-labelledby="new-token-title">
        <CardHeader>
          <CardTitle id="new-token-title">New token</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                autoFocus
                value={name}
                onValueChange={setName}
                maxLength={80}
                placeholder="The app or machine it's for"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <FieldSet>
              <FieldLegend variant="label">Expires in</FieldLegend>
              <SegmentedControl aria-label="Expires in" value={String(days)} onValueChange={(value) => setDays(Number(value))}>
                {EXPIRY_DAYS.map((d) => (
                  <SegmentedControlItem key={d} value={String(d)}>
                    {`${d} days`}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </FieldSet>
          </div>
          <FieldSet className="mt-4">
            <FieldLegend variant="label">Scopes</FieldLegend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCOPES.map((scope) => {
                const on = scopes.includes(scope);
                return (
                  // The tile is its label, so a tap anywhere on it flips the box; the one that's on
                  // sits on the pressed wash
                  <label
                    key={scope}
                    className={cx(
                      "flex cursor-pointer items-start gap-3 rounded-panel border border-line-faint p-3 transition-colors duration-(--dur-state) ease-out",
                      on ? "bg-pressed" : "hover:bg-hover",
                    )}
                  >
                    <Checkbox
                      checked={on}
                      onCheckedChange={(checked) => setScopes((s) => (checked ? [...s, scope] : s.filter((x) => x !== scope)))}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block type-label text-text-1">{SCOPE_WORDS[scope].short}</span>
                      <span className="block type-caption text-text-2">{SCOPE_WORDS[scope].long}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </FieldSet>
          {error && (
            <Alert status="fail" className="mt-3">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" pending={busy} pendingLabel="Creating">
            Create token
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function Row({ token, onRevoke }: { token: TokenRow; onRevoke: () => void }) {
  const status = statusOf(token);
  const dead = isDead(status);
  const days = daysUntil(token.expires_at);
  return (
    <tr className={cx("border-t border-line-faint type-body-sm", dead ? "text-text-2" : "text-text-1")}>
      <td className="max-w-88 px-4 py-3">
        <p className={cx("truncate type-label", dead ? "text-text-2" : "text-text-1")} title={token.name}>
          {token.name}
        </p>
        <p className="type-caption text-text-2">
          <span className="mono">{token.prefix}</span>…
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {token.scopes.map((scope) => (
            <Badge key={scope} size="sm">
              {scope.replace("curatit:", "")}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
        {status === "revoked" ? (
          `Revoked ${when(token.revoked_at)}`
        ) : status === "expired" ? (
          `Expired ${when(token.expires_at)}`
        ) : status === "expiring" ? (
          // Soon: the ink, heavier, so it stands out in words rather than a colour
          <span className="type-label text-text-1">in {days === 1 ? "1 day" : `${days} days`}</span>
        ) : (
          when(token.expires_at)
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap tabular-nums">{when(token.last_used_at) ?? "Never"}</td>
      <td className="px-4 py-3 text-right">
        {!dead && (
          <Button size="sm" variant="secondary" onClick={onRevoke}>
            Revoke
          </Button>
        )}
      </td>
    </tr>
  );
}
