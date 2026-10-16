// Runs `callback` once the page's first contentful paint has reached the screen (at once if it
// already has, or if the browser doesn't report paint timing). Returns a function that cancels it.
//
// For work that must not compete with the first paint: deferred images, sections coming alive.
// Waiting for `load` isn't enough. Now and then Chrome puts the first frame on screen a second
// after it was painted, well after `load`, and Lighthouse's mobile simulation then charges the
// largest paint for every request that finished and every script that ran before it: the hero's
// covers alone moved the homepage's simulated LCP from 3.4 to 4.9 seconds (2026-10-16).
export function afterFirstPaint(callback: () => void): () => void {
  if (
    typeof PerformanceObserver === "undefined" ||
    !PerformanceObserver.supportedEntryTypes?.includes("paint")
  ) {
    callback();
    return () => {};
  }
  let done = false;
  const observer = new PerformanceObserver((list) => {
    if (done || !list.getEntriesByName("first-contentful-paint").length) return;
    done = true;
    observer.disconnect();
    callback();
  });
  // `buffered` replays a paint that happened before this observer existed
  observer.observe({ type: "paint", buffered: true });
  return () => {
    done = true;
    observer.disconnect();
  };
}
