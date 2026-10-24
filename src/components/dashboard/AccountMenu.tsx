"use client";

// The account menu, after Cosmos: your avatar is the button, and it opens a menu with your
// profile, saved posts, the welcome flow again (Personalise your feed), the analysis review (for
// editors), API tokens (for MCP clients), contact and log out, then the theme (light, dark,
// system) and the grid size, both remembered on this device. Since 2026-10-24 it is Glaze's
// DropdownMenu: the trigger is a ghost icon Button holding the Avatar, the name and email a label
// at the top, the pages LinkItems (so they open in a new tab too), every row with its glyph at the
// end (as the menu was before Glaze, at the owner's request), and the two settings as rows with a segmented switch each (icons, named for screen
// readers; picking one keeps the menu open so the change shows behind it).
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/glaze/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSegment,
  DropdownMenuSegmented,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/glaze/ui/dropdown-menu";
import { Bookmark, ChatDots, CircleHalf, Dark, Icon, Key, Light, SealCheck, SignOut, Sparkle, SquaresFour, TileLarge, TileSmall } from "@/components/glaze/icon";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/components/global/theme";
import { SUPPORT_MAILTO } from "@/lib/site";
import { signOut } from "@/app/auth/actions";
import { resetAnalytics } from "@/lib/analytics";
import { Avatar, useUser } from "./user";
import { useGridSize, type GridSize } from "./prefs";
import { useProfile } from "./profile";

export default function AccountMenu({ onShowSaved }: { onShowSaved: () => void }) {
  const { size: gridSize, setSize: onGridSize } = useGridSize();
  const user = useUser();
  const { profile } = useProfile();
  const editor = profile.editor;
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => setTheme(getThemeMode()), []);

  const chooseTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    setTheme(mode);
  };

  return (
    <DropdownMenu>
      {/* The avatar in a ghost icon button: the button's hover wash rings it, and it is named */}
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Account menu" />}>
        <Avatar size="default" decorative />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Who's signed in. A non-breaking space holds each line's height until the session is read */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate type-label text-text-1">{user?.name ?? " "}</span>
                <span className="block truncate type-caption text-text-2">{user?.email ?? " "}</span>
              </span>
              <Avatar size="lg" decorative />
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuItem onClick={onShowSaved}>
          Saved posts
          <Icon icon={Bookmark} className="ms-auto" />
        </DropdownMenuItem>
        <DropdownMenuLinkItem render={<Link href="/dashboard/welcome" />}>
          Personalise your feed
          <Icon icon={Sparkle} className="ms-auto" />
        </DropdownMenuLinkItem>
        {editor && (
          <DropdownMenuLinkItem render={<Link href="/dashboard/review" />}>
            Analysis review
            <Icon icon={SealCheck} className="ms-auto" />
          </DropdownMenuLinkItem>
        )}
        <DropdownMenuLinkItem render={<Link href="/dashboard/settings/tokens" />}>
          API tokens
          <Icon icon={Key} className="ms-auto" />
        </DropdownMenuLinkItem>
        {/* A mailto: the browser opens the mail client in place */}
        <DropdownMenuLinkItem href={SUPPORT_MAILTO}>
          Contact us
          <Icon icon={ChatDots} className="ms-auto" />
        </DropdownMenuLinkItem>
        {/* The signOut server action, as the form's submit called it; analytics reset first */}
        <DropdownMenuItem
          onClick={() => {
            resetAnalytics();
            void signOut();
          }}
        >
          Log out
          <Icon icon={SignOut} className="ms-auto" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuSegmented label="Theme" value={theme} onValueChange={(mode) => chooseTheme(mode as ThemeMode)}>
          <DropdownMenuSegment value="light" label="Light">
            <Icon icon={Light} />
          </DropdownMenuSegment>
          <DropdownMenuSegment value="dark" label="Dark">
            <Icon icon={Dark} />
          </DropdownMenuSegment>
          <DropdownMenuSegment value="system" label="Match system">
            <Icon icon={CircleHalf} />
          </DropdownMenuSegment>
        </DropdownMenuSegmented>
        <DropdownMenuSegmented label="Grid size" value={gridSize} onValueChange={(size) => onGridSize(size as GridSize)}>
          <DropdownMenuSegment value="large" label="Large tiles">
            <Icon icon={TileLarge} />
          </DropdownMenuSegment>
          <DropdownMenuSegment value="medium" label="Medium tiles">
            <Icon icon={SquaresFour} />
          </DropdownMenuSegment>
          <DropdownMenuSegment value="small" label="Small tiles">
            <Icon icon={TileSmall} />
          </DropdownMenuSegment>
        </DropdownMenuSegmented>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
