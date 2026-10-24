"use client";

// The design system page's Light / Dark / Both switch. It sets data-system-theme on <html>
// (system.css hides the other theme's panels; "both" is no attribute) and remembers the choice
// in localStorage. The layout's inline script applies the saved choice before paint, so the
// sheets never flash both themes first. Independent of the site's own theme.
import { useEffect, useState } from "react";
import { SegmentedControl, SegmentedControlItem } from "@/components/glaze/ui/segmented-control";
import { SYSTEM_THEME_KEY } from "./topics";

const MODES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "both", label: "Both" },
] as const;
type Mode = (typeof MODES)[number]["value"];

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "both") delete root.dataset.systemTheme;
  else root.dataset.systemTheme = mode;
}

export default function ThemeModeSwitch() {
  const [mode, setMode] = useState<Mode>("both");
  // The saved choice arrives after mount; the control remounts with it, so its thumb starts
  // there instead of sliding across on load
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(SYSTEM_THEME_KEY);
    } catch {}
    const initial: Mode = saved === "light" || saved === "dark" ? saved : "both";
    setMode(initial);
    setRestored(true);
    apply(initial);
    // Leaving the design system: the attribute only matters on its pages
    return () => {
      delete document.documentElement.dataset.systemTheme;
    };
  }, []);

  const choose = (next: Mode) => {
    setMode(next);
    apply(next);
    try {
      if (next === "both") localStorage.removeItem(SYSTEM_THEME_KEY);
      else localStorage.setItem(SYSTEM_THEME_KEY, next);
    } catch {}
  };

  return (
    <SegmentedControl
      key={restored ? "restored" : "initial"}
      aria-label="Show specimens in"
      value={mode}
      onValueChange={(value) => choose(value as Mode)}
    >
      {MODES.map((m) => (
        <SegmentedControlItem key={m.value} value={m.value}>
          {m.label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
