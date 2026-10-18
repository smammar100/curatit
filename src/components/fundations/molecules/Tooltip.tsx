"use client";

// A tooltip: a few words about one control, for a mouse and the keyboard (2026-10-18). It wraps a
// single trigger and gives it aria-describedby, so a screen reader reads the words with the
// control (unless they're the control's own aria-label, which the tooltip then only echoes).
// - A mouse or pen resting on the trigger shows it after 400ms; moving on to another tooltip's
//   trigger within 300ms shows that one at once, with no animation. Touch never shows it: a tap
//   has no hover to rest on, so nothing here may be needed to use the control.
// - Keyboard focus (focus-visible) shows it at once.
// - It hides on Escape, blur, a press or click on the trigger, a scroll anywhere, and the pointer
//   leaving (after 100ms, so the pointer can cross onto the tooltip to read it; WCAG 1.4.13).
// - It sits in the top layer (popover="manual"), so no overflow or z-index clips it, while staying
//   next to its trigger in the page, so it takes the theme tokens in scope there. It's placed by
//   measuring the trigger once, on show (it hides on scroll, so it never needs to follow), and
//   flips to the other side when there's no room.
// - In: animate-fade-in with a 4px slide from the trigger's side (150ms, ease-out-quint); out:
//   animate-fade-out (120ms). Under reduced motion it fades in without sliding and goes at once.
//
//   <Tooltip label="Copy link"><Button iconOnly aria-label="Copy link">…</Button></Tooltip>
//
// Use it for the name of an icon-only control, or a few words a control's label leaves out
// ("Anyone with the link can view"). Instead: anything someone needs in order to act is visible
// text beside the control; a sentence or more is a Notice or a hint under a field; a link or a
// button is never inside a tooltip (the label is a string, so it can't be); a list of actions is a
// Menu. Don't put one on a disabled control: it gets no pointer or focus events.
import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type Ref,
} from "react";
import { usePresence, useReducedMotion } from "@/lib/motion";
import { cx } from "@/lib/cx";

type Side = "top" | "bottom" | "left" | "right";

const DELAY = 400; // a pointer resting on the trigger
const WARM = 300; // after one hides, the next shows at once for this long
const GRACE = 100; // time to cross from the trigger onto the tooltip
const EXIT_MS = 120; // animate-fade-out
const GAP = 6; // from the trigger
const EDGE = 8; // kept from the window's edges

// The 4px slide in, from the trigger's side
const FROM: Record<Side, string> = { top: "0 4px", bottom: "0 -4px", left: "4px 0", right: "-4px 0" };
const FLIP: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

// The tooltip on screen now, page-wide, and until when the next one skips its delay
type Handle = { hideNow: () => void };
let active: Handle | null = null;
let warmUntil = 0;

type Shown = { open: boolean; instant: boolean };

// One tooltip's timers and open state, outside React's renders so every handler sees the same
function controller(set: (next: Shown) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let open = false;
  const self = {
    trigger: null as HTMLElement | null,
    isOpen: () => open,
    cancel: () => clearTimeout(timer),
    later(fn: () => void, ms: number) {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    },
    show(instant: boolean) {
      clearTimeout(timer);
      // Not over an open menu that the trigger opened
      if (!self.trigger || self.trigger.getAttribute("aria-expanded") === "true") return;
      if (active && active !== self) active.hideNow();
      active = self;
      open = true;
      set({ open: true, instant });
    },
    hideNow() {
      clearTimeout(timer);
      if (active === self) active = null;
      if (!open) return;
      open = false;
      warmUntil = performance.now() + WARM;
      set({ open: false, instant: false });
    },
  };
  return self;
}

// Places the tooltip beside the trigger, flipped when that side has no room and kept inside the
// window; returns the side it went on
function place(tip: HTMLElement, trigger: HTMLElement, wanted: Side): Side {
  const t = trigger.getBoundingClientRect();
  const w = tip.offsetWidth;
  const h = tip.offsetHeight;
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const fits: Record<Side, boolean> = {
    top: t.top - GAP - h >= EDGE,
    bottom: t.bottom + GAP + h <= vh - EDGE,
    left: t.left - GAP - w >= EDGE,
    right: t.right + GAP + w <= vw - EDGE,
  };
  const side = fits[wanted] || !fits[FLIP[wanted]] ? wanted : FLIP[wanted];
  let x: number;
  let y: number;
  if (side === "top" || side === "bottom") {
    x = t.left + t.width / 2 - w / 2;
    y = side === "top" ? t.top - GAP - h : t.bottom + GAP;
  } else {
    x = side === "left" ? t.left - GAP - w : t.right + GAP;
    y = t.top + t.height / 2 - h / 2;
  }
  const clamp = (n: number, max: number) => Math.min(Math.max(n, EDGE), Math.max(EDGE, max));
  tip.style.left = `${Math.round(clamp(x, vw - w - EDGE))}px`;
  tip.style.top = `${Math.round(clamp(y, vh - h - EDGE))}px`;
  return side;
}

type TriggerProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

// Props handed to the tooltip by a wrapper (a Menu cloning its trigger) go on to the trigger,
// their handlers running after the trigger's own
function passOn(own: Record<string, unknown>, extra: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...extra };
  for (const key of Object.keys(extra)) {
    const first = own[key];
    const then = extra[key];
    if (/^on[A-Z]/.test(key) && typeof first === "function" && typeof then === "function") {
      out[key] = (event: unknown) => {
        first(event);
        then(event);
      };
    }
  }
  return out;
}

function chain<E>(...handlers: unknown[]) {
  return (event: E) => {
    for (const handler of handlers) if (typeof handler === "function") handler(event);
  };
}

export type TooltipProps = Omit<TriggerProps, "children"> & {
  /** The words: a name or a short phrase, no full stop. A string, so it can't hold a control */
  label: string;
  /** Which side of the trigger it prefers; it flips when there's no room */
  side?: Side;
  /** One element that takes a ref and pointer and focus handlers: a Button, a link */
  children: ReactElement<TriggerProps>;
};

export default function Tooltip({ label, side = "top", children, ref, ...extra }: TooltipProps) {
  const id = useId();
  const [shown, setShown] = useState<Shown>({ open: false, instant: false });
  const [api] = useState(() => controller(setShown));
  const { mounted, closing } = usePresence(shown.open, EXIT_MS);
  const reduced = useReducedMotion();
  const tip = useRef<HTMLSpanElement>(null);
  // The slide in that's playing, cancelled when it shows again before it's done
  const slide = useRef<Animation | null>(null);

  // Escape, a scroll anywhere or a resize hide it while it's up; unmounting lets it go
  useEffect(() => {
    if (!shown.open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && api.hideNow();
    const onMove = () => api.hideNow();
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, { capture: true, passive: true });
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    };
  }, [shown.open, api]);
  useEffect(() => () => api.hideNow(), [api]);

  // Into the top layer and into place before paint, then the slide; out of it once the fade is done
  useLayoutEffect(() => {
    const el = tip.current;
    if (!el) return;
    const layered = typeof el.showPopover === "function";
    if (!mounted) {
      if (layered && el.matches(":popover-open")) el.hidePopover();
      return;
    }
    if (layered && !el.matches(":popover-open")) el.showPopover();
    if (closing || !api.trigger) return;
    const final = place(el, api.trigger, side);
    slide.current?.cancel();
    if (!shown.instant && !reduced && typeof el.animate === "function") {
      const easing = getComputedStyle(el).getPropertyValue("--ease-out-quint").trim() || "ease-out";
      slide.current = el.animate([{ translate: FROM[final] }, { translate: "0 0" }], { duration: 150, easing });
    }
  }, [mounted, closing, side, shown.instant, reduced, api]);

  const own = children.props;
  // A tooltip that repeats the control's own name adds nothing for a screen reader
  const describes = label !== own["aria-label"];
  const passed = passOn(own as Record<string, unknown>, extra as Record<string, unknown>);
  const pick = (key: keyof TriggerProps) => (key in passed ? passed[key] : own[key]);
  const describedBy = [pick("aria-describedby"), describes ? id : null].filter(Boolean).join(" ") || undefined;

  const trigger = cloneElement(children, {
    ...passed,
    ref: mergeRefs<HTMLElement>(own.ref, ref),
    "aria-describedby": describedBy,
    onPointerEnter: chain<ReactPointerEvent<HTMLElement>>(pick("onPointerEnter"), (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") return;
      api.trigger = event.currentTarget;
      if (api.isOpen()) return api.cancel();
      const warm = performance.now() < warmUntil || (active !== null && active !== api);
      if (warm) api.show(true);
      else api.later(() => api.show(false), DELAY);
    }),
    onPointerLeave: chain<ReactPointerEvent<HTMLElement>>(pick("onPointerLeave"), (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") return;
      if (api.isOpen()) api.later(api.hideNow, GRACE);
      else api.cancel();
    }),
    onPointerDown: chain<ReactPointerEvent<HTMLElement>>(pick("onPointerDown"), () => api.hideNow()),
    onClick: chain(pick("onClick"), () => api.hideNow()),
    onFocus: chain<ReactFocusEvent<HTMLElement>>(pick("onFocus"), (event: ReactFocusEvent<HTMLElement>) => {
      let visible = false;
      try {
        visible = event.currentTarget.matches(":focus-visible");
      } catch {
        // A browser without :focus-visible shows it on hover only
      }
      if (!visible) return;
      api.trigger = event.currentTarget;
      api.show(true);
    }),
    onBlur: chain(pick("onBlur"), () => api.hideNow()),
  } as TriggerProps & Record<string, unknown>);

  return (
    <>
      {trigger}
      <span
        ref={tip}
        id={id}
        role="tooltip"
        popover="manual"
        aria-hidden={describes ? undefined : true}
        onPointerEnter={() => api.cancel()}
        onPointerLeave={() => api.later(api.hideNow, GRACE)}
        className={cx(
          "fixed inset-auto z-50 m-0 w-max max-w-64 overflow-visible rounded-md border-0 bg-inverted-solid px-2 py-1 text-left text-caption-lg text-pretty text-on-inverted-foreground",
          // Rendered all the time, hidden while it's down, so aria-describedby always has its words
          !mounted ? "hidden" : closing ? "block animate-fade-out" : shown.instant ? "block" : "block animate-fade-in",
        )}
      >
        {label}
      </span>
    </>
  );
}
