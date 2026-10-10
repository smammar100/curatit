"use client";

import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// Hydrating every section up front is most of the work a phone does before it can paint
// and respond, and almost none of it is on screen yet. This keeps a section's server HTML
// as it is during hydration and only renders the real thing (a fresh client render, which
// replaces that HTML with the same markup) once the section starts to scroll into view,
// or as soon as keyboard focus lands inside it.
//
// The trick: on the client's hydration pass the wrapper renders with an empty
// `dangerouslySetInnerHTML`, which React neither checks nor patches, so the server's
// markup stays in place untouched until `show` flips. The flip is a transition, so while a
// lazy section's code is still downloading (see islands.tsx) React keeps that markup up
// instead of blanking it.
//
// The wrapper also has `content-visibility: auto`: until a section is near the viewport the
// browser neither lays it out nor paints it, and the lazy images inside it are not requested.
// Otherwise the covers of the section just below the fold load during the hero's first
// paint and, on a slow connection, delay it. `contain-intrinsic-size` is the stand-in height
// while skipped (the real one takes over once rendered), so the page's scroll length is sane.

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";
const SKIPPABLE = "[content-visibility:auto] [contain-intrinsic-size:auto_100vh]";
const subscribe = () => () => {};

export default function HydrateOnView({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // True on the server and while hydrating; false when the page was reached by client-side
  // navigation, where there is no server HTML to keep and the section renders right away
  const hydrating = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const [show, setShow] = useState(!hydrating);
  // Index of the focused control while the server HTML is still up, to restore it after
  const focusIndex = useRef(-1);
  // Counts the links into the page that land in or past this section (see below); once
  // there has been one, the section is always laid out for real
  const [pinned, setPinned] = useState(0);
  const scrollTarget = useRef<string | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (show || !element) return;

    // From its first visible pixel. No margin ahead of the viewport: the first section
    // starts right where the hero ends, so any margin would render it on load. A render
    // takes a frame or two and the markup is identical, so nothing visibly changes.
    //
    // The root is one pixel shorter at the bottom. A section that starts exactly at the fold
    // (the first one does: the hero is a screen tall) otherwise counts as intersecting from
    // the start with a ratio of 0, and since scrolling it into view never crosses a
    // threshold after that, the observer never called back and the section never came to
    // life. One pixel in, it crosses into the shortened root and fires.
    const reveal = () => startTransition(() => setShow(true));
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { rootMargin: "0px 0px -1px 0px" },
    );
    observer.observe(element);

    // Tabbing into a section still showing server HTML: render it now, and remember where
    // focus is so it can move to the same control in the new markup
    const onFocusIn = (event: FocusEvent) => {
      focusIndex.current = [...element.querySelectorAll(FOCUSABLE)].indexOf(event.target as Element);
      reveal();
    };
    element.addEventListener("focusin", onFocusIn);

    return () => {
      observer.disconnect();
      element.removeEventListener("focusin", onFocusIn);
    };
  }, [show]);

  // A link into the page (/#how-it-works): the browser jumps to the target while the skipped
  // sections above it still have their stand-in height, so it lands in the wrong place. Every
  // section up to the target drops `content-visibility: auto` and is laid out for real, then
  // the one holding the target scrolls to it again.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      const inside = element.contains(target);
      if (!inside && !(element.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) return;
      if (inside) scrollTarget.current = id;
      setPinned((n) => n + 1);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Runs before paint, so keyboard users never see focus drop to the page
  useLayoutEffect(() => {
    if (!show || focusIndex.current < 0) return;
    ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE)[focusIndex.current]?.focus();
    focusIndex.current = -1;
  }, [show]);

  useLayoutEffect(() => {
    if (!pinned || !scrollTarget.current) return;
    const target = document.getElementById(scrollTarget.current);
    scrollTarget.current = null;
    if (!target) return;
    // The sections above lay out and hydrate over the next frames, each shifting the target;
    // follow it until it has held still, or for a second, or until the visitor scrolls
    let frames = 0;
    let still = 0;
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
    const follow = () => {
      if (Math.abs(target.getBoundingClientRect().top) > 1) {
        target.scrollIntoView({ behavior: "instant", block: "start" });
        still = 0;
      } else {
        still++;
      }
      if (++frames < 60 && still < 10) raf = requestAnimationFrame(follow);
      else stop();
    };
    follow();
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    return stop;
  }, [pinned]);

  const className = pinned ? "[content-visibility:visible]" : SKIPPABLE;
  if (typeof window === "undefined" || show) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: "" }} suppressHydrationWarning />;
}
