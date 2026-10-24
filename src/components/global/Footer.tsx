import type { CSSProperties } from "react";
import Link from "next/link";
// Assets
import Logo from "@/components/assets/Logo";
import Symbol from "@/components/assets/Symbol";
import TextLink from "@/components/fundations/elements/TextLink";
import DeferredImages from "@/components/global/DeferredImages";
import {
  getPublishedPosts,
  optimizedImage,
  type LibraryPost,
} from "@/lib/posts";
import FooterNewsletter from "./FooterNewsletter";

// The site footer, "Ruled" (chosen from two prototype rounds on 2026-10-15, replacing "Night"'s
// fanned covers): the page's paper carries on, and the footer is an inset dark panel, one of two
// deliberately dark surfaces (with Vision's panel) on the marketing site. Hairlines divide it
// into cells: the full logo (the mark turning beside the wordmark) over a short statement in the
// first, the links in their own; then the newest covers as a filmstrip running edge to
// edge and drifting sideways (a CSS marquee, still under reduced motion); then © and legal.
// A server component, so it costs the page no script beyond the hidden email field; if the
// library can't be reached, it renders without the strip.
//
// Since 2026-10-24 on Glaze. The panel is its own Glaze scope in the dark theme (`glaze` with
// data-theme="dark"), so it stays dark on both the light and the dark site and every colour
// inside is a Glaze role that flips there: the panel is the grey field (the one solid surface of
// that theme the bridge leaves alone; paper, page and shell keep the site's own ladder), the words
// text-1 and text-2, the cell rules the line that must read, the links quiet TextLinks (text-2,
// text-1 on hover, Glaze's ink focus ring, which is light in this scope), the strip's empty tiles
// the hover wash with tag corners. The --f-* palette in global.css is no longer read here.

// One column of links since 2026-10-23, at the owner's request: Pricing, Submit a brand, Blog,
// Advertise and Contact came out, with the Company heading; the pages themselves stay
const LINKS = [
  {
    title: "Product",
    links: [
      { label: "MCP (beta)", href: "/agents" },
      { label: "Vision", href: "/vision" },
      { label: "Roadmap", href: "/roadmap" },
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
      if (
        !post.images[0] ||
        brands.has(post.brand.slug) ||
        (strict && categories.has(post.category.slug))
      )
        continue;
      brands.add(post.brand.slug);
      categories.add(post.category.slug);
      picked.push(post);
    }
  }
  return picked;
}

// A quiet link, at least 40px tall (44px on touch screens)
const linkClass = "inline-flex min-h-10 items-center text-pretty pointer-coarse:min-h-11";
const cell = "border-line p-6 sm:p-8";
// The footer's bottom edge clears the home indicator on phones
const safeBottom = { "--footer-pb": "max(1rem, env(safe-area-inset-bottom))" } as CSSProperties;

export default async function Footer() {
  const posts = await getPublishedPosts().catch(() => []);
  const covers = pickCovers(posts);
  const strip = Array.from({ length: REPEAT }, () => covers).flat();

  return (
    <footer className="mt-12 bg-page px-4 pb-(--footer-pb) lg:mt-16" style={safeBottom}>
      <div data-theme="dark" className="glaze relative isolate overflow-clip rounded-(--radius-float) bg-field text-text-2">
        <div className="grid grid-cols-2 lg:grid-cols-12">
          {/* The logo and the statement */}
          <div className={`${cell} col-span-2 border-b lg:col-span-6 lg:border-r lg:border-b-0`}>
            <Link href="/" aria-label="Curatit home" className="inline-flex items-center gap-2.5 rounded-tag text-text-1">
              <Symbol className="footer-mark size-6 shrink-0" aria-hidden="true" />
              <Logo className="h-4 w-auto" aria-hidden="true" />
            </Link>
            <p className="mt-10 max-w-sm font-display text-h4 font-normal text-balance lg:mt-16 lg:text-h3">
              <span className="text-text-2">Real brand posts. </span>
              <span className="text-text-1">Useful ideas for your next project.</span>
            </p>
            {SHOW_NEWSLETTER && (
              <div className="mt-8">
                <FooterNewsletter />
              </div>
            )}
          </div>
          {/* The one links column takes the width the two used to share */}
          {LINKS.map((group) => (
            <nav key={group.title} aria-label={group.title} className={`${cell} col-span-2 border-b lg:col-span-6 lg:border-b-0`}>
              <p className="type-label-sm text-text-2">{group.title}</p>
              <ul className="mt-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <TextLink variant="quiet" href={link.href} className={`${linkClass} type-body-sm`}>
                      {link.label}
                    </TextLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* The newest covers, a filmstrip drifting across the whole width */}
        {covers.length > 0 && (
          <div className="footer-strip overflow-clip border-b border-line py-2" aria-hidden="true">
            <div className="footer-strip-track flex w-max gap-2">
              {strip.map((post, i) => (
                <div
                  key={`${post.id}-${i}`}
                  className="relative aspect-4/5 w-24 shrink-0 overflow-hidden rounded-panel bg-hover sm:w-28 lg:w-32"
                >
                  {/* Started after the page has loaded (DeferredImages below): on a short page
                      the strip is close enough to the fold for the browser to fetch its covers
                      during the first paint (2026-10-16, Lighthouse mobile) */}
                  <img
                    data-src={optimizedImage(post.images[0], 128, 75)}
                    data-srcset={`${optimizedImage(post.images[0], 128, 75)} 128w, ${optimizedImage(post.images[0], 256, 75)} 256w`}
                    suppressHydrationWarning
                    sizes="128px"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <DeferredImages selector=".footer-strip img" />

        <div className="flex flex-wrap items-center justify-between gap-x-6 px-6 py-5 sm:px-8">
          <p className="type-caption text-text-2">© 2026 Curatit</p>
          <ul className="flex gap-x-5" aria-label="Legal">
            {LEGAL.map((link) => (
              <li key={link.href}>
                <TextLink variant="quiet" href={link.href} className={`${linkClass} type-caption`}>
                  {link.label}
                </TextLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
