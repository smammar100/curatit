"use client";

// A segmented control: one choice out of two to five, all visible at once (2026-10-18, after
// Fluid Functionalism's segmented tabs, rebuilt on the site's tokens without its libraries).
// It's a radiogroup: Tab reaches the chosen option, the arrow keys (and Home / End) move the
// choice, and a thumb slides to it (useThumb: it snaps on keyboard input, so held arrows never
// queue up slides, and it never animates on load). Until the thumb has measured, which includes
// the server's HTML, the chosen option wears the thumb's fill itself.
//
// Use it for a setting with a few short, mutually exclusive values (theme, grid size, token
// expiry, MCP / REST). Five or more values, or long labels, are a select; actions are Buttons;
// views of different content are tabs.
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useThumb } from "@/lib/motion";
import { cx } from "@/lib/cx";

export type SegmentedOption<T extends string> = {
  value: T;
  /** The option's name. Shown, or with `iconOnly` read by screen readers and shown as a tooltip */
  label: string;
  icon?: ReactNode;
};

// Track padding, option height and horizontal padding per size (icon-only options are squares)
const sizes = {
  sm: { track: "p-0.5", option: "h-7 px-3 gap-1.5", square: "size-7" },
  md: { track: "p-1", option: "h-8 px-3 gap-1.5", square: "size-8" },
  lg: { track: "p-1", option: "h-9 px-3.5 gap-2", square: "size-9" },
};
// rounded: Interfere's control radius; pill: fully round (the dashboard's controls)
const shapes = {
  rounded: { track: "rounded-lg", thumb: "rounded-md" },
  pill: { track: "rounded-full", thumb: "rounded-full" },
};
// raised: a white thumb lifted by the default shadow on the grey track; inverted: the primary
// button's solid fill
const tones = {
  raised: {
    thumb: "bg-component-on-container-subtle shadow-sm",
    on: "text-primary-foreground",
  },
  inverted: {
    thumb: "bg-inverted-solid",
    on: "text-on-inverted-foreground",
  },
};

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

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
  shape?: keyof typeof shapes;
  tone?: keyof typeof tones;
  /** Show only the icons; the labels become the options' accessible names and tooltips */
  iconOnly?: boolean;
  className?: string;
};

export default function Segmented<T extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  size = "sm",
  shape = "rounded",
  tone = "raised",
  iconOnly = false,
  className,
  ...aria
}: Props<T>) {
  const [own, setOwn] = useState<T | undefined>(defaultValue ?? options[0]?.value);
  const current = value ?? own;
  const thumb = useThumb<HTMLDivElement>(current);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const index = options.findIndex((o) => o.value === current);
  // Whether the last change came from the arrow keys. Set in the same update as the value, so the
  // render that recolours the options already knows (the thumb's `snap` only follows a render
  // later): from the keyboard the colours snap with the thumb, from a pointer they fade with it
  const [keyed, setKeyed] = useState(false);

  const choose = (next: T) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent, at: number) => {
    let next: number | undefined;
    if (event.key in STEPS) next = (at + STEPS[event.key] + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setKeyed(true);
    choose(options[next].value);
    buttons.current[next]?.focus();
  };

  const s = sizes[size];
  const t = tones[tone];
  return (
    <div
      ref={thumb.ref}
      role="radiogroup"
      {...aria}
      onKeyDown={thumb.handlers.onKeyDown}
      onPointerDown={() => {
        thumb.handlers.onPointerDown();
        setKeyed(false);
      }}
      className={cx("relative inline-flex shrink-0 gap-0.5 bg-component", s.track, shapes[shape].track, className)}
    >
      {/* Exempt from the freeze while the theme switches (data-theme-icon), so a theme control
          still slides when it's the theme that changed */}
      <span
        aria-hidden="true"
        data-theme-icon
        data-snap={thumb.snap || undefined}
        style={thumb.style}
        className={cx(
          "pointer-events-none absolute top-0 left-0 transition-[translate,width,height] duration-200 ease-out-quint data-snap:transition-none motion-reduce:transition-none",
          shapes[shape].thumb,
          t.thumb,
          !thumb.ready && "opacity-0",
        )}
      />
      {options.map((option, at) => {
        const checked = at === index;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttons.current[at] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={iconOnly ? option.label : undefined}
            title={iconOnly ? option.label : undefined}
            tabIndex={checked || (index < 0 && at === 0) ? 0 : -1}
            data-selected={checked || undefined}
            onClick={() => choose(option.value)}
            onKeyDown={(event) => onKeyDown(event, at)}
            className={cx(
              "relative flex items-center justify-center text-body-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus",
              !keyed && "transition-colors duration-150 ease-out-quint motion-reduce:transition-none",
              iconOnly ? s.square : s.option,
              shapes[shape].thumb,
              checked ? t.on : "text-secondary-foreground hover:text-primary-foreground",
              // The thumb's fill, worn by the chosen option until the thumb has measured
              checked && !thumb.ready && t.thumb,
            )}
          >
            {option.icon}
            {!iconOnly && option.label}
          </button>
        );
      })}
    </div>
  );
}
