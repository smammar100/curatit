import Link from "next/link";
// Assets
import Lockup from "@/components/assets/Lockup";
// Fundations
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import TextLink from "@/components/fundations/elements/TextLink";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import ThemeToggle from "@/components/global/ThemeToggle";
import MobileNav from "./MobileNav";

// The site's navigation from md up (MobileNav takes over below it): the lockup, the links centred
// on the page, then the theme menu, Sign in and Create account. Since 2026-10-23 on the system:
// each link is a quiet TextLink (the muted ink, the ink on hover, 44px tall on touch screens), the
// two account actions are Buttons, the theme switch is ThemeToggle's menu, and the lockup's focus
// ring is the site's one ring.

// Quick access links; `beta` adds a small Beta chip after the label
const links = [
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
              className="w-fit shrink-0 rounded-[4px] focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--focus-ring)]"
              aria-label="Go to homepage"
            >
              <Lockup />
            </Link>
            {/* The quiet link reaches 44px tall and 4px past its words on a touch screen through
                its own invisible ::after; the gap-6 between them still keeps the areas apart */}
            <div className="flex items-center justify-center gap-6 text-body-sm">
              {links.map((link) => (
                <TextLink
                  key={link.href}
                  variant="quiet"
                  href={link.href}
                  className="inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap"
                >
                  {link.text}
                  {link.beta && <Badge size="sm">Beta</Badge>}
                </TextLink>
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
