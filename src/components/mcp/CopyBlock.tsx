"use client";

// A configuration snippet with a copy button: the one piece of script on the connect page.
// The button confirms with a check for a moment (and a status line for screen readers).
// `tone="light"` is for a snippet inside a white card (the MCP landing page's install card):
// a pale field with a hairline instead of the dark slab, and long lines wrap.

import { useEffect, useRef, useState } from "react";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import { cx } from "@/lib/cx";

const tones = {
  // The standout slab, dark in both themes
  dark: {
    pre: "bg-standout text-on-standout-primary-foreground",
    button:
      "bg-paper/10 text-on-standout-primary-foreground hover:bg-paper/20 focus-visible:outline-brand-border-focus",
  },
  // Wraps rather than scrolls: a narrow card would otherwise hide most of a command
  light: {
    pre: "bg-card text-primary-foreground ring-1 ring-border-default whitespace-pre-wrap [overflow-wrap:anywhere]",
    button:
      "text-secondary-foreground hover:bg-component-hover hover:text-primary-foreground focus-visible:outline-brand-border-focus",
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
    <div className="relative">
      <pre className={cx("overflow-x-auto rounded-lg px-4 py-3.5 pr-14 font-mono text-body-sm leading-relaxed", tones[tone].pre)}>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
        className={cx(
          "absolute top-2 right-2 flex size-9 items-center justify-center rounded-md transition-colors duration-150 ease-out-quint focus-visible:outline-2 focus-visible:outline-offset-2",
          tones[tone].button,
        )}
      >
        <span className="grid">
          <Copy className={cx(icon, copied ? gone : shown)} />
          <Check className={cx(icon, copied ? shown : gone)} />
        </span>
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
