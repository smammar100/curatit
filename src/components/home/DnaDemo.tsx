"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { m } from "framer-motion";
// Icons
import Check from "@/components/fundations/icons/Check";
import Copy from "@/components/fundations/icons/Copy";
// Components
import PostCover from "./PostCover";
import { easeOut, useScript } from "./DemoParts";
import { dna } from "./demo";
import { usePost } from "./HomePosts";
import { cx } from "@/lib/cx";

/*
 * A post taken apart, on a loop while the panel is on screen: Wise's carousel cover gets its
 * parts pinned with leader lines (hook, layout, kicker, product), the strategy lands above it,
 * a pointer picks four colours off the slide and they fly down into a palette, then it taps
 * Copy brief and the brief slides up. Every label, the strategy and the colours come from the
 * post's published analysis (`dna` in demo.ts); where the pins sit is read off the slide by
 * hand. Motion is transform and opacity only. The annotated slide is what the server renders,
 * what the first view holds, and all that reduced motion shows. The loop pauses while pointed
 * at or focused (useScript).
 */

// 0 the slide alone · 1–4 pins · 5 strategy · 6–9 the pointer picks colours 1–4 · 10 they fly to
// the palette · 11 pointer to Copy brief · 12 copied · 13 the brief · 14 annotated (rest)
const SCRIPT: [number, number][] = [
  [0, 0],
  [450, 1],
  [900, 2],
  [1350, 3],
  [1800, 4],
  [2500, 5],
  [3300, 6],
  [3800, 7],
  [4300, 8],
  [4800, 9],
  [5400, 10],
  [6500, 11],
  [7200, 12],
  [7600, 13],
  [10300, 14],
];
const REST = 14;
const CYCLE = 11800;
// On first view the annotated slide is already showing; hold it this long before the loop starts
const FIRST_HOLD = 3500;
const PICK = 6;

type Point = { x: number; y: number };

export default function DnaDemo() {
  const { ref, step, handlers } = useScript(SCRIPT, { cycle: CYCLE, hold: FIRST_HOLD, rest: REST });
  const post = usePost(dna.post);

  // Where things are, measured from the stage, so the pointer and the picked colours travel to
  // the right place at any size: the four picking spots, the palette's dots and Copy brief
  const stage = useRef<HTMLDivElement>(null);
  const spots = useRef<(HTMLSpanElement | null)[]>([]);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);
  const pill = useRef<HTMLSpanElement>(null);
  const [places, setPlaces] = useState<{ spots: Point[]; dots: Point[]; pill: Point; park: Point } | null>(null);
  const measure = useCallback(() => {
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    const centre = (el: Element | null | undefined): Point => {
      const r = el?.getBoundingClientRect();
      return r ? { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top } : { x: 0, y: 0 };
    };
    // Where the pointer waits, out of sight: the stage's bottom-right corner, so it always comes in from there
    const park = { x: box.width - 24, y: box.height - 8 };
    setPlaces({ spots: spots.current.map(centre), dots: dots.current.map(centre), pill: centre(pill.current), park });
  }, []);
  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);
  // Again just before anything travels, in case the layout settled since
  useLayoutEffect(() => {
    if (step === 5 || step === 9) measure();
  }, [step, measure]);

  if (!post) return null;

  const briefOpen = step === 13;
  const pinned = (i: number) => step >= i + 1 && !briefOpen;
  const picked = (i: number) => step >= PICK + i && !briefOpen;
  const copied = step === 12 || step === 13;
  // The pointer: on a picking spot, on Copy brief, or out of the way
  const target = step >= PICK && step < PICK + dna.samples.length ? places?.spots[step - PICK] : step === 11 || step === 12 ? places?.pill : undefined;

  return (
    <div
      ref={ref}
      {...handlers}
      role="img"
      aria-label={`Demo: ${post.brand.name}'s carousel cover taken apart by Curatit: its hook, layout, kicker and product pinned, its strategy, four colours picked off the slide, then copied as a brief for an AI tool`}
      // At least 4:3 from lg like the MCP demo beside it (a zero-width spacer 75% of the width
      // tall), taller only if the column is too narrow; an aspect ratio would clip it instead
      className="relative flex items-center overflow-hidden rounded-2xl bg-base-50 lg:before:block lg:before:w-0 lg:before:shrink-0 lg:before:pt-[75%] lg:before:content-['']"
    >
      <div ref={stage} aria-hidden="true" className="relative w-full px-4 py-6 select-none sm:px-10 sm:py-8">
        {/* The strategy, and Copy brief */}
        <div className="flex items-start justify-between gap-4">
          <m.div className="max-w-64 min-w-0" {...rise(step >= 5 && !briefOpen)}>
            <p className="text-[11px] text-base-500">Strategy</p>
            <p className="mt-0.5 text-xs font-medium text-pretty text-base-900 sm:text-sm">{dna.headline}</p>
          </m.div>
          <m.span
            ref={pill}
            className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-white pr-2.5 pl-3 text-xs font-medium whitespace-nowrap text-base-900 shadow-sm"
            initial={false}
            animate={{ scale: step === 12 ? [1, 0.92, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            {copied ? "Copied" : "Copy brief"}
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </m.span>
        </div>

        {/* The slide, with room either side for the pins */}
        <div className="relative mx-auto mt-5 w-[40%] [--reach:0.625rem] sm:mt-6 sm:w-[38%] sm:[--reach:1.5rem]">
          <m.div initial={false} animate={{ scale: briefOpen ? 0.97 : 1, opacity: briefOpen ? 0.5 : 1 }} transition={{ duration: 0.4, ease: easeOut }}>
            <PostCover post={post} sizes="(min-width: 640px) 240px, 140px" className="rounded shadow-lg" />
          </m.div>

          {dna.pins.map((pin, i) => {
            const on = pinned(i);
            const left = pin.side === "left";
            return (
              <div
                key={pin.label}
                className="absolute"
                style={
                  left
                    ? { top: `${pin.y}%`, left: "calc(-1 * var(--reach))", width: `calc(${pin.x}% + var(--reach))` }
                    : { top: `${pin.y}%`, left: `${pin.x}%`, right: "calc(-1 * var(--reach))" }
                }
              >
                {/* The leader line draws out from the slide, a white line with a dark edge so it
                    reads over the photo and over the grey alike */}
                <m.span
                  className={cx("absolute inset-x-0 top-0 h-px bg-paper shadow-[0_0_0_0.5px_rgb(0_0_0/0.55)]", left ? "origin-right" : "origin-left")}
                  initial={false}
                  animate={{ scaleX: on ? 1 : 0 }}
                  transition={on ? { duration: 0.35, ease: easeOut } : { duration: 0.2 }}
                />
                <m.span
                  className={cx("absolute top-0 -mt-1 size-2 rounded-full bg-paper ring-2 ring-base-900", left ? "-right-1" : "-left-1")}
                  initial={false}
                  animate={{ scale: on ? 1 : 0.4, opacity: on ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                />
                <div className={cx("absolute top-0 -translate-y-1/2", left ? "right-full mr-0.5 sm:mr-1" : "left-full ml-0.5 sm:ml-1")}>
                  <m.span
                    className="flex h-6 items-center gap-1 rounded-full bg-white px-1.5 text-[10px] whitespace-nowrap shadow-sm sm:px-2 sm:text-[11px]"
                    initial={false}
                    animate={on ? { opacity: 1, x: 0 } : { opacity: 0, x: left ? 6 : -6 }}
                    transition={on ? { duration: 0.4, ease: easeOut, delay: 0.15 } : { duration: 0.2 }}
                  >
                    <span className="hidden text-base-500 sm:inline">{pin.label}</span>
                    <span className="font-medium text-base-900 sm:hidden">{pin.short}</span>
                    <span className="hidden font-medium text-base-900 sm:inline">{pin.value}</span>
                  </m.span>
                </div>
              </div>
            );
          })}

          {/* Where each colour was picked: a small mark that stays */}
          {dna.samples.map((sample, i) => (
            <m.span
              key={sample.hex}
              ref={(el) => {
                spots.current[i] = el;
              }}
              className="absolute -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-paper shadow-[0_0_0_1px_rgb(0_0_0/0.5)]"
              style={{ top: `${sample.y}%`, left: `${sample.x}%` }}
              initial={false}
              animate={{ opacity: picked(i) ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>

        {/* The palette the picked colours land in */}
        <ul className="mx-auto mt-5 grid w-fit grid-cols-2 gap-1.5 sm:flex">
          {dna.samples.map((sample, i) => {
            const shown = step >= 10 && !briefOpen;
            return (
              <m.li
                key={sample.hex}
                className="flex h-6 items-center gap-1.5 rounded-full bg-white pr-2 pl-1 shadow-sm"
                initial={false}
                animate={{ opacity: shown ? 1 : 0 }}
                transition={shown ? { duration: 0.3, delay: i * 0.05 } : { duration: 0.2 }}
              >
                <m.span
                  ref={(el) => {
                    dots.current[i] = el;
                  }}
                  className="size-4 rounded-full outline-1 -outline-offset-1 outline-edge"
                  style={{ background: sample.hex }}
                  initial={false}
                  // Filled in as its colour arrives from the slide
                  animate={{ opacity: shown ? 1 : 0 }}
                  transition={shown && step === 10 ? { duration: 0.15, delay: 0.5 + i * 0.07 } : { duration: 0.15 }}
                />
                <span className="font-mono text-[10px] text-base-600">{sample.hex}</span>
              </m.li>
            );
          })}
        </ul>

        {/* The colours themselves: picked on the slide, then carried down to the palette */}
        {places &&
          dna.samples.map((sample, i) => {
            const from = places.spots[i];
            const to = places.dots[i];
            const flying = step === 10;
            const shown = step >= PICK + i && step <= 10;
            return (
              <m.span
                key={sample.hex}
                className="absolute top-0 left-0 -mt-2 -ml-2 size-4 rounded-full shadow-md ring-2 ring-paper"
                style={{ background: sample.hex }}
                initial={false}
                animate={
                  flying
                    ? { x: to.x, y: to.y, opacity: [1, 1, 0], scale: 1 }
                    : { x: from.x, y: from.y, opacity: shown ? 1 : 0, scale: shown ? 1 : 0.4 }
                }
                transition={
                  flying
                    ? { x: { duration: 0.55, ease: easeOut, delay: i * 0.07 }, y: { duration: 0.55, ease: easeOut, delay: i * 0.07 }, opacity: { duration: 0.7, times: [0, 0.85, 1], delay: i * 0.07 } }
                    : shown
                      ? { x: { duration: 0 }, y: { duration: 0 }, opacity: { duration: 0.15 }, scale: { type: "spring", stiffness: 500, damping: 22 } }
                      : { duration: 0 }
                }
              />
            );
          })}

        {/* The pointer that picks the colours and taps Copy brief, its tip on the target */}
        {places && (
          <m.svg
            viewBox="0 0 16 20"
            className="pointer-events-none absolute top-0 left-0 z-10 -mt-px -ml-px w-3.5 fill-base-900 stroke-white"
            initial={false}
            animate={target ? { x: target.x, y: target.y, opacity: 1, scale: [1, 1, 0.85, 1] } : { x: places.park.x, y: places.park.y, opacity: 0, scale: 1 }}
            transition={
              target
                ? { x: { duration: 0.4, ease: easeOut }, y: { duration: 0.4, ease: easeOut }, opacity: { duration: 0.2 }, scale: { duration: 0.5, times: [0, 0.75, 0.88, 1] } }
                : // Fades where it is, then moves to the corner unseen
                  { opacity: { duration: 0.25 }, x: { duration: 0, delay: 0.3 }, y: { duration: 0, delay: 0.3 }, scale: { duration: 0 } }
            }
          >
            <path d="M1 1v15.5l4.2-4.1 2.7 6.3 2.6-1.1-2.7-6.2H14z" strokeWidth="1.2" strokeLinejoin="round" />
          </m.svg>
        )}

        {/* Everything above, written into the brief */}
        <m.div
          className="absolute inset-x-4 bottom-4 rounded-xl bg-white p-3 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[62%]"
          initial={false}
          animate={briefOpen ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.97 }}
          transition={briefOpen ? { type: "spring", stiffness: 300, damping: 28 } : { duration: 0.25 }}
        >
          <p className="flex items-center justify-between gap-2 text-[11px] text-base-500">
            <span className="font-mono">replica-brief.md</span>
            <span className="flex items-center gap-1">
              <Check className="size-3 text-base-900" /> Copied
            </span>
          </p>
          <div className="mt-2 space-y-0.5 font-mono text-[10px] leading-4 text-base-600">
            {dna.brief.map((line, i) => (
              <m.p key={line} className={cx("truncate", i === 0 && "font-medium text-base-900")} {...rise(briefOpen, i + 1)}>
                {line}
              </m.p>
            ))}
          </div>
        </m.div>
      </div>
    </div>
  );
}

// A piece that rises in once its step has come, and leaves quietly
function rise(on: boolean, index = 0) {
  return {
    initial: false as const,
    animate: on ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
    transition: on ? { duration: 0.4, ease: easeOut, delay: 0.1 + index * 0.07 } : { duration: 0.15 },
  };
}
