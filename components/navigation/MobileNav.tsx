"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/assets/Logo";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { Burger, Close } from "@/components/fundations/icons";
import { navLinks } from "./links";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  // Close when clicking anywhere outside the nav, like the original inline script.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  return (
    <nav ref={containerRef} className="fixed inset-x-0 top-0 z-40 bg-white md:hidden">
      <Wrapper variant="standard" className="py-3">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Go to homepage">
            <Logo className="h-4 text-base-900" />
          </Link>
          <Button
            iconOnly
            size="xs"
            variant="default"
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
            icon={open ? <Close className="size-4" /> : <Burger className="size-4" />}
          />
        </div>
      </Wrapper>

      {open && (
        <div className="bg-white">
          <Wrapper variant="standard" className="py-4">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base-900 text-lg font-medium py-1 border-b border-base-100 last:border-b-0"
                >
                  {link.text}
                </Link>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2">
              <Button isLink size="xs" variant="muted" href="/signin" className="shrink-0">
                Sign in
              </Button>
              <Button isLink size="xs" variant="default" href="/signup" className="shrink-0">
                Sign up
              </Button>
            </div>
          </Wrapper>
        </div>
      )}
    </nav>
  );
}
