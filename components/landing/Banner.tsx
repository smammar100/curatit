"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bannerImages } from "./tokens";

const SLIDES = bannerImages.length;

const roundButton =
  "flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.15)]";

/** Autoplaying cross-fade banner with dots, prev/next, and a pulsing CTA. */
export default function Banner({ ctaHref }: { ctaHref: string }) {
  const [active, setActive] = useState(0);

  // Restart the 3s timer whenever the slide changes, including manual changes.
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % SLIDES), 3000);
    return () => window.clearInterval(timer);
  }, [active]);

  return (
    <motion.div
      className="relative w-full overflow-hidden rounded-lg bg-base-900"
      style={{ height: "clamp(320px, 45vw, 600px)" }}
      initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Curatit highlights"
    >
      {bannerImages.map((src, index) => (
        <motion.div
          key={src}
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: index === active ? 1 : 0, scale: index === active ? 1 : 1.04 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          aria-hidden={index !== active}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            priority={index === 0}
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
        </motion.div>
      ))}

      <div className="absolute right-6 top-6 z-10 flex gap-[5px]">
        {bannerImages.map((src, index) => (
          <button
            key={src}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            aria-current={index === active}
            onClick={() => setActive(index)}
            className="h-1.5 cursor-pointer rounded-full border-0 p-0 transition-all duration-300 ease-in-out"
            style={{
              width: index === active ? 18 : 6,
              background: index === active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.45)",
            }}
          />
        ))}
      </div>

      <div className="absolute bottom-7 left-7 z-10">
        <div className="relative inline-block">
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full"
            style={{ inset: -8, borderRadius: 14, border: "2px solid rgba(255,255,255,0.40)" }}
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full"
            style={{ inset: -4, borderRadius: 12, border: "2px solid rgba(255,255,255,0.25)" }}
            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />
          <motion.div className="relative" style={{ zIndex: 2 }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Link
              href={ctaHref}
              className="flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-base font-medium text-base-900"
            >
              Explore the library
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-7 right-7 z-10 flex gap-2.5">
        <motion.button
          type="button"
          aria-label="Previous slide"
          className={roundButton}
          whileHover={{ scale: 1.08, backgroundColor: "#FFFFFF" }}
          transition={{ duration: 0.2 }}
          onClick={() => setActive((current) => (current - 1 + SLIDES) % SLIDES)}
        >
          <ChevronLeft size={20} color="#111111" />
        </motion.button>
        <motion.button
          type="button"
          aria-label="Next slide"
          className={roundButton}
          whileHover={{ scale: 1.08, backgroundColor: "#FFFFFF" }}
          transition={{ duration: 0.2 }}
          onClick={() => setActive((current) => (current + 1) % SLIDES)}
        >
          <ChevronRight size={20} color="#111111" />
        </motion.button>
      </div>
    </motion.div>
  );
}
