"use client";

import { useEffect, useSyncExternalStore } from "react";

// Images that start after the page has loaded. The `<img>`s name their files in `data-src` /
// `data-srcset`, and this moves them into `src` / `srcset` once `load` has fired (or at once
// when the page has already loaded). The images themselves stay in server components: this is
// the one small client piece beside them.
//
// Why: Lighthouse's mobile simulation charges the first paint for every byte requested before
// it, and the browser's preload scanner starts every `src` it finds in the HTML, lazy or not,
// as soon as it is within a few screens. The hero corridor's eighteen covers, the footer strip's
// twenty and the sign-in wall's eighty-seven were starting before the headline had painted
// (2026-10-16).
//
// Two paths, because React never runs a `<script>` it creates itself:
// - A page served as HTML: the inline script runs as the browser parses it, before React has
//   loaded, and waits for `load`. This component renders it only on the server and while
//   hydrating (when React keeps the server's element), then drops it.
// - A page reached by a client-side navigation (a link, Back, a redirect): there is no server
//   HTML, React builds the images itself, and the effect does the swap after mount.
// The swap removes `data-src`, so whichever runs second finds nothing to do.
//
// `selector` picks the images; keep it specific to one component. Images that are lazy keep
// `loading="lazy"`, so after the swap the browser still only fetches the ones near the viewport.
// The images carry `suppressHydrationWarning`: if `load` fires before React has hydrated them,
// the server's attributes no longer match the props, on purpose.

function swap(selector: string) {
  document
    .querySelectorAll<HTMLImageElement>(`${selector}[data-src]`)
    .forEach((image) => {
      image.srcset = image.dataset.srcset || "";
      image.src = image.dataset.src || "";
      image.removeAttribute("data-src");
      image.removeAttribute("data-srcset");
    });
}

const subscribe = () => () => {};

export default function DeferredImages({ selector }: { selector: string }) {
  // True on the server and while hydrating, false once mounted or on a client-side render
  const fromServer = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );

  useEffect(() => {
    if (document.readyState === "complete") {
      swap(selector);
      return;
    }
    const run = () => swap(selector);
    window.addEventListener("load", run, { once: true });
    return () => window.removeEventListener("load", run);
  }, [selector]);

  if (!fromServer) return null;
  const query = JSON.stringify(`${selector}[data-src]`);
  const script = `(function(){var go=function(){document.querySelectorAll(${query}).forEach(function(i){i.srcset=i.dataset.srcset||"";i.src=i.dataset.src;i.removeAttribute("data-src");i.removeAttribute("data-srcset")})};if(document.readyState==="complete")go();else addEventListener("load",go,{once:true})})()`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
