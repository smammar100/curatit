import Link from "next/link";
import Logo from "@/components/assets/Logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import { getViewer } from "@/lib/auth";
import MobileNav from "./MobileNav";
import NavLinks from "./NavLinks";
import { adminLinks, memberLinks, publicLinks } from "./links";

/** Site header: serif wordmark, a fluid-hover link strip, and account actions. 56px. */
export default async function Navigation() {
  const viewer = await getViewer();
  const links = viewer
    ? [...memberLinks, ...(viewer.role === "admin" ? adminLinks : []), ...publicLinks]
    : publicLinks;

  return (
    <>
      <MobileNav links={links} signedIn={Boolean(viewer)} />
      <header className="fixed inset-x-0 top-0 z-20 hidden bg-background/90 backdrop-blur-sm md:block">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
          <Link
            href="/"
            className="shrink-0 rounded-lg text-foreground outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
          >
            <Logo />
          </Link>
          <nav aria-label="Main">
            <NavLinks links={links} />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {viewer ? (
              <form action={signOutAction} className="flex items-center gap-3">
                <span className="max-w-48 truncate text-[12px] text-muted-foreground" title={viewer.email}>
                  {viewer.email}
                </span>
                <Button type="submit" size="compact" variant="ghost">
                  Sign out
                </Button>
              </form>
            ) : (
              <>
                <Button asChild size="compact" variant="ghost">
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button asChild size="compact">
                  <Link href="/signup">Get access</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
