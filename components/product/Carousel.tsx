"use client";

import { useState } from "react";
import type { SlideArt as Art } from "@/lib/art";
import SlideArt from "./SlideArt";

/** Accessible slide viewer: buttons, arrow keys, and a live position label. */
export default function Carousel({ slides, label }: { slides: { art: Art; alt: string }[]; label: string }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const go = (next: number) => setIndex(Math.max(0, Math.min(count - 1, next)));

  if (count === 1) {
    return (
      <div className="rounded overflow-hidden shadow">
        <SlideArt art={slides[0].art} alt={slides[0].alt} />
      </div>
    );
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(index + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(index - 1);
        }
      }}
      className="rounded-lg focus:outline-2 focus:outline-offset-4 focus:outline-accent-500"
    >
      <div className="relative rounded overflow-hidden shadow">
        {slides.map((slide, position) => (
          <div
            key={position}
            role="group"
            aria-roledescription="slide"
            aria-label={`${position + 1} of ${count}`}
            hidden={position !== index}
          >
            <SlideArt art={slide.art} alt={slide.alt} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="h-9 px-4 rounded-lg text-sm font-medium bg-white text-base-900 ring-1 ring-base-200 hover:bg-base-100 disabled:opacity-40"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose slide">
          {slides.map((_, position) => (
            <button
              key={position}
              type="button"
              role="tab"
              aria-selected={position === index}
              aria-label={`Slide ${position + 1}`}
              onClick={() => go(position)}
              className={`size-2.5 rounded-full transition-colors ${position === index ? "bg-base-900" : "bg-base-300 hover:bg-base-400"}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === count - 1}
          className="h-9 px-4 rounded-lg text-sm font-medium bg-white text-base-900 ring-1 ring-base-200 hover:bg-base-100 disabled:opacity-40"
        >
          Next →
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {count}
      </p>
    </section>
  );
}
