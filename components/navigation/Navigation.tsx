import Link from "next/link";
import Logo from "@/components/assets/Logo";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import MobileNav from "./MobileNav";
import { navLinks } from "./links";

export default function Navigation() {
  return (
    <>
      <MobileNav />
      <nav className="fixed w-full top-0 z-20 bg-white py-4 hidden md:block">
        <Wrapper variant="standard">
          <div className="grid grid-cols-2 md:grid-cols-2 items-center w-full gap-3 relative">
            <Link href="/" className="shrink-0 focus:outline-none" aria-label="Go to homepage">
              <Logo className="h-4 text-base-900" />
            </Link>
            <div className="flex items-center gap-2 lg:gap-2 ml-auto">
              <div className="flex items-center gap-4">
                {navLinks.map((link) =>
                  link.href.startsWith("/") ? (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-base-600 hover:text-base-900 text-xs whitespace-nowrap"
                    >
                      {link.text}
                    </Link>
                  ) : (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base-600 hover:text-base-900 text-xs whitespace-nowrap"
                    >
                      {link.text}
                    </a>
                  )
                )}
              </div>
              <Button isLink size="xs" variant="muted" href="/signin" className="shrink-0">
                Sign in
              </Button>
              <Button isLink size="xs" variant="default" href="/signup" className="shrink-0">
                Sign up
              </Button>
            </div>
          </div>
        </Wrapper>
      </nav>
    </>
  );
}
