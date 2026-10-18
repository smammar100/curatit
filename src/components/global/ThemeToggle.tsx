"use client";

import { useId } from "react";
// Fundations
import Button from "@/components/fundations/elements/Button";
// Icons
import Moon from "@/components/fundations/icons/Moon";
import Sun from "@/components/fundations/icons/Sun";
import { setThemeMode } from "./theme";

// The moon and the sun share one cell, both always rendered, and the theme decides through CSS
// which one shows, so the button renders the same on the server and in either theme without
// knowing which one is on. A switch cross-fades them (the icons carry data-theme-icon, which
// the freeze on transitions during a theme switch lets through); at load they're simply in
// place, since the theme is set before paint.
const swap =
  "[grid-area:1/1] size-4 transition-[opacity,scale,filter] duration-250 ease-out-quint motion-reduce:transition-none";
// The one that isn't showing: shrunk, transparent and a little blurred
const away = "scale-50 opacity-0 blur-[2px]";

// Switches between the light and dark theme (data-theme on <html>, see ThemeScript) and
// remembers the choice. Its name says where it goes ("Switch to dark theme"), picked by the same
// CSS: the label wrapper is what aria-labelledby points at, and the line for the other theme is
// display: none, so it's left out of the name.
export default function ThemeToggle({ className }: { className?: string }) {
  const labelId = useId();
  return (
    <Button
      iconOnly
      size="xs"
      variant="muted"
      aria-labelledby={labelId}
      onClick={() => setThemeMode(document.documentElement.dataset.theme === "dark" ? "light" : "dark")}
      className={className}
    >
      <span id={labelId} className="sr-only">
        <span className="dark:hidden">Switch to dark theme</span>
        <span className="hidden dark:inline">Switch to light theme</span>
      </span>
      <span className="grid">
        <Moon data-theme-icon className={`${swap} dark:scale-50 dark:opacity-0 dark:blur-[2px]`} />
        <Sun data-theme-icon className={`${swap} ${away} dark:scale-100 dark:opacity-100 dark:blur-none`} />
      </span>
    </Button>
  );
}
