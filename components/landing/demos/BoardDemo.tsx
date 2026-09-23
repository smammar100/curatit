"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link2, Lock, Share } from "lucide-react";
import SlideArt from "@/components/product/SlideArt";
import { Button } from "@/components/ui/button";
import { InputCopy } from "@/components/ui/input-copy";
import { Elevated } from "@/lib/elevated";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
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

  return (
    <AppWindow title="Boards · Autumn launch, sportswear client">
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[16px] text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
              Autumn launch
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              {shared ? (
                <>
                  <Link2 size={12} strokeWidth={1.5} aria-hidden="true" /> Read-only link active, expires in 7 days
                </>
              ) : (
                <>
                  <Lock size={12} strokeWidth={1.5} aria-hidden="true" /> Private: only you can see this board
                </>
              )}
            </p>
          </div>
          <div className="relative">
            <Button
              type="button"
              size="compact"
              leadingIcon={Share}
              active={open}
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              Share
            </Button>

            <AnimatePresence>
              {open && (
                <motion.div
                  role="dialog"
                  aria-label="Share board"
                  className="absolute right-0 top-9 z-10 w-72"
                  style={{ transformOrigin: "top right" }}
                  initial={{ opacity: 0, scale: 0.97, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, transition: spring.fast.exit }}
                  transition={spring.fast}
                >
                  <Elevated offset={2} className="rounded-xl p-3 text-left">
                    <p className="text-[13px] text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                      Read-only link
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      Shows the title and references. Never your notes.
                    </p>
                    {shared ? (
                      <>
                        <InputCopy className="mt-3" size="compact" value="curatit.com/s/q1GeB5wIZ8Wr-EFNc" />
                        <Button type="button" variant="ghost" size="compact" className="mt-2" onClick={() => setShared(false)}>
                          Revoke link
                        </Button>
                      </>
                    ) : (
                      <Button type="button" size="compact" className="mt-3 w-full" onClick={() => setShared(true)}>
                        Create link · 7 days
                      </Button>
                    )}
                  </Elevated>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <ol className="mt-4 divide-y divide-border border-y border-border">
          {items.slice(0, 3).map((item, index) => (
            <li key={item.id} className="flex gap-3 py-3">
              <div className="w-12 shrink-0 overflow-hidden rounded-[2px] shadow-surface-1">
                <SlideArt art={item.art} alt="" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] text-foreground">
                  <span style={{ fontVariationSettings: fontWeights.medium }}>{item.brand}</span>{" "}
                  <span className="text-muted-foreground">{item.hook}</span>
                </p>
                {NOTES[index] && (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    <span className="text-foreground">Note: </span>
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
