import Link from "next/link";
import Logo from "@/components/assets/Logo";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { signOutAction } from "@/app/actions/auth";
import { getViewer } from "@/lib/auth";
import MobileNav from "./MobileNav";
import { adminLinks, memberLinks, publicLinks } from "./links";

export default async function Navigation() {
  const viewer = await getViewer();
  const links = viewer
    ? [...memberLinks, ...(viewer.role === "admin" ? adminLinks : []), ...publicLinks]
    : publicLinks;

  return (
    <>
      <MobileNav links={links} signedIn={Boolean(viewer)} />
      <nav className="fixed w-full top-0 z-20 bg-white/95 backdrop-blur py-4 hidden md:block" aria-label="Main">
        <Wrapper variant="standard">
          <div className="flex items-center justify-between gap-6">
            <Link href="/" className="shrink-0 rounded focus:outline-2 focus:outline-offset-4 focus:outline-accent-500">
              <Logo className="text-2xl text-base-900" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-5 mr-2">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="text-base-600 hover:text-base-900 text-sm whitespace-nowrap">
                    {link.text}
                  </Link>
                ))}
              </div>
              {viewer ? (
                <form action={signOutAction} className="flex items-center gap-3">
                  <span className="max-w-48 truncate text-xs text-base-500" title={viewer.email}>
                    {viewer.email}
                  </span>
                  <Button type="submit" size="xs" variant="muted" className="shrink-0">
                    Sign out
                  </Button>
                </form>
              ) : (
                <>
                  <Button isLink size="xs" variant="muted" href="/signin" className="shrink-0">
                    Sign in
                  </Button>
                  <Button isLink size="xs" variant="default" href="/signup" className="shrink-0">
                    Get access
                  </Button>
                </>
              )}
            </div>
          </div>
        </Wrapper>
      </nav>
    </>
  );
}
