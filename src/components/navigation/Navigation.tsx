import Link from "next/link";
// Assets
import Lockup from "@/components/assets/Lockup";
// Fundations
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import ThemeToggle from "@/components/global/ThemeToggle";
import MobileNav from "./MobileNav";
// Quick access links; `beta` adds a small Beta chip after the label
const links = [
  { href: "/#how-it-works", text: "How it works" },
  { href: "/vision", text: "Vision" },
  { href: "/roadmap", text: "Roadmap" },
  { href: "/agents", text: "AI integration", beta: true },
];

export default function Navigation() {
  return (
    <>
      <MobileNav />
      <nav className="fixed w-full top-0 z-20 bg-page py-4 hidden md:block">
        <Wrapper variant="standard">
          {/* Logo left, links centred on the page, account buttons right */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-3 relative">
            <Link
              href="/"
              className="w-fit shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-border-focus"
              aria-label="Go to homepage"
            >
              <Lockup />
            </Link>
            {/* On a touch screen each link reaches 44px tall and 8px past its words through an
                invisible ::after; the gap-6 between them still keeps the areas apart */}
            <div className="flex items-center justify-center gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className="relative inline-flex min-h-7 items-center gap-1.5 rounded-sm text-body-sm whitespace-nowrap text-secondary-foreground transition-colors duration-150 ease-out-quint hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-2"
                  href={link.href}
                >
                  {link.text}
                  {link.beta && <Badge size="sm">Beta</Badge>}
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2">
              <ThemeToggle className="shrink-0" />
              <Button
                isLink
                size="xs"
                variant="transparent"
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
                Create account
              </Button>
            </div>
          </div>
        </Wrapper>
      </nav>
    </>
  );
}
