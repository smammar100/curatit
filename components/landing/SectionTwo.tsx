"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Tag from "./Tag";
import Button from "@/components/fundations/elements/Button";
import { colors } from "./tokens";

const lines: { words: string[]; color: string }[] = [
  { words: ["Search,", "save"], color: colors.ink },
  { words: ["&", "share", "references"], color: colors.accent },
  { words: ["for", "every", "brief."], color: colors.ink },
];

const blurIn = {
  initial: { opacity: 0, filter: "blur(8px)", y: 16 },
  whileInView: { opacity: 1, filter: "blur(0px)", y: 0 },
  viewport: { once: true, margin: "-80px" },
};

export default function SectionTwo({ signedIn }: { signedIn: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  // Tags pop in only once the cascade is fully on screen.
  const inView = useInView(sectionRef, { amount: 0.95 });
  let wordIndex = 0;

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      data-section="two"
      className="relative flex items-start overflow-hidden px-5 pt-20 md:px-16"
      style={{ background: colors.page, minHeight: "calc(100vh - 30px)" }}
    >
      <div className="relative z-10 w-full max-w-[520px] pt-8">
        <motion.div
          className="mb-5 text-xs font-medium uppercase"
          style={{ letterSpacing: 2.5, color: colors.eyebrow }}
          {...blurIn}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          RESEARCH BOARDS
        </motion.div>

        <h2
          className="m-0 font-display font-light"
          style={{ fontSize: "clamp(40px, 5vw, 60px)", lineHeight: 1.05 }}
        >
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className="block" style={{ color: line.color }}>
              {line.words.map((word) => {
                const delay = wordIndex++ * 0.06;
                return (
                  <motion.span
                    key={word}
                    className="inline-block"
                    style={{ marginRight: "0.25em" }}
                    initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                    whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, ease: "easeOut", delay }}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </h2>

        <motion.p
          className="mt-7 max-w-[340px] text-sm"
          style={{ color: colors.body, lineHeight: 1.65 }}
          {...blurIn}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
        >
          Collect posts for a campaign, note what to adapt, and send a read-only link your client can open without an
          account.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-wrap gap-3"
          {...blurIn}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.7 }}
        >
          <Button isLink href={signedIn ? "/boards" : "/signup"} size="base" variant="default">
            {signedIn ? "Open your boards" : "Get access"}
          </Button>
          <Button isLink href="/pricing" size="base" variant="muted">
            See pricing
          </Button>
        </motion.div>
      </div>

      <Tag
        color={colors.accentSoft}
        className="hidden md:block"
        style={{ top: 260, left: "calc(40% + 340px)", zIndex: 20 }}
        padding="9px 20px"
        tail={{ side: "center", near: 8, far: 8 }}
        motionProps={{
          initial: { opacity: 0, scale: 0.6 },
          animate: inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 },
          transition: { duration: 0.5, ease: "easeOut" },
        }}
      >
        #carousel
      </Tag>
      <Tag
        color={colors.ink}
        className="hidden md:block"
        style={{ top: 430, left: "min(calc(40% + 680px), calc(100% - 150px))", zIndex: 20 }}
        padding="9px 20px"
        tail={{ side: "left", offset: 20, near: 8, far: 8 }}
        motionProps={{
          initial: { opacity: 0, scale: 0.6 },
          animate: inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 },
          transition: { duration: 0.5, ease: "easeOut", delay: 0.15 },
        }}
      >
        #bold-type
      </Tag>
    </section>
  );
}
