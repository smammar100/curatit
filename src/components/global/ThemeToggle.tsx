"use client";

import { useRef, useState } from "react";
// Glaze
import { Button } from "@/components/glaze/ui/button";
import { Dark, Icon, Light } from "@/components/glaze/icon";
// The type only: the component itself is imported on intent below
import type ThemeMenuComponent from "./ThemeMenu";

// The moon and the sun share one cell, both always rendered, and the theme decides through CSS
// which one shows (the `in-data-[theme=dark]` variant reads <html>'s data-theme), so the button
// renders the same on the server and in either theme without knowing which one is on. A switch
// cross-fades them (the icons carry data-theme-icon, which the freeze on transitions during a
// theme switch lets through); at load they're simply in place, since the theme is set before
// paint. Glaze has no blur, so the one leaving shrinks and fades.
const swap =
  "[grid-area:1/1] transition-[opacity,scale] duration-(--dur-overlay) ease-out motion-reduce:transition-none";
// The one that isn't showing: shrunk and transparent
const away = "scale-50 opacity-0";

// The theme switch in both navigations. It opens Glaze's DropdownMenu with Light, Dark and System
// as radio items (ThemeMenu); the choice goes through setThemeMode (global/theme.ts), which also
// sets data-theme-switching for two frames so nothing tweens. The menu's code is loaded on intent
// (pointer over the button, focus, or a tap) rather than with the page, because the navigation
// is in the homepage hero's path and the menu brings Base UI's menu with it; until it arrives
// the button is the plain ghost icon Button below, and a tap made before then opens the menu as
// soon as it mounts. If the button had focus when the menu takes over, focus is put back on it.
export default function ThemeToggle({ className }: { className?: string }) {
  const [ThemeMenu, setThemeMenu] = useState<typeof ThemeMenuComponent | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const loading = useRef(false);
  const wanted = useRef(false);
  const hadFocus = useRef(false);

  const load = () => {
    if (loading.current) return;
    loading.current = true;
    import("./ThemeMenu").then((module) => {
      hadFocus.current = document.activeElement === button.current;
      setThemeMenu(() => module.default);
    });
  };

  const trigger = (
    <Button
      ref={button}
      size="icon-sm"
      variant="ghost"
      aria-label="Theme"
      onPointerEnter={load}
      onFocus={load}
      onClick={() => {
        wanted.current = true;
        load();
      }}
      className={className}
    >
      <span className="grid">
        <Icon icon={Dark} data-theme-icon className={`${swap} in-data-[theme=dark]:scale-50 in-data-[theme=dark]:opacity-0`} />
        <Icon icon={Light} data-theme-icon className={`${swap} ${away} in-data-[theme=dark]:scale-100 in-data-[theme=dark]:opacity-100`} />
      </span>
    </Button>
  );

  if (!ThemeMenu) return trigger;
  return (
    <ThemeMenu
      trigger={trigger}
      defaultOpen={wanted.current}
      restoreFocus={() => {
        if (hadFocus.current) button.current?.focus();
      }}
    />
  );
}
