"use client";

// The account menu, after Cosmos: your avatar is the button, and it opens a panel with your
// profile, saved posts, the welcome flow again (Personalise your feed), API tokens (for MCP
// clients), contact and log out,
// then the theme (light, dark, system) and the grid
// size, both remembered on this device. A disclosure rather than a role="menu" (2026-10-18): a
// menu may hold only menu items, and this panel mixes links, a form's button and two radio
// groups, so it opens in the tab order after the avatar and Tab walks through it.
import { useEffect, useState } from "react";
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
import Segmented from "@/components/fundations/elements/Segmented";
import { signOut } from "@/app/auth/actions";
import { resetAnalytics } from "@/lib/analytics";
import { Avatar, useUser } from "./user";
import { useGridSize } from "./prefs";
import { useProfile } from "./profile";
import { GLIDE_HIGHLIGHT, GLIDE_ROW, usePopover } from "./usePopover";

export default function AccountMenu({ savedCount, onShowSaved }: { savedCount: number; onShowSaved: () => void }) {
  const { size: gridSize, setSize: onGridSize } = useGridSize();
  const user = useUser();
  const { profile } = useProfile();
  const editor = profile.editor;
  const popover = usePopover("disclosure");
  const { glide } = popover;
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => setTheme(getThemeMode()), []);

  const chooseTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setTheme(mode);
  };

  const item = cx("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-subtitle font-medium text-base-900", GLIDE_ROW);

  return (
    <div {...popover.rootProps} className="relative flex items-center">
      {/* A ring marks it as a button: on hover, and held while the menu is open */}
      <button
        type="button"
        aria-label="Account menu"
        {...popover.triggerProps}
        className={cx(
          "flex rounded-full ring-offset-2 ring-offset-white transition-[box-shadow,scale] duration-150 hover:ring-2 hover:ring-base-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-base-900 active:scale-[0.96]",
          popover.open && "ring-2 ring-base-300 hover:ring-base-300",
        )}
      >
        <Avatar className="size-11 text-body" />
      </button>

      {popover.mounted && (
        <div
          {...popover.contentProps}
          className={cx("absolute top-full right-0 z-40 mt-3 w-80 origin-top-right rounded-[28px] bg-modal p-3 shadow-lg", popover.motion)}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              {/* A non-breaking space holds each line's height until the session is read */}
              <p className="truncate text-subtitle font-medium text-base-900">{user?.name ?? " "}</p>
              <p className="truncate text-body text-base-500">{user?.email ?? " "}</p>
            </div>
            <Avatar />
          </div>
          <div ref={glide.ref} {...glide.handlers} className="relative">
            <span aria-hidden="true" className={cx(GLIDE_HIGHLIGHT, "rounded-xl")} style={glide.highlight.style} data-fresh={glide.highlight.fresh || undefined} />
            <button
              type="button"
              data-glide-item
              className={item}
              onClick={() => {
                onShowSaved();
                popover.close();
              }}
            >
              <span className="flex items-center gap-2">
                Saved posts
                <span className="rounded-md bg-component px-1.5 py-0.5 text-caption font-medium text-base-600 tabular-nums">{savedCount}</span>
              </span>
              <BookmarkSimple className="size-5" />
            </button>
            <Link data-glide-item href="/dashboard/welcome" className={item} onClick={() => popover.close()}>
              Personalise your feed
              <Sparkle className="size-5" />
            </Link>
            {editor && (
              <Link data-glide-item href="/dashboard/review" className={item} onClick={() => popover.close()}>
                Analysis review
                <SealCheck className="size-5" />
              </Link>
            )}
            <Link data-glide-item href="/dashboard/settings/tokens" className={item} onClick={() => popover.close()}>
              API tokens
              <Key className="size-5" />
            </Link>
            <a data-glide-item href={SUPPORT_MAILTO} className={item}>
              Contact us
              <ChatDots className="size-5" />
            </a>
            <form action={signOut} onSubmit={resetAnalytics}>
              <button data-glide-item type="submit" className={item}>
                Log out
                <SignOut className="size-5" />
              </button>
            </form>
          </div>

          <div className="mx-3 my-2 h-px bg-border-default" />

          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-subtitle font-medium text-base-900">Theme</span>
            <Segmented
              aria-label="Theme"
              iconOnly
              size="md"
              shape="pill"
              tone="inverted"
              value={theme}
              onValueChange={chooseTheme}
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
              aria-label="Grid size"
              iconOnly
              size="md"
              shape="pill"
              tone="inverted"
              value={gridSize}
              onValueChange={onGridSize}
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
