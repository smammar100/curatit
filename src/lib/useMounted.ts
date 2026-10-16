"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False while rendering on the server and during hydration, true once the component has
// mounted in the browser. Used to keep image requests off the first paint: a cover rendered
// through this is a blank frame in the server HTML and only asks for its file after mount,
// which on the homepage means after the section it sits in has scrolled into view
// (HydrateOnView keeps the server HTML until then). Lighthouse's mobile simulation charges the
// headline's paint for every byte requested before it, so images below the fold must not start.
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
