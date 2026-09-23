"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "@/components/assets/Logo";
import { Button } from "@/components/ui/button";
import { Elevated } from "@/lib/elevated";
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
import { isCurrent } from "./NavLinks";
import type { NavLink } from "./links";

/** Under 768px: the wordmark and a menu button; links open in a sheet below. */
export default function MobileNav({ links, signedIn }: { links: NavLink[]; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const containerRef = useRef<HTMLElement>(null);

  // Close on a tap outside, or Escape.
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
    <header ref={containerRef} className="fixed inset-x-0 top-0 z-40 bg-background md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-foreground">
          <Logo />
        </Link>
        <Button
          size="icon"
          variant="tertiary"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
        </Button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="px-4 pb-4"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: spring.moderate.exit }}
            transition={spring.moderate}
          >
            <Elevated offset={2} className="rounded-xl p-1">
              <nav aria-label="Main" className="flex flex-col">
                {links.map((link) => {
                  const current = isCurrent(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={current ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex h-9 items-center rounded-lg px-3 text-[13px] transition-colors duration-80 hover:bg-hover",
                        current ? "text-foreground" : "text-muted-foreground"
                      )}
                      style={{ fontVariationSettings: current ? fontWeights.semibold : fontWeights.normal }}
                    >
                      {link.text}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-1 flex items-center gap-2 border-t border-border p-2">
                {signedIn ? (
                  <form action={signOutAction}>
                    <Button type="submit" size="compact" variant="secondary">
                      Sign out
                    </Button>
                  </form>
                ) : (
                  <>
                    <Button asChild size="compact" variant="secondary">
                      <Link href="/signin">Sign in</Link>
                    </Button>
                    <Button asChild size="compact">
                      <Link href="/signup">Get access</Link>
                    </Button>
                  </>
                )}
              </div>
            </Elevated>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
