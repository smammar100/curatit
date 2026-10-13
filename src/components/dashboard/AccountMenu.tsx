"use client";

// The account menu, after Cosmos: your avatar is the button, and it opens a panel with your
// profile, saved posts, the welcome flow again (Personalise your feed), API tokens (for MCP
// clients), contact and log out,
// then the theme (light, dark, system) and the grid
// size, both remembered on this device.
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
// Icons
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import ChatDots from "@/components/fundations/icons/ChatDots";
import SealCheck from "@/components/fundations/icons/SealCheck";
import CircleHalf from "@/components/fundations/icons/CircleHalf";
import Key from "@/components/fundations/icons/Key";
import Moon from "@/components/fundations/icons/Moon";
import SignOut from "@/components/fundations/icons/SignOut";
import Sparkle from "@/components/fundations/icons/Sparkle";
import Sun from "@/components/fundations/icons/Sun";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/components/global/theme";
import { SUPPORT_MAILTO } from "@/lib/site";
import { cx } from "@/lib/cx";
import { signOut } from "@/app/auth/actions";
import { resetAnalytics } from "@/lib/analytics";
import { Avatar, useUser } from "./user";
import { useGridSize } from "./prefs";
import { useProfile } from "./profile";

export default function AccountMenu({ savedCount, onShowSaved }: { savedCount: number; onShowSaved: () => void }) {
  const { size: gridSize, setSize: onGridSize } = useGridSize();
  const user = useUser();
  const { profile } = useProfile();
  const editor = profile.editor;
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("system");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setTheme(getThemeMode()), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const chooseTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setTheme(mode);
  };

  const item = "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-subtitle font-medium text-base-900 hover:bg-base-50";

  return (
    <div ref={ref} className="relative flex items-center">
      {/* A ring marks it as a button: on hover, and held while the menu is open */}
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          "flex rounded-full ring-offset-2 ring-offset-white transition-[box-shadow,scale] duration-150 hover:ring-2 hover:ring-base-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-base-900 active:scale-[0.96]",
          open && "ring-2 ring-base-300 hover:ring-base-300",
        )}
      >
        <Avatar className="size-11 text-body" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-3 w-80 origin-top-right animate-[menu-in_150ms_cubic-bezier(0.23,1,0.32,1)] rounded-[28px] bg-white p-3 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] dark:ring-1 dark:ring-edge motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-subtitle font-medium text-base-900">{user?.name ?? " "}</p>
              <p className="truncate text-body text-base-500">{user?.email ?? " "}</p>
            </div>
            <Avatar />
          </div>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              onShowSaved();
              setOpen(false);
            }}
          >
            <span className="flex items-center gap-2">
              Saved posts
              <span className="rounded-md bg-base-100 px-1.5 py-0.5 text-caption font-medium text-base-600 tabular-nums">{savedCount}</span>
            </span>
            <BookmarkSimple className="size-5" />
          </button>
          <Link role="menuitem" href="/dashboard/welcome" className={item} onClick={() => setOpen(false)}>
            Personalise your feed
            <Sparkle className="size-5" />
          </Link>
          {editor && (
            <Link role="menuitem" href="/dashboard/review" className={item} onClick={() => setOpen(false)}>
              Analysis review
              <SealCheck className="size-5" />
            </Link>
          )}
          <Link role="menuitem" href="/dashboard/settings/tokens" className={item} onClick={() => setOpen(false)}>
            API tokens
            <Key className="size-5" />
          </Link>
          <a role="menuitem" href={SUPPORT_MAILTO} className={item}>
            Contact us
            <ChatDots className="size-5" />
          </a>
          <form action={signOut} onSubmit={resetAnalytics}>
            <button type="submit" role="menuitem" className={item}>
              Log out
              <SignOut className="size-5" />
            </button>
          </form>

          <div className="mx-3 my-2 h-px bg-base-100" />

          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-subtitle font-medium text-base-900">Theme</span>
            <Segmented
              label="Theme"
              value={theme}
              onChange={chooseTheme}
              options={[
                { value: "light", label: "Light", icon: <Sun className="size-4" /> },
                { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
                { value: "system", label: "Match system", icon: <CircleHalf className="size-4" /> },
              ]}
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-subtitle font-medium text-base-900">Grid size</span>
            <Segmented
              label="Grid size"
              value={gridSize}
              onChange={onGridSize}
              options={[
                { value: "large", label: "Large tiles", icon: <Bars count={1} /> },
                { value: "medium", label: "Medium tiles", icon: <Bars count={2} /> },
                { value: "small", label: "Small tiles", icon: <Bars count={3} /> },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// A row of icon buttons where one is on, like a radio group
function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon: ReactNode }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-full bg-base-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(option.value)}
          className="flex size-8 items-center justify-center rounded-full text-base-500 transition-colors duration-150 hover:text-base-900 aria-checked:bg-base-900 aria-checked:text-white"
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

// One, two or three upright bars: the grid size icons
function Bars({ count }: { count: number }) {
  return (
    <span aria-hidden="true" className="flex h-3.5 items-stretch gap-[3px]">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="w-[2px] rounded-full bg-current" />
      ))}
    </span>
  );
}
