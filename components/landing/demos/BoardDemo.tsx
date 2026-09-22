"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Link2, Lock } from "lucide-react";
import SlideArt from "@/components/product/SlideArt";
import type { LandingLibrary } from "@/lib/services/creatives";
import AppWindow from "../AppWindow";

// Written for the three posts the service picks (claim–proof launch, run club, 10K plan).
const NOTES = [
  "Open on one number, like this. Our weight claim can carry slide one.",
  "Borrow the real-member quotes for the ambassador post.",
  "Weekly grid works for the 4-week challenge. Keep it this sparse.",
];

/**
 * A private board with notes. The visitor shares it: the popover grows from
 * the Share button, the link copies with a confirmation, and revoking puts
 * the board back to private.
 */
export default function BoardDemo({ items }: { items: LandingLibrary["board"] }) {
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  function copy() {
    setCopied(true);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AppWindow title="Boards — Autumn launch, sportswear client">
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-xl text-ink">Autumn launch</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-subtle">
              {shared ? (
                <>
                  <Link2 size={12} aria-hidden="true" /> Read-only link active · expires in 7 days
                </>
              ) : (
                <>
                  <Lock size={12} aria-hidden="true" /> Private — only you can see this board
                </>
              )}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-haspopup="dialog"
              className="h-8 rounded-lg bg-base-800 px-3 text-xs font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-base-700 active:scale-[0.97]"
            >
              Share
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  role="dialog"
                  aria-label="Share board"
                  className="absolute right-0 top-10 z-10 w-72 rounded-lg bg-surface p-4 text-left shadow-window ring-1 ring-line"
                  style={{ transformOrigin: "top right" }}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12, ease: "easeIn" } }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <p className="text-xs font-medium text-ink">Read-only link</p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    Shows the title and references. Never your notes.
                  </p>
                  {shared ? (
                    <>
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="min-w-0 grow truncate rounded-md bg-surface-sunken px-2 py-1.5 font-mono text-[11px] text-ink-muted ring-1 ring-line">
                          curatit.com/s/q1GeB5wIZ8Wr-EFNc
                        </span>
                        <button
                          type="button"
                          onClick={copy}
                          aria-label={copied ? "Copied" : "Copy link"}
                          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink ring-1 ring-line transition-[background-color,transform] duration-150 ease-out hover:bg-surface-inset active:scale-[0.94]"
                        >
                          {copied ? <Check size={13} className="text-accent-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShared(false);
                          setCopied(false);
                        }}
                        className="mt-3 text-[11px] font-medium text-accent-700 hover:text-ink"
                      >
                        Revoke link
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShared(true)}
                      className="mt-3 h-8 w-full rounded-lg bg-brand text-xs font-medium text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-hover active:scale-[0.98]"
                    >
                      Create link · 7 days
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ol className="mt-4 divide-y divide-line border-y border-line">
          {items.slice(0, 3).map((item, index) => (
            <li key={item.id} className="flex gap-3 py-3">
              <div className="w-12 shrink-0 overflow-hidden rounded ring-1 ring-line">
                <SlideArt art={item.art} alt="" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-ink">
                  <span className="font-medium">{item.brand}</span> — {item.hook}
                </p>
                {NOTES[index] && (
                  <p className="mt-1 text-[11px] text-ink-muted">
                    <span className="text-ink-subtle">Note · </span>
                    {NOTES[index]}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </AppWindow>
  );
}
