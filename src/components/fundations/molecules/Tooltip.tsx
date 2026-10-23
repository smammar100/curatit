"use client";

// A tooltip: a few words about one control, for a mouse and the keyboard. Since 2026-10-23 it is
// Fluid Functionalism's Tooltip (src/components/ui/tooltip.tsx, on Radix's): the ink with the
// page's text in the caption role, rising 4px from the trigger's side on the fast spring and
// leaving on its exit tween; 200ms after the pointer rests on the trigger, at once on keyboard
// focus, and never on touch (a tap has no hover to rest on, so nothing here may be needed to use
// the control). Radix wires aria-describedby, hides it on Escape, blur and a press, and places
// it in a portal, flipping to the other side when there's no room.
//
//   <Tooltip label="Copy link"><Button iconOnly aria-label="Copy link">…</Button></Tooltip>
//
// Use it for the name of an icon-only control, or a few words a control's label leaves out
// ("Anyone with the link can view"). Instead: anything someone needs in order to act is visible
// text beside the control; a sentence or more is a Notice or a hint under a field; a link or a
// button is never inside a tooltip (the label is a string, so it can't be); a list of actions is a
// Menu. Don't put one on a disabled control: it gets no pointer or focus events.
import { cloneElement, type HTMLAttributes, type ReactElement, type Ref } from "react";
import { MotionConfig } from "motion/react";
import { Tooltip as FluidTooltip } from "@/components/ui/tooltip";

type Side = "top" | "bottom" | "left" | "right";
type TriggerProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };

export type TooltipProps = Omit<TriggerProps, "children"> & {
  /** The words: a name or a short phrase, no full stop. A string, so it can't hold a control */
  label: string;
  /** Which side of the trigger it prefers; it flips when there's no room */
  side?: Side;
  /** One element that takes a ref and pointer and focus handlers: a Button, a link */
  children: ReactElement<TriggerProps>;
};

export default function Tooltip({ label, side = "top", children, ...extra }: TooltipProps) {
  // Anything else passed here lands on the trigger, as before
  const trigger = Object.keys(extra).length ? cloneElement(children, extra as TriggerProps) : children;
  return (
    <MotionConfig reducedMotion="user">
      <FluidTooltip content={label} side={side} sideOffset={6} className="max-w-64 text-pretty">
        {trigger}
      </FluidTooltip>
    </MotionConfig>
  );
}
