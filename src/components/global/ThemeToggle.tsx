"use client";

// Fundations
import Button from "@/components/fundations/elements/Button";
// Icons
import Moon from "@/components/fundations/icons/Moon";
import Sun from "@/components/fundations/icons/Sun";
import { setThemeMode } from "./theme";

// Switches between the light and dark theme (data-theme on <html>, see ThemeScript) and
// remembers the choice. Which icon shows is decided by CSS from the attribute, so the button
// renders the same on the server and in either theme without knowing which one is on.
export default function ThemeToggle({ className }: { className?: string }) {
  return (
    <Button
      iconOnly
      size="xs"
      variant="muted"
      type="button"
      aria-label="Switch theme"
      onClick={() => setThemeMode(document.documentElement.dataset.theme === "dark" ? "light" : "dark")}
      className={className}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </Button>
  );
}
