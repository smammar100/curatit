"use client";

import { motion } from "framer-motion";
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";
import Tag from "./Tag";
import { colors, jelly, smoothEase } from "./tokens";
import { useIntroSkipped } from "./useIntro";

const paragraph =
  "Real organic brand posts, reviewed by editors. Search by brief, save the best references to private boards, and share them with your client.";

const blurWord = { opacity: 0, y: 16, filter: "blur(8px)" };
const clearWord = { opacity: 1, y: 0, filter: "blur(0px)" };

const lines = [
  ["Find", "the", "brand", "posts"],
  ["worth", "studying."],
];

export default function Hero({ signedIn }: { signedIn: boolean }) {
  // After the first visit this session, render settled instead of replaying the intro.
  const skipped = useIntroSkipped();
  const from = <T,>(state: T) => (skipped ? false : state);
  let wordIndex = 0;

  return (
    <section className="relative flex min-h-screen justify-center overflow-hidden px-8">
      <div key={skipped ? "settled" : "intro"} className="flex w-full flex-col items-center pt-[140px] text-center">
        <h1
          className="max-w-[1100px] font-display font-light text-base-900 text-balance"
          style={{ fontSize: "clamp(44px, 7.5vw, 96px)", lineHeight: 1 }}
        >
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className="block">
              {line.map((word) => {
                const delay = 0.15 + wordIndex++ * 0.06;
                return (
                  <motion.span
                    key={word}
                    className="inline-block"
                    style={{ marginRight: "0.25em" }}
                    initial={from(blurWord)}
                    animate={clearWord}
                    transition={{ duration: 0.5, ease: smoothEase, delay }}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </h1>

        {/* The hero card row lives in the global overlay; this reserves its space. */}
        <div data-hero-row className="relative mt-10 h-[260px] w-full">
          <Tag
            color={colors.accent}
            style={{ left: "max(8px, calc(50% - 320px))", top: -12, zIndex: 20 }}
            tail={{ side: "left", offset: 16, near: 8, far: 4 }}
            motionProps={{ initial: from({ opacity: 0 }), animate: jelly, transition: { duration: 0.8, delay: 2.0 } }}
          >
            #product-launch
          </Tag>
          <Tag
            color={colors.dark}
            style={{ right: "max(8px, calc(50% - 420px))", top: -20, zIndex: 20 }}
            tail={{ side: "right", offset: 16, near: 8, far: 4 }}
            motionProps={{ initial: from({ opacity: 0 }), animate: jelly, transition: { duration: 0.8, delay: 2.15 } }}
          >
            #editorial
          </Tag>
        </div>

        <Text tag="p" variant="textBase" className="mt-12 max-w-[480px] text-base-600">
          {paragraph.split(" ").map((word, index) => (
            <motion.span
              key={index}
              className="inline-block"
              style={{ marginRight: "0.25em" }}
              initial={from(blurWord)}
              animate={clearWord}
              transition={{ duration: 0.4, ease: smoothEase, delay: 1.6 + index * 0.02 }}
            >
              {word}
            </motion.span>
          ))}
        </Text>

        <motion.div
          className="mt-7 flex flex-wrap justify-center gap-2 pb-20"
          initial={from({ opacity: 0, y: 20 })}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: smoothEase, delay: 1.9 }}
        >
          <Button isLink href={signedIn ? "/library" : "/signup"} size="base" variant="default">
            {signedIn ? "Open the library" : "Get access"}
          </Button>
          <Button isLink href="#how-it-works" size="base" variant="muted">
            Read more
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
