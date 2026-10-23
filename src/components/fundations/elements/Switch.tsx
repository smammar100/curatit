"use client";

// An on/off switch, since 2026-10-23 Fluid Functionalism's (src/components/ui/switch.tsx): a whole
// labelled row that toggles on a click anywhere on it, whose thumb can also be dragged across the
// track (past the middle flips it), stretches into a pill under the pointer and squashes while
// pressed, and moves on the library's moderate spring. On, the track is the ink, like the primary
// button. For a setting that takes effect as soon as it's flipped, or a form option read on
// submit, like "Share with a link". A choice between named values is a Segmented; an action is a
// Button.
//
// `label` is the row's words and the switch's name. `labelHidden` keeps the name for screen
// readers but draws nothing, for a switch whose words a Field beside it already shows.
import type { HTMLAttributes } from "react";
import { MotionConfig } from "motion/react";
import { Switch as FluidSwitch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Props = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "onToggle"> & {
  label: string;
  labelHidden?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function Switch({ checked, onCheckedChange, label, labelHidden, className, ...rest }: Props) {
  return (
    <MotionConfig reducedMotion="user">
      <FluidSwitch
        label={label}
        labelHidden={labelHidden}
        checked={checked}
        onToggle={() => onCheckedChange(!checked)}
        // The library pads the row like a menu item; alone, or beside a Field's words, the
        // switch sits flush
        className={cn(labelHidden && "px-0 py-0", className)}
        {...rest}
      />
    </MotionConfig>
  );
}
