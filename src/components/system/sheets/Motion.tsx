"use client";

// /system/motion: Fluid Functionalism's three tiers and two curves as Glaze's motion tokens
// (glaze-bridge.css), and the springs the site's own motion/react animations use (src/lib/springs.ts).
// Every demo moves transform only, and holds still under reduced motion (the tokens drop to 0ms)
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/glaze/ui/button";
import { Pause, Play, Icon } from "@/components/glaze/icon";
import { spring } from "@/lib/springs";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";
import { cn } from "@/lib/glaze/utils";

const TIERS = [
  { token: "--dur-state", ms: "80ms", use: "A hover, a colour, a field's line, a press", cls: "duration-(--dur-state)" },
  { token: "--dur-slide", ms: "160ms", use: "A selection travelling: the segmented thumb, a tab", cls: "duration-(--dur-slide)" },
  { token: "--dur-overlay", ms: "240ms", use: "Something arriving: a menu, a popover, a dialog", cls: "duration-(--dur-overlay)" },
] as const;

const OTHER = [
  { token: "--dur-press", value: "80ms", use: "A flat control's press scale" },
  { token: "--dur-glass-press", value: "80ms", use: "Glass going down" },
  { token: "--dur-glass-release", value: "180ms", use: "Glass coming back up" },
  { token: "--ease-out", value: "cubic-bezier(0.23, 1, 0.32, 1)", use: "Ease-out-quint: everything arriving (ease-out)" },
  { token: "--ease-in", value: "cubic-bezier(0.5, 0, 0.75, 0)", use: "Ease-in-quart: something leaving (ease-in)" },
  { token: "--scale-press", value: "0.97", use: "A held ghost or flat control" },
  { token: "--overlay-shift", value: "4px", use: "How far an anchored overlay travels from its trigger" },
];

const SPRINGS = [
  { name: "fast", note: "0.08s, no bounce", tier: spring.fast },
  { name: "moderate", note: "0.16s, no bounce", tier: spring.moderate },
  { name: "slow", note: "0.24s, bounce 0.12", tier: spring.slow },
] as const;

function Lanes() {
  const [on, setOn] = useState(false);
  return (
    <div className="grid gap-4">
      <div>
        <Button variant="secondary" size="sm" onClick={() => setOn((v) => !v)}>
          <Icon icon={on ? Pause : Play} size={12} />
          {on ? "Send back" : "Play the tiers"}
        </Button>
      </div>
      <ul className="grid gap-3">
        {TIERS.map((t) => (
          <li key={t.token} className="grid gap-1">
            <span className="type-caption text-text-2">
              <Mono>{t.token}</Mono> {t.ms}
            </span>
            <span className="relative block h-6 rounded-pill bg-field">
              <span
                aria-hidden
                className={cn(
                  "absolute start-0.5 top-0.5 block size-5 rounded-pill bg-ink transition-transform",
                  t.cls,
                  on ? "translate-x-40 ease-out sm:translate-x-80" : "translate-x-0 ease-in",
                )}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Springs() {
  const [on, setOn] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-4">
      <div>
        <Button variant="secondary" size="sm" onClick={() => setOn((v) => !v)}>
          <Icon icon={on ? Pause : Play} size={12} />
          {on ? "Send back" : "Play the springs"}
        </Button>
      </div>
      <ul className="grid gap-3">
        {SPRINGS.map((s) => (
          <li key={s.name} className="grid gap-1">
            <span className="type-caption text-text-2">
              <Mono>{`spring.${s.name}`}</Mono> {s.note}
            </span>
            <span className="relative block h-6 rounded-pill bg-field">
              <motion.span
                aria-hidden
                className="absolute start-0.5 top-0.5 block size-5 rounded-pill bg-ink"
                animate={{ x: on ? 160 : 0 }}
                transition={reduce ? { duration: 0 } : s.tier}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Motion() {
  return (
    <SheetBody>
      <SheetHeader title="Motion">
        Short and quiet. Three tiers of duration carry Fluid Functionalism&rsquo;s timing: a hover or a colour is 80ms, a
        selection travelling 160ms, something arriving 240ms, and each leaves a tier quicker. Things arrive on
        ease-out-quint and leave on ease-in-quart. Only transform and opacity move, and nothing moves under reduced
        motion.
      </SheetHeader>

      <SheetSection title="Tiers" description="Glaze's components read these tokens already. In your own CSS transitions, use the duration-(--dur-*) and ease-out or ease-in utilities.">
        <Sheet>
          {() => (
            <div className="grid gap-6">
              <Lanes />
              <Matrix
                columns={["Value", "Use"]}
                rows={OTHER.map((o) => ({
                  label: <Mono>{o.token}</Mono>,
                  cells: [
                    <span key="v" className="type-caption text-text-2">
                      {o.value}
                    </span>,
                    <span key="u" className="type-body-sm text-text-2">
                      {o.use}
                    </span>,
                  ],
                }))}
              />
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Springs"
        description="The site's own animations on motion/react take a spring from src/lib/springs.ts: fast for a press, moderate for panels and selections that must land exactly, slow for something that may settle with a little give."
      >
        <Sheet>{() => <Springs />}</Sheet>
        <div className="mt-4">
          <Example
            code={`import { spring } from "@/lib/springs";

<motion.div animate={{ x: open ? 0 : -8 }} transition={spring.moderate} />`}
          />
        </div>
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Move transform and opacity only, from the tokens, and stop under reduced motion." },
            { kind: "do", text: "Let a designed illustration that loops keep looping while it is on screen." },
            { kind: "dont", text: "Fade or slide content in as it scrolls into view." },
            { kind: "dont", text: "Blink a cursor, sweep a shimmer or fade in each word of a streamed answer." },
            { kind: "dont", text: "Write a duration or a cubic-bezier by hand, or animate on a key that repeats." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
