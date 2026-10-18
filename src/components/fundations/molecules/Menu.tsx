"use client";

// A menu: a short list of actions or choices that opens from a button (2026-10-18), the
// dashboard's menus (the feed menu in Header.tsx, BoardView's More, the Save menu in boards.tsx)
// made one component. After the WAI-ARIA menu button pattern, on the dashboard's own usePopover:
// Enter, Space or ↓ opens it on the first item (the checked one in a radio group), ↑ on the last;
// ↑ / ↓ move and wrap, Home / End jump, a letter jumps to the next item starting with it; Escape
// and Shift+Tab close it and return focus to the trigger, Tab closes it and moves on; choosing an
// item closes it and returns focus to the trigger. A mouse gets the gliding highlight (useGlide);
// keyboard focus gets the row's own fill and ring, at once. It scales in from the trigger's side
// (animate-menu-in) and leaves faster (animate-menu-out), neither under reduced motion.
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
// anything with a field or more than a line of words is a Dialog. The menu is placed inside its
// own wrapper, so an ancestor with overflow (a scrolling row, a clipped card) clips it.
import Link from "next/link";
import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { GLIDE_HIGHLIGHT, GLIDE_ROW, usePopover } from "@/components/dashboard/usePopover";
import CaretDown from "@/components/fundations/icons/CaretDown";
import Check from "@/components/fundations/icons/Check";
import { cx } from "@/lib/cx";

// Where the menu opens, and the corner it grows from (the trigger's)
const placements = {
  "bottom-start": "top-full left-0 mt-2 origin-top-left",
  "bottom-end": "top-full right-0 mt-2 origin-top-right",
  "top-start": "bottom-full left-0 mb-2 origin-bottom-left",
  "top-end": "bottom-full right-0 mb-2 origin-bottom-right",
} as const;

const tones = {
  neutral: "text-primary-foreground",
  danger: "text-danger-foreground",
} as const;

// A row: the menu's radius less its padding (rounded-2xl p-1.5: 12 − 6 = rounded-md), 36px tall,
// 44 on touch screens. No hover fill of its own: the glide is the mouse's (GLIDE_ROW)
const ROW =
  "flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-body-sm select-none pointer-coarse:py-3 disabled:cursor-not-allowed disabled:text-disabled-foreground";

const ITEMS = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

type MenuContextValue = { close: (returnFocus?: boolean) => void };
const MenuContext = createContext<MenuContextValue | null>(null);

type RadioContextValue = { value: string; choose: (value: string) => void };
const RadioContext = createContext<RadioContextValue | null>(null);

type TriggerProps = {
  ref?: Ref<HTMLElement>;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

export type MenuProps = {
  /** The button that opens it, usually a Button. It's given aria-haspopup, aria-expanded,
   *  aria-controls and the toggle; its own onClick and onKeyDown run first */
  trigger: ReactElement<TriggerProps>;
  /** The menu's name for screen readers ("Board actions", "Sort by") */
  label: string;
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
  children: ReactNode;
  /** On the wrapper round the trigger and the menu, for layout only */
  className?: string;
};

export default function Menu({
  trigger,
  label,
  align = "start",
  side = "bottom",
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  className,
}: MenuProps) {
  const pop = usePopover<HTMLElement>("menu");
  const { glide } = pop;
  const controlled = open !== undefined;

  // usePopover keeps its own open state, so open / defaultOpen drive it from outside: `asked` is
  // the last value the props asked for (it's only driven when they change), `known` the state the
  // props already know about (asked for, or reported), so a change is reported once and a change
  // the props made isn't reported back to them. One effect, reporting before driving: a drive
  // lands on the next render, so a report after it in the same commit would see the old state
  const asked = useRef<boolean | undefined>(undefined);
  const known = useRef(false);
  useEffect(() => {
    if (pop.open !== known.current) {
      known.current = pop.open;
      onOpenChange?.(pop.open);
    }
    const want = controlled ? open : (asked.current ?? defaultOpen);
    if (want === asked.current) return;
    asked.current = want;
    if (want === pop.open) return;
    known.current = want;
    if (want) {
      // A click with a detail, as a pointer makes: it opens without moving focus
      pop.triggerProps.onClick({ detail: 1 } as unknown as ReactMouseEvent);
    } else {
      pop.close(pop.contentProps.ref.current?.contains(document.activeElement) ?? false);
    }
  });

  // Typeahead: a letter moves to the next item starting with it, a word typed quickly to the
  // first starting with the word; everything else is usePopover's (arrows, Home, End, Tab)
  const typed = useRef({ text: "", at: 0 });
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const printable = event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (printable && (target === event.currentTarget || target.matches(ITEMS))) {
      const fresh = event.timeStamp - typed.current.at > 500;
      const text = (fresh ? event.key : typed.current.text + event.key).toLowerCase();
      typed.current = { text, at: event.timeStamp };
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(ITEMS)).filter(
        (item) => !item.matches(":disabled, [aria-disabled='true']"),
      );
      const at = items.indexOf(target);
      const start = text.length === 1 ? at + 1 : Math.max(at, 0);
      const match = [...items.slice(start), ...items.slice(0, start)].find((item) =>
        (item.textContent ?? "").trim().toLowerCase().startsWith(text),
      );
      if (match) {
        event.preventDefault();
        match.focus();
      }
      return;
    }
    pop.contentProps.onKeyDown(event);
  };

  const own = trigger.props;
  const button = cloneElement(trigger, {
    "aria-haspopup": "menu",
    "aria-expanded": pop.triggerProps["aria-expanded"],
    "aria-controls": pop.triggerProps["aria-controls"],
    ref: mergeRefs<HTMLElement>(own.ref, pop.triggerProps.ref),
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      own.onClick?.(event);
      if (!event.defaultPrevented) pop.triggerProps.onClick(event);
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      own.onKeyDown?.(event);
      if (!event.defaultPrevented) pop.triggerProps.onKeyDown(event);
    },
  } as TriggerProps & Record<string, unknown>);

  return (
    <div {...pop.rootProps} className={cx("relative inline-flex", className)}>
      {button}
      {pop.mounted && (
        <div
          {...pop.contentProps}
          role="menu"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={cx(
            "absolute z-40 w-max max-w-72 min-w-44 rounded-2xl bg-modal p-1.5 text-primary-foreground shadow-lg outline-hidden",
            placements[`${side}-${align}`],
            pop.motion,
          )}
        >
          <div ref={glide.ref} {...glide.handlers} className="relative">
            <span
              aria-hidden="true"
              className={cx(GLIDE_HIGHLIGHT, "rounded-md")}
              style={glide.highlight.style}
              data-fresh={glide.highlight.fresh || undefined}
            />
            <MenuContext.Provider value={{ close: pop.close }}>{children}</MenuContext.Provider>
          </div>
        </div>
      )}
    </div>
  );
}

// An icon slot: 16px, in the row's colour
function ItemIcon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
      {children}
    </span>
  );
}

export type MenuItemProps = {
  children: ReactNode;
  /** Runs when it's chosen. Call event.preventDefault() to keep the menu open */
  onSelect?: (event: ReactMouseEvent<HTMLElement>) => void;
  /** Makes it a link (next/link), for an item that goes somewhere */
  href?: string;
  /** A 16px Phosphor icon before the words */
  icon?: ReactNode;
  /** danger: an action that destroys something, in red. The words must say it too */
  tone?: keyof typeof tones;
  /** Shown but can't be chosen, and skipped by the arrow keys */
  disabled?: boolean;
};

/** One action. Choosing it runs onSelect (or follows href), closes the menu and puts focus back
 *  on the trigger */
export function MenuItem({ children, onSelect, href, icon, tone = "neutral", disabled = false }: MenuItemProps) {
  const menu = useContext(MenuContext);
  const select = (event: ReactMouseEvent<HTMLElement>) => {
    onSelect?.(event);
    if (!event.defaultPrevented) menu?.close();
  };
  const classes = cx(ROW, tones[tone], GLIDE_ROW);
  const content = (
    <>
      {icon && <ItemIcon>{icon}</ItemIcon>}
      <span className="min-w-0 flex-1">{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        role="menuitem"
        tabIndex={-1}
        data-glide-item
        className={classes}
        onClick={select}
        // Space chooses an item; a link only answers Enter by itself
        onKeyDown={(event) => {
          if (event.key !== " ") return;
          event.preventDefault();
          event.currentTarget.click();
        }}
      >
        {content}
      </Link>
    );
  }
  return (
    <button type="button" role="menuitem" tabIndex={-1} data-glide-item disabled={disabled} className={classes} onClick={select}>
      {content}
    </button>
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

/** One choice out of several, inside a menu: MenuItemRadio rows with a check on the chosen one.
 *  Opening the menu from the keyboard puts focus on the chosen one */
export function MenuRadioGroup<T extends string>({ label, value, onValueChange, children }: MenuRadioGroupProps<T>) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={label ? id : undefined}>
      {label && <MenuLabel id={id}>{label}</MenuLabel>}
      <RadioContext.Provider value={{ value, choose: (next) => onValueChange(next as T) }}>{children}</RadioContext.Provider>
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
  const group = useContext(RadioContext);
  const menu = useContext(MenuContext);
  const checked = group?.value === value;
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      tabIndex={-1}
      data-glide-item
      disabled={disabled}
      className={cx(ROW, tones.neutral, GLIDE_ROW)}
      onClick={() => {
        group?.choose(value);
        menu?.close();
      }}
    >
      {icon && <ItemIcon>{icon}</ItemIcon>}
      <span className="min-w-0 flex-1">{children}</span>
      {/* Always in place, so the menu keeps its width whichever option is chosen */}
      <Check className={cx("size-3.5 shrink-0", !checked && "invisible")} />
    </button>
  );
}

/** A hairline between groups of items */
export function MenuSeparator() {
  return <div role="separator" className="mx-2.5 my-1 h-px bg-border-default" />;
}

/** A small heading over a group of items. Words only: it can't be focused or chosen */
export function MenuLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div id={id} className="px-2.5 pt-2 pb-1 text-caption-lg text-secondary-foreground select-none">
      {children}
    </div>
  );
}

/** The trigger's caret: put it in the Button's rightIcon. It turns while the menu is open (read
 *  off the trigger's aria-expanded, so it needs no state) */
export function MenuCaret() {
  return (
    <CaretDown className="size-3.5 transition-transform duration-200 ease-out-quint in-aria-expanded:rotate-180 motion-reduce:transition-none" />
  );
}
