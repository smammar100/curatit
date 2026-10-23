"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
// Assets
import Lockup from "@/components/assets/Lockup";
// Fundations
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import ThemeToggle from "@/components/global/ThemeToggle";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { cx } from "@/lib/cx";
import { fontWeights } from "@/lib/font-weight";
import { playMenuSound } from "./menuSound";

// The navigation below md: the lockup, the theme menu and a menu button over a sheet that unfolds
// (Makisu, below). Since 2026-10-23 the rows are on the system's tokens: the one stroke under
// each, the link in the ink at the library's semibold, the site's one focus ring; the account
// actions are Buttons, the theme switch ThemeToggle's menu. The fold itself is unchanged.

// Same links as the desktop nav
const links = [
  { href: "/vision", text: "Vision" },
  { href: "/roadmap", text: "Roadmap" },
  { href: "/agents", text: "AI integration", beta: true },
];

// The menu unfolds like Makisu (Justin Windle's CSS 3D dropdown, MIT, codepen.io/soulwire/pen/AmywKv):
// every row hangs from the bottom of the one above it and swings down into place, one after
// another, with a shade lifting off each as it opens; closing folds them back up from the
// bottom. The keyframes are `.makisu-*` in global.css; these are the timings, in seconds, after
// Makisu's own (`speed` per row, `overlap` of one row with the next, closing at 0.66 speed).
const SPEED = 0.36;
const OVERLAP = 0.62;
const CLOSE_SPEED = SPEED * 0.66;

type Phase = "closed" | "opening" | "open" | "closing";
// What the menu is doing, and which keyframes are running it (`data-state`): its own, or, after
// a tap mid-fold, the other set playing back from where it had got to
type Fold = { phase: Phase; keyframes: Phase };

// Per-row delays, as CSS variables, for a menu of `count` rows
function timing(index: number, count: number) {
  const step = SPEED * (1 - OVERLAP);
  const closeStep = CLOSE_SPEED * (1 - OVERLAP);
  const last = index === count - 1;
  return {
    "--makisu-unfold-delay": `${index * step}s`,
    // A row's shade lifts when the next row starts to move
    "--makisu-unshade-delay": `${(last ? index : index + 1) * step}s`,
    "--makisu-fold-delay": `${(count - index - 1) * closeStep}s`,
    "--makisu-shade-delay": `${index === 0 ? (count - 1) * closeStep : (count - index - 2) * closeStep + CLOSE_SPEED * 0.35}s`,
  } as CSSProperties;
}

function menuTimes(count: number) {
  const step = SPEED * (1 - OVERLAP);
  const closeStep = CLOSE_SPEED * (1 - OVERLAP);
  return {
    open: Math.max((count - 1) * step + SPEED, count * step * 1.4),
    close: (count - 1) * closeStep + CLOSE_SPEED,
    swingOpen: count * step * 1.4,
    swingClose: count * closeStep,
  };
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// On touch screens Button's xs size already reaches 44px tall (its own ::after); the two icon
// buttons in the bar also reach 44px wide through a ::before past their edges. They sit 8px apart,
// so each takes 4px of the gap and the rest outwards.
const themeTarget = "relative pointer-coarse:before:absolute pointer-coarse:before:-inset-y-2 pointer-coarse:before:-right-1 pointer-coarse:before:-left-3";
const menuTarget = "relative pointer-coarse:before:absolute pointer-coarse:before:-inset-y-2 pointer-coarse:before:-right-3 pointer-coarse:before:-left-1";

// Each row holds the next one, so folding a row folds everything under it
function Rows({ rows, index = 0 }: { rows: ReactNode[]; index?: number }) {
  if (index >= rows.length) return null;
  return (
    <div className={cx("makisu-node", index === 0 && "makisu-first")} style={timing(index, rows.length)}>
      <div className={cx("makisu-face relative bg-page", index === rows.length - 1 && "border-b border-border")}>
        {rows[index]}
        <span aria-hidden="true" className="makisu-back" />
        <span aria-hidden="true" className="makisu-shade" />
      </div>
      <Rows rows={rows} index={index + 1} />
    </div>
  );
}

export default function MobileNav() {
  const [fold, setFold] = useState<Fold>({ phase: "closed", keyframes: "closed" });
  const { phase } = fold;
  const setPhase = (next: Phase) => setFold({ phase: next, keyframes: next });
  const open = phase === "opening" || phase === "open";
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // Close the menu after client-side navigation, at once and silently
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setPhase("closed");
  }

  const rowCount = links.length + 1;
  const times = menuTimes(rowCount);

  // Comes to rest once the fold is done, unless a navigation has closed the menu meanwhile
  const settle = (next: "open" | "closed", after: number) => {
    const moving = next === "open" ? "opening" : "closing";
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setFold((prev) => (prev.phase === moving ? { phase: next, keyframes: next } : prev)),
      after * 1000,
    );
  };

  // A tap or Escape mid-fold plays the running keyframes back from where they are, through the
  // Web Animations API, rather than starting the other set from flat or folded, so no row jumps.
  // The dimmer's fade is one of them, so it turns with the rows. Returns the seconds until
  // they're back where they started, or null when nothing is moving. Reads the fold from the
  // DOM, since the Escape and outside-tap listeners hold an older render.
  const turnAround = () => {
    const menu = menuRef.current;
    const running = menu?.dataset.state;
    if (!menu || (running !== "opening" && running !== "closing")) return null;
    const animations = [...menu.getAnimations({ subtree: true }), ...(dimRef.current?.getAnimations() ?? [])].filter(
      (a) => a instanceof CSSAnimation && /^(makisu|fade-)/.test(a.animationName),
    );
    if (!animations.length) return null;
    // They all started together, so the furthest along is the fold's clock (one that has
    // finished holds at its own end). Each is set to that time and its rate flipped. The rate
    // setter keeps the time where it is, so a finished row holds its pose until the clock comes
    // back to it and they retrace in step; reverse() would rewind a finished one to its end, or
    // on a second turn to its start, and it would jump.
    const at = Math.max(...animations.map((a) => Number(a.currentTime) || 0));
    const forwards = animations[0].playbackRate > 0;
    for (const animation of animations) {
      animation.currentTime = at;
      animation.playbackRate = -animation.playbackRate;
    }
    const length = (running === "opening" ? times.open : times.close) * 1000;
    return (forwards ? at : length - at) / 1000;
  };

  const move = (moving: "opening" | "closing", rest: "open" | "closed", length: number) => {
    const back = turnAround();
    setFold((prev) => ({ phase: moving, keyframes: back === null ? moving : prev.keyframes }));
    settle(rest, back ?? length);
  };

  const openMenu = () => {
    window.clearTimeout(timer.current);
    if (reducedMotion()) return setPhase("open");
    playMenuSound("open");
    move("opening", "open", times.open);
  };

  const closeMenu = () => {
    window.clearTimeout(timer.current);
    navRef.current?.querySelector<HTMLElement>("[aria-controls=mobile-menu]")?.focus({ preventScroll: true });
    if (reducedMotion()) return setPhase("closed");
    playMenuSound("close");
    move("closing", "closed", times.close);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Into the menu when it opens
  useEffect(() => {
    if (open) firstLinkRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Escape, or a tap anywhere outside the nav, closes it
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const onClick = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) closeMenu();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
    // closeMenu only reads refs, the DOM and the fixed timings
  }, [open]);

  // The page stays put while the menu is showing
  useEffect(() => {
    if (phase === "closed") return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [phase === "closed"]);

  const rows = [
    ...links.map((link, index) => (
      <Wrapper key={link.href} variant="standard">
        <Link
          ref={index === 0 ? firstLinkRef : undefined}
          className="flex min-h-11 items-center gap-2 border-b border-border text-body-lg text-foreground focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
          style={{ fontVariationSettings: fontWeights.semibold }}
          href={link.href}
        >
          {link.text}
          {link.beta && <Badge size="sm">Beta</Badge>}
        </Link>
      </Wrapper>
    )),
    <Wrapper key="account" variant="standard" className="pt-8 pb-4">
      <div className="flex items-center gap-2">
        <Button isLink size="xs" variant="transparent" href="/signin" className="shrink-0">
          Sign in
        </Button>
        <Button isLink size="xs" variant="default" href="/signup" className="shrink-0">
          Create account
        </Button>
      </div>
    </Wrapper>,
  ];

  return (
    <>
      <nav ref={navRef} className="fixed inset-x-0 top-0 z-40 md:hidden">
        <div className="relative z-10 bg-page">
          <Wrapper variant="standard" className="py-3">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                aria-label="Go to homepage"
                className="rounded-[4px] focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--focus-ring)]"
              >
                <Lockup />
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle className={themeTarget} />
                <Button
                  iconOnly
                  size="xs"
                  variant="default"
                  type="button"
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                  aria-label={open ? "Close menu" : "Open menu"}
                  onClick={() => (open ? closeMenu() : openMenu())}
                  className={menuTarget}
                >
                  {/* Two bars that turn into a cross */}
                  <span aria-hidden="true" data-open={open} className="menu-icon relative size-4">
                    <span />
                    <span />
                  </span>
                </Button>
              </div>
            </div>
          </Wrapper>
        </div>
        <div
          ref={menuRef}
          id="mobile-menu"
          hidden={phase === "closed"}
          inert={phase === "closing"}
          data-state={fold.keyframes}
          className="makisu absolute inset-x-0 top-full"
          style={
            {
              "--makisu-speed": `${SPEED}s`,
              "--makisu-close-speed": `${CLOSE_SPEED}s`,
              "--makisu-swing-open": `${times.swingOpen}s`,
              "--makisu-swing-close": `${times.swingClose}s`,
            } as CSSProperties
          }
        >
          <div className="makisu-root">
            <Rows rows={rows} />
          </div>
        </div>
      </nav>
      {/* Dims the page under the menu; a tap on it closes the menu (the listener above). Its fade
          runs with the fold's keyframes, over the same length and with the same ease-in-out (the
          CSS keyword the rows use, not Tailwind's ease-in-out), and turnAround() turns it with
          them, so the two arrive together however often the menu changes its mind */}
      <div
        ref={dimRef}
        aria-hidden="true"
        style={{ "--makisu-dim": `${fold.keyframes === "opening" ? times.open : times.close}s` } as CSSProperties}
        className={cx(
          "fixed inset-0 z-30 bg-black/25 md:hidden",
          fold.keyframes === "opening" && "motion-safe:animate-[fade-in_var(--makisu-dim)_ease-in-out_both]",
          fold.keyframes === "closing" && "motion-safe:animate-[fade-out_var(--makisu-dim)_ease-in-out_both]",
          fold.keyframes === "closed" && "opacity-0",
          !open && "pointer-events-none",
        )}
      />
    </>
  );
}
