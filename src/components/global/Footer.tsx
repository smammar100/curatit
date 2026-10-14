import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
// Assets
import Logo from "@/components/assets/Logo";
import Symbol from "@/components/assets/Symbol";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import { getPublishedPosts, type LibraryPost } from "@/lib/posts";
import { SUPPORT_MAILTO } from "@/lib/site";
import FooterNewsletter from "./FooterNewsletter";

// The site footer, "Night" (chosen from a five-way prototype on 2026-10-11): the page's paper
// carries on, and the footer is an inset dark panel, one of two deliberately dark surfaces (with Vision's panel) on the
// marketing site, like a gallery after hours. The full logo (the mark turning beside the wordmark)
// over a short statement (and the email field, hidden for now), the newest covers fanned in from
// the right edge, then the links.
// A server component, so it costs the page no script beyond the email field; the motion is CSS
// (.footer-* in global.css). If the library can't be reached, it renders without the covers.

const LINKS = [
  {
    title: "Product",
    links: [
      { label: "Library", href: "/library" },
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/#how-it-works" },
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

const FAN = 5;
const SPREAD_DEG = 12;

// The newest post of five different brands, from different categories where it can
function pickCovers(posts: LibraryPost[]) {
  const brands = new Set<string>();
  const categories = new Set<string>();
  const picked: LibraryPost[] = [];
  for (const strict of [true, false]) {
    for (const post of posts) {
      if (picked.length === FAN) break;
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

  return (
    <footer className="mt-12 bg-white px-4 lg:mt-16 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="footer-panel relative isolate overflow-clip rounded-[1.5rem] sm:rounded-[2rem]">
        {/* The logo and the statement, with the covers on the right */}
        <div className="relative">
          <Wrapper className="relative pt-10 pb-6 sm:pt-12 lg:pt-20 lg:pb-10">
            <div className="flex h-24 items-start sm:h-28 lg:h-auto">
              <Link
                href="/"
                aria-label="Curatit home"
                className="inline-flex items-center gap-2.5 rounded-sm text-[color:var(--f-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--f-focus)] sm:gap-3 lg:gap-4"
              >
                {/* Smaller on phones, where the covers fan in beside it */}
                <Symbol className="footer-mark size-7 shrink-0 sm:size-8 lg:size-10" aria-hidden="true" />
                <Logo className="h-5 w-auto sm:h-6 lg:h-8" aria-hidden="true" />
              </Link>
            </div>
            <Text tag="h2" variant="displayMD" className="mt-4 max-w-md font-display font-light text-balance lg:mt-10">
              <span className="block text-[color:var(--f-quiet)]">The library never closes.</span>
              <span className="block text-[color:var(--f-ink)]">Get the new posts as they land.</span>
            </Text>
            {SHOW_NEWSLETTER && (
              <div className="mt-8">
                <FooterNewsletter />
              </div>
            )}
          </Wrapper>

          {covers.length > 0 && (
            <div
              aria-hidden="true"
              className="footer-fan pointer-events-none absolute top-0 right-0 h-36 w-[64%] overflow-clip select-none sm:h-40 sm:w-[56%] lg:inset-y-0 lg:left-[48%] lg:h-auto lg:w-auto"
            >
              {covers.map((post, i) => (
                <div
                  key={post.id}
                  className="footer-cover overflow-hidden rounded-md bg-[color:var(--f-raise)] outline-1 -outline-offset-1 outline-[color:var(--f-edge)]"
                  style={{ "--a": `${(i - (covers.length - 1) / 2) * SPREAD_DEG}deg`, "--i": i } as CSSProperties}
                >
                  <Image
                    src={post.images[0]}
                    alt=""
                    fill
                    sizes="(min-width: 96rem) 192px, (min-width: 80rem) 176px, (min-width: 64rem) 160px, (min-width: 40rem) 84px, 68px"
                    draggable={false}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Wrapper className="pt-12 pb-6 lg:pt-14">
          <div className="grid gap-x-8 gap-y-10 lg:grid-cols-12">
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 lg:col-span-7 lg:col-start-7">
              {LINKS.map((group) => (
                <div key={group.title}>
                  <p id={`footer-${group.title.toLowerCase()}`} className="text-xs/5 font-medium text-[color:var(--f-quiet)]">
                    {group.title}
                  </p>
                  <ul aria-labelledby={`footer-${group.title.toLowerCase()}`} className="mt-1">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <FooterLink href={link.href} className="text-sm">
                          {link.label}
                        </FooterLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 lg:mt-16">
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
        </Wrapper>
      </div>
    </footer>
  );
}
