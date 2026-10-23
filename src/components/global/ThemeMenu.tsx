"use client";

// The theme menu behind ThemeToggle's button: Light, Dark and System as a radio group in the
// system's Menu (one choice on a fill that travels, the keyboard moving the highlight, Escape and
// a press outside closing it, focus back on the button after). The choice goes through
// setThemeMode, which flips data-theme on <html>, stores it (System stores nothing and follows
// the OS) and freezes transitions for two frames (data-theme-switching) so nothing tweens. Read
// only on the client (ThemeToggle loads this file on intent), so the saved choice can be read
// when it mounts. Split from ThemeToggle so the menu's code (Radix's dropdown and motion/react)
// stays out of every page's first load: the navigation is in the homepage hero's path.
import { useEffect, useRef, useState, type ReactElement } from "react";
import Menu, { MenuItemRadio, MenuRadioGroup } from "@/components/fundations/molecules/Menu";
import CircleHalf from "@/components/fundations/icons/CircleHalf";
import Moon from "@/components/fundations/icons/Moon";
import Sun from "@/components/fundations/icons/Sun";
import { getThemeMode, setThemeMode, type ThemeMode } from "./theme";

export default function ThemeMenu({
  trigger,
  defaultOpen = false,
  restoreFocus,
}: {
  /** The button that opens it (ThemeToggle's) */
  trigger: ReactElement;
  /** Open as soon as it mounts: the button was pressed before this file had arrived */
  defaultOpen?: boolean;
  /** The button's node, to put focus back on once it has been re-rendered as the menu's trigger */
  restoreFocus?: () => void;
}) {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode);
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    restoreFocus?.();
  }, [restoreFocus]);
  return (
    <Menu label="Theme" align="end" trigger={trigger} defaultOpen={defaultOpen}>
      <MenuRadioGroup
        value={mode}
        onValueChange={(next) => {
          setThemeMode(next);
          setMode(next);
        }}
      >
        <MenuItemRadio value="light" icon={<Sun />}>
          Light
        </MenuItemRadio>
        <MenuItemRadio value="dark" icon={<Moon />}>
          Dark
        </MenuItemRadio>
        <MenuItemRadio value="system" icon={<CircleHalf />}>
          System
        </MenuItemRadio>
      </MenuRadioGroup>
    </Menu>
  );
}
