"use client";

// The design system page's Light / Dark / Both switch. It sets data-system-theme on <html>
// (system.css hides the other theme's panels; "both" is no attribute) and remembers the choice
// in localStorage. The layout's inline script applies the saved choice before paint, so the
// sheets never flash both themes first. Independent of the site's own theme.
import { useEffect, useState, type KeyboardEvent } from "react";
import { useThumb } from "@/lib/motion";
import { cx } from "@/lib/cx";
import { SYSTEM_THEME_KEY } from "./topics";

const MODES = ["light", "dark", "both"] as const;
type Mode = (typeof MODES)[number];

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "both") delete root.dataset.systemTheme;
  else root.dataset.systemTheme = mode;
}

export default function ThemeModeSwitch() {
  const [mode, setMode] = useState<Mode>("both");
  const thumb = useThumb<HTMLDivElement>(mode);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(SYSTEM_THEME_KEY);
    } catch {}
    const initial: Mode = saved === "light" || saved === "dark" ? saved : "both";
    if (initial !== "both") thumb.snapNext();
    setMode(initial);
    apply(initial);
    // Leaving the design system: the attribute only matters on its pages
    return () => {
      delete document.documentElement.dataset.systemTheme;
    };
  }, [thumb.snapNext]);

  const choose = (next: Mode) => {
    setMode(next);
    apply(next);
    try {
      if (next === "both") localStorage.removeItem(SYSTEM_THEME_KEY);
      else localStorage.setItem(SYSTEM_THEME_KEY, next);
    } catch {}
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = MODES[(MODES.indexOf(mode) + step + MODES.length) % MODES.length];
    choose(next);
    thumb.ref.current?.querySelector<HTMLElement>(`[data-mode="${next}"]`)?.focus();
  };

  return (
    <div
      ref={thumb.ref}
      role="radiogroup"
      aria-label="Show specimens in"
      onKeyDown={(e) => {
        thumb.handlers.onKeyDown();
        onKeyDown(e);
      }}
      onPointerDown={thumb.handlers.onPointerDown}
      className="relative inline-flex shrink-0 rounded-lg bg-component p-0.5"
    >
      <span
        aria-hidden
        data-snap={thumb.snap || undefined}
        style={thumb.style}
        className={cx(
          "pointer-events-none absolute top-0 left-0 rounded-md bg-component-on-container-subtle shadow-sm transition-[translate,width] duration-200 ease-out-quint data-snap:transition-none motion-reduce:transition-none",
          !thumb.ready && "opacity-0",
        )}
      />
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          tabIndex={mode === m ? 0 : -1}
          data-mode={m}
          data-selected={mode === m || undefined}
          onClick={() => choose(m)}
          className={cx(
            "relative h-7 rounded-md px-3 text-body-sm font-medium capitalize transition-colors duration-150 ease-out-quint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus",
            mode === m ? "text-primary-foreground" : "text-secondary-foreground hover:text-primary-foreground",
            // Until the thumb has measured (and in the server HTML) the chosen option keeps its own fill
            mode === m && !thumb.ready && "bg-component-on-container-subtle shadow-sm",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
