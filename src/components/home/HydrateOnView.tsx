"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { afterFirstPaint } from "@/lib/afterFirstPaint";

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
//
// A section already in view when the page first paints waits for the visitor: their first
// scroll, tap or key (2026-10-16). On a phone the first section's heading shows under the hero
// at load while its stage is still below the fold (its top at 109 to 160% of the screen's
// height, 360 to 430px wide), so it used to come alive at once, and its code, its render and
// its dozen covers landed in the seconds Lighthouse measures, worst on a slow device, where
// the render alone was 200 to 500ms of blocking time. Arriving through a link to a section
// (/#how-it-works) counts as the visitor having moved.

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";
const SKIPPABLE =
  "[content-visibility:auto] [contain-intrinsic-size:auto_100vh]";
const subscribe = () => () => {};

// Whether the visitor has scrolled, tapped or pressed a key, noted from the moment this module
// loads: a section below the fold is only ever seen by scrolling, and that scroll must count
const SIGNS = ["scroll", "pointerdown", "keydown", "touchstart"] as const;
let engaged = false;
const waiting = new Set<() => void>();
if (typeof window !== "undefined") {
  const engage = () => {
    engaged = true;
    for (const sign of SIGNS) window.removeEventListener(sign, engage);
    for (const callback of waiting) callback();
    waiting.clear();
  };
  for (const sign of SIGNS)
    window.addEventListener(sign, engage, { passive: true });
}

// Runs `callback` once the visitor has moved (at once if they have, if the page isn't at its
// top, or if they arrived through a link to a section). Returns a function that cancels it.
function whenEngaged(callback: () => void): () => void {
  if (engaged || window.scrollY > 0 || location.hash) {
    callback();
    return () => {};
  }
  waiting.add(callback);
  return () => waiting.delete(callback);
}

// Whether the section is still wholly below the fold, asked by an intro as it first renders
// (useIntro in DemoParts; 2026-10-18). The server HTML is the finished state, so an intro may
// only hide its pieces to play them in while nobody can see them: a section already on screen
// as it comes alive (a link to it, a refresh partway down, a fling past the margin ahead, a tab
// into it) stays as it is instead of blinking out and fading back. A function rather than a
// value, because the render can wait on the section's code (see islands.tsx) while the visitor
// keeps scrolling, so it's measured at the last moment. False on the server and outside a
// HydrateOnView, where nothing may hide.
export const BelowFold = createContext<() => boolean>(() => false);

export default function HydrateOnView({
  children,
  ahead = false,
}: {
  children: ReactNode;
  /**
   * Come alive half a screen before the section scrolls in, so its code and its covers (which
   * are requested only after mount) are there by the time it is on screen. For every section
   * but the first: the first starts right at the fold, where any margin would render it on load.
   */
  ahead?: boolean;
}) {
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
  // For BelowFold: measured on the wrapper, which still holds the server HTML (and its place)
  // while the section's first client render runs. There's no wrapper yet after a client-side
  // navigation, where nothing has been on screen, so an intro may hide its pieces
  const belowFold = useCallback(() => {
    if (typeof window === "undefined") return false;
    const element = ref.current;
    return !element || element.getBoundingClientRect().top >= window.innerHeight;
  }, []);

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
    //
    // It starts watching only once the first paint is on screen, so a section's code and covers
    // never compete with the headline (see lib/afterFirstPaint), and comes alive only once the
    // visitor has moved (see whenEngaged above).
    const reveal = () => startTransition(() => setShow(true));
    let cancelWait = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        cancelWait = whenEngaged(reveal);
      },
      { rootMargin: ahead ? "0px 0px 50% 0px" : "0px 0px -1px 0px" },
    );
    const cancel = afterFirstPaint(() => observer.observe(element));

    // Tabbing into a section still showing server HTML: render it now, and remember where
    // focus is so it can move to the same control in the new markup
    const onFocusIn = (event: FocusEvent) => {
      focusIndex.current = [...element.querySelectorAll(FOCUSABLE)].indexOf(
        event.target as Element,
      );
      reveal();
    };
    element.addEventListener("focusin", onFocusIn);

    return () => {
      cancel();
      cancelWait();
      observer.disconnect();
      element.removeEventListener("focusin", onFocusIn);
    };
  }, [show, ahead]);

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
      if (
        !inside &&
        !(
          element.compareDocumentPosition(target) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
      )
        return;
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
    ref.current
      ?.querySelectorAll<HTMLElement>(FOCUSABLE)
      [focusIndex.current]?.focus();
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
    // The provider sits inside the wrapper, so both branches keep the same <div> and React
    // reuses the server's node instead of replacing it
    return (
      <div ref={ref} className={className}>
        <BelowFold.Provider value={belowFold}>{children}</BelowFold.Provider>
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: "" }}
      suppressHydrationWarning
    />
  );
}
