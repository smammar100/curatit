"use client";

// The live demos on the display sheets (/system/skeleton): the ones that need state, which a
// server sheet can't hold. SkeletonSwap flips a post card and a person row between their
// skeletons and their content and measures the block both ways, so you can see nothing moves.
// Each demo renders once per theme panel; nothing moves until it's pressed.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Avatar from "@/components/fundations/elements/Avatar";
import Button from "@/components/fundations/elements/Button";
import Skeleton from "@/components/fundations/elements/Skeleton";
import Card, { CardDescription, CardMedia, CardMeta, CardTitle } from "@/components/fundations/molecules/Card";

const PICTURE = "/_next/image?url=%2Fimages%2Favatar.jpeg&w=96&q=75";

/** The element's height in whole pixels, kept current as it changes */
function useHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setHeight(Math.round(node.getBoundingClientRect().height)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, height };
}

export function SkeletonSwap() {
  const [loaded, setLoaded] = useState(false);
  const { ref, height } = useHeight<HTMLDivElement>();

  return (
    <div className="flex flex-col items-start gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={() => setLoaded((value) => !value)}>
          {loaded ? "Show the skeleton" : "Show the content"}
        </Button>
        <span className="font-mono text-caption-lg text-secondary-foreground tabular-nums">
          {height === null ? "measuring…" : `block height ${height}px`}
        </span>
      </div>

      <div ref={ref} aria-busy={!loaded} className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {loaded ? (
          <>
            <Card tag="article">
              <CardMedia aspect="8/5">
                <Image src="/images/sites/2.png" alt="A red landing page with a black panel" width={1920} height={1200} sizes="320px" />
              </CardMedia>
              <CardMeta className="mt-4" uppercase>
                Agency · Landing page
              </CardMeta>
              <CardTitle className="mt-1">An award-winning studio&rsquo;s home</CardTitle>
            </Card>
            <Card tag="article" variant="raised" padding="md" className="self-start">
              <div className="flex items-center gap-3">
                <Avatar src={PICTURE} name="Daniel Okafor" decorative />
                <div className="flex min-w-0 flex-col">
                  <CardTitle tag="p">Daniel Okafor</CardTitle>
                  <CardMeta>Saved 12 posts this week</CardMeta>
                </div>
              </div>
              <CardDescription className="mt-3">Collects fintech launches.</CardDescription>
            </Card>
          </>
        ) : (
          <>
            {/* Each card announces its own wait once; every block inside is hidden */}
            <Card role="status" aria-label="Loading the example post">
              <Skeleton className="aspect-8/5 w-full" />
              <div className="mt-4 text-caption-lg">
                <Skeleton shape="line" width="1/2" />
              </div>
              <div className="mt-1 text-body-sm">
                <Skeleton shape="line" width="3/4" />
              </div>
            </Card>
            <Card role="status" aria-label="Loading the example person" variant="raised" padding="md" className="self-start">
              <div className="flex items-center gap-3">
                <Skeleton shape="circle" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="text-body-sm">
                    <Skeleton shape="line" width="1/2" />
                  </div>
                  <div className="text-caption-lg">
                    <Skeleton shape="line" width="2/3" />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-body-sm">
                <Skeleton shape="line" width="2/3" />
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
