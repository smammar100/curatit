// The site's light / dark theme: data-theme="dark" on <html> (see ThemeScript, which applies
// the saved choice before paint). "system" stores nothing and follows the OS.
import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "system";

const KEY = "theme";
const systemDark = () => matchMedia("(prefers-color-scheme: dark)").matches;

export function getThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "system";
}

export function setThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  const dark = mode === "dark" || (mode === "system" && systemDark());
  // Nothing tweens during the swap, or every colour would animate on its own clock
  root.setAttribute("data-theme-switching", "");
  if (dark) root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    if (mode === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {}
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")));
}

// Whether the page is dark right now, following data-theme as ThemeScript and setThemeMode change
// it (light while rendering on the server). For pieces that take a theme prop instead of reading
// the tokens, like the search's BorderBeam.
export function useDarkTheme() {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => observer.disconnect();
    },
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
}
