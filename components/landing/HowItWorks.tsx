"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Text from "@/components/fundations/elements/Text";
import SlideArt from "@/components/product/SlideArt";
import type { LandingLibrary } from "@/lib/services/creatives";
import { smoothEase } from "./tokens";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: smoothEase, delay },
});

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
        tone === "accent" ? "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-100" : "bg-white text-base-700"
      }`}
    >
      {children}
    </span>
  );
}

/** Step panel: big serif numeral, a slice of real product UI, then the copy. */
function Step({
  number,
  title,
  body,
  children,
  delay,
}: {
  number: string;
  title: string;
  body: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.li className="flex flex-col" {...reveal(delay)}>
      <div className="flex h-[22rem] flex-col overflow-hidden rounded-lg bg-base-50 p-8">
        <p className="font-display text-5xl font-light text-base-300">{number}</p>
        <div className="mt-6 grow">{children}</div>
      </div>
      <Text tag="h3" variant="textBase" className="mt-4 font-medium text-base-900">
        {title}
      </Text>
      <Text tag="p" variant="textSM" className="mt-1 max-w-sm text-base-600">
        {body}
      </Text>
    </motion.li>
  );
}

export default function HowItWorks({ library }: { library: LandingLibrary }) {
  const sample = library.sample;
  const covers = library.categories.flatMap((category) => category.covers).slice(0, 6);

  return (
    <section className="relative px-8 pb-24 pt-40 md:px-16 lg:pt-64">
      <motion.div className="mx-auto max-w-2xl text-center" {...reveal()}>
        <span className="inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[2.5px] text-base-500 ring-1 ring-base-200">
          How it works
        </span>
        <Text tag="h2" variant="displayLG" className="mt-6 font-display font-light text-base-900 text-balance">
          From brief to board, <span className="text-accent-600">in three steps.</span>
        </Text>
        <Text tag="p" variant="textBase" className="mx-auto mt-4 max-w-lg text-base-600">
          Describe the campaign, study why the best posts work, and hand your client a board they can open anywhere.
        </Text>
      </motion.div>

      <ol className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
        <Step
          number="01"
          title="Search by brief"
          body="Write the brief the way you'd say it. Curatit reads it into objectives, formats, and styles you can apply as filters."
          delay={0}
        >
          <div className="flex h-10 items-center gap-2 rounded-md bg-white px-3 text-xs text-base-900 shadow-sm ring-1 ring-base-200">
            <Search size={14} className="shrink-0 text-base-400" aria-hidden="true" />
            <span className="truncate">finance carousels explaining a feature</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip tone="accent">+ Category: Finance</Chip>
            <Chip tone="accent">+ Media type: Carousel</Chip>
            <Chip tone="accent">+ Objective: Educational</Chip>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {covers.slice(0, 3).map((cover, index) => (
              <div key={index} className="overflow-hidden rounded shadow-sm">
                <SlideArt art={cover.art} alt="" />
              </div>
            ))}
          </div>
        </Step>

        <Step
          number="02"
          title="Understand the pattern"
          body="Every post is reviewed by an editor: the hook, the structure across slides, the visual approach, and why it earned a place."
          delay={0.08}
        >
          {sample && (
            <div className="flex gap-4">
              <div className="w-24 shrink-0 overflow-hidden rounded shadow">
                <SlideArt art={sample.cover.art} alt="" />
              </div>
              <dl className="min-w-0 grow divide-y divide-base-200 text-xs">
                {[
                  ["Objective", sample.objective],
                  ["Structure", sample.structure],
                  ["Style", sample.styles],
                  ["Narrative", sample.sequence.slice(0, 3).join(" → ")],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 py-1.5">
                    <dt className="font-medium text-base-900">{label}</dt>
                    <dd className="truncate text-right text-base-600">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {sample && (
            <p className="mt-4 text-xs text-base-500">
              <span className="font-medium text-base-900">{sample.brand}</span> — {sample.hook}
            </p>
          )}
        </Step>

        <Step
          number="03"
          title="Build and share the board"
          body="Save references to private boards with notes on what to adapt, then send a read-only link that expires when you choose."
          delay={0.16}
        >
          <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-base-200">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-base-900">Autumn launch — fintech client</p>
              <Chip tone="accent">Link active · 7 days</Chip>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {covers.slice(2, 6).map((cover, index) => (
                <div key={index} className="overflow-hidden rounded-sm">
                  <SlideArt art={cover.art} alt="" />
                </div>
              ))}
            </div>
            <p className="mt-3 rounded bg-base-50 px-2 py-1.5 text-[11px] text-base-600">
              <span className="font-medium text-base-900">Note:</span> borrow the weighted-bar explainer for the fee
              breakdown.
            </p>
          </div>
        </Step>
      </ol>
    </section>
  );
}
