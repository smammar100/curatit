"use client";

// A segmented control: one choice out of two to five, all visible at once. Since 2026-10-23 it is
// Fluid Functionalism's Tabs (src/components/ui/tabs.tsx): a muted track holding one raised pill
// for the choice, which travels on the moderate spring; a faint hover pill that previews the next
// click and glides to the option nearest the pointer; one focus ring that springs between options
// from the keyboard; and labels that get heavier when chosen without shifting their neighbours
// (an invisible semibold copy reserves the width). The arrow keys move the choice, Home and End
// jump to the ends.
//
// Use it for a setting with a few short, mutually exclusive values (theme, grid size, token
// expiry, MCP / REST). Five or more values, or long labels, are a select; actions are Buttons;
// views of different content are Tabs.
import { useMemo, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { TabItem, Tabs, TabsList } from "@/components/ui/tabs";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  /** The option's name. Shown, or with `iconOnly` read by screen readers and shown as a tooltip */
  label: string;
  icon?: ReactNode;
};

// The site's three sizes on the library's two steps: 28px tall (24px options) up to md, 36px
// (28px options) at lg
const sizes = { sm: "compact", md: "compact", lg: "default" } as const;
const squares = { compact: "w-6", default: "w-7" } as const;

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  /** Controlled value; pair with onValueChange */
  value?: T;
  /** Uncontrolled starting value */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** The group's name for screen readers, unless aria-labelledby points at a visible label */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  size?: keyof typeof sizes;
  /** Accepted for older call sites: every control is a pill, and the thumb is always the raised
   *  surface (the site's shape setting, and one look for every segmented control) */
  shape?: "rounded" | "pill";
  tone?: "raised" | "inverted";
  /** Show only the icons; the labels become the options' accessible names and tooltips */
  iconOnly?: boolean;
  className?: string;
};

// The library takes an icon as a component it can size; the site passes an element, so each one
// is wrapped once (memoised per options array, or the icon would remount on every render)
function asIcon(node: ReactNode): IconComponent {
  const Glyph = ({ size = 14, className }: { size?: number; className?: string }) => (
    <span className={cn("inline-flex shrink-0 [&>svg]:size-full", className)} style={{ width: size, height: size }}>
      {node}
    </span>
  );
  return Glyph;
}

export default function Segmented<T extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "sm",
  shape: _shape,
  tone: _tone,
  iconOnly = false,
  className,
  ...aria
}: Props<T>) {
  const step = sizes[size];
  const icons = useMemo(() => options.map((option) => (option.icon ? asIcon(option.icon) : undefined)), [options]);
  return (
    <MotionConfig reducedMotion="user">
      <Tabs
        value={value}
        defaultValue={defaultValue ?? options[0]?.value}
        onValueChange={(next) => onValueChange?.(next as T)}
        size={step}
      >
        <TabsList aria-label={aria["aria-label"]} aria-labelledby={aria["aria-labelledby"]} className={className}>
          {options.map((option, at) => (
            <TabItem
              key={option.value}
              value={option.value}
              label={option.label}
              icon={icons[at]}
              title={iconOnly ? option.label : undefined}
              // Icon-only: a square, with the label kept for screen readers alone
              className={cn(iconOnly && "justify-center px-0 [&>span:last-child]:sr-only", iconOnly && squares[step])}
            />
          ))}
        </TabsList>
      </Tabs>
    </MotionConfig>
  );
}
