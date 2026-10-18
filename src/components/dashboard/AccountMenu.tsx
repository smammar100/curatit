"use client";

// The account menu, after Cosmos: your avatar is the button, and it opens a panel with your
// profile, saved posts, the welcome flow again (Personalise your feed), API tokens (for MCP
// clients), contact and log out,
// then the theme (light, dark, system) and the grid
// size, both remembered on this device. A disclosure rather than a role="menu" (2026-10-18): a
// menu may hold only menu items, and this panel mixes links, a form's button and two radio
// groups, so it opens in the tab order after the avatar and Tab walks through it. So it isn't the
// shared Menu (whose items are role="menuitem" and tab stops of none): it's usePopover's
// disclosure, with the shared pieces where they apply (2026-10-19): the glide highlight and row
// recipe the Menu uses (GLIDE_HIGHLIGHT, GLIDE_ROW), the Separator atom between the links and the
// settings, Badge for the count and Segmented for the two settings. The rows stay its own: they're
// links, a form's submit and buttons, full width with the icon at the far end in the subtitle
// role, which no Button size or TextLink draws, and the 28px panel radius is the account menu's.
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
import Badge from "@/components/fundations/elements/Badge";
import Segmented from "@/components/fundations/elements/Segmented";
import Separator from "@/components/fundations/elements/Separator";
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

  // Rows (and their highlight) are the panel's radius less its padding: 28 − 12 = 16
  const item = cx("flex w-full items-center justify-between gap-3 rounded-3xl px-3 py-2.5 text-left text-subtitle font-medium text-primary-foreground", GLIDE_ROW);

  return (
    <div {...popover.rootProps} className="relative flex items-center">
      {/* A ring marks it as a button: on hover, and held while the menu is open */}
      <button
        type="button"
        aria-label="Account menu"
        {...popover.triggerProps}
        className={cx(
          "flex rounded-full ring-offset-2 ring-offset-page transition-[box-shadow,scale] duration-150 ease-out-quint hover:ring-2 hover:ring-border-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-border-focus motion-safe:active:scale-[0.96]",
          popover.open && "ring-2 ring-border-strong",
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
              <p className="truncate text-subtitle font-medium text-primary-foreground">{user?.name ?? " "}</p>
              <p className="truncate text-body text-secondary-foreground">{user?.email ?? " "}</p>
            </div>
            <Avatar />
          </div>
          <div ref={glide.ref} {...glide.handlers} className="relative">
            <span aria-hidden="true" className={cx(GLIDE_HIGHLIGHT, "rounded-3xl")} style={glide.highlight.style} data-fresh={glide.highlight.fresh || undefined} />
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
                <Badge className="font-medium tabular-nums">{savedCount}</Badge>
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

          <div className="px-3 py-2">
            <Separator />
          </div>

          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-subtitle font-medium text-primary-foreground">Theme</span>
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
            <span className="text-subtitle font-medium text-primary-foreground">Grid size</span>
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
