"use client";

import { useState } from "react";
// Fundations
import Button from "@/components/fundations/elements/Button";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
// Components
import AppWindow from "./AppWindow";
import PostCover from "./PostCover";
import { brands, posts, type Post } from "./demo";

const post: Post = posts.fizzwellYuzu;
const brand = brands[post.brand];

// Layout follows the window's own width (AppWindow is a container), so it works inside a card
export default function DetailDemo() {
  const [slide, setSlide] = useState(0);
  const count = post.slides.length;

  const analysis = [
    { label: "Brand", value: `${brand.name} · ${brand.category}` },
    { label: "Objective", value: post.objective },
    { label: "Format", value: `${post.format} ${post.mediaType.toLowerCase()} · ${count} slides` },
    { label: "Structure", value: post.structure },
    { label: "Visual style", value: post.styles.join(", ") },
  ];

  return (
    <AppWindow title={`${brand.name} — ${post.hook}`}>
      <div className="grid gap-5 p-4 @sm:grid-cols-2 @sm:p-5">
        <div>
          {/* Controls sit above the slide, so they stay reachable when the window is cropped below */}
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <Button
              type="button"
              iconOnly
              size="xxs"
              variant="muted"
              aria-label="Previous slide"
              disabled={slide === 0}
              onClick={() => setSlide(slide - 1)}
              className="disabled:opacity-40"
            >
              <CaretLeft className="size-3.5" />
            </Button>
            <p className="truncate text-xs text-base-600" aria-live="polite">
              <span className="font-medium text-base-900">{post.sequence?.[slide]}</span> · {slide + 1} / {count}
            </p>
            <Button
              type="button"
              iconOnly
              size="xxs"
              variant="muted"
              aria-label="Next slide"
              disabled={slide === count - 1}
              onClick={() => setSlide(slide + 1)}
              className="disabled:opacity-40"
            >
              <CaretRight className="size-3.5" />
            </Button>
          </div>
          <PostCover brand={post.brand} slide={post.slides[slide]} className="max-w-44 rounded shadow @sm:max-w-none" />
        </div>
        <div>
          <dl className="divide-y divide-base-100 text-xs">
            {analysis.map((row) => (
              <div key={row.label} className="flex justify-between gap-3 py-2">
                <dt className="shrink-0 text-base-500">{row.label}</dt>
                <dd className="text-right text-base-900">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 rounded-md bg-base-50 p-3">
            <p className="text-xs font-medium text-base-900">Why it&apos;s here</p>
            <p className="mt-1 text-xs leading-relaxed text-base-600">{post.reason}</p>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}
