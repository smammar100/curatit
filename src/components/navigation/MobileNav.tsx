"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// Assets
import Lockup from "@/components/assets/Lockup";
// Fundations
import Button from "@/components/fundations/elements/Button";
import ThemeToggle from "@/components/global/ThemeToggle";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Icons
import Burger from "@/components/fundations/icons/Burger";

// Same links as the desktop nav
const links = [
  { href: "/#how-it-works", text: "How it works" },
  { href: "/pricing", text: "Pricing" },
  { href: "/vision", text: "Vision" },
  { href: "/roadmap", text: "Roadmap" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Close the menu after client-side navigation
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Close on any click outside the nav
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <nav ref={navRef} className="fixed inset-x-0 top-0 z-40 bg-white md:hidden">
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
              aria-label="Open menu"
              onClick={() => setOpen(!open)}
            >
              <Burger className="size-4" />
            </Button>
          </div>
        </div>
      </Wrapper>
      <div
        className={open ? "md:hidden bg-white" : "hidden md:hidden bg-white"}
      >
        <Wrapper variant="standard" className="py-4">
          <div className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                className="text-base-900 text-lg font-medium py-1 border-b border-base-100 last:border-b-0"
                href={link.href}
              >
                {link.text}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-2">
            <Button
              isLink
              size="xs"
              variant="muted"
              href="/signin"
              className="shrink-0"
            >
              Sign in
            </Button>
            <Button
              isLink
              size="xs"
              variant="default"
              href="/signup"
              className="shrink-0"
            >
              Sign up
            </Button>
          </div>
        </Wrapper>
      </div>
    </nav>
  );
}
