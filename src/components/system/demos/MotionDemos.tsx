"use client";

// The live demos on the Motion sheet (/system/motion). Every one waits for a person: nothing
// plays on load, and under reduced motion they do what the site does (nothing moves, menus and
// the dialog appear and go at once). Each is rendered once per theme panel, so ids come from useId.
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Button from "@/components/fundations/elements/Button";
import CaretDown from "@/components/fundations/icons/CaretDown";
import Check from "@/components/fundations/icons/Check";
import Play from "@/components/fundations/icons/Play";
import { GLIDE_HIGHLIGHT, GLIDE_ROW, usePopover } from "@/components/dashboard/usePopover";
import { useGlide, usePresence, useReducedMotion } from "@/lib/motion";
import { cx } from "@/lib/cx";

/** useReducedMotion's value right now, as the hook returns it */
export function ReducedMotionValue() {
  const reduced = useReducedMotion();
  return (
    <p className="text-body-sm text-secondary-foreground">
      Right now it returns{" "}
      <code className="font-mono text-caption-lg text-primary-foreground">{String(reduced)}</code>.
    </p>
  );
}

// ---------------------------------------------------------------------------------------------
// Replays: one Play button sets every track in its group running at once, so the curves (or
// the durations) can be compared side by side

const ReplayContext = createContext(0);

export function ReplayGroup({ label, note, children }: { label: string; note: ReactNode; children: ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <ReplayContext.Provider value={run}>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Play className="size-3.5" />}
          onClick={() => setRun((n) => n + 1)}
        >
          {label}
        </Button>
        {/* Swapped by CSS, so the server's HTML already says the right thing */}
        <p className="text-body-sm text-secondary-foreground">
          <span className="motion-reduce:hidden">{note}</span>
          <span className="hidden motion-reduce:inline">Reduced motion is on, so the dots jump to the end.</span>
        </p>
      </div>
      {children}
    </ReplayContext.Provider>
  );
}

// Full class names, so Tailwind sees them
const EASE = {
  "out-quint": "ease-out-quint",
  "in-out-quart": "ease-in-out-quart",
  "in-quart": "ease-in-quart",
} as const;
const DURATION = {
  140: "duration-140",
  150: "duration-150",
  200: "duration-200",
  400: "duration-400",
  600: "duration-600",
} as const;

export type Ease = keyof typeof EASE;
export type Ms = keyof typeof DURATION;

/**
 * A dot that crosses its track on the given curve, each time its group's Play button is pressed.
 * The mover is the track's width less the dot's, so translate: 100% lands the dot on the end.
 * It's a CSS transition on translate (the curve is the real utility class), restarted by writing
 * straight to the element: no render per frame. Under reduced motion it jumps.
 */
export function Track({ ease, ms, className }: { ease: Ease; ms: Ms; className?: string }) {
  const run = useContext(ReplayContext);
  const mover = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = mover.current;
    if (!run || !el) return;
    el.style.transitionProperty = "none";
    el.style.translate = "0";
    // Commit the start before the transition comes back, or the browser skips straight to the end
    void el.offsetWidth;
    el.style.transitionProperty = "";
    el.style.translate = "100%";
  }, [run]);

  return (
    <span aria-hidden="true" className={cx("relative block h-3 min-w-6", className)}>
      <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-component" />
      <span
        ref={mover}
        className={cx(
          "absolute inset-y-0 right-3 left-0 transition-[translate] motion-reduce:transition-none",
          EASE[ease],
          DURATION[ms],
        )}
      >
        <span className="block size-3 rounded-full bg-primary-foreground" />
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Keyframes: each pair on a small specimen, held for its exit by usePresence. At rest on load
// (no animation class until the first press), so nothing plays because the page opened

type Kind = "menu" | "toast" | "fade" | "rise";

const KEYFRAMES: Record<Kind, { in: string; out?: string; exit: number; name: string }> = {
  menu: {
    in: "animate-[menu-in_150ms_var(--ease-out-quint)]",
    out: "animate-[menu-out_120ms_var(--ease-in-quart)_forwards]",
    exit: 120,
    name: "the menu",
  },
  toast: {
    in: "animate-[toast-in_180ms_var(--ease-out-quint)]",
    out: "animate-[toast-out_120ms_var(--ease-in-quart)_forwards]",
    exit: 120,
    name: "the toast",
  },
  fade: {
    in: "animate-[fade-in_150ms_var(--ease-out-quint)]",
    out: "animate-[fade-out_120ms_var(--ease-in-quart)_forwards]",
    exit: 120,
    name: "the dim",
  },
  // An FAQ answer closes at once: <details> has no exit
  rise: { in: "animate-[rise-in_200ms_var(--ease-out-quint)]", exit: 0, name: "the answer" },
};

export function KeyframeToggle({ kind }: { kind: Kind }) {
  const [shown, setShown] = useState(true);
  const [played, setPlayed] = useState(false);
  const k = KEYFRAMES[kind];
  const { mounted, closing } = usePresence(shown, k.exit);
  const motion = cx(
    closing ? k.out : played && k.in,
    "motion-reduce:animate-none",
    closing && "pointer-events-none",
  );

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        size="xs"
        className="w-14"
        onClick={() => {
          setPlayed(true);
          setShown((s) => !s);
        }}
      >
        {shown ? "Hide" : "Show"}
        <span className="sr-only"> {k.name}</span>
      </Button>
      <div aria-hidden="true" className="relative h-14 w-40">
        {kind === "fade" && (
          <div className="absolute inset-0 flex flex-col justify-center gap-1.5 rounded-lg bg-card px-3">
            <span className="h-1.5 w-24 rounded-full bg-component" />
            <span className="h-1.5 w-28 rounded-full bg-component" />
            <span className="h-1.5 w-16 rounded-full bg-component" />
          </div>
        )}
        {mounted && kind === "menu" && (
          <div className={cx("absolute top-0 left-0 w-32 origin-top-left rounded-lg bg-modal p-1 shadow-lg", motion)}>
            <span className="block rounded-md bg-transparent-hover px-2 py-1 text-caption-lg text-primary-foreground">
              Rename
            </span>
            <span className="block px-2 py-1 text-caption-lg text-primary-foreground">Share</span>
          </div>
        )}
        {mounted && kind === "toast" && (
          <p
            className={cx(
              "absolute bottom-1 left-0 flex items-center gap-1.5 rounded-lg bg-inverted-solid px-3 py-2 text-caption-lg whitespace-nowrap text-on-inverted-foreground shadow-lg",
              motion,
            )}
          >
            <Check className="size-3 shrink-0" />
            Saved to Launch
          </p>
        )}
        {mounted && kind === "fade" && <div className={cx("absolute inset-0 rounded-lg bg-black/25", motion)} />}
        {mounted && kind === "rise" && (
          <p className={cx("absolute inset-x-0 top-0 text-body-sm text-secondary-foreground", motion)}>
            It drops 4px into place, and closes at once.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// useGlide: a list that's always open, so the glide can be tried without opening anything

const ACTIONS = ["Rename", "Share", "Copy link", "Move to the top"];

export function GlideList() {
  const glide = useGlide<HTMLDivElement>();
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-56 flex-col gap-3">
      <div className="rounded-xl bg-modal p-1 shadow-lg">
        <div ref={glide.ref} {...glide.handlers} role="group" aria-label="Board actions" className="relative">
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
              data-glide-item
              onClick={() => setPicked(action)}
              className={cx(
                "flex w-full rounded-md px-2.5 py-2 text-left text-body-sm text-primary-foreground",
                GLIDE_ROW,
              )}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
      <p aria-live="polite" className="text-caption-lg text-secondary-foreground">
        {picked ? `Picked ${picked}` : "Nothing picked yet"}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// usePresence, through usePopover: a menu that leaves rather than vanishing

const SORTS = ["Newest", "Most liked", "Brand A–Z"] as const;
type Sort = (typeof SORTS)[number];

export function PresenceMenu() {
  const [sort, setSort] = useState<Sort>("Newest");
  const popover = usePopover("menu");
  const { glide } = popover;

  return (
    <div {...popover.rootProps} className="relative">
      <Button
        variant="secondary"
        size="sm"
        aria-haspopup="menu"
        {...popover.triggerProps}
        rightIcon={
          <CaretDown
            className={cx(
              "size-3.5 transition-transform duration-200 ease-out-quint motion-reduce:transition-none",
              popover.open && "rotate-180",
            )}
          />
        }
      >
        {`Sort: ${sort}`}
      </Button>
      {popover.mounted && (
        <div
          {...popover.contentProps}
          role="menu"
          aria-label="Sort by"
          className={cx(
            "absolute top-full left-0 z-10 mt-2 w-48 origin-top-left rounded-xl bg-modal p-1 shadow-lg outline-none",
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
            {SORTS.map((option) => (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={option === sort}
                tabIndex={-1}
                data-glide-item
                onClick={() => {
                  setSort(option);
                  popover.close();
                }}
                className={cx(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-body-sm text-primary-foreground",
                  GLIDE_ROW,
                )}
              >
                {option}
                {option === sort && <Check className="size-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// A native dialog on .dialog-motion: showModal() and close() play it; it stays mounted

export function DialogDemo() {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <Button variant="secondary" size="sm" className="w-fit" onClick={() => ref.current?.showModal()}>
        Open the dialog
      </Button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        // A click on the dimmed page behind (the dialog's own box, outside the card) closes it
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="dialog-motion m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border-0 bg-modal p-0 text-primary-foreground shadow-xl backdrop:bg-black/40"
      >
        <div className="p-6">
          <h4 id={titleId} className="text-body-base font-medium text-primary-foreground">
            A native dialog
          </h4>
          <p className="mt-2 text-body-sm text-secondary-foreground">
            It scaled in from 0.97 and faded over 200ms. Close it and it leaves in 140ms, faster than
            it came. Escape and a click outside close it too.
          </p>
          <div className="mt-6 flex justify-end">
            <Button size="sm" onClick={() => ref.current?.close()}>
              Close
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
