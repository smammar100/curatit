"use client";

import { useEffect, useState } from "react";

const KEY = "curatit:intro-seen";

// Decided once per page load, so every component that asks gets the same answer.
let decided: boolean | null = null;

function introAlreadySeen() {
  if (decided === null) {
    try {
      decided = window.sessionStorage.getItem(KEY) === "1";
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      decided = false;
    }
    // Everything mounting in this commit shares the answer; any later mount in
    // the same page load (client navigation back to /) counts as already seen.
    window.setTimeout(() => {
      decided = true;
    }, 0);
  }
  return decided;
}

/**
 * True when the hero intro has already played in this session. The intro plays
 * once per visit, not on every return to the page (sessionStorage, not
 * localStorage, so a genuinely new visit sees it again).
 */
export function useIntroSkipped() {
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    setSkipped(introAlreadySeen());
  }, []);
  return skipped;
}
