"use client";

import { useState } from "react";
import type { SlideArt as Art } from "@/lib/art";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SlideArt from "./SlideArt";

/** Accessible slide viewer: buttons, arrow keys, and a live position label. */
export default function Carousel({ slides, label }: { slides: { art: Art; alt: string }[]; label: string }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const go = (next: number) => setIndex(Math.max(0, Math.min(count - 1, next)));

  if (count === 1) {
    return (
      <div className="overflow-hidden rounded-[2px] shadow-surface-1">
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
      className="rounded-xl outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)] focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative overflow-hidden rounded-[2px] shadow-surface-1">
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
        <Button type="button" variant="secondary" size="compact" leadingIcon={ArrowLeft} onClick={() => go(index - 1)} disabled={index === 0}>
          Previous
        </Button>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="Choose slide">
          {slides.map((_, position) => (
            <button
              key={position}
              type="button"
              role="tab"
              aria-selected={position === index}
              aria-label={`Slide ${position + 1}`}
              onClick={() => go(position)}
              className={cn("size-2 rounded-full transition-colors duration-80", position === index ? "bg-foreground" : "bg-accent hover:bg-selected")}
            />
          ))}
        </div>

        <Button type="button" variant="secondary" size="compact" trailingIcon={ArrowRight} onClick={() => go(index + 1)} disabled={index === count - 1}>
          Next
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {count}
      </p>
    </section>
  );
}
