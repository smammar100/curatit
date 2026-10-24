"use client";

// /system/dropdown-menu: Glaze's DropdownMenu (src/components/glaze/ui/dropdown-menu). The menus open in the
// panel's theme through its stage portal. Rules from glaze-docs/dropdown-menu.md
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/glaze/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/glaze/ui/dropdown-menu";
import { ChevronDown, Edit, Icon, Link as LinkGlyph, More, ShareNetwork, TrashCan } from "@/components/glaze/icon";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

function BoardMenu({ size }: { size: "default" | "sm" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="secondary" size={size === "sm" ? "sm" : "default"} />}
      >
        Board
        <Icon icon={ChevronDown} />
      </DropdownMenuTrigger>
      <DropdownMenuContent size={size} align="start">
        <DropdownMenuItem>
          <Icon icon={Edit} />
          Rename board
          <DropdownMenuShortcut keys={["R"]} />
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Icon icon={ShareNetwork} />
          Share board
        </DropdownMenuItem>
        <DropdownMenuLinkItem render={<Link href="/system/dropdown-menu" />}>
          <Icon icon={LinkGlyph} />
          Open the share page
        </DropdownMenuLinkItem>
        <DropdownMenuItem disabled>
          <Icon icon={More} />
          Move posts
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Icon icon={TrashCan} />
          Delete board
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingsMenu() {
  const [theme, setTheme] = useState("system");
  const [notes, setNotes] = useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Settings for the feed" />}>
        <Icon icon={More} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(String(v))}>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={notes} onCheckedChange={setNotes}>
          Show notes on tiles
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DropdownMenuSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Dropdown menu"
        importLine={`import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLinkItem, DropdownMenuSeparator} from '@/components/glaze/ui/dropdown-menu'`}
      >
        Lists the actions on one thing, opened from a button. Rows are 32px (28 in a small menu) on the overlay surface;
        a destructive item goes last, after a separator. A choice that stays shown is a radio or checkbox row.
      </SheetHeader>

      <SheetSection title="Sizes and rows" description="Open each: an action with a shortcut, a link, a disabled row and a destructive one; then radio and checkbox rows.">
        <Sheet>
          {() => (
            <Matrix
              columns={["Actions", "Choices"]}
              rows={[
                { label: <Mono>default</Mono>, sub: "32px rows", cells: [<BoardMenu key="m" size="default" />, <SettingsMenu key="s" />] },
                { label: <Mono>sm</Mono>, sub: "28px rows, from a small control", cells: [<BoardMenu key="m" size="sm" />, null] },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="More for Spring launch"/>}>
    <Icon icon={More}/>
  </DropdownMenuTrigger>
  <DropdownMenuContent size="sm">
    <DropdownMenuItem onClick={rename}>Rename board</DropdownMenuItem>
    <DropdownMenuLinkItem render={<Link href={shareUrl}/>}>Open the share page</DropdownMenuLinkItem>
    <DropdownMenuSeparator/>
    <DropdownMenuItem variant="destructive" onClick={remove}>Delete board</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Put a destructive item last, after a separator, with variant destructive." },
            { kind: "do", text: "Use DropdownMenuLinkItem for an item that navigates; never router.push in an item." },
            { kind: "do", text: "Name an icon trigger with the object it acts on, and start each item with a verb." },
            { kind: "do", text: "Pass size sm to a menu opened from a small control or a row." },
            { kind: "dont", text: "Colour an item by className, or add a shadow to the menu." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
