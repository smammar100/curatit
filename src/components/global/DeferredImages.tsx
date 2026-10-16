"use client";

import { useEffect, useSyncExternalStore } from "react";
import { afterFirstPaint } from "@/lib/afterFirstPaint";

// Images that start after the page has loaded and its first paint is on screen. The `<img>`s
// name their files in `data-src` / `data-srcset`, and this moves them into `src` / `srcset` once
// `load` has fired and the first contentful paint has been shown (at once when both have already
// happened). The images themselves stay in server components: this is the one small client
// piece beside them.
//
// Why: Lighthouse's mobile simulation charges the first paint for every byte requested before
// it, and the browser's preload scanner starts every `src` it finds in the HTML, lazy or not,
// as soon as it is within a few screens. The hero corridor's eighteen covers, the footer strip's
// twenty and the sign-in wall's eighty-seven were starting before the headline had painted
// (2026-10-16). `load` alone wasn't enough: Chrome sometimes shows the first frame a second
// after `load`, and the covers were charged to it all the same (see lib/afterFirstPaint).
//
// Two paths, because React never runs a `<script>` it creates itself:
// - A page served as HTML: the inline script runs as the browser parses it, before React has
//   loaded, and waits for `load` and the first paint. This component renders it only on the
//   server and while hydrating (when React keeps the server's element), then drops it.
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
    let cancel = () => {};
    const run = () => {
      cancel = afterFirstPaint(() => swap(selector));
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
    return () => {
      window.removeEventListener("load", run);
      cancel();
    };
  }, [selector]);

  if (!fromServer) return null;
  const query = JSON.stringify(`${selector}[data-src]`);
  // The same as the effect, in plain script: after `load`, then after the first contentful paint
  // (straight away where the browser doesn't report paint timing)
  const script = `(function(){var go=function(){document.querySelectorAll(${query}).forEach(function(i){i.srcset=i.dataset.srcset||"";i.src=i.dataset.src;i.removeAttribute("data-src");i.removeAttribute("data-srcset")})};var start=function(){var P=window.PerformanceObserver;if(!P||!P.supportedEntryTypes||P.supportedEntryTypes.indexOf("paint")<0)return go();var o=new P(function(l){if(l.getEntriesByName("first-contentful-paint").length){o.disconnect();go()}});o.observe({type:"paint",buffered:true})};if(document.readyState==="complete")start();else addEventListener("load",start,{once:true})})()`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
