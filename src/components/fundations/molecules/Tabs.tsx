"use client";

// Tabs: views of the same thing, one at a time (2026-10-18). It replaces the three tab rows that
// were built by hand before it (the post panel's Creative breakdown, the review queue's lists,
// the MCP page's client tabs) with one compound component:
//
//   <Tabs defaultValue="breakdown">
//     <TabList aria-label="Creative breakdown" variant="pill">
//       <Tab value="breakdown">Breakdown</Tab>
//       <Tab value="visual">Visual DNA</Tab>
//     </TabList>
//     <TabPanel value="breakdown">…</TabPanel>
//     <TabPanel value="visual">…</TabPanel>
//   </Tabs>
//
// ARIA tabs with one tab stop (a roving tabindex): Tab reaches the selected tab, ← / → move
// along the row (wrapping, skipping disabled tabs), Home / End jump to the ends. Selection
// follows focus by default; with activation="manual" the arrows move focus only and Enter or
// Space selects (for panels that are slow to render). A key the row uses is marked handled:
// preventDefault, which a document listener checks as event.defaultPrevented (PostView's arrows
// do: Next runs React from the document, so stopPropagation can't keep the event from it), and
// stopPropagation for React parents. Keys held with Alt, Ctrl, Meta or Shift are never taken
// (Alt+← is the browser's Back).
//
// The indicator slides to the selected tab (useThumb: 200ms ease-out-quint) and snaps on
// keyboard input and on first render; the labels' colours fade over 150ms for a pointer and snap
// for a key; nothing moves under reduced motion. Until the indicator has measured, which
// includes the server's HTML, the selected tab wears it itself. The row scrolls sideways when it
// doesn't fit and fades the edge that has more tabs beyond it, only while it does; with `wrap` it
// breaks onto a second line instead (the review queue's lists, whose counts make it long) and the
// indicator follows the selected tab to whichever line it's on.
//
// Use it for views of one thing. A setting with a few short values is Segmented; going to
// another page is a link (TextLink, or a nav row like /system's); steps in a sequence are never
// tabs.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useReducedMotion, useThumb } from "@/lib/motion";
import { cx } from "@/lib/cx";

// ---------------------------------------------------------------------------------------------
// Looks: a closed set, every class written out so Tailwind sees it

// underline: a 2px line under the selected tab (an inset shadow, so it takes no space and sits
// over the row's hairline), the labels set flush with the text around them; pill: the
// dashboard's look, the selected tab filled with the primary button's solid
const variants = {
  underline: {
    list: "gap-6",
    // Each tab's hit area reaches halfway across the gap, so no click falls between two tabs
    tab: "rounded-sm before:absolute before:inset-y-0 before:-inset-x-3",
    on: "text-primary-foreground",
    off: "text-secondary-foreground enabled:hover:text-primary-foreground",
    thumb: "text-primary-foreground shadow-[inset_0_-2px_0_currentColor]",
    wear: "shadow-[inset_0_-2px_0_currentColor]",
  },
  pill: {
    list: "gap-1",
    tab: "rounded-full",
    on: "text-on-inverted-foreground",
    off: "text-secondary-foreground enabled:hover:bg-transparent-hover enabled:hover:text-primary-foreground",
    thumb: "rounded-full bg-inverted-solid",
    wear: "bg-inverted-solid",
  },
};

// Height, padding and gap per size and variant. Under 44px a tab reaches it on touch screens
// through an invisible ::after, so nothing moves (the row's py-1 leaves room for it)
const sizes = {
  md: {
    underline: "h-10 gap-1.5 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-0.5",
    pill: "h-9 gap-1.5 px-3.5 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-1",
  },
  lg: {
    underline: "h-11 gap-2",
    pill: "h-10 gap-2 px-4 pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-0.5",
  },
};

// A wrapping row's gaps: the lines sit far enough apart that a pill's 44px touch area (36px and
// 4px each side) never overlaps the line under it
const wrapGaps = {
  underline: "gap-x-6 gap-y-1",
  pill: "gap-x-1 gap-y-2",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;
type Activation = "automatic" | "manual";

// The edge fade's width, matched by the scroll that brings a tab clear of it
const FADE = 40;

// What a keyboard can land on inside a panel. A panel holding none of these is a tab stop itself
const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

// ---------------------------------------------------------------------------------------------
// State shared by the parts

type TabsState = {
  base: string;
  value: string | undefined;
  activation: Activation;
  select: (value: string) => void;
};
const TabsContext = createContext<TabsState | null>(null);
const ListContext = createContext<{ variant: Variant; size: Size; ready: boolean } | null>(null);

function useTabs(part: string) {
  const state = useContext(TabsContext);
  if (!state) throw new Error(`<${part}> must be inside <Tabs>.`);
  return state;
}

// Ids from a tab's value, made safe for an id and for aria-controls' list of ids (no spaces)
const slug = (value: string) => value.replace(/[^\w-]/g, (c) => `_${c.charCodeAt(0)}`);
const tabId = (base: string, value: string) => `${base}-tab-${slug(value)}`;
const panelId = (base: string, value: string) => `${base}-panel-${slug(value)}`;

const tabsIn = (list: HTMLElement | null) =>
  list ? Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]')) : [];

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

// ---------------------------------------------------------------------------------------------
// Tabs: the root. Holds the selection; renders a plain div for layout

type TabsProps<T extends string> = {
  /** Selection follows focus (automatic, the default), or waits for Enter / Space (manual) */
  activation?: Activation;
  onValueChange?: (value: T) => void;
  /** Layout only (margins, width, grid placement) */
  className?: string;
  children: ReactNode;
} & (
  | { /** Controlled: pair with onValueChange */ value: T; defaultValue?: never }
  | { /** Uncontrolled: the tab selected at first */ defaultValue: T; value?: never }
) &
  Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange" | "children" | "className">;

export default function Tabs<T extends string>({
  value,
  defaultValue,
  onValueChange,
  activation = "automatic",
  className,
  children,
  ...rest
}: TabsProps<T>) {
  const base = useId();
  const [own, setOwn] = useState<T | undefined>(defaultValue);
  const current = value ?? own;
  const controlled = value !== undefined;

  const select = useCallback(
    (next: string) => {
      if (next === current) return;
      if (!controlled) setOwn(next as T);
      onValueChange?.(next as T);
    },
    [current, controlled, onValueChange],
  );

  return (
    <TabsContext value={{ base, value: current, activation, select }}>
      <div className={className} {...rest}>
        {children}
      </div>
    </TabsContext>
  );
}

// ---------------------------------------------------------------------------------------------
// TabList: the row. Scrolls sideways when it doesn't fit

type Naming =
  | { /** The row's name for screen readers */ "aria-label": string; "aria-labelledby"?: never }
  | { /** The id of a visible heading that names the row */ "aria-labelledby": string; "aria-label"?: never };

type TabListProps = {
  variant?: Variant;
  size?: Size;
  /** Scroll edge to edge on phones, through the page gutter: for a row directly in a Wrapper */
  bleed?: boolean;
  /** Break onto more lines instead of scrolling sideways (a pill row with counts). Never with bleed */
  wrap?: boolean;
  ref?: Ref<HTMLDivElement>;
  /** Layout only, on the scrolling box (margins, width) */
  className?: string;
  children: ReactNode;
} & Naming &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    "children" | "className" | "role" | "aria-label" | "aria-labelledby" | "onKeyDown" | "onPointerDown" | "onPointerMove"
  >;

export function TabList({
  variant = "underline",
  size = "md",
  bleed = false,
  wrap = false,
  ref,
  className,
  children,
  ...rest
}: TabListProps) {
  const tabs = useTabs("TabList");
  const thumb = useThumb<HTMLDivElement>(tabs.value);
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const first = useRef(true);
  const [more, setMore] = useState({ start: false, end: false });
  const v = variants[variant];

  // One tab stop: the selected tab, or the first enabled one when the selection matches no tab
  // or a disabled one. Tab sets it in the server's HTML; this keeps it right after any render
  useLayoutEffect(() => {
    const all = tabsIn(thumb.ref.current);
    const stop =
      all.find((tab) => tab.hasAttribute("data-selected") && !tab.disabled) ?? all.find((tab) => !tab.disabled);
    for (const tab of all) tab.tabIndex = tab === stop ? 0 : -1;
  });

  // The selected tab is brought clear of the edge fade: at once on load and from the keyboard,
  // with a smooth scroll after a click
  useLayoutEffect(() => {
    const row = thumb.ref.current;
    const el = scroller.current;
    const tab = row?.querySelector<HTMLElement>("[data-selected]");
    const instant = first.current || reduced || row?.hasAttribute("data-keyed");
    first.current = false;
    if (!el || !tab || el.scrollWidth <= el.clientWidth) return;
    const box = el.getBoundingClientRect();
    const at = tab.getBoundingClientRect();
    const by = at.left < box.left + FADE ? at.left - box.left - FADE : at.right > box.right - FADE ? at.right - box.right + FADE : 0;
    if (by) el.scrollBy({ left: by, behavior: instant ? "auto" : "smooth" });
  }, [tabs.value, reduced, thumb.ref]);

  // Which edges have more tabs beyond them
  useEffect(() => {
    const el = scroller.current;
    const row = thumb.ref.current;
    if (!el || !row) return;
    const update = () => {
      const start = el.scrollLeft > 1;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setMore((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(row);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [thumb.ref]);
  const fade =
    more.start || more.end
      ? `linear-gradient(to right, ${more.start ? `transparent, black ${FADE}px` : "black"}, ${more.end ? `black calc(100% - ${FADE}px), transparent` : "black"})`
      : undefined;

  // data-keyed on the row turns the labels' colour fade off, so a key recolours them at once (it's
  // set before React re-renders, in the same event); a pointer brings the fade back
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    thumb.handlers.onKeyDown();
    event.currentTarget.dataset.keyed = "";
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const all = tabsIn(event.currentTarget).filter((tab) => !tab.disabled);
    if (!all.length) return;
    const focused = all.indexOf(document.activeElement as HTMLButtonElement);
    const at = Math.max(0, focused >= 0 ? focused : all.findIndex((tab) => tab.hasAttribute("data-selected")));
    const next =
      event.key === "ArrowRight"
        ? (at + 1) % all.length
        : event.key === "ArrowLeft"
          ? (at - 1 + all.length) % all.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? all.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    event.stopPropagation();
    all[next].focus();
    if (tabs.activation === "automatic" && all[next].dataset.value !== undefined) tabs.select(all[next].dataset.value);
  };
  const unkey = (event: PointerEvent<HTMLDivElement>) => {
    delete event.currentTarget.dataset.keyed;
  };

  return (
    <ListContext value={{ variant, size, ready: thumb.ready }}>
      <div
        ref={scroller}
        style={fade ? { maskImage: fade } : undefined}
        className={cx(
          "min-w-0 py-1",
          wrap ? "-mx-1 px-1" : cx("overflow-x-auto scrollbar-hide", bleed ? "-mx-4 px-4 sm:-mx-8 sm:px-8" : "-mx-1 px-1"),
          className,
        )}
      >
        <div className={cx("relative", wrap ? "w-full" : "w-max min-w-full")}>
          {variant === "underline" && (
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border-default" />
          )}
          <div
            {...rest}
            ref={(node) => {
              thumb.ref.current = node;
              setRef(ref, node);
            }}
            role="tablist"
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
            onPointerDown={(event) => {
              thumb.handlers.onPointerDown();
              unkey(event);
            }}
            onPointerMove={unkey}
            className={cx("group/tabs relative flex", wrap ? cx("flex-wrap", wrapGaps[variant]) : v.list)}
          >
            <span
              aria-hidden="true"
              data-snap={thumb.snap || undefined}
              style={thumb.style}
              className={cx(
                "pointer-events-none absolute top-0 left-0 transition-[translate,width,height] duration-200 ease-out-quint data-snap:transition-none motion-reduce:transition-none",
                v.thumb,
                !thumb.ready && "opacity-0",
              )}
            />
            {children}
          </div>
        </div>
      </div>
    </ListContext>
  );
}

// ---------------------------------------------------------------------------------------------
// Tab: one tab. A label, and optionally an icon before it and a count after it

type TabProps = {
  value: string;
  /** The label: short, one or two words */
  children: ReactNode;
  /** A decorative icon before the label (a fundations/icons component; sized to 16px here) */
  icon?: ReactNode;
  /** A number after the label, read with it ("Needs review 12") */
  count?: number;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
  /** Layout only */
  className?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "children" | "type" | "role" | "id" | "tabIndex" | "disabled" | "className" | "aria-selected" | "aria-controls"
>;

export function Tab({ value, icon, count, disabled = false, ref, className, children, onClick, ...rest }: TabProps) {
  const tabs = useTabs("Tab");
  const list = useContext(ListContext);
  if (!list) throw new Error("<Tab> must be inside <TabList>.");
  const selected = tabs.value === value;
  const v = variants[list.variant];
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="tab"
      id={tabId(tabs.base, value)}
      aria-selected={selected}
      aria-controls={panelId(tabs.base, value)}
      tabIndex={selected && !disabled ? 0 : -1}
      disabled={disabled}
      data-value={value}
      data-selected={selected || undefined}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tabs.select(value);
      }}
      className={cx(
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center text-body-sm font-medium whitespace-nowrap select-none touch-manipulation transition-[color,background-color] duration-150 ease-out-quint group-data-keyed/tabs:transition-none motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus disabled:pointer-events-none disabled:text-disabled-foreground",
        sizes[list.size][list.variant],
        v.tab,
        selected ? v.on : v.off,
        // The indicator, worn by the selected tab until the sliding one has measured
        selected && !list.ready && v.wear,
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="flex shrink-0 [&_svg]:size-4">
          {icon}
        </span>
      )}
      {children}
      {count !== undefined && <span className="font-normal tabular-nums">{count}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------------------------
// TabPanel: one tab's view, hidden unless its tab is selected. Its content is always rendered
// (in the HTML, keeping its state); for a view that's costly to render, control the value and
// render that view's children only when it's selected.
//
// The tab stop rule: a panel is a tab stop (tabIndex 0) only when it holds nothing focusable, so
// Tab from the row goes to the panel's first link or button when it has one, and to the panel
// itself when it's only text. It works this out itself, again whenever its content changes;
// pass tabIndex to decide it yourself.

type TabPanelProps = {
  value: string;
  children: ReactNode;
  tabIndex?: number;
  ref?: Ref<HTMLDivElement>;
  /** Layout only */
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "role" | "id" | "hidden" | "tabIndex">;

export function TabPanel({ value, tabIndex, ref, className, children, ...rest }: TabPanelProps) {
  const tabs = useTabs("TabPanel");
  const selected = tabs.value === value;
  const own = useRef<HTMLDivElement>(null);
  const [bare, setBare] = useState(false);

  useLayoutEffect(() => {
    const panel = own.current;
    if (!selected || !panel || tabIndex !== undefined) return;
    const check = () => setBare(!panel.querySelector(FOCUSABLE));
    check();
    const observer = new MutationObserver(check);
    observer.observe(panel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "href", "tabindex", "contenteditable"],
    });
    return () => observer.disconnect();
  }, [selected, tabIndex]);

  return (
    <div
      {...rest}
      ref={(node) => {
        own.current = node;
        setRef(ref, node);
      }}
      role="tabpanel"
      id={panelId(tabs.base, value)}
      aria-labelledby={tabId(tabs.base, value)}
      hidden={!selected}
      tabIndex={tabIndex ?? (bare ? 0 : undefined)}
      className={cx(
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus",
        className,
      )}
    >
      {children}
    </div>
  );
}
