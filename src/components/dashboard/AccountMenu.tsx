"use client";

// The account menu, after Cosmos: your avatar is the button, and it opens a menu with your
// profile, saved posts, the welcome flow again (Personalise your feed), the analysis review (for
// editors), API tokens (for MCP clients), contact and log out, then the theme (light, dark,
// system) and the grid size, both remembered on this device. Since 2026-10-24 it is Glaze's
// DropdownMenu: the trigger is a ghost icon Button holding the Avatar, the name and email a label
// at the top, the pages LinkItems (so they open in a new tab too), every row with its glyph before
// the words, and the two settings radio groups (a check on the choice; picking one closes the
// menu, as a menu does).
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/glaze/ui/dropdown-menu";
import { Bookmark, ChatDots, CircleHalf, Dark, Icon, Key, Light, SealCheck, SignOut, Sparkle } from "@/components/glaze/icon";
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
      <DropdownMenuContent align="end" className="w-64">
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
          <Icon icon={Bookmark} />
          Saved posts
        </DropdownMenuItem>
        <DropdownMenuLinkItem render={<Link href="/dashboard/welcome" />}>
          <Icon icon={Sparkle} />
          Personalise your feed
        </DropdownMenuLinkItem>
        {editor && (
          <DropdownMenuLinkItem render={<Link href="/dashboard/review" />}>
            <Icon icon={SealCheck} />
            Analysis review
          </DropdownMenuLinkItem>
        )}
        <DropdownMenuLinkItem render={<Link href="/dashboard/settings/tokens" />}>
          <Icon icon={Key} />
          API tokens
        </DropdownMenuLinkItem>
        {/* A mailto: the browser opens the mail client in place */}
        <DropdownMenuLinkItem href={SUPPORT_MAILTO}>
          <Icon icon={ChatDots} />
          Contact us
        </DropdownMenuLinkItem>
        {/* The signOut server action, as the form's submit called it; analytics reset first */}
        <DropdownMenuItem
          onClick={() => {
            resetAnalytics();
            void signOut();
          }}
        >
          <Icon icon={SignOut} />
          Log out
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(mode) => chooseTheme(mode as ThemeMode)}>
            <DropdownMenuRadioItem value="light">
              <Icon icon={Light} />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Icon icon={Dark} />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Icon icon={CircleHalf} />
              Match system
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Grid size</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={gridSize} onValueChange={(size) => onGridSize(size as GridSize)}>
            <DropdownMenuRadioItem value="large">Large tiles</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="medium">Medium tiles</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="small">Small tiles</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
