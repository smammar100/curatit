"use client";

// The account menu, after Cosmos: your avatar is the button, and it opens a menu with your
// profile, saved posts, the welcome flow again (Personalise your feed), the analysis review (for
// editors), API tokens (for MCP clients), contact and log out, then the theme (light, dark,
// system) and the grid size, both remembered on this device. Since 2026-10-23 it is the shared
// Menu (fundations/molecules/Menu) rather than usePopover's own disclosure: the trigger is a
// ghost icon Button holding the Avatar atom, the name and email are a label at the top, every
// row is a MenuItem with its icon before the words, and the two settings are MenuRadioGroups
// (a check on the choice; picking one closes the menu, as a menu does). The count of saved
// posts is no longer repeated in the row: the header's bookmark beside the avatar carries it.
import { useEffect, useState } from "react";
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
import { fontWeights } from "@/lib/font-weight";
import Button from "@/components/fundations/elements/Button";
import Menu, { MenuItem, MenuItemRadio, MenuLabel, MenuRadioGroup, MenuSeparator } from "@/components/fundations/molecules/Menu";
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
    <Menu
      label="Account menu"
      align="end"
      width="fixed"
      trigger={
        // The avatar in a ghost icon button: the button's hover fill rings it, and it is named
        <Button variant="transparent" size="lg" iconOnly aria-label="Account menu">
          <Avatar size="sm" decorative />
        </Button>
      }
    >
      {/* Who's signed in. A non-breaking space holds each line's height until the session is read */}
      <MenuLabel>
        <span className="flex items-center justify-between gap-3 py-1">
          <span className="min-w-0">
            <span className="block truncate text-body text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
              {user?.name ?? " "}
            </span>
            <span className="block truncate text-caption text-muted-foreground">{user?.email ?? " "}</span>
          </span>
          <Avatar decorative />
        </span>
      </MenuLabel>
      <MenuItem icon={<BookmarkSimple />} onSelect={onShowSaved}>
        Saved posts
      </MenuItem>
      <MenuItem icon={<Sparkle />} href="/dashboard/welcome">
        Personalise your feed
      </MenuItem>
      {editor && (
        <MenuItem icon={<SealCheck />} href="/dashboard/review">
          Analysis review
        </MenuItem>
      )}
      <MenuItem icon={<Key />} href="/dashboard/settings/tokens">
        API tokens
      </MenuItem>
      {/* A mailto, which the router can't push: the browser opens the mail client in place */}
      <MenuItem icon={<ChatDots />} onSelect={() => location.assign(SUPPORT_MAILTO)}>
        Contact us
      </MenuItem>
      {/* The signOut server action, as the form's submit called it; analytics reset first */}
      <MenuItem
        icon={<SignOut />}
        onSelect={() => {
          resetAnalytics();
          void signOut();
        }}
      >
        Log out
      </MenuItem>

      <MenuSeparator />
      <MenuRadioGroup<ThemeMode> label="Theme" value={theme} onValueChange={chooseTheme}>
        <MenuItemRadio value="light" icon={<Sun />}>
          Light
        </MenuItemRadio>
        <MenuItemRadio value="dark" icon={<Moon />}>
          Dark
        </MenuItemRadio>
        <MenuItemRadio value="system" icon={<CircleHalf />}>
          Match system
        </MenuItemRadio>
      </MenuRadioGroup>

      <MenuSeparator />
      <MenuRadioGroup<GridSize> label="Grid size" value={gridSize} onValueChange={onGridSize}>
        <MenuItemRadio value="large" icon={<Bars count={1} />}>
          Large tiles
        </MenuItemRadio>
        <MenuItemRadio value="medium" icon={<Bars count={2} />}>
          Medium tiles
        </MenuItemRadio>
        <MenuItemRadio value="small" icon={<Bars count={3} />}>
          Small tiles
        </MenuItemRadio>
      </MenuRadioGroup>
    </Menu>
  );
}

// One, two or three upright bars: the grid size icons, drawn as an SVG so the menu row sizes it
// like any other icon
function Bars({ count }: { count: number }) {
  const width = count * 4 - 2;
  const x0 = (16 - width) / 2;
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} x={x0 + i * 4} y="2" width="2" height="12" rx="1" />
      ))}
    </svg>
  );
}
