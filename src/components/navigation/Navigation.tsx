import Link from "next/link";
// Assets
import Lockup from "@/components/assets/Lockup";
// Fundations
import TextLink from "@/components/fundations/elements/TextLink";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Glaze
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
// Components
import ThemeToggle from "@/components/global/ThemeToggle";
import MobileNav from "./MobileNav";

// The site's navigation from md up (MobileNav takes over below it): the lockup, the links centred
// on the page, then the theme menu, Sign in and Create account. Since 2026-10-24 on Glaze: each
// link is a quiet TextLink (text-2, text-1 on hover, 44px tall on touch screens) with Glaze's
// Badge for Beta, Sign in a ghost Button and Create account the group's one primary, both small
// pills rendered as links, the theme switch ThemeToggle's menu, and the lockup takes Glaze's ink
// focus ring from its base styles.

// Quick access links; `beta` adds a small Beta badge after the label
const links = [
  { href: "/vision", text: "Vision" },
  { href: "/roadmap", text: "Roadmap" },
  { href: "/agents", text: "AI integration", beta: true },
];

export default function Navigation() {
  return (
    <>
      <MobileNav />
      <nav className="fixed top-0 z-(--z-sticky) hidden w-full bg-page py-4 md:block">
        <Wrapper variant="standard">
          {/* Logo left, links centred on the page, account buttons right */}
          <div className="relative grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Link href="/" className="w-fit shrink-0 rounded-tag" aria-label="Go to homepage">
              <Lockup />
            </Link>
            {/* The quiet link reaches 44px tall and 4px past its words on a touch screen through
                its own invisible ::after; the gap-6 between them still keeps the areas apart */}
            <div className="flex items-center justify-center gap-6 type-body-sm">
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
              <Button size="sm" variant="ghost" render={<Link href="/signin" />} nativeButton={false}>
                Sign in
              </Button>
              <Button size="sm" variant="primary" render={<Link href="/signup" />} nativeButton={false}>
                Create account
              </Button>
            </div>
          </div>
        </Wrapper>
      </nav>
    </>
  );
}
