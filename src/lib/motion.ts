// Shared motion hooks for client components (2026-10-18), after Fluid Functionalism's sliding
// selection and fluid hover, rebuilt as CSS transitions so no animation library comes along.
// The rules they keep (emil-animations): transform and opacity only (a thumb's width and height
// are the one exception: it's absolutely positioned and nothing lays out around it), no motion
// on keyboard-repeated input, nothing under reduced motion, and exits shorter than entrances.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

const REDUCE = "(prefers-reduced-motion: reduce)";

/** Whether the visitor asked for reduced motion (false while rendering on the server). */
export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = matchMedia(REDUCE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => matchMedia(REDUCE).matches,
    () => false,
  );
}

type Box = { x: number; y: number; w: number; h: number };

/**
 * A selection thumb that slides between the options of a segmented control or a row of tabs.
 * Put `ref` and `handlers` on the group (which must be `relative`), mark the selected option
 * with `data-selected`, and render one absolutely positioned thumb (`left-0 top-0`) with
 * `style` and `data-snap={snap || undefined}`:
 *
 *   className="pointer-events-none absolute top-0 left-0 rounded-md bg-… shadow-xs
 *              transition-[translate,width,height] duration-200 ease-out-quint
 *              data-snap:transition-none motion-reduce:transition-none"
 *
 * The thumb snaps on the first measure, on a resize, and when the change came from the
 * keyboard, so held arrow keys never queue up slides. Until it has measured (`ready` is false,
 * which includes the server render), the selected option should keep its own fill, so the HTML
 * is right before any script runs.
 */
export function useThumb<T extends HTMLElement = HTMLDivElement>(value: unknown) {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<(Box & { snap: boolean }) | null>(null);
  const keyboard = useRef(false);
  const first = useRef(true);

  const measure = useCallback((snap: boolean) => {
    const el = ref.current?.querySelector<HTMLElement>("[data-selected]");
    setBox(
      el
        ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, snap }
        : null,
    );
  }, []);

  useLayoutEffect(() => {
    measure(first.current || keyboard.current);
    first.current = false;
    keyboard.current = false;
  }, [value, measure]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(() => measure(true));
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure]);

  const handlers = {
    onKeyDown: () => {
      keyboard.current = true;
    },
    onPointerDown: () => {
      keyboard.current = false;
    },
  };
  const style: CSSProperties | undefined = box
    ? { width: box.w, height: box.h, translate: `${box.x}px ${box.y}px` }
    : undefined;
  return { ref, handlers, style, snap: box?.snap ?? true, ready: box !== null };
}

/**
 * A hover highlight that glides between the rows of a menu or list, Fluid Functionalism's
 * "fluid hover" without its gap-click routing. Mouse only: on touch a tap would leave a row
 * lit, so touch and pen keep the rows' own pressed state, and keyboard focus keeps the rows'
 * own focus style (instant, as keyboard feedback should be).
 *
 * Put `ref` and `handlers` on the list (which must be `relative`), mark each row with
 * `data-glide-item`, and render <GlideHighlight> from `highlight` as the list's first child:
 *
 *   <span aria-hidden className="pointer-events-none absolute top-0 left-0 rounded-lg
 *     bg-base-50 transition-[translate,height,opacity] duration-150 ease-out-quint
 *     data-fresh:transition-[opacity] motion-reduce:transition-[opacity]"
 *     style={highlight.style} data-fresh={highlight.fresh || undefined} />
 *
 * Rows keep no hover fill of their own while the highlight is in use. The highlight fades in
 * where the pointer enters (no slide from a stale row) and fades out where it leaves.
 */
export function useGlide<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<{ box: Box | null; last: Box | null; fresh: boolean }>({
    box: null,
    last: null,
    fresh: true,
  });

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-glide-item]");
    if (!row || !ref.current?.contains(row) || row.matches(":disabled, [aria-disabled='true']")) {
      return;
    }
    const next = { x: row.offsetLeft, y: row.offsetTop, w: row.offsetWidth, h: row.offsetHeight };
    setState((prev) =>
      prev.box && prev.box.y === next.y && prev.box.x === next.x && prev.box.h === next.h
        ? prev
        : { box: next, last: next, fresh: prev.box === null },
    );
  }, []);
  const onPointerLeave = useCallback(() => {
    setState((prev) => (prev.box ? { ...prev, box: null } : prev));
  }, []);

  const shown = state.box ?? state.last;
  const highlight = {
    style: shown
      ? ({
          width: shown.w,
          height: shown.h,
          translate: `${shown.x}px ${shown.y}px`,
          opacity: state.box ? 1 : 0,
        } satisfies CSSProperties)
      : ({ opacity: 0 } satisfies CSSProperties),
    fresh: state.fresh,
  };
  return { ref, handlers: { onPointerMove, onPointerLeave }, highlight };
}

/**
 * Keeps a conditionally rendered element (a menu, a toast) mounted for its exit animation.
 * `mounted` is what to render on; `closing` is true while it plays its exit (put it on the
 * element as `data-closing` and give that an `animate-[menu-out_…]`). Under reduced motion
 * the element unmounts at once.
 */
export function usePresence(open: boolean, exitMs: number) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  // Render-time sync, React's recommended way to adjust state when a prop changes
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMounted(true);
      setClosing(false);
    } else if (reduced || exitMs <= 0) {
      setMounted(false);
    } else {
      setClosing(true);
    }
  }
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, exitMs);
    return () => clearTimeout(timer);
  }, [closing, exitMs]);
  return { mounted, closing };
}
