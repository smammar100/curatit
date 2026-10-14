// Assets
import Symbol from "@/components/assets/Symbol";
// Icons
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import Question from "@/components/fundations/icons/Question";
// Components
import BrandName from "@/components/home/BrandName";
import PostCover from "@/components/home/PostCover";
import type { LibraryPost } from "@/lib/posts";

// The MCP landing page's illustration (2026-10-13, redrawn 2026-10-15 when the person asked to
// improve it): one question, asked once and centred over both answers (no tail, so it reads as
// asked of each), answered two ways side by side at 2:3. Without Curatit the answer is words on
// paper: a hairline card (the page's token cards) of guessed ideas beside small empty dashed frames,
// none of it a link. With Curatit it's the library's real posts, large and shadowed on the mat, each
// tile a link to the post on Instagram with the terms it matched on. Pictures against words, filled
// against empty, so the difference shows before anything is read. Below sm the posts turn into rows
// (a 96px cover beside its caption), so a real cover is on the first screen. Small text that carries
// meaning is base-600: base-500 is under 4.5:1 on paper and on the mat. With none of the posts to
// show (the library can't be reached) it renders nothing, rather than an answer that looks emptier
// than the one it beats. A server component: no script, no motion.

export const QUESTION = "Find fintech carousels that launch a feature.";

// What curatit_search_posts returned for that question on 2026-10-13 (industry fintech, format
// carousel, approach feature launch), with the taxonomy terms each one matched on. These describe
// the real posts, so keep them in step if you swap one; a short code that isn't published is skipped.
export const PICKS = [
  { shortCode: "DeJsl6nF39v", matched: ["Feature launch", "Reveal, then detail"] }, // Wise
  { shortCode: "Dd9Lmh6o00b", matched: ["Feature launch", "Listicle"] }, // Robinhood
  { shortCode: "DdrpIpkAYGX", matched: ["Feature launch", "Listicle"] }, // Wealthfront
];

// What an assistant with no library tends to offer instead: plausible, and impossible to check
const GUESSES = ["A bold headline slide, then one feature per slide", "The old way and the new, side by side", "A countdown teaser in the week before launch"];

// For the figcaption: PICKS and GUESSES are three each
const NUMBERS = ["zero", "one", "two", "three"];

// Each answer's label: the card meta line (uppercase, medium), dark only on the side that wins
const label = "text-xs font-medium tracking-wide uppercase";

export default function BeforeAfter({ posts, className }: { posts: LibraryPost[]; className?: string }) {
  const results = PICKS.flatMap(({ shortCode, matched }) => {
    const post = posts.find((candidate) => candidate.shortCode === shortCode);
    return post ? [{ post, matched }] : [];
  });
  // Without its posts the comparison would argue the wrong way; the benefits below still make the case
  if (!results.length) return null;
  const brands = new Intl.ListFormat("en", { type: "conjunction" }).format(results.map(({ post }) => post.brand.name));

  return (
    <figure className={className}>
      {/* Asked once, centred over both answers (McpDemo's bubble without its tail) */}
      <p className="mx-auto w-fit max-w-full rounded-2xl bg-base-100 px-5 py-4 text-center text-sm leading-relaxed text-balance text-base-900 sm:text-base">
        <span className="sr-only">Question: </span>
        {QUESTION}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Without: words on paper beside frames with nothing in them. Nothing here opens. */}
        <div className="flex flex-col rounded-2xl bg-white p-4 ring-1 ring-edge sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className={`${label} text-base-600`}>Without Curatit</p>
            <p className="text-xs text-base-600">From memory</p>
          </div>
          {/* mt-2 plus the row's py-3 sets the first frame level with the covers (mt-5) */}
          <ul aria-label="Ideas from memory" className="mt-2 divide-y divide-base-200">
            {GUESSES.map((guess) => (
              <li key={guess} className="flex items-center gap-3 py-3">
                <div
                  aria-hidden="true"
                  className="flex aspect-4/5 w-10 shrink-0 items-center justify-center rounded border border-dashed border-base-300"
                >
                  <Question className="size-3.5 text-base-400" />
                </div>
                <p className="text-sm text-pretty text-base-600">
                  {guess}
                  <span className="sr-only"> (no source)</span>
                </p>
              </li>
            ))}
          </ul>
          {/* Pinned to the card's foot from lg, level with the posts' captions */}
          <p className="mt-auto pt-5 text-xs text-pretty text-base-600">It sounds right, but there&apos;s nothing to open, check or show a client.</p>
        </div>

        {/* With: the library's real posts, large, on the mat */}
        <div className="rounded-2xl bg-base-50 p-4 sm:p-6 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className={`${label} text-base-900`}>With Curatit</p>
            <p className="flex min-w-0 items-center gap-1.5 text-base-600">
              <Symbol className="size-3 shrink-0 text-base-900" aria-hidden="true" />
              <span className="font-mono text-[11px]">curatit_search_posts</span>
            </p>
          </div>
          {/* Rows on phones (the cover beside its caption), three across from sm */}
          <ul aria-label="Posts from Curatit's library" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {results.map(({ post, matched }) => (
              <li key={post.shortCode} className="group/post relative flex items-center gap-3 sm:block">
                <PostCover
                  post={post}
                  // 96px rows on phones, under 30vw while the answers stack, 160 to 215px beside the
                  // other answer, and at most about 310px once the Wrapper caps at 110rem
                  sizes="(min-width: 1536px) 320px, (min-width: 1024px) 216px, (min-width: 640px) 30vw, 96px"
                  className="w-24 shrink-0 rounded shadow sm:w-auto"
                />
                <div className="min-w-0 sm:mt-3">
                  <div className="flex items-center gap-1">
                    <BrandName brand={post.brand} className="transition-colors duration-150 group-hover/post:text-accent-600 group-has-[:focus-visible]/post:text-accent-600" />
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-3 shrink-0 text-base-500 transition-colors duration-150 group-hover/post:text-accent-600 group-has-[:focus-visible]/post:text-accent-600"
                    />
                  </div>
                  {/* The card meta's middot, kept from screen readers; each term wraps only whole */}
                  <ul aria-label="Matched on" className="mt-1 flex flex-wrap gap-x-1 text-xs text-base-600">
                    {matched.map((term, i) => (
                      <li key={term}>
                        {term}
                        {i < matched.length - 1 && <span aria-hidden="true"> ·</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Stretched link to the post on Instagram, as on LibraryCard: the whole tile opens it. No focus
                    outline (2026-10-15, at the person's request); keyboard focus turns the name accent, like hover */}
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 outline-none"
                >
                  <span className="sr-only">Open this {post.brand.name} post on Instagram (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <figcaption className="sr-only">
        One question, answered two ways. Without Curatit, an assistant offers {NUMBERS[GUESSES.length]} ideas from memory, none with a source. With Curatit, it
        searches the library and answers with {NUMBERS[results.length]} real fintech {results.length === 1 ? "carousel" : "carousels"}, from {brands}, each linked to
        the post on Instagram.
      </figcaption>
    </figure>
  );
}
