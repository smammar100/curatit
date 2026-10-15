"use client";

import { lazy, type ComponentType } from "react";

// The homepage's below-the-fold client components, each in its own chunk. The server still
// renders them into the page's HTML, but the browser only downloads their code (and the
// animation library they share) when HydrateOnView brings their section to life, instead of
// competing with the hero for bandwidth and CPU on load. HydrateOnView renders them in a
// transition, so the server HTML stays on screen until a chunk arrives.

// Each export is a plain component around the lazy one: the server references these
// exports as client components, which React already loads through a lazy of its own, and
// React rejects a lazy that resolves to another lazy. The animation provider loads with the
// section rather than here, so none of framer-motion is in the page's first chunks.
function island<P extends object>(
  load: () => Promise<{ default: ComponentType<P> }>,
) {
  const Lazy = lazy(async () => {
    const [{ default: Component }, { default: MotionProvider }] =
      await Promise.all([load(), import("./MotionProvider")]);
    return {
      default: (props: P) => (
        <MotionProvider>
          <Component {...props} />
        </MotionProvider>
      ),
    };
  });
  return function Island(props: P) {
    return <Lazy {...props} />;
  };
}

export const ProblemSolution = island(() => import("./ProblemSolution"));
export const SearchDemo = island(() => import("./SearchDemo"));
export const DetailDemo = island(() => import("./DetailDemo"));
export const BoardDemo = island(() => import("./BoardDemo"));
export const Categories = island(() => import("./Categories"));
export const McpDemo = island(() => import("./McpDemo"));
export const LogoReel = island(() => import("./LogoReel"));
