"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { smoothEase } from "./tokens";

/** Dark closing panel with a two-line serif headline and one action. */
export default function ClosingCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="px-8 pb-24 md:px-16">
      <motion.div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-lg bg-base-900 px-8 py-24 text-center"
        initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: smoothEase }}
      >
        {/* Soft accent glow, echoing the page's background blobs. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-full size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-accent-600), transparent 65%)" }}
        />
        <h2 className="relative font-display text-4xl font-light leading-tight text-white text-balance md:text-5xl lg:text-6xl">
          <span className="block">Reference, not copying.</span>
          <span className="block text-base-400">Start with your next brief.</span>
        </h2>
        <p className="relative mx-auto mt-6 max-w-md text-sm text-base-300">
          Every post credits its brand and links to the original. Use the patterns to make work that&rsquo;s yours.
        </p>
        <Link
          href={signedIn ? "/library" : "/signup"}
          className="relative mt-10 inline-flex h-11 items-center rounded-lg bg-white px-5 text-base font-medium text-base-900 transition-colors hover:bg-base-100 focus:outline-2 focus:outline-offset-2 focus:outline-white"
        >
          {signedIn ? "Open the library" : "Get access"}
        </Link>
      </motion.div>
    </section>
  );
}
