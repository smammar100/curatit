"use client";

// Toast: a short message after something the person just did, that leaves on its own. "Saved to
// Moodboard", "Link copied", "Removed from Moodboard" with Undo, or the failure of a background
// write that nothing else on screen would show ("Couldn't save to Moodboard. Try again.").
//
// Use instead:
//  - anything that must stay until it's dealt with, or that belongs to a place on the page (a
//    form's server error, a state like "Sharing is off"): a Notice, beside what it's about
//  - a problem with one field: the Field's error under it
//  - a question that needs an answer: a Dialog. Inside an open Dialog, use a Notice there: the
//    dialog sits in the top layer, over the toast
//  - an empty place: an EmptyState
//
// Wrap the app (or an area of it) in one <ToastProvider>; call `useToast()` beneath it:
//
//   const { toast, dismiss } = useToast();
//   const id = toast({ message: "Removed from Moodboard", action: { label: "Undo", onClick: restore } });
//
// Tones (closed, default neutral): neutral (it's done: a check) and danger (it failed: a warning
// icon, "Error:" for screen readers, read out assertively). Nothing else: a warning or a success
// that must stay is a Notice.
//
// One toast at a time. A new one waits in a queue of three (the oldest dropped beyond that) and
// replaces the one on screen as soon as that one has been seen for 1.5s: the on-screen one plays
// its exit, then the next enters. So the newest gets its full time and a burst still shows each
// briefly. Each stays for its reading time, `toastDuration()`: 250 words a minute plus 1.5s,
// clamped to 2.5–8s, 4s at least for danger and 5s at least with an action, unless `duration`
// (ms) is given. Its clock
// (and any replacement) stops while it's pointed at, while focus is in it and while the tab is
// hidden, and runs on with the time it had left. Escape dismisses it while focus is inside, and
// focus goes back where it came from.
//
// The region is fixed at the bottom centre, 24px above the screen's safe area, and stays
// mounted: two live regions (polite, and assertive for danger), so every toast is announced.
// It enters with animate-toast-in and leaves with animate-toast-out (held by usePresence);
// under reduced motion it appears and goes at once.
//
// An action is a shortcut (Undo, View board), never the only way to do something: a toast can
// leave before a keyboard or screen reader user gets to it.
//
// Copy: past tense, what happened, the thing named: "Saved to Moodboard", not "Success!". A
// failure says what to do: "Couldn't save to Moodboard. Check your connection and try again."
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import Check from "@/components/fundations/icons/Check";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import { cx } from "@/lib/cx";
import { usePresence } from "@/lib/motion";

export type ToastTone = "neutral" | "danger";
export type ToastAction = { label: string; onClick: () => void };
export type ToastOptions = {
  /** One or two short sentences: what happened, and what to do if it failed */
  message: string;
  /** Defaults to neutral */
  tone?: ToastTone;
  /** One shortcut, shown as a text button: Undo, View board */
  action?: ToastAction;
  /** How long it stays, in ms. Leave it out: the reading time is worked out from the words */
  duration?: number;
};

// How long the exit runs (animate-toast-out is 120ms), how many toasts may wait, and how long the
// one on screen is seen before a waiting one replaces it
const EXIT_MS = 120;
const QUEUE_MAX = 3;
const SEEN_MS = 1500;

/** How long a toast stays: 250 words a minute (240ms a word, the action's label counted) plus
 *  1.5s to notice it, clamped to 2.5–8s; a failure 4s at least (it's unexpected, and says what
 *  to do: the dashboard's error toasts always had 4s), and with an action 5s at least, to reach it */
export function toastDuration({ message, action, tone }: Pick<ToastOptions, "message" | "action" | "tone">) {
  const words = `${message} ${action?.label ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
  const ms = Math.min(8000, Math.max(2500, words * 240 + 1500));
  return Math.max(ms, action ? 5000 : 0, tone === "danger" ? 4000 : 0);
}

export type ToastProps = {
  message: string;
  tone?: ToastTone;
  /** Its shortcut. `onClick` may be left out only for a static specimen */
  action?: { label: string; onClick?: () => void };
  /** The entrance or the exit; leave it out for a toast that doesn't move (a specimen) */
  phase?: "in" | "out";
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">;

/** The toast itself, as the provider draws it. Exported for the design system's specimens; in a
 *  feature, call useToast() instead of rendering one */
export function Toast({ message, tone = "neutral", action, phase, ...rest }: ToastProps) {
  return (
    <div
      className={cx(
        "flex w-fit max-w-sm items-center gap-2 rounded-lg bg-inverted-solid px-4 py-2.5 text-body-sm text-on-inverted-foreground shadow-lg",
        phase === "in" && "pointer-events-auto animate-toast-in motion-reduce:animate-none",
        phase === "out" && "pointer-events-none animate-toast-out motion-reduce:animate-none",
      )}
      {...rest}
    >
      {tone === "danger" ? (
        <WarningCircle className="size-4 shrink-0" />
      ) : (
        <Check className="size-3.5 shrink-0" />
      )}
      <span className="min-w-0 text-pretty">
        {tone === "danger" && <span className="sr-only">Error: </span>}
        {message}
      </span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="relative ml-2 shrink-0 cursor-pointer rounded-sm font-medium whitespace-nowrap underline-offset-2 select-none touch-manipulation hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

type Item = { id: number; message: string; tone: ToastTone; action?: ToastAction; ms: number };
type State = { current: Item | null; open: boolean; queue: Item[] };
type ToastApi = {
  /** Shows a toast (once the one on screen has been seen and has left) and returns its id */
  toast: (options: ToastOptions) => number;
  /** Takes a toast away, on screen or still waiting */
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** `toast()` and `dismiss()`, from the nearest ToastProvider */
export function useToast() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast outside ToastProvider");
  return api;
}

// Whether this tab is in the background, where a toast's clock stops
const onVisibility = (change: () => void) => {
  document.addEventListener("visibilitychange", change);
  return () => document.removeEventListener("visibilitychange", change);
};
const usePageHidden = () =>
  useSyncExternalStore(onVisibility, () => document.hidden, () => false);

/** Holds the toasts for everything inside it and draws the one on screen */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ current: null, open: false, queue: [] });
  const count = useRef(0);
  const { mounted, closing } = usePresence(state.open, EXIT_MS);
  const { current } = state;

  // The toast on screen, and where focus was before it came into it. When the toast starts to
  // leave with focus inside (its action pressed, Escape, dismiss()), focus goes back there, before
  // the toast is taken out, so it's never stranded on a removed node
  const node = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const handBack = useCallback(() => {
    const el = node.current;
    if (!el || !el.contains(document.activeElement)) return;
    const back = returnTo.current;
    returnTo.current = null;
    if (back?.isConnected) back.focus();
    else (document.activeElement as HTMLElement | null)?.blur();
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const item: Item = {
        id: ++count.current,
        message: options.message,
        tone: options.tone ?? "neutral",
        action: options.action,
        ms: options.duration ?? toastDuration(options),
      };
      // Waits its turn: the clock below takes the one on screen away once it has been seen
      setState((s) => ({ ...s, queue: [...s.queue, item].slice(-QUEUE_MAX) }));
      return item.id;
    },
    [],
  );

  const dismiss = useCallback(
    (id: number) => {
      if (node.current?.dataset.toastId === String(id)) handBack();
      setState((s) =>
        s.current?.id === id
          ? { ...s, open: false }
          : { ...s, queue: s.queue.filter((item) => item.id !== id) },
      );
    },
    [handBack],
  );

  // Once nothing is on screen (the last exit has finished), the next one in the queue comes in
  useEffect(() => {
    if (state.open || mounted) return;
    if (!state.current && state.queue.length === 0) return;
    setState((s) =>
      s.open
        ? s
        : s.queue.length
          ? { current: s.queue[0], open: true, queue: s.queue.slice(1) }
          : { ...s, current: null },
    );
  }, [state, mounted]);

  // The clock: the toast leaves when its time is up, or once it has been seen for SEEN_MS while a
  // newer one waits. It stops while pointed at, while focus is inside and while the tab is
  // hidden (so nothing is taken from under the pointer), and runs on with the time it had left
  const [pointedAt, setPointedAt] = useState<number | null>(null);
  const [focusedIn, setFocusedIn] = useState<number | null>(null);
  const hidden = usePageHidden();
  const paused =
    hidden || (current !== null && (pointedAt === current.id || focusedIn === current.id));
  const waiting = state.queue.length > 0;
  const clock = useRef<{ id: number; left: number; seen: number } | null>(null);
  useEffect(() => {
    if (!current || !state.open || paused) return;
    if (clock.current?.id !== current.id) clock.current = { id: current.id, left: current.ms, seen: 0 };
    const entry = clock.current;
    const ms = waiting ? Math.min(entry.left, Math.max(0, SEEN_MS - entry.seen)) : entry.left;
    // A duration of Infinity stays until it's dismissed or replaced (setTimeout would fire it
    // at once)
    if (!Number.isFinite(ms)) return;
    const start = Date.now();
    const timer = setTimeout(() => dismiss(current.id), Math.max(0, ms));
    return () => {
      clearTimeout(timer);
      entry.left -= Date.now() - start;
      entry.seen += Date.now() - start;
    };
  }, [current, state.open, paused, waiting, dismiss]);

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  const shown =
    current && mounted ? (
      <Toast
        key={current.id}
        ref={node}
        data-toast-id={current.id}
        message={current.message}
        tone={current.tone}
        phase={closing ? "out" : "in"}
        action={
          current.action && {
            label: current.action.label,
            onClick: () => {
              current.action?.onClick();
              dismiss(current.id);
            },
          }
        }
        onPointerEnter={() => setPointedAt(current.id)}
        onPointerLeave={() => setPointedAt(null)}
        onFocus={(event) => {
          if (focusedIn !== current.id && event.relatedTarget instanceof HTMLElement) {
            returnTo.current = event.relatedTarget;
          }
          setFocusedIn(current.id);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusedIn(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            dismiss(current.id);
          }
        }}
      />
    ) : null;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Kept mounted, so each toast that enters is announced: polite for neutral, assertive for
          danger. Both regions share one cell at the bottom centre, above the safe area */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-50 grid px-4">
        <div aria-live="polite" aria-atomic="true" className="col-start-1 row-start-1 flex justify-center">
          {current?.tone !== "danger" && shown}
        </div>
        <div aria-live="assertive" aria-atomic="true" className="col-start-1 row-start-1 flex justify-center">
          {current?.tone === "danger" && shown}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
