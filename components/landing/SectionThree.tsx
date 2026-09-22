"use client";

import { motion } from "framer-motion";
import Banner from "./Banner";
import Tag from "./Tag";
import { colors, jelly } from "./tokens";

const words = ["Reference,", "not", "copying."];

export default function SectionThree({ signedIn }: { signedIn: boolean }) {
  return (
    <section
      data-section="three"
      className="relative min-h-screen overflow-hidden px-5 pb-20 pt-20 md:px-16"
      style={{ background: colors.page }}
    >
      <div className="relative z-10 mb-10 max-w-[520px]">
        <motion.div
          className="mb-5 text-xs font-medium uppercase"
          style={{ letterSpacing: 2.5, color: colors.eyebrow }}
          initial={{ opacity: 0, filter: "blur(8px)", y: 12 }}
          whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          EDITOR-REVIEWED LIBRARY
        </motion.div>
        <h2
          className="m-0 font-display font-light text-base-900"
          style={{ fontSize: "clamp(48px, 6.5vw, 80px)", lineHeight: 1 }}
        >
          {words.map((word, index) => (
            <motion.span
              key={word}
              className="inline-block"
              style={{ marginRight: "0.2em" }}
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.07 }}
            >
              {word}
            </motion.span>
          ))}
        </h2>
      </div>

      <Tag
        color={colors.ink}
        className="hidden md:block"
        style={{ top: 120, right: 180, zIndex: 10 }}
        padding="10px 22px"
        fontSize={16}
        tail={{ side: "right", offset: 24, near: 4, far: 8 }}
        motionProps={{
          initial: { opacity: 0 },
          whileInView: jelly,
          viewport: { once: true },
          transition: { duration: 0.8, delay: 0.65 },
        }}
      >
        #editor-picked
      </Tag>

      <Banner ctaHref={signedIn ? "/library" : "/signup?next=/library"} />
    </section>
  );
}
