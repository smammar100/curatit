"use client";

// A configuration snippet with a copy button: the one piece of script on the connect page.
// The button confirms with a check for a moment, and a status line for screen readers.
// `tone="light"` is for a snippet inside a white card (the MCP landing page's install card):
// the muted tile with a hairline instead of the inverted slab, and long lines wrap.
//
// Since 2026-10-23 the copy button is the system's ghost Button (icon-only, named for screen
// readers) and the dark tone is the ink itself, as the Toast draws it (bg-foreground, the page's
// colour on it, so it inverts with the theme). Inside the slab the ink and the page swap places
// through two variables set on the button's wrapper, the way Button's accent variant sets its
// own, so the ghost button's words and hover read on the slab in both themes.

import { useEffect, useRef, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import { cx } from "@/lib/cx";

const tones = {
  // The inverted slab: the ink, with the page's colour on it
  dark: {
    pre: "bg-foreground text-background",
    // The wrapper hands the slab's two colours to the button swapped (--ink and --ground are
    // read off the page one level up, since a variable can't be set from itself); the hover
    // tint is the page's colour at 12%, which reads on the slab in both themes
    button:
      "[--foreground:var(--ground)] [--background:var(--ink)] [--muted-foreground:color-mix(in_oklab,var(--ground)_70%,transparent)] [--hover:color-mix(in_oklab,var(--ground)_12%,transparent)] [--active:color-mix(in_oklab,var(--ground)_18%,transparent)]",
  },
  // Wraps rather than scrolls: a narrow card would otherwise hide most of a command
  light: {
    pre: "bg-muted text-foreground shadow-surface-1 whitespace-pre-wrap [overflow-wrap:anywhere]",
    button: "",
  },
};

// Copy and Check share one cell. The one arriving fades in from 0.6 and a 2px blur; the one
// leaving only fades, and shrinks back once it's out of sight (the delays). Opacity alone under
// reduced motion
const icon =
  "[grid-area:1/1] size-4 transition-[opacity,scale,filter] duration-200 ease-out-quint motion-reduce:scale-100 motion-reduce:blur-none";
const shown = "opacity-100 scale-100 blur-none";
const gone = "opacity-0 scale-60 blur-[2px] [transition-delay:0ms,200ms,200ms]";

export default function CopyBlock({ code, label, tone = "dark" }: { code: string; label: string; tone?: keyof typeof tones }) {
  const [copied, setCopied] = useState(false);
  // One timer at a time: a second copy restarts the moment rather than ending it early
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the text is selectable
    }
  };
  return (
    <div className="relative [--ground:var(--background)] [--ink:var(--foreground)]">
      <pre className={cx("overflow-x-auto rounded-[12px] px-4 py-3.5 pr-14 font-mono text-body-sm leading-relaxed", tones[tone].pre)}>
        <code>{code}</code>
      </pre>
      <span className={cx("absolute top-2 right-2", tones[tone].button)}>
        <Button
          variant="transparent"
          size="sm"
          iconOnly
          onClick={copy}
          aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
        >
          <span className="grid">
            <Copy className={cx(icon, copied ? gone : shown)} />
            <Check className={cx(icon, copied ? shown : gone)} />
          </span>
        </Button>
      </span>
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
