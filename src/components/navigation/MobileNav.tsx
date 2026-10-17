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
import { playMenuSound } from "./menuSound";

// Same links as the desktop nav
const links = [
  { href: "/#how-it-works", text: "How it works" },
  { href: "/pricing", text: "Pricing" },
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

// Each row holds the next one, so folding a row folds everything under it
function Rows({ rows, index = 0 }: { rows: ReactNode[]; index?: number }) {
  if (index >= rows.length) return null;
  return (
    <div className={cx("makisu-node", index === 0 && "makisu-first")} style={timing(index, rows.length)}>
      <div className={cx("makisu-face relative bg-page", index === rows.length - 1 && "border-b border-border-default")}>
        {rows[index]}
        <span aria-hidden="true" className="makisu-back" />
        <span aria-hidden="true" className="makisu-shade" />
      </div>
      <Rows rows={rows} index={index + 1} />
    </div>
  );
}

export default function MobileNav() {
  const [phase, setPhase] = useState<Phase>("closed");
  const open = phase === "opening" || phase === "open";
  const navRef = useRef<HTMLElement>(null);
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

  const settle = (next: Phase, after: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase(next), after * 1000);
  };

  const openMenu = () => {
    window.clearTimeout(timer.current);
    if (reducedMotion()) return setPhase("open");
    playMenuSound("open");
    setPhase("opening");
    settle("open", times.open);
  };

  const closeMenu = () => {
    window.clearTimeout(timer.current);
    navRef.current?.querySelector<HTMLElement>("[aria-controls=mobile-menu]")?.focus({ preventScroll: true });
    if (reducedMotion()) return setPhase("closed");
    playMenuSound("close");
    setPhase("closing");
    settle("closed", times.close);
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
    // closeMenu only reads refs and the fixed timings
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
          className="flex min-h-11 items-center gap-2 border-b border-border-default text-body-lg font-medium text-primary-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-border-focus"
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
        <div className="relative z-10 bg-white">
          <Wrapper variant="standard" className="py-3">
            <div className="flex items-center justify-between">
              <Link href="/" aria-label="Go to homepage">
                <Lockup />
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  iconOnly
                  size="xs"
                  variant="default"
                  type="button"
                  aria-expanded={open}
                  aria-controls="mobile-menu"
                  aria-label={open ? "Close menu" : "Open menu"}
                  onClick={() => (open ? closeMenu() : openMenu())}
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
          id="mobile-menu"
          hidden={phase === "closed"}
          inert={phase === "closing"}
          data-state={phase}
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
      {/* Dims the page under the menu; a tap on it closes the menu (the listener above) */}
      <div
        aria-hidden="true"
        className={cx(
          "fixed inset-0 z-30 bg-black/25 transition-opacity duration-300 ease-out motion-reduce:transition-none md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
    </>
  );
}
