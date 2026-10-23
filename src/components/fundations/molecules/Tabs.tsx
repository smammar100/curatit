"use client";

// Tabs: views of the same thing, one at a time. Since 2026-10-23 the row is Fluid
// Functionalism's TabsSubtle (src/components/ui/tabs-subtle.tsx, on Radix's tabs) behind the
// compound API the dashboard and the MCP page have used since 2026-10-18:
//
//   <Tabs defaultValue="breakdown">
//     <TabList aria-label="Creative breakdown">
//       <Tab value="breakdown">Breakdown</Tab>
//       <Tab value="visual">Visual DNA</Tab>
//     </TabList>
//     <TabPanel value="breakdown">…</TabPanel>
//     <TabPanel value="visual">…</TabPanel>
//   </Tabs>
//
// The selected tab sits on a pressed pill that travels to the next choice on the moderate
// spring; a faint hover pill previews the next click and glides to the tab nearest the pointer
// (it dims the selected one while it does); one focus ring springs between tabs from the
// keyboard; the selected label gets heavier without moving its neighbours. Radix owns the roles,
// the roving tabindex and ← / → / Home / End; selection follows focus by default (the arrows turn
// the tabs and mark the key handled, which PostView's own arrows check), or with
// activation="manual" the arrows move focus only and Enter or Space selects. The row scrolls
// sideways when it doesn't fit. The panels stay mounted (hidden), so a view keeps its state.
//
// Use it for views of one thing. A setting with a few short values is Segmented; going to
// another page is a link (TextLink, or a nav row like /system's); steps in a sequence are never
// tabs.
import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { MotionConfig } from "motion/react";
import { TabsSubtle, TabsSubtleItem } from "@/components/ui/tabs-subtle";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";

type Activation = "automatic" | "manual";

// What a keyboard can land on inside a panel. A panel holding none of these is a tab stop itself
const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

type TabsState = {
  base: string;
  activation: Activation;
  value: string | undefined;
  /** The tabs' values in order, reported by the TabList, so a value maps to the library's index */
  order: string[];
  setOrder: (order: string[]) => void;
  select: (value: string) => void;
};
const TabsContext = createContext<TabsState | null>(null);

function useTabs(part: string) {
  const state = useContext(TabsContext);
  if (!state) throw new Error(`<${part}> must be inside <Tabs>.`);
  return state;
}

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

// The library takes an icon as a component it can size; the site passes an element
function asIcon(node: ReactNode): IconComponent {
  const Glyph = ({ size = 14, className }: { size?: number; className?: string }) => (
    <span className={cn("inline-flex shrink-0 [&>svg]:size-full", className)} style={{ width: size, height: size }}>
      {node}
    </span>
  );
  return Glyph;
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
  activation = "automatic",
  onValueChange,
  className,
  children,
  ...rest
}: TabsProps<T>) {
  const base = useId();
  const [own, setOwn] = useState<string | undefined>(defaultValue);
  const current = value ?? own;
  const [order, setOrderState] = useState<string[]>([]);
  // Keep the current array when the order is unchanged, so a TabList re-reporting the same tabs
  // doesn't re-render the whole root
  const setOrder = useCallback((next: string[]) => {
    setOrderState((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next));
  }, []);
  const select = useCallback(
    (next: string) => {
      if (value === undefined) setOwn(next);
      onValueChange?.(next as T);
    },
    [value, onValueChange],
  );
  const state = useMemo<TabsState>(
    () => ({ base, activation, value: current, order, setOrder, select }),
    [base, activation, current, order, setOrder, select],
  );
  return (
    <TabsContext.Provider value={state}>
      <div {...rest} className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ---------------------------------------------------------------------------------------------
// TabList: the row

type Naming =
  | { /** The row's name for screen readers */ "aria-label": string; "aria-labelledby"?: never }
  | { /** The id of a visible heading that names the row */ "aria-labelledby": string; "aria-label"?: never };

type TabListProps = {
  /** Accepted for older call sites: every row is the library's pills */
  variant?: "underline" | "pill";
  /** Accepted for older call sites: the row follows the site's size step */
  size?: "md" | "lg";
  /** Scroll edge to edge on phones, through the page gutter: for a row directly in a Wrapper */
  bleed?: boolean;
  /** Break onto more lines instead of scrolling sideways (a pill row with counts). Never with bleed */
  wrap?: boolean;
  ref?: Ref<HTMLDivElement>;
  /** Layout only, on the row (margins, width) */
  className?: string;
  children: ReactNode;
} & Naming &
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "role" | "aria-label" | "aria-labelledby">;

export function TabList({
  variant: _variant,
  size: _size,
  bleed = false,
  wrap = false,
  ref,
  className,
  children,
  ...rest
}: TabListProps) {
  const tabs = useTabs("TabList");
  // The tabs' values, in order, from the children; the root maps the selection through them
  const items = Children.toArray(children).filter(isValidElement) as ReactElementWithValue[];
  const values = items.map((child) => child.props.value).filter((v): v is string => typeof v === "string");
  const key = JSON.stringify(values);
  const { setOrder } = tabs;
  useLayoutEffect(() => {
    setOrder(JSON.parse(key) as string[]);
  }, [setOrder, key]);
  const selected = tabs.value !== undefined ? values.indexOf(tabs.value) : -1;
  return (
    <MotionConfig reducedMotion="user">
      <TabsSubtle
        {...rest}
        ref={ref}
        idPrefix={tabs.base}
        activationMode={tabs.activation}
        selectedIndex={selected}
        onSelect={(index) => {
          const next = values[index];
          if (next !== undefined) tabs.select(next);
        }}
        className={cn(wrap && "flex-wrap overflow-visible", bleed && "-mx-4 px-4 sm:-mx-8 sm:px-8", className)}
      >
        {items.map((child, index) => cloneElement(child, { _index: index } as Record<string, unknown>))}
      </TabsSubtle>
    </MotionConfig>
  );
}
type ReactElementWithValue = React.ReactElement<{ value?: string }>;

// ---------------------------------------------------------------------------------------------
// Tab: one tab. A label, and optionally an icon before it and a count after it

type TabProps = {
  value: string;
  /** The label: short, one or two words */
  children: ReactNode;
  /** A decorative icon before the label (a fundations/icons component; sized to 14px here) */
  icon?: ReactNode;
  /** A number after the label, read with it ("Needs review 12") */
  count?: number;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
  /** Layout only */
  className?: string;
  /** @internal Set by TabList */
  _index?: number;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "children" | "type" | "role" | "id" | "tabIndex" | "disabled" | "className" | "aria-selected" | "aria-controls"
>;

export function Tab({ value, icon, count, disabled = false, ref, className, children, _index = 0, ...rest }: TabProps) {
  useTabs("Tab");
  const Icon = useMemo(() => (icon ? asIcon(icon) : undefined), [icon]);
  return (
    <TabsSubtleItem
      {...rest}
      ref={ref}
      index={_index}
      icon={Icon}
      disabled={disabled}
      data-value={value}
      className={cn("shrink-0 whitespace-nowrap", className)}
      label={
        count === undefined ? (
          children
        ) : (
          <>
            {children}
            <span className="ml-1.5 tabular-nums" style={{ fontVariationSettings: "'wght' 400, 'opsz' 14" }}>
              {count}
            </span>
          </>
        )
      }
    />
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
  const index = tabs.order.indexOf(value);
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
      id={`${tabs.base}-panel-${index}`}
      aria-labelledby={`${tabs.base}-tab-${index}`}
      hidden={!selected}
      tabIndex={tabIndex ?? (bare ? 0 : undefined)}
      className={cn("rounded-[8px] outline-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]", className)}
    >
      {children}
    </div>
  );
}
