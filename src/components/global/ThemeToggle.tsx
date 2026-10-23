"use client";

import { useRef, useState } from "react";
// Fundations
import Button from "@/components/fundations/elements/Button";
// Icons
import Moon from "@/components/fundations/icons/Moon";
import Sun from "@/components/fundations/icons/Sun";
// The type only: the component itself is imported on intent below
import type ThemeMenuComponent from "./ThemeMenu";

// The moon and the sun share one cell, both always rendered, and the theme decides through CSS
// which one shows, so the button renders the same on the server and in either theme without
// knowing which one is on. A switch cross-fades them (the icons carry data-theme-icon, which
// the freeze on transitions during a theme switch lets through); at load they're simply in
// place, since the theme is set before paint.
const swap =
  "[grid-area:1/1] size-4 transition-[opacity,scale,filter] duration-250 ease-out-quint motion-reduce:transition-none";
// The one that isn't showing: shrunk, transparent and a little blurred
const away = "scale-50 opacity-0 blur-[2px]";

// The theme switch in both navigations. Since 2026-10-23 it opens the system's Menu with Light,
// Dark and System as radio items (ThemeMenu), in place of a tap that flipped between light and
// dark; the choice still goes through setThemeMode (global/theme.ts), which also sets
// data-theme-switching for two frames so nothing tweens. The menu's code is loaded on intent
// (pointer over the button, focus, or a tap) rather than with the page, because the navigation
// is in the homepage hero's path and the menu brings Radix's dropdown and motion/react with it;
// until it arrives the button is the plain Button below, and a tap made before then opens the
// menu as soon as it mounts. If the button had focus when the menu takes over, focus is put back
// on it.
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
      iconOnly
      size="xs"
      variant="muted"
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
        <Moon data-theme-icon className={`${swap} dark:scale-50 dark:opacity-0 dark:blur-[2px]`} />
        <Sun data-theme-icon className={`${swap} ${away} dark:scale-100 dark:opacity-100 dark:blur-none`} />
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
