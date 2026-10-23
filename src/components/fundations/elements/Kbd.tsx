import type { HTMLAttributes, ReactNode } from "react";
import Command from "@/components/fundations/icons/Command";
import { cn } from "@/lib/utils";

// A key to press, drawn as a key cap: the search box's "/" (dashboard/SearchBox.tsx), a menu
// row's shortcut, "Press ⌘ K" in a sentence. It only shows a key; it never takes a click, a
// focus or a hover. Something to press with the mouse is a Button; a code value to copy is
// CopyBlock or a <code>.
//
// One key: children (<Kbd>/</Kbd>). A combination: `keys`, each in its own cap, inside one
// <kbd> as HTML nests them. Named keys are drawn as their symbol and read by name: "cmd" is
// Phosphor's Command glyph, read "Command"; "shift" ⇧, "option" ⌥, "ctrl", "enter" ↵, "esc",
// the arrows. Single letters are capitalised. ⌘ and ⌥ are Mac keys: on Windows the same
// shortcut is Ctrl and Alt, and a server component can't tell which the visitor has, so the
// caller decides (and keeps the binding in step).
//
// `hideOnTouch` hides it on touch screens, where there's no keyboard to press it on.
//
// Since 2026-10-23 a cap is drawn as Fluid Functionalism's CommandMenu draws its shortcuts: the
// hover tint, no stroke, 5px corners, the micro role in the muted ink.

// Sizes: sm 16 (the compact step: in a menu row, beside 12px text), md 20 (the default step: the
// search box's cap)
const sizes = {
  sm: "h-4 min-w-4 px-1 text-[length:var(--fs-micro-compact,10px)] leading-[var(--lh-micro-compact,12px)]",
  md: "h-5 min-w-5 px-1 text-[length:var(--fs-micro,11px)] leading-[var(--lh-micro,14px)]",
} as const;
const iconSizes = {
  sm: "size-2.5",
  md: "size-3",
} as const;

// What a named key shows, and what a screen reader says for it
const NAMED: Record<string, { show: string; say: string }> = {
  shift: { show: "⇧", say: "Shift" },
  option: { show: "⌥", say: "Option" },
  alt: { show: "Alt", say: "Alt" },
  ctrl: { show: "Ctrl", say: "Control" },
  enter: { show: "↵", say: "Enter" },
  esc: { show: "Esc", say: "Escape" },
  tab: { show: "Tab", say: "Tab" },
  space: { show: "Space", say: "Space" },
  backspace: { show: "⌫", say: "Backspace" },
  up: { show: "↑", say: "Up arrow" },
  down: { show: "↓", say: "Down arrow" },
  left: { show: "←", say: "Left arrow" },
  right: { show: "→", say: "Right arrow" },
};
// Other spellings of the same keys, symbols included (a bare "⇧" would be read as an arrow)
const ALIASES: Record<string, string> = {
  "⇧": "shift",
  opt: "option",
  "⌥": "option",
  control: "ctrl",
  "⌃": "ctrl",
  return: "enter",
  "↵": "enter",
  escape: "esc",
  "⌫": "backspace",
  "↑": "up",
  "↓": "down",
  "←": "left",
  "→": "right",
};

const cap =
  "inline-flex items-center justify-center rounded-[5px] bg-hover font-sans whitespace-nowrap text-muted-foreground";

type Content =
  | { /** One key: its label as children */ children: ReactNode; keys?: never }
  | {
      /** A combination, pressed together: "cmd", "shift", "k" */
      keys: readonly string[];
      children?: never;
    };

export type KbdProps = Content &
  Omit<HTMLAttributes<HTMLElement>, "children" | "onClick" | "tabIndex"> & {
    size?: keyof typeof sizes;
    /** Hidden on touch screens (no keyboard there) */
    hideOnTouch?: boolean;
  };

function Key({ name, size }: { name: string; size: keyof typeof sizes }) {
  const lower = name.toLowerCase();
  const key = ALIASES[lower] ?? lower;
  if (key === "cmd" || key === "command" || key === "⌘") {
    return (
      <kbd className={cn(cap, sizes[size])}>
        <Command className={iconSizes[size]} />
        <span className="sr-only">Command</span>
      </kbd>
    );
  }
  const named = NAMED[key];
  return (
    <kbd className={cn(cap, sizes[size])}>
      {named ? (
        <>
          <span aria-hidden="true">{named.show}</span>
          <span className="sr-only">{named.say}</span>
        </>
      ) : name.length === 1 ? (
        name.toLocaleUpperCase()
      ) : (
        name
      )}
    </kbd>
  );
}

export default function Kbd({ size = "md", hideOnTouch = false, keys, children, className, ...rest }: KbdProps) {
  // relative: holds the visually hidden names, so they can't widen a scrolling row
  const root = cn("relative", hideOnTouch && "pointer-coarse:hidden", className);

  if (keys) {
    return (
      <kbd {...rest} className={cn("inline-flex items-center gap-0.5", root)}>
        {keys.map((name, i) => (
          <span key={`${name}-${i}`} className="contents">
            {i > 0 && <span className="sr-only"> plus </span>}
            <Key name={name} size={size} />
          </span>
        ))}
      </kbd>
    );
  }

  return (
    <kbd {...rest} className={cn(cap, sizes[size], root)}>
      {children}
    </kbd>
  );
}
