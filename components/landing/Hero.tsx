"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/springs";
import Tag from "./Tag";
import { colors } from "./tokens";
import { useIntroSkipped } from "./useIntro";

/**
 * Section 1. The headline and copy are still; the only motion is the card
 * deck dealing out (ScrollCards) and the two tags landing with it.
 */
export default function Hero({ signedIn }: { signedIn: boolean }) {
  // After the first visit this session, render settled instead of replaying the deal.
  const skipped = useIntroSkipped();
  const tagIn = (delay: number) => ({
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: skipped ? { duration: 0 } : { ...spring.moderate, delay },
  });

  return (
    <section className="relative flex min-h-screen justify-center overflow-hidden px-6">
      <div className="flex w-full flex-col items-center pt-[140px] text-center">
        <h1
          className="max-w-[1000px] text-balance font-serif font-normal tracking-[-0.02em] text-foreground"
          style={{ fontSize: "clamp(44px, 7.5vw, 96px)", lineHeight: 1 }}
        >
          <span className="block">Find the brand posts</span>
          <span className="block">worth studying.</span>
        </h1>

        {/* The hero card row lives in the global overlay; this reserves its space. */}
        <div data-hero-row className="relative mt-10 h-[260px] w-full">
          <Tag
            color={colors.ink}
            ink={colors.onInk}
            style={{ left: "max(8px, calc(50% - 320px))", top: -12, zIndex: 20 }}
            tail={{ side: "left", offset: 16, near: 8, far: 4 }}
            motionProps={tagIn(1.5)}
          >
            #product-launch
          </Tag>
          <Tag
            color="var(--accent)"
            ink={colors.ink}
            style={{ right: "max(8px, calc(50% - 420px))", top: -20, zIndex: 20 }}
            tail={{ side: "right", offset: 16, near: 8, far: 4 }}
            motionProps={tagIn(1.6)}
          >
            #editorial
          </Tag>
        </div>

        <p className="mt-12 max-w-[440px] text-[14px] leading-6 text-muted-foreground">
          Real organic brand posts, reviewed by editors. Search by brief, save the best references to private boards,
          and share them with your client.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2 pb-20">
          <Button asChild>
            <Link href={signedIn ? "/library" : "/signup"}>{signedIn ? "Open the library" : "Get access"}</Link>
          </Button>
          <Button asChild variant="secondary" trailingIcon={ArrowDown}>
            <Link href="#how-it-works">How it works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
