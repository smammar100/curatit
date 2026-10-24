"use client";

// A search box: an Input with the Search icon inside on the left, a clear button on the right
// once there's text, and optionally the key that jumps to it (a Kbd, shown while it's empty and
// not focused). Escape clears the text and keeps focus; with nothing to clear, Escape is left
// alone, so it can still close the panel or dialog around it. For searching or filtering
// something on the page. Any other single line of text is Input; the dashboard's header search
// (its suggestions panel, the border beam) is dashboard/SearchBox, which is built for that one
// place.
//
//   size      md or lg, both 36px on the site's default step, the Input's two
//   value / defaultValue / onValueChange   controlled or uncontrolled; the value is a string
//   shortcut  one key, like "/", that focuses it from anywhere on the page except while typing
//             in another field (it isn't taken with Cmd, Ctrl or Alt held, nor while the field
//             isn't drawn). The page's other shortcuts must not use the same key; of two search
//             fields with one key, the first one drawn takes it. Read out via aria-keyshortcuts
//
// Name it: inside Field (its label), aria-labelledby, or aria-label. With none of those it's
// called "Search". It's type="search" (a searchbox to screen readers, a Search key on phone
// keyboards) without the browser's own clear button, and spellcheck and autocomplete are off.
// `className` is for layout, on the wrapper; other props and `ref` go to the <input>.
import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from "react";
import Button from "@/components/fundations/elements/Button";
import Input, { type InputProps } from "@/components/fundations/elements/Input";
import Kbd from "@/components/fundations/elements/Kbd";
import Close from "@/components/fundations/icons/Close";
import Search from "@/components/fundations/icons/Search";

export type SearchFieldProps = Omit<
  InputProps,
  "type" | "value" | "defaultValue" | "onChange" | "leadingIcon" | "trailing"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** One key that focuses the field from anywhere on the page, like "/" */
  shortcut?: string;
};

// Typing somewhere already: a shortcut key there is a character, not a jump
function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || Boolean(target.closest("input, textarea, select, [contenteditable]")))
  );
}

export default function SearchField({
  value,
  defaultValue = "",
  onValueChange,
  shortcut,
  size = "md",
  ref,
  onKeyDown,
  "aria-label": ariaLabel,
  ...rest
}: SearchFieldProps) {
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const field = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => field.current as HTMLInputElement, []);

  const change = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== shortcut || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.defaultPrevented || isEditable(event.target)) return;
      // Not drawn (display: none, like a header's phone copy): leave the key to another one
      const element = field.current;
      if (!element || element.getClientRects().length === 0) return;
      event.preventDefault();
      element.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Escape" || !current) return;
    // Taken: the browser's own clear doesn't run, and nothing around it closes on this one
    event.preventDefault();
    event.stopPropagation();
    change("");
  };

  // Its own name only when nothing else names it: aria-label would outrank a <label htmlFor>
  const named = ariaLabel ?? (rest["aria-labelledby"] || rest.id ? undefined : "Search");

  return (
    <Input
      {...rest}
      ref={field}
      size={size}
      type="search"
      enterKeyHint={rest.enterKeyHint ?? "search"}
      autoComplete={rest.autoComplete ?? "off"}
      spellCheck={rest.spellCheck ?? false}
      aria-label={named}
      aria-keyshortcuts={shortcut}
      value={current}
      onChange={(event) => change(event.target.value)}
      onKeyDown={keyDown}
      leadingIcon={<Search />}
      trailing={
        current ? (
          <Button
            size="xxs"
            variant="transparent"
            iconOnly
            aria-label="Clear search"
            // Keep the caret in the field on a click; a keyboard press puts focus back below
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              change("");
              field.current?.focus();
            }}
          >
            <Close className="size-3.5" />
          </Button>
        ) : shortcut ? (
          // Hidden while the field has focus (it's already there) and on touch screens
          <Kbd aria-hidden="true" size={size === "lg" ? "md" : "sm"} hideOnTouch className="[.peer:focus~*_&]:invisible">
            {shortcut}
          </Kbd>
        ) : undefined
      }
    />
  );
}
