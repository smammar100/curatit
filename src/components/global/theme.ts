// The site's light / dark theme: data-theme="dark" on <html> (see ThemeScript, which applies
// the saved choice before paint). "system" stores nothing and follows the OS.
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
