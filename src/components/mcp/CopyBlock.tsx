"use client";

// A configuration snippet with a copy button: the one piece of script on the connect page.
// The button confirms with a check for a moment (and a status line for screen readers).

import { useState } from "react";
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";

export default function CopyBlock({ code, label }: { code: string; label: string }) {
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
      <pre className="overflow-x-auto rounded-lg bg-base-900 px-4 py-3.5 pr-14 font-mono text-[13px] leading-relaxed text-base-50 dark:bg-base-50 dark:text-base-900">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
        className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-md bg-white/10 text-base-50 transition-colors duration-150 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-50 dark:bg-base-900/10 dark:text-base-900 dark:hover:bg-base-900/20"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
