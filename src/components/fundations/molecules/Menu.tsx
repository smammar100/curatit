"use client";

// A menu: a short list of actions or choices that opens from a button. Since 2026-10-23 it is
// Fluid Functionalism's Dropdown (src/components/ui/dropdown.tsx, on Radix's dropdown menu)
// behind the API the dashboard's menus have used since 2026-10-18: the popup is a raised surface
// two steps up the ladder with a dropdown's shadow, in a portal (so nothing clips it), entering
// on the fast spring from the trigger's side; one hover highlight glides to the row nearest the
// pointer and a click in a gap lands on the lit row; the keyboard moves the same highlight; the
// chosen radio option carries a selected fill that travels when the choice changes, and checked
// boxes merge their fills when they sit together; labels get heavier when checked without
// moving. Radix owns the roles, the roving focus, typeahead, Escape and the return of focus to
// the trigger.
//
//   <Menu label="Board actions" align="end" trigger={<Button iconOnly aria-label="More">…</Button>}>
//     <MenuItem onSelect={rename}>Rename</MenuItem>
//     <MenuSeparator />
//     <MenuItem tone="danger" onSelect={remove}>Delete board…</MenuItem>
//   </Menu>
//
// Use it for actions on one thing (Rename, Share, Delete) or one choice that's out of sight
// until asked for (Sort by). Instead: two to five options always in view are a Segmented; a value
// in a form is a native <select>; views of the same thing are Tabs; a single action is a Button;
// anything with a field or more than a line of words is a Dialog.
//
// For a list that grows with the person's data (the Save menu's boards): `heading` is a visible
// title over the items that also names the menu, the items scroll past 480px by themselves,
// `width="fixed"` holds the menu at 256px whatever the names, and `footer` is a slot after a
// hairline below the items: one MenuItem that may turn into an inline form when chosen (the Save
// menu's New board). `useMenu().close()` closes the menu from inside (the footer's form, on
// submit). `returnFocus="keyboard"` puts focus back on the trigger only when an item was chosen
// from the keyboard, for a trigger shown on hover or focus-within (a tile's Save).
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";
import {
  DropdownContent,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { MenuItem as FluidMenuItem } from "@/components/ui/menu-item";
import CaretDown from "@/components/fundations/icons/CaretDown";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";

// How wide it is: as wide as its longest item (176 to 288px), or a fixed 256px for a list of the
// person's own names, which shouldn't make the menu change width (long ones truncate). Both
// replace the library's trigger-wide default
const widths = {
  content: "w-max min-w-44 max-w-72",
  fixed: "w-64 min-w-0",
} as const;

// danger: the row's words and icon in red, whatever its state
const tones = {
  neutral: "",
  danger: "text-danger-foreground [&_span]:text-inherit [&_svg]:text-inherit",
} as const;

type CloseOptions = { fromKeyboard?: boolean };
type MenuContextValue = {
  close: (options?: CloseOptions) => void;
  /** A row's place among the popup's rows, for the hover highlight (any unique number will do) */
  nextIndex: () => number;
  /** A radio option reports itself as the chosen one, a checkbox whether it's on */
  setRadio: (index: number, checked: boolean) => void;
  setBox: (index: number, checked: boolean | null) => void;
};
const MenuContext = createContext<MenuContextValue | null>(null);

type RadioContextValue = { value: string; choose: (value: string) => void };
const RadioContext = createContext<RadioContextValue | null>(null);

function useMenuContext(part: string) {
  const menu = useContext(MenuContext);
  if (!menu) throw new Error(`<${part}> must be inside <Menu>.`);
  return menu;
}

// The library takes an icon as a component it can size; the site passes an element, so each one
// is wrapped (a 16px icon, or a 28px picture)
function asIcon(node: ReactNode, px: number): IconComponent {
  const Glyph = ({ className }: { className?: string }) => (
    <span className={cn("inline-flex shrink-0 items-center justify-center [&>svg]:size-full", className)} style={{ width: px, height: px }}>
      {node}
    </span>
  );
  return Glyph;
}

// The menu's name: for screen readers only (label), or a visible title over the items (heading)
type Naming =
  | {
      /** The menu's name for screen readers ("Board actions", "Sort by") */
      label: string;
      heading?: never;
    }
  | {
      /** A visible title over the items, which also names the menu ("Save to board") */
      heading: string;
      label?: never;
    };

export type MenuProps = Naming & {
  /** The button that opens it, usually a Button. Radix gives it aria-haspopup, aria-expanded,
   *  aria-controls and the toggle; its own handlers run too */
  trigger: ReactElement;
  /** Which edge of the trigger it lines up with */
  align?: "start" | "end";
  /** Below the trigger, or above it (near the bottom of the screen) */
  side?: "bottom" | "top";
  /** Controlled: pair with onOpenChange */
  open?: boolean;
  /** Uncontrolled: open on the first render */
  defaultOpen?: boolean;
  /** Called whenever it opens or closes by itself (the trigger, an item, Escape, a press outside) */
  onOpenChange?: (open: boolean) => void;
  /** content (default): as wide as the longest item, 176–288px. fixed: 256px, for the person's
   *  own names (boards), which truncate */
  width?: keyof typeof widths;
  /** Accepted for older call sites: the items always scroll once they pass the popup's height */
  scrollable?: boolean;
  /** After a hairline below the items: one MenuItem, which may turn into an inline form when
   *  chosen (New board) */
  footer?: ReactNode;
  /** After an item is chosen, focus goes back to the trigger: always (default), or only when it
   *  was chosen from the keyboard (a trigger revealed on hover or focus-within) */
  returnFocus?: "always" | "keyboard";
  children: ReactNode;
  /** On the trigger's wrapper, for layout only */
  className?: string;
};

export default function Menu({
  trigger,
  label,
  heading,
  align = "start",
  side = "bottom",
  open,
  defaultOpen = false,
  onOpenChange,
  width = "content",
  scrollable: _scrollable,
  footer,
  returnFocus = "always",
  children,
  className,
}: MenuProps) {
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = open ?? own;
  const headingId = useId();
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setOwn(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );

  // Whether focus should go back to the trigger when this close lands: the keyboard closes
  // always return it, a pointer's only when returnFocus asks for it
  const restore = useRef(true);
  const counter = useRef(0);
  const [radio, setRadioIndex] = useState<number | undefined>(undefined);
  const [boxes, setBoxes] = useState<Map<number, boolean>>(() => new Map());
  // Each open starts the row count again (the rows unmount with the popup after its exit)
  useEffect(() => {
    if (!isOpen) counter.current = 0;
  }, [isOpen]);

  const menu = useMemo<MenuContextValue>(
    () => ({
      close: ({ fromKeyboard = true } = {}) => {
        restore.current = returnFocus === "always" || fromKeyboard;
        setOpen(false);
      },
      nextIndex: () => counter.current++,
      setRadio: (index, checked) =>
        setRadioIndex((current) => (checked ? index : current === index ? undefined : current)),
      setBox: (index, checked) =>
        setBoxes((current) => {
          if (checked === null ? !current.has(index) : current.get(index) === checked) return current;
          const next = new Map(current);
          if (checked === null) next.delete(index);
          else next.set(index, checked);
          return next;
        }),
    }),
    [returnFocus, setOpen],
  );
  const checkedIndices = useMemo(
    () => (boxes.size ? [...boxes].filter(([, on]) => on).map(([index]) => index) : undefined),
    [boxes],
  );

  return (
    <MotionConfig reducedMotion="user">
      <MenuContext.Provider value={menu}>
        <DropdownMenu
          open={isOpen}
          onOpenChange={(next) => {
            // Radix closing it (Escape, a press outside, an item): always a keyboard-like close
            if (!next) restore.current = true;
            setOpen(next);
          }}
        >
          <span className={cn("relative inline-flex", className)}>
            <DropdownTrigger render={trigger} />
          </span>
          <DropdownContent
            side={side}
            align={align}
            sideOffset={8}
            aria-label={heading ? undefined : label}
            aria-labelledby={heading ? headingId : undefined}
            checkedIndex={radio}
            checkedIndices={checkedIndices}
            onCloseAutoFocus={(event) => {
              if (!restore.current) event.preventDefault();
              restore.current = true;
            }}
            className={widths[width]}
          >
            {heading && <DropdownLabel id={headingId}>{heading}</DropdownLabel>}
            {children}
            {footer && (
              <>
                <DropdownSeparator />
                {footer}
              </>
            )}
          </DropdownContent>
        </DropdownMenu>
      </MenuContext.Provider>
    </MotionConfig>
  );
}

/** From inside a menu: `close()` closes it, with focus back on the trigger (unless
 *  `fromKeyboard: false` and the menu's returnFocus is "keyboard"). For the footer's inline
 *  form, on submit */
export function useMenu() {
  const menu = useContext(MenuContext);
  if (!menu) throw new Error("useMenu outside Menu");
  return { close: menu.close };
}

/** A row's stable place among the rows, taken once when it mounts */
function useRowIndex(menu: MenuContextValue) {
  const [index] = useState(() => menu.nextIndex());
  return index;
}

// The words, with a 28px picture or a 16px icon before them
function useRowIcon(icon: ReactNode | undefined, media: ReactNode | undefined) {
  return useMemo(() => (media ? asIcon(media, 28) : icon ? asIcon(icon, 16) : undefined), [icon, media]);
}
// A row with a picture is 44px tall; the library's compact row is 28
const MEDIA_ROW = "h-11";

export type MenuItemProps = {
  children: ReactNode;
  /** Runs when it's chosen. Call event.preventDefault() to keep the menu open */
  onSelect?: (event: ReactMouseEvent<HTMLElement>) => void;
  /** Goes somewhere when chosen (a client-side navigation) */
  href?: string;
  /** A 16px Phosphor icon before the words */
  icon?: ReactNode;
  /** A 28px picture before the words in place of an icon (a board's cover, a plus tile) */
  media?: ReactNode;
  /** danger: an action that destroys something, in red. The words must say it too */
  tone?: keyof typeof tones;
  /** Shown but can't be chosen, and skipped by the arrow keys */
  disabled?: boolean;
};

/** One action. Choosing it runs onSelect (or follows href), closes the menu and puts focus back
 *  on the trigger. The words must be a string: the library sets them in its own weight */
export function MenuItem({ children, onSelect, href, icon, media, tone = "neutral", disabled = false }: MenuItemProps) {
  const menu = useMenuContext("MenuItem");
  const index = useRowIndex(menu);
  const router = useRouter();
  const Icon = useRowIcon(icon, media);
  return (
    <FluidMenuItem
      index={index}
      label={typeof children === "string" ? children : ""}
      icon={Icon}
      disabled={disabled}
      closeOnClick={false}
      onClick={(event) => {
        onSelect?.(event);
        if (event.defaultPrevented) return;
        if (href) router.push(href);
        // Enter and Space click with no detail: that's the keyboard
        menu.close({ fromKeyboard: event.detail === 0 });
      }}
      className={cn(tones[tone], media && MEDIA_ROW)}
    >
      {typeof children === "string" ? undefined : children}
    </FluidMenuItem>
  );
}

export type MenuRadioGroupProps<T extends string> = {
  /** A visible heading over the options, which names the group. Leave it out when the menu's own
   *  label says it (a menu that's only "Sort by") */
  label?: string;
  /** Always controlled: the menu's contents unmount when it closes, so the choice lives with the page */
  value: T;
  onValueChange: (value: T) => void;
  children: ReactNode;
};

/** One choice out of several, inside a menu: MenuItemRadio rows, the chosen one on a fill that
 *  travels to the next choice */
export function MenuRadioGroup<T extends string>({ label, value, onValueChange, children }: MenuRadioGroupProps<T>) {
  const id = useId();
  const group = useMemo<RadioContextValue>(
    () => ({ value, choose: (next) => onValueChange(next as T) }),
    [value, onValueChange],
  );
  return (
    <div role="group" aria-labelledby={label ? id : undefined} className="contents">
      {label && <DropdownLabel id={id}>{label}</DropdownLabel>}
      <RadioContext.Provider value={group}>{children}</RadioContext.Provider>
    </div>
  );
}

export type MenuItemRadioProps = {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

/** An option in a MenuRadioGroup. Choosing it sets the group's value and closes the menu */
export function MenuItemRadio({ value, children, icon, disabled = false }: MenuItemRadioProps) {
  const menu = useMenuContext("MenuItemRadio");
  const group = useContext(RadioContext);
  const index = useRowIndex(menu);
  const checked = group?.value === value;
  const Icon = useRowIcon(icon, undefined);
  useEffect(() => {
    menu.setRadio(index, checked);
  }, [menu, index, checked]);
  return (
    <FluidMenuItem
      index={index}
      label={typeof children === "string" ? children : ""}
      icon={Icon}
      checked={checked}
      disabled={disabled}
      closeOnClick={false}
      onClick={(event) => {
        group?.choose(value);
        menu.close({ fromKeyboard: event.detail === 0 });
      }}
    >
      {typeof children === "string" ? undefined : children}
    </FluidMenuItem>
  );
}

export type MenuItemCheckboxProps = {
  /** Whether it's on. Always controlled, like the radio group */
  checked: boolean;
  /** Called with the new value, then the menu closes; event.preventDefault() keeps it open
   *  (several things to turn on in a row) */
  onCheckedChange: (checked: boolean, event: ReactMouseEvent<HTMLElement>) => void;
  children: ReactNode;
  icon?: ReactNode;
  /** A 28px picture before the words in place of an icon (a board's cover) */
  media?: ReactNode;
  disabled?: boolean;
};

/** One thing to turn on or off (a post on a board): a check while it's on, and choosing it flips
 *  it. Closes the menu like an item, unless onCheckedChange prevents the event. Rows that are on
 *  next to each other share one fill */
export function MenuItemCheckbox({ checked, onCheckedChange, children, icon, media, disabled = false }: MenuItemCheckboxProps) {
  const menu = useMenuContext("MenuItemCheckbox");
  const index = useRowIndex(menu);
  const Icon = useRowIcon(icon, media);
  useEffect(() => {
    menu.setBox(index, checked);
    return () => menu.setBox(index, null);
  }, [menu, index, checked]);
  return (
    <FluidMenuItem
      index={index}
      label={typeof children === "string" ? children : ""}
      icon={Icon}
      checked={checked}
      disabled={disabled}
      closeOnClick={false}
      onClick={(event) => {
        onCheckedChange(!checked, event);
        if (!event.defaultPrevented) menu.close({ fromKeyboard: event.detail === 0 });
      }}
      className={cn("[&_span]:truncate", media && MEDIA_ROW)}
    >
      {typeof children === "string" ? undefined : children}
    </FluidMenuItem>
  );
}

/** A line in place of the items while there's nothing to choose yet ("Loading your boards…").
 *  Words only: it can't be focused or chosen */
export function MenuMessage({ children }: { children: ReactNode }) {
  return <DropdownLabel className="text-body-sm">{children}</DropdownLabel>;
}

/** A hairline between groups of items */
export function MenuSeparator() {
  return <DropdownSeparator />;
}

/** A small heading over a group of items. Words only: it can't be focused or chosen */
export function MenuLabel({ children, id }: { children: ReactNode; id?: string }) {
  return <DropdownLabel id={id}>{children}</DropdownLabel>;
}

/** The trigger's caret: put it in the Button's rightIcon. It turns while the menu is open (read
 *  off the trigger's aria-expanded, so it needs no state) */
export function MenuCaret() {
  return (
    <CaretDown className="size-3.5 transition-transform duration-200 ease-out-quint in-aria-expanded:rotate-180 motion-reduce:transition-none" />
  );
}
