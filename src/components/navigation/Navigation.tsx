import Link from "next/link";
// Assets
import Lockup from "@/components/assets/Lockup";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import ThemeToggle from "@/components/global/ThemeToggle";
import MobileNav from "./MobileNav";
// Quick access links
const links = [
  { href: "/#how-it-works", text: "How it works" },
  { href: "/library", text: "Library" },
  { href: "/pricing", text: "Pricing" },
  { href: "/blog", text: "Blog" },
  { href: "/about", text: "About" },
];

export default function Navigation() {
  return (
    <>
      <MobileNav />
      <nav className="fixed w-full top-0 z-20 bg-white py-4 hidden md:block">
        <Wrapper variant="standard">
          {/* Logo left, links centred on the page, account buttons right */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-3 relative">
            <Link href="/" className="w-fit shrink-0 foucs:outline-none" aria-label="Go to homepage">
              <Lockup />
            </Link>
            <div className="flex items-center justify-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className="text-base-600 hover:text-base-900 text-xs whitespace-nowrap"
                  href={link.href}
                >
                  {link.text}
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2">
              <ThemeToggle className="shrink-0" />
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
