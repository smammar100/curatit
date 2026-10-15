import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
// Assets
import Logo from "@/components/assets/Logo";
import Symbol from "@/components/assets/Symbol";
import { getPublishedPosts, type LibraryPost } from "@/lib/posts";
import { SUPPORT_MAILTO } from "@/lib/site";
import FooterNewsletter from "./FooterNewsletter";

// The site footer, "Ruled" (chosen from two prototype rounds on 2026-10-15, replacing "Night"'s
// fanned covers): the page's paper carries on, and the footer is an inset dark panel, one of two
// deliberately dark surfaces (with Vision's panel) on the marketing site. Hairlines divide it
// into cells: the full logo (the mark turning beside the wordmark) over a short statement in the
// first, the link groups in their own; then the newest covers as a filmstrip running edge to
// edge and drifting sideways (a CSS marquee, still under reduced motion); then © and legal.
// A server component, so it costs the page no script beyond the hidden email field; if the
// library can't be reached, it renders without the strip.

const LINKS = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "MCP (beta)", href: "/agents" },
      { label: "Submit a brand to the library", href: "/submit" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Vision", href: "/vision" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Blog", href: "/blog" },
      { label: "Advertise", href: "/advertise" },
      { label: "Contact", href: SUPPORT_MAILTO },
    ],
  },
];

const LEGAL = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];

// The email field is hidden until there's a mailing list (2026-10-12); FooterNewsletter is kept,
// so turning this back on brings it back as it was
const SHOW_NEWSLETTER = false;

const COVERS = 5;
// The strip repeats its covers so the loop is seamless at any width; the marquee moves one half
const REPEAT = 4;

// The newest post of five different brands, from different categories where it can
function pickCovers(posts: LibraryPost[]) {
  const brands = new Set<string>();
  const categories = new Set<string>();
  const picked: LibraryPost[] = [];
  for (const strict of [true, false]) {
    for (const post of posts) {
      if (picked.length === COVERS) break;
      if (!post.images[0] || brands.has(post.brand.slug) || (strict && categories.has(post.category.slug))) continue;
      brands.add(post.brand.slug);
      categories.add(post.category.slug);
      picked.push(post);
    }
  }
  return picked;
}

const linkClass =
  "inline-flex min-h-10 items-center rounded-sm text-pretty text-[color:var(--f-body)] transition-colors duration-150 ease-out hover:text-[color:var(--f-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--f-focus)] pointer-coarse:min-h-11";
const cell = "border-[color:var(--f-line)] p-6 sm:p-8";

function FooterLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const classes = `${linkClass} ${className ?? ""}`;
  return href.startsWith("/") ? (
    <Link href={href} className={classes}>
      {children}
    </Link>
  ) : (
    <a href={href} className={classes}>
      {children}
    </a>
  );
}

export default async function Footer() {
  const posts = await getPublishedPosts().catch(() => []);
  const covers = pickCovers(posts);
  const strip = Array.from({ length: REPEAT }, () => covers).flat();

  return (
    <footer className="mt-12 bg-white px-4 lg:mt-16 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="footer-panel relative isolate overflow-clip rounded-[1.5rem] sm:rounded-[2rem]">
        <div className="grid grid-cols-2 lg:grid-cols-12">
          {/* The logo and the statement */}
          <div className={`${cell} col-span-2 border-b lg:col-span-6 lg:border-r lg:border-b-0`}>
            <Link
              href="/"
              aria-label="Curatit home"
              className="inline-flex items-center gap-2.5 rounded-sm text-[color:var(--f-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--f-focus)]"
            >
              <Symbol className="footer-mark size-6 shrink-0" aria-hidden="true" />
              <Logo className="h-4 w-auto" aria-hidden="true" />
            </Link>
            <p className="mt-10 max-w-sm font-display text-3xl font-light leading-tight text-balance lg:mt-16 lg:text-4xl">
              <span className="text-[color:var(--f-quiet)]">The library never closes. </span>
              <span className="text-[color:var(--f-ink)]">Get the new posts as they land.</span>
            </p>
            {SHOW_NEWSLETTER && (
              <div className="mt-8">
                <FooterNewsletter />
              </div>
            )}
          </div>
          {LINKS.map((group, i) => (
            <nav
              key={group.title}
              aria-label={group.title}
              className={`${cell} border-b lg:col-span-3 lg:border-b-0 ${i === 0 ? "border-r" : ""}`}
            >
              <p className="text-xs/5 font-medium text-[color:var(--f-quiet)]">{group.title}</p>
              <ul className="mt-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink href={link.href} className="text-sm">
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* The newest covers, a filmstrip drifting across the whole width */}
        {covers.length > 0 && (
          <div className="footer-strip overflow-clip border-b border-[color:var(--f-line)] py-2" aria-hidden="true">
            <div className="footer-strip-track flex w-max gap-2">
              {strip.map((post, i) => (
                <div
                  key={`${post.id}-${i}`}
                  className="relative aspect-4/5 w-24 shrink-0 overflow-hidden rounded-sm bg-[color:var(--f-raise)] sm:w-28 lg:w-32"
                >
                  <Image src={post.images[0]} alt="" fill sizes="128px" draggable={false} className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-6 px-6 py-5 sm:px-8">
          <p className="text-xs/5 text-[color:var(--f-quiet)]">© 2026 Curatit</p>
          <ul className="flex gap-x-5" aria-label="Legal">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <FooterLink href={link.href} className="text-xs">
                  {link.label}
                </FooterLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
