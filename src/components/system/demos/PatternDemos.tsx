"use client";

// The live demos on the Patterns sheet (/system/patterns). Each one is the pattern's real recipe:
// the same hooks and classes as the dashboard, so what works here works there. Each is rendered
// once per theme panel (ids come from useId), nothing plays on load, and under reduced motion they
// do what the site does.
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Symbol from "@/components/assets/Symbol";
import { GLIDE_HIGHLIGHT, GLIDE_ROW, usePopover } from "@/components/dashboard/usePopover";
import Button from "@/components/fundations/elements/Button";
import Check from "@/components/fundations/icons/Check";
import Pause from "@/components/fundations/icons/Pause";
import Play from "@/components/fundations/icons/Play";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import Input from "@/components/fundations/elements/Input";
import Dialog from "@/components/fundations/molecules/Dialog";
import Field from "@/components/fundations/molecules/Field";
import ThoughtLine from "@/components/ui/thought-line";
import { usePresence } from "@/lib/motion";
import { cx } from "@/lib/cx";

// ---------------------------------------------------------------------------------------------
// The menu: a board's More menu (BoardView.tsx), opening to the left so it fits a phone's panel

const ACTIONS = ["Rename", "Add a description"];

export function MenuDemo() {
  const popover = usePopover("menu");
  const { glide } = popover;
  const [picked, setPicked] = useState<string | null>(null);
  // Rows and their highlight are the menu's radius less its padding (12 − 6)
  const item = cx("flex w-full rounded-md px-3 py-2 text-left text-body text-primary-foreground", GLIDE_ROW);
  const choose = (action: string) => {
    setPicked(action);
    popover.close();
  };

  return (
    // Room below for the menu to open into
    <div className="flex min-h-56 items-start gap-4">
      <div {...popover.rootProps} className="relative">
        <Button
          aria-haspopup="menu"
          {...popover.triggerProps}
          variant="secondary"
          size="lg"
          shape="pill"
          iconOnly
          aria-label="More"
        >
          <span aria-hidden="true" className="flex gap-[3px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-[3px] rounded-full bg-current" />
            ))}
          </span>
        </Button>
        {popover.mounted && (
          <div
            {...popover.contentProps}
            role="menu"
            aria-label="More"
            className={cx(
              "absolute top-full left-0 z-30 mt-2 w-60 origin-top-left rounded-2xl bg-modal p-1.5 text-left shadow-lg outline-hidden",
              popover.motion,
            )}
          >
            <div ref={glide.ref} {...glide.handlers} className="relative">
              <span
                aria-hidden="true"
                className={cx(GLIDE_HIGHLIGHT, "rounded-md")}
                style={glide.highlight.style}
                data-fresh={glide.highlight.fresh || undefined}
              />
              {ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  data-glide-item
                  className={item}
                  onClick={() => choose(action)}
                >
                  {action}
                </button>
              ))}
              <div role="separator" className="mx-3 my-1 h-px bg-border-default" />
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                data-glide-item
                className={item}
                onClick={() => choose("Delete board…")}
              >
                Delete board…
              </button>
            </div>
          </div>
        )}
      </div>
      <p aria-live="polite" className="pt-3 text-body-sm text-secondary-foreground">
        {picked ? `Picked ${picked}` : "Nothing picked yet"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The toast: BoardsProvider's (dashboard/boards.tsx), which isn't exported, copied with its
// classes, its clock and its live region. The real one is fixed to the bottom of the window

type Toast = { id: number; text: string; tone: "done" | "error" };
// As in boards.tsx: long enough to read, longer for a problem
const TOAST_MS = { done: 2400, error: 4000 };

// Whether this tab is in the background, where a toast's clock stops
const onVisibility = (change: () => void) => {
  document.addEventListener("visibilitychange", change);
  return () => document.removeEventListener("visibilitychange", change);
};
const usePageHidden = () => useSyncExternalStore(onVisibility, () => document.hidden, () => false);

export function ToastDemo() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);
  const count = useRef(0);
  const { mounted, closing } = usePresence(open, 120);
  const [pointedAt, setPointedAt] = useState<number | null>(null);
  const hidden = usePageHidden();
  const paused = hidden || (toast !== null && pointedAt === toast.id);
  const left = useRef<{ id: number; ms: number } | null>(null);

  // The clock stops while the pointer is on it and while the tab is hidden, then runs on with
  // the time it had left
  useEffect(() => {
    if (!toast || !open || paused) return;
    if (left.current?.id !== toast.id) left.current = { id: toast.id, ms: TOAST_MS[toast.tone] };
    const entry = left.current;
    const start = Date.now();
    const timer = setTimeout(() => setOpen(false), entry.ms);
    return () => {
      clearTimeout(timer);
      entry.ms -= Date.now() - start;
    };
  }, [toast, open, paused]);

  const notify = (text: string, tone: Toast["tone"] = "done") => {
    setToast({ id: ++count.current, text, tone });
    setOpen(true);
  };

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => notify("Saved to Launch ideas")}>
          Save a post
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => notify("Couldn’t save to Launch ideas. Try again.", "error")}
        >
          Fail a save
        </Button>
      </div>
      {/* Stands in for the bottom of the window */}
      <div className="relative h-28 rounded-2xl bg-card">
        {/* The live region stays mounted, so each toast that enters it is announced */}
        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
          {toast && mounted && (
            <p
              key={toast.id}
              role={toast.tone === "error" ? "alert" : undefined}
              data-closing={closing || undefined}
              onPointerEnter={() => setPointedAt(toast.id)}
              onPointerLeave={() => setPointedAt(null)}
              className={cx(
                "flex max-w-sm items-center gap-2 rounded-lg bg-inverted-solid px-4 py-2.5 text-body text-on-inverted-foreground shadow-lg motion-reduce:animate-none",
                closing ? "pointer-events-none animate-toast-out" : "pointer-events-auto animate-toast-in",
              )}
            >
              {toast.tone === "error" ? (
                <WarningCircle className="size-4 shrink-0" />
              ) : (
                <Check className="size-3.5 shrink-0" />
              )}
              <span className="min-w-0">{toast.text}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Skeletons: the shimmer waits for Play, so the sheet holds still on load. A paused animation
// rests on its first frame, where the band is off the block

export function ShimmerPlay({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          onClick={() => setPlaying((on) => !on)}
        >
          {playing ? "Pause the shimmer" : "Play the shimmer"}
        </Button>
        {/* Swapped by CSS, so the server's HTML already says the right thing */}
        <p className="text-body-sm text-secondary-foreground">
          <span className="motion-reduce:hidden">In the app it runs by itself until the content lands.</span>
          <span className="hidden motion-reduce:inline">Reduced motion is on, so the band holds still.</span>
        </p>
      </div>
      <div className={playing ? undefined : "[&_.animate-shimmer]:[animation-play-state:paused]"}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// ThoughtLine: settled at first (the time a search took), and run again on a press. Until the
// first run its settle takes no time, so its glyph doesn't dim on load

const TRACE = ["Reading the brief", "Searching the library", "Ranking by fit"];
const STEP_MS = 900;

export function ThoughtDemo() {
  const [runs, setRuns] = useState(0);
  const [working, setWorking] = useState(false);
  const [steps, setSteps] = useState(TRACE.length);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const run = () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.length = 0;
    setRuns((n) => n + 1);
    setWorking(true);
    setSteps(1);
    for (let step = 2; step <= TRACE.length; step++) {
      timers.current.push(window.setTimeout(() => setSteps(step), STEP_MS * (step - 1)));
    }
    timers.current.push(window.setTimeout(() => setWorking(false), STEP_MS * TRACE.length));
  };

  const ran = runs > 0;
  return (
    <div className="flex flex-col items-start gap-5">
      <Button variant="secondary" size="sm" leftIcon={<Play className="size-3.5" />} onClick={run}>
        Run a search
      </Button>
      {/* A new run is a new line, so its clock starts from zero */}
      <ThoughtLine
        key={runs}
        working={working}
        label="Searching…"
        doneLabel="Found 12 posts in"
        steps={TRACE.slice(0, steps)}
        glyph={<Symbol />}
        // Real colours, never currentColor: the shimmer mixes the ink with transparent through
        // color-mix(), which can't take currentColor, and the label would vanish
        color="var(--color-secondary-foreground)"
        glyphColor="var(--color-primary-foreground)"
        fontSize={14}
        elapsed={ran ? undefined : 2.4}
        settleDuration={ran ? 350 : 0}
        // Announced only once someone runs it, not on load
        live={ran}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The dialog: a new board on the shared Dialog (fundations/molecules/Dialog), which was made from
// NewBoardDialog's native <dialog>. Its close button, scroll lock, focus and exit are its own

export function NewBoardDemo() {
  const id = useId();
  const formId = `${id}-form`;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [made, setMade] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        onClick={() => {
          setName("");
          setOpen(true);
        }}
      >
        New board
      </Button>
      <p aria-live="polite" className="text-body-sm text-secondary-foreground">
        {made ? `Created ${made}` : "No board yet"}
      </p>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="New board"
        description="Name it for the brief it's for. You can change it later."
        footer={
          <>
            <Button variant="muted" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {/* In the footer, outside the form, so it names the form it submits */}
            <Button type="submit" form={formId} disabled={!name.trim()}>
              Create board
            </Button>
          </>
        }
      >
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            setMade(trimmed);
            setOpen(false);
          }}
        >
          <Field label="Board name">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              autoComplete="off"
              placeholder="Launch ideas"
            />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
