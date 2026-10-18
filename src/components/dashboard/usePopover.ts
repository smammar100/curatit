// One popover's open state and every way it closes, for the dashboard's menus and panels
// (2026-10-18; AccountMenu, Header, boards and BoardView each had their own copy of the
// click-outside and Escape logic). After the WAI-ARIA menu button, dialog and disclosure patterns:
// - a press outside closes it and leaves focus where the press put it, and so does focus moving
//   somewhere else on the page (Tab past the end, which is how Tab closes a menu);
// - Escape closes it and puts focus back on the trigger, and so does `close()`, which an item calls
//   when choosing it closes the popover (`close(false)` leaves focus where it is);
// - it leaves with a short fade and shrink (usePresence), inert and unclickable while it does.
// `kind` says what it holds: a "menu" (role="menu", items tabIndex -1: ↑ / ↓ move between them and
// wrap, Home / End, and opening it from the keyboard focuses the first item, or the checked one),
// a "dialog" (focus moves to its first control whenever it opens) or a "disclosure" (a panel that
// follows its trigger in the tab order, so focus stays where it is).
//
// Spread `rootProps` on the element wrapping the trigger and the popover, `triggerProps` on the
// trigger and `contentProps` on the popover (rendered while `mounted`), and add `motion` to the
// popover's classes. A list inside with a gliding hover highlight uses `glide` (useGlide), which
// is cleared whenever the popover closes, so a row lit when it closed isn't lit on the next open.
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useGlide, usePresence } from "@/lib/motion";

type Kind = "menu" | "dialog" | "disclosure";
type Where = "first" | "last";

const EXIT_MS = 120;
const ITEMS = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';
const CONTROLS =
  'input:not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

// In with menu-in, out with menu-out, faster (the shared animate-menu-in / animate-menu-out
// utilities in global.css); neither under reduced motion (where usePresence unmounts at once anyway)
const ENTER = "animate-menu-in motion-reduce:animate-none";
const EXIT = "pointer-events-none animate-menu-out motion-reduce:animate-none";

// The gliding hover highlight in a menu's list (useGlide in src/lib/motion.ts); add the rows' radius,
// which is the menu's less its padding (rounded-md in a rounded-2xl p-1.5 menu: 12 − 6)
export const GLIDE_HIGHLIGHT =
  "pointer-events-none absolute top-0 left-0 bg-transparent-hover transition-[translate,height,opacity] duration-150 ease-out-quint data-fresh:transition-[opacity] motion-reduce:transition-[opacity]";
// A row under that highlight: no hover fill of its own (the highlight is it), a fill for a press
// (touch has no highlight), and for keyboard focus the fill plus the focus ring, inset so the
// menu's padding or a scrolling list can't clip it (the fill alone is too faint to find, and
// would look like the mouse's highlight). Relative, so it paints over the highlight.
export const GLIDE_ROW =
  "relative focus-visible:bg-transparent-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-border-focus active:bg-transparent-hover";

const itemsOf = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>(ITEMS)).filter((item) => !item.matches(":disabled, [aria-disabled='true']"));

export function usePopover<T extends HTMLElement = HTMLButtonElement>(kind: Kind) {
  const [open, setOpen] = useState(false);
  const { mounted, closing } = usePresence(open, EXIT_MS);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<T>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useId();
  // Where focus goes once the popover is on screen, when opening it asked for that
  const pending = useRef<Where | null>(null);
  const glide = useGlide();
  // The pointer leaving never reaches a list that unmounted under it, so clear the highlight here
  const clearGlide = glide.handlers.onPointerLeave;
  useEffect(() => {
    if (!open) clearGlide();
  }, [open, clearGlide]);

  // Focus into the popover: a menu's first item (the checked one if it has one) or last, else the
  // menu itself (while it has no items); a dialog's or panel's first control
  const focusIn = useCallback(
    (where: Where = "first") => {
      const content = contentRef.current;
      if (!content) return;
      if (kind !== "menu") return content.querySelector<HTMLElement>(CONTROLS)?.focus();
      const items = itemsOf(content);
      const checked = content.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]');
      const target = where === "last" ? items.at(-1) : (checked ?? items[0]);
      (target ?? content).focus();
    },
    [kind],
  );

  // Closes it and puts focus back on the trigger; `false` leaves focus alone (it has moved on, or
  // a pointer chose an item and focus would only keep a hover-revealed trigger on screen)
  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const show = (where: Where | null) => {
    pending.current = where;
    setOpen(true);
  };

  // Before paint, so the first frame already has focus where it belongs
  useLayoutEffect(() => {
    if (!open || !pending.current) return;
    focusIn(pending.current);
    pending.current = null;
  }, [open, focusIn]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const rootProps = {
    ref: rootRef,
    // Focus going to something else on the page closes it; focus going nowhere (a click on text
    // inside it, the window losing focus) doesn't
    onBlur: (event: ReactFocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && !event.currentTarget.contains(next)) setOpen(false);
    },
  };

  const triggerProps = {
    ref: triggerRef,
    "aria-expanded": open,
    "aria-controls": mounted ? id : undefined,
    onClick: (event: ReactMouseEvent) => {
      if (open) return setOpen(false);
      // Enter and Space make a click with no detail: a menu opened from the keyboard takes focus
      show(kind === "dialog" || (kind === "menu" && event.detail === 0) ? "first" : null);
    },
    // ↓ / ↑ open a menu on its first or last item (or move there if it's open)
    onKeyDown: (event: ReactKeyboardEvent) => {
      if (kind !== "menu" || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
      event.preventDefault();
      const where = event.key === "ArrowDown" ? "first" : "last";
      if (open) focusIn(where);
      else show(where);
    },
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (kind !== "menu") return;
    const menu = event.currentTarget;
    const target = event.target as HTMLElement;
    // Keys typed into a field inside (the Save menu's new board name) are the field's
    if (target !== menu && !target.matches(ITEMS)) return;
    // Shift+Tab from an item goes back to the trigger, closing the menu; Tab goes on to whatever
    // follows, and the focus leaving closes it
    if (event.key === "Tab") {
      if (event.shiftKey) {
        event.preventDefault();
        close();
      }
      return;
    }
    const items = itemsOf(menu);
    if (!items.length) return;
    const at = items.indexOf(target);
    const last = items.length - 1;
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = at < 0 || at === last ? 0 : at + 1;
        break;
      case "ArrowUp":
        next = at <= 0 ? last : at - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    items[next].focus();
  };

  const contentProps = {
    ref: contentRef,
    id,
    tabIndex: kind === "menu" ? -1 : undefined,
    inert: closing || undefined,
    "data-closing": closing || undefined,
    onKeyDown: onMenuKeyDown,
  };

  return {
    open,
    close,
    focusIn,
    mounted,
    closing,
    rootProps,
    triggerProps,
    contentProps,
    motion: closing ? EXIT : ENTER,
    glide,
    clearGlide,
  };
}
