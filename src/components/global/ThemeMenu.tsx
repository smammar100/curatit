"use client";

// The theme menu behind ThemeToggle's button: Light, Dark and System as a radio group in Glaze's
// DropdownMenu (a check on the choice, the keyboard moving the highlight, Escape and a press
// outside closing it, focus back on the button after). The choice goes through setThemeMode,
// which flips data-theme on <html>, stores it (System stores nothing and follows the OS) and
// freezes transitions for two frames (data-theme-switching) so nothing tweens. Read only on the
// client (ThemeToggle loads this file on intent), so the saved choice can be read when it mounts.
// Split from ThemeToggle so the menu's code (Base UI's menu) stays out of every page's first
// load: the navigation is in the homepage hero's path.
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/glaze/ui/dropdown-menu";
import { CircleHalf, Dark, Icon, Light } from "@/components/glaze/icon";
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
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" size="sm" aria-label="Theme">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(next) => {
            setThemeMode(next as ThemeMode);
            setMode(next as ThemeMode);
          }}
        >
          <DropdownMenuRadioItem value="light">
            <Icon icon={Light} />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Icon icon={Dark} />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Icon icon={CircleHalf} />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
