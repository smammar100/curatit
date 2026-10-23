"use client";

// An on/off switch (2026-10-18, after Fluid Functionalism's switch: the thumb slides, and
// stretches 4px while pressed, growing toward the middle so the edge it rests on stays put). For
// a setting that takes effect as soon as it's flipped, or a form option read on submit, like
// "Share with a link". A choice between named values is a Segmented; an action is a Button.
//
// Give it a name: wrap it with its words in a <label>, point a <label htmlFor> at its id, or pass
// aria-label / aria-labelledby. The hit area reaches 8px past the track for touch.
import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value" | "role"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export default function Switch({ checked, onCheckedChange, className, disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cx(
        "group/switch relative flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-150 ease-out-quint before:absolute before:-inset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus disabled:cursor-not-allowed",
        disabled ? "bg-disabled" : checked ? "bg-inverted-solid" : "bg-component-active",
        className,
      )}
      {...rest}
    >
      {/* On, the thumb is placed by its own width (the track's 44px inside, less 100%), so the
          press stretch grows to the left and its right edge stays put */}
      <span
        aria-hidden="true"
        className={cx(
          "h-6 w-6 rounded-full bg-page shadow-sm transition-[translate,width] duration-[200ms,150ms] ease-out-quint group-active/switch:w-7 motion-reduce:transition-none",
          checked && "translate-x-[calc(2.75rem-100%)]",
        )}
      />
    </button>
  );
}
