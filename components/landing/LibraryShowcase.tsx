"use client";

import SlideArt from "@/components/product/SlideArt";
import { Card, CardGroup, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { LandingLibrary } from "@/lib/services/creatives";
import Backdrop from "./Backdrop";

/** The three stacked covers on each category tile (back → front). */
const fan = [
  { x: -22, rotate: -7, y: 4 },
  { x: 22, rotate: 7, y: 4 },
  { x: 0, rotate: 0, y: 0 },
];

export default function LibraryShowcase({ library, signedIn }: { library: LandingLibrary; signedIn: boolean }) {
  return (
    <section className="px-6 py-24 md:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <h2 className="heading-display max-w-lg text-foreground">Six categories, studied closely.</h2>
          <p className="max-w-md text-[14px] leading-6 text-muted-foreground lg:justify-self-end">
            Curatit starts narrow and deep: recognisable brands, Instagram statics and carousels, every post reviewed by
            an editor. New categories open only once they&rsquo;re properly covered.
          </p>
        </div>

        <div className="mt-10">
          <CardGroup columns={3} separated border="outlined" className="max-lg:hidden">
            {library.categories.map((category) => (
              <CategoryCard key={category.id} category={category} signedIn={signedIn} />
            ))}
          </CardGroup>
          <CardGroup separated border="outlined" className="lg:hidden">
            {library.categories.map((category) => (
              <CategoryCard key={category.id} category={category} signedIn={signedIn} />
            ))}
          </CardGroup>
        </div>

        <p className="mt-6 text-[12px] text-muted-foreground">
          Shown with Curatit&rsquo;s demo library of fictional brands while launch sources are approved.
        </p>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  signedIn,
  index,
}: {
  category: LandingLibrary["categories"][number];
  signedIn: boolean;
  index?: number;
}) {
  const target = `/library?category=${category.id}`;
  const href = signedIn ? target : `/signup?next=${encodeURIComponent(target)}`;

  return (
    <Card href={href} label={`Browse ${category.name}`} index={index}>
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-[2px]">
        <Backdrop covers={category.covers} />
        {category.covers.map((cover, position) => (
          <div
            key={position}
            className="absolute w-28 overflow-hidden rounded-[2px] shadow-surface-5"
            style={{
              zIndex: position,
              transform: `translate(${fan[position].x}px, ${fan[position].y}px) rotate(${fan[position].rotate}deg)`,
            }}
          >
            <SlideArt art={cover.art} alt="" />
          </div>
        ))}
      </div>
      <CardHeader>
        <CardTitle>{category.name}</CardTitle>
        <CardDescription>
          <span className="tabular-nums">
            {category.count} references · {category.objectives} objectives
          </span>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
