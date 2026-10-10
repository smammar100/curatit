"use client";

// Fundations
import Button from "@/components/fundations/elements/Button";
// Icons
import Moon from "@/components/fundations/icons/Moon";
import Sun from "@/components/fundations/icons/Sun";

// Switches between the light and dark theme (data-theme on <html>, see ThemeScript) and
// remembers the choice. Which icon shows is decided by CSS from the attribute, so the button
// renders the same on the server and in either theme without knowing which one is on.
export default function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme !== "dark";
    // Nothing tweens during the swap, or every colour would animate on its own clock
    root.setAttribute("data-theme-switching", "");
    if (dark) root.dataset.theme = "dark";
    else delete root.dataset.theme;
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
    requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute("data-theme-switching")));
  };

  return (
    <Button iconOnly size="xs" variant="muted" type="button" aria-label="Switch theme" onClick={toggle} className={className}>
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </Button>
  );
}
