// One deadline per tool call. executeTool runs the call inside runWithDeadline, which keeps an
// AbortSignal in AsyncLocalStorage; the catalog client and the media fetches combine it with
// their own per-request timeouts, so when the budget runs out (or the caller hangs up) every
// request still in flight is aborted, and none is retried behind the caller's back. The call
// itself settles at the deadline even if something it awaits ignores the signal.
//
// Server-only: it uses node:async_hooks, so nothing a browser bundle imports may import it.

import { AsyncLocalStorage } from "node:async_hooks";
import { CuratitError } from "./errors";

// What a tool call may take, end to end. The routes allow 60 s (maxDuration), so a call that
// waits the limiter's 1.5 s and then its whole budget still answers with an envelope
export const CALL_BUDGET_MS = 25_000;

type Deadline = {
  signal: AbortSignal;
  // When the budget runs out, in Date.now() milliseconds
  expiresAt: number;
  // The last stage that started (resolvePost, get_post_v2, probe…), for the log when time runs out
  stage: string | null;
};

const store = new AsyncLocalStorage<Deadline>();

// The signal of the deadline the caller is running under, if any
export function currentSignal(): AbortSignal | undefined {
  return store.getStore()?.signal;
}

// Milliseconds left before the deadline; Infinity outside one
export function remainingMs(): number {
  const deadline = store.getStore();
  return deadline ? Math.max(0, deadline.expiresAt - Date.now()) : Infinity;
}

// Notes which stage of the call is running, so a timeout can say where it stopped
export function markStage(stage: string) {
  const deadline = store.getStore();
  if (deadline) deadline.stage = stage;
}

// Combines a per-request timeout with the deadline's signal and any other signals given
export function withDeadline(timeoutMs: number, ...others: (AbortSignal | null | undefined)[]): AbortSignal {
  const signals = [AbortSignal.timeout(timeoutMs), currentSignal(), ...others].filter((s): s is AbortSignal => Boolean(s));
  return signals.length === 1 ? signals[0] : AbortSignal.any(signals);
}

// Runs fn with a budget of `ms`, cut short when `parent` aborts (the HTTP request going away) or
// an enclosing deadline ends. Rejects with TIMEOUT when the budget runs out first.
export async function runWithDeadline<T>(ms: number, parent: AbortSignal | null | undefined, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const outer = store.getStore();
  const budget = AbortSignal.timeout(ms);
  const signal = AbortSignal.any([budget, ...(parent ? [parent] : []), ...(outer ? [outer.signal] : [])]);
  const deadline: Deadline = { signal, expiresAt: Math.min(Date.now() + ms, outer?.expiresAt ?? Infinity), stage: null };

  let onAbort: () => void = () => {};
  const stopped = new Promise<never>((_, reject) => {
    onAbort = () => reject(stoppedError(budget, parent, ms, deadline.stage));
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
  // Settled by the race below; this only keeps a late rejection from going unhandled
  stopped.catch(() => {});

  try {
    return await Promise.race([store.run(deadline, () => fn(signal)), stopped]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}

function stoppedError(budget: AbortSignal, parent: AbortSignal | null | undefined, ms: number, stage: string | null) {
  const cause = { stage, message: budget.aborted ? `deadline of ${ms} ms passed` : "the request was cancelled" };
  if (parent?.aborted && !budget.aborted) return new CuratitError("TIMEOUT", "The request was cancelled before it finished.", { cause });
  return new CuratitError("TIMEOUT", `The request took longer than ${Math.round(ms / 1000)} seconds and was stopped. Try again, or ask for less (a narrower search, fewer references).`, { cause });
}
