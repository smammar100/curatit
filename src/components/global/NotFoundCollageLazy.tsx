"use client";

import { lazy, Suspense, type ComponentProps } from "react";

// NotFoundCollage, with its code fetched only when a 404 actually renders. Next writes the
// not-found page into every page's data (it's the boundary a notFound() would show), and the
// browser loads the code of every client component named there: the collage's was two of the
// homepage's first scripts (2026-10-16). Through this wrapper the page names only this small
// module. On the 404 page itself the server renders the collage in full, and the Suspense
// boundary keeps that HTML on screen while its code arrives.
const Collage = lazy(() => import("./NotFoundCollage"));

export default function NotFoundCollageLazy(
  props: ComponentProps<typeof Collage>,
) {
  return (
    <Suspense>
      <Collage {...props} />
    </Suspense>
  );
}
