"use client";

// ---------------------------------------------------------------------------
// Components never import an icon directly: they look one up by the role it
// plays (`useIcons()["chevron-down"]`). That keeps the icon set swappable in
// one place, so an app on another library wraps its tree in IconProvider and
// every component follows. Lucide is the default and the only icon library
// this file depends on.
//
// Components read from the map rather than calling `useIcon(name)`: React
// Compiler's lint (`react-hooks/static-components`, on in a fresh Next app)
// takes a component returned by a hook call for one created during render,
// and flags rendering it. A property read from the map is the same lookup
// without the false alarm.
// ---------------------------------------------------------------------------

import { createContext, useContext, useMemo, type ComponentType, type ReactNode } from "react";

// Curatit: the default set is the site's own Phosphor bold icons (src/components/fundations/icons),
// adapted to the contract below, in place of Lucide, which would otherwise be a second icon library
// in every page's bundle. Phosphor draws filled paths, so strokeWidth is ignored (the hover cue the
// library gives an outline icon is lost, as its own Phosphor set notes). A slot no installed
// component reads yet gets a dot; give it its Phosphor icon (docs/design/icons.md) when one does.
import type { IconProps } from "@/components/fundations/icons/Icon";
import ArrowRight from "@/components/fundations/icons/ArrowRight";
import BookOpen from "@/components/fundations/icons/BookOpen";
import CaretDown from "@/components/fundations/icons/CaretDown";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
import ChatCircle from "@/components/fundations/icons/ChatCircle";
import Check from "@/components/fundations/icons/Check";
import CircleNotch from "@/components/fundations/icons/CircleNotch";
import Close from "@/components/fundations/icons/Close";
import Copy from "@/components/fundations/icons/Copy";
import DotOutline from "@/components/fundations/icons/DotOutline";
import Heart from "@/components/fundations/icons/Heart";
import House from "@/components/fundations/icons/House";
import Info from "@/components/fundations/icons/Info";
import Moon from "@/components/fundations/icons/Moon";
import PaintBrush from "@/components/fundations/icons/PaintBrush";
import Pause from "@/components/fundations/icons/Pause";
import Picture from "@/components/fundations/icons/Picture";
import Play from "@/components/fundations/icons/Play";
import Plus from "@/components/fundations/icons/Plus";
import Search from "@/components/fundations/icons/Search";
import Sun from "@/components/fundations/icons/Sun";
import UsersThree from "@/components/fundations/icons/UsersThree";
import Wrench from "@/components/fundations/icons/Wrench";

// The whole contract an icon has to meet. Components pass `strokeWidth` and
// also animate stroke width through `className` (1.5 → 2 on hover is a
// common cue), so an icon from another library should forward both to its
// `<svg>`. A filled icon set ignores them and simply loses that cue.
export interface IconComponentProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export type IconComponent = ComponentType<IconComponentProps>;

// Names describe the role, not the glyph, so a library whose icon is called
// something else still fills the same slot (`more-horizontal` is Lucide's
// Ellipsis).
export type IconName =
  | "chevron-right" | "chevron-down" | "x" | "copy" | "menu" | "dot"
  | "monitor" | "sun" | "moon" | "rectangle-horizontal" | "circle"
  | "square-library" | "clock" | "star" | "settings"
  | "plus" | "arrow-left" | "arrow-right" | "arrow-up" | "arrow-down"
  | "search" | "loader"
  | "users" | "lock" | "mail" | "bell" | "shield" | "palette"
  | "lightbulb" | "rocket" | "heart" | "paintbrush" | "brain"
  | "globe" | "user"
  | "image" | "link" | "check" | "rotate-ccw"
  | "play" | "pause" | "pipette"
  | "home" | "message-circle" | "inbox"
  | "pencil" | "scaling" | "skip-forward" | "corner-down-right" | "corner-down-left"
  | "panel-left" | "panel-right" | "chevrons-up-down" | "more-horizontal" | "more-vertical" | "calendar" | "folder"
  | "sliders-horizontal" | "info";

function adapt(Glyph: ComponentType<IconProps>): IconComponent {
  const Adapted = ({ size = 16, className }: IconComponentProps) => (
    <Glyph className={className} style={{ width: size, height: size }} />
  );
  Adapted.displayName = Glyph.displayName ?? Glyph.name;
  return Adapted;
}

const Dot = adapt(DotOutline);

export const defaultIcons: Record<IconName, IconComponent> = {
  "chevron-right": adapt(CaretRight),
  "chevron-down": adapt(CaretDown),
  "pipette": Dot,
  "x": adapt(Close),
  "copy": adapt(Copy),
  "menu": Dot,
  "dot": Dot,
  "monitor": Dot,
  "sun": adapt(Sun),
  "moon": adapt(Moon),
  "rectangle-horizontal": Dot,
  "circle": Dot,
  "square-library": adapt(BookOpen),
  "clock": Dot,
  "star": Dot,
  "settings": adapt(Wrench),
  "plus": adapt(Plus),
  "arrow-left": adapt(CaretLeft),
  "arrow-right": adapt(ArrowRight),
  "arrow-up": Dot,
  "arrow-down": Dot,
  "search": adapt(Search),
  "loader": adapt(CircleNotch),
  "users": adapt(UsersThree),
  "lock": Dot,
  "mail": Dot,
  "bell": Dot,
  "shield": Dot,
  "palette": adapt(PaintBrush),
  "lightbulb": Dot,
  "rocket": Dot,
  "heart": adapt(Heart),
  "paintbrush": adapt(PaintBrush),
  "brain": Dot,
  "globe": Dot,
  "user": Dot,
  "image": adapt(Picture),
  "link": Dot,
  "check": adapt(Check),
  "rotate-ccw": Dot,
  "play": adapt(Play),
  "pause": adapt(Pause),
  "home": adapt(House),
  "message-circle": adapt(ChatCircle),
  "inbox": Dot,
  "pencil": Dot,
  "scaling": Dot,
  "skip-forward": Dot,
  "corner-down-right": Dot,
  "corner-down-left": Dot,
  "panel-left": Dot,
  "panel-right": Dot,
  "chevrons-up-down": Dot,
  "more-horizontal": Dot,
  "more-vertical": Dot,
  "calendar": Dot,
  "folder": Dot,
  "sliders-horizontal": Dot,
  "info": adapt(Info),
};

const IconContext = createContext<Record<IconName, IconComponent> | null>(null);

/**
 * Returns a single icon component for the given name.
 * Falls back to the default (Phosphor) set if no provider is present, so a
 * component works on its own before any IconProvider is set up.
 *
 * Fine for passing an icon on as a prop. To render it as `<Icon />`, take it
 * from `useIcons()` instead (see the note at the top of this file).
 */
function useIcon(name: IconName): IconComponent {
  const icons = useContext(IconContext);
  return (icons ?? defaultIcons)[name];
}

/**
 * Returns the full icon map.
 * Falls back to the default (Phosphor) set if no provider is present.
 */
function useIcons(): Record<IconName, IconComponent> {
  const icons = useContext(IconContext);
  return icons ?? defaultIcons;
}

/**
 * Swap some or all icons for components from another library.
 * Names left out of `icons` keep their default (Phosphor) component, so a
 * partial map never leaves a component without an icon.
 *
 * Pass a stable `icons` object (module scope or memoized): an inline object
 * is new on every render and re-renders every component that reads an icon.
 */
function IconProvider({
  children,
  icons,
}: {
  children: ReactNode;
  icons?: Partial<Record<IconName, IconComponent>>;
}) {
  const value = useMemo(() => ({ ...defaultIcons, ...icons }), [icons]);
  return <IconContext.Provider value={value}>{children}</IconContext.Provider>;
}

export { IconProvider, useIcon, useIcons };
