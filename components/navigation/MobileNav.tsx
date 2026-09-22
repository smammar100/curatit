"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/assets/Logo";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Burger, Close } from "@/components/fundations/icons";
import { signOutAction } from "@/app/actions/auth";
import type { NavLink } from "./links";

export default function MobileNav({ links, signedIn }: { links: NavLink[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  // Close when tapping anywhere outside the nav, or pressing Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <nav ref={containerRef} className="fixed inset-x-0 top-0 z-40 bg-white md:hidden" aria-label="Main">
      <Wrapper variant="standard" className="py-3">
        <div className="flex items-center justify-between">
          <Link href={signedIn ? "/library" : "/"}>
            <Logo className="text-2xl text-base-900" />
          </Link>
          <Button
            iconOnly
            size="xs"
            variant="default"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            icon={open ? <Close className="size-4" /> : <Burger className="size-4" />}
          />
        </div>
      </Wrapper>

      {open && (
        <div id="mobile-menu" className="bg-white border-b border-base-100">
          <Wrapper variant="standard" className="py-4">
            <div className="flex flex-col">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base-900 text-lg font-medium py-2 border-b border-base-100 last:border-b-0"
                >
                  {link.text}
                </Link>
              ))}
            </div>
            {signedIn ? (
              <form action={signOutAction} className="mt-6">
                <Button type="submit" size="xs" variant="muted">
                  Sign out
                </Button>
              </form>
            ) : (
              <div className="mt-6 flex items-center gap-2">
                <Button isLink size="xs" variant="muted" href="/signin" className="shrink-0">
                  Sign in
                </Button>
                <Button isLink size="xs" variant="default" href="/signup" className="shrink-0">
                  Get access
                </Button>
              </div>
            )}
          </Wrapper>
        </div>
      )}
    </nav>
  );
}
