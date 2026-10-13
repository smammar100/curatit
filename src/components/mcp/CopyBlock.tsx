"use client";

// A configuration snippet with a copy button: the one piece of script on the connect page.
// The button confirms with a check for a moment (and a status line for screen readers).
// `tone="light"` is for a snippet inside a white card (the MCP landing page's install card):
// a pale field with a hairline instead of the dark slab, and long lines wrap.

import { useState } from "react";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
import { cx } from "@/lib/cx";

const tones = {
  dark: {
    pre: "bg-base-900 text-base-50 dark:bg-base-50 dark:text-base-900",
    button:
      "bg-white/10 text-base-50 hover:bg-white/20 focus-visible:outline-base-50 dark:bg-base-900/10 dark:text-base-900 dark:hover:bg-base-900/20",
  },
  // Wraps rather than scrolls: a narrow card would otherwise hide most of a command
  light: {
    pre: "bg-base-50 text-base-900 ring-1 ring-base-200 whitespace-pre-wrap [overflow-wrap:anywhere]",
    button: "text-base-600 hover:bg-base-100 hover:text-base-900 focus-visible:outline-base-900",
  },
};

export default function CopyBlock({ code, label, tone = "dark" }: { code: string; label: string; tone?: keyof typeof tones }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the text is selectable
    }
  };
  return (
    <div className="relative">
      <pre className={cx("overflow-x-auto rounded-lg px-4 py-3.5 pr-14 font-mono text-[13px] leading-relaxed", tones[tone].pre)}>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
        className={cx(
          "absolute top-2 right-2 flex size-9 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2",
          tones[tone].button,
        )}
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
