import type { ReactNode } from "react";
// Assets
import Symbol from "@/components/assets/Symbol";
// Icons
import Question from "@/components/fundations/icons/Question";
// Components
import BrandName from "@/components/home/BrandName";
import PostCover from "@/components/home/PostCover";
import type { LibraryPost } from "@/lib/posts";

// The MCP landing page's illustration (2026-10-13): the same question asked of an assistant twice.
// Without Curatit it answers from memory, ideas with nothing behind them (dashed frames, "No
// source"); with Curatit it searches the library and answers with real posts, each with what it
// matched on and the link it came from. A server component: no script, no motion.

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
const GUESSES = ["A bold headline slide, then one feature per slide", "A before-and-after of the old way and the new", "A countdown teaser in the week before launch"];

function Panel({ label, aside, footer, children }: { label: string; aside: ReactNode; footer: string; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl bg-base-50 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-base-900 uppercase">{label}</p>
        <div className="min-w-0 text-xs text-base-500">{aside}</div>
      </div>
      <p className="mt-5 ml-auto max-w-[17rem] rounded-2xl rounded-br-sm bg-base-100 px-4 py-3 text-sm text-base-900">{QUESTION}</p>
      <div className="mt-5 flex-1">{children}</div>
      <p className="mt-5 text-xs text-pretty text-base-500">{footer}</p>
    </div>
  );
}

const row = "flex items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-edge sm:gap-4";
const frame = "w-12 shrink-0 sm:w-14";

export default function BeforeAfter({ posts }: { posts: LibraryPost[] }) {
  const results = PICKS.flatMap(({ shortCode, matched }) => {
    const post = posts.find((candidate) => candidate.shortCode === shortCode);
    return post ? [{ post, matched }] : [];
  });

  return (
    <figure>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel label="Without Curatit" aside="From memory" footer="It sounds right, but there's nothing to open, check or show a client.">
          <p className="text-sm text-base-600">Here are a few ideas you could try:</p>
          <ul className="mt-3 space-y-2">
            {GUESSES.map((guess) => (
              <li key={guess} className={row}>
                <div className={`${frame} flex aspect-4/5 items-center justify-center rounded border border-dashed border-base-300`} aria-hidden="true">
                  <Question className="size-4 text-base-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-pretty text-base-900">{guess}</p>
                  <p className="mt-1 text-xs text-base-500">No source</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          label="With Curatit"
          aside={
            <span className="flex min-w-0 items-center gap-1.5">
              <Symbol className="size-3 shrink-0 text-base-900" aria-hidden="true" />
              <span className="truncate font-mono text-[11px]">curatit_search_posts</span>
            </span>
          }
          footer="Real posts from the library, each with what it matched on and the link it came from."
        >
          <p className="text-sm text-base-600">Three from Curatit&apos;s library:</p>
          <ul className="mt-3 space-y-2">
            {results.map(({ post, matched }) => (
              <li key={post.shortCode} className={row}>
                <PostCover post={post} sizes="56px" className={`${frame} rounded shadow`} />
                <div className="min-w-0">
                  <BrandName brand={post.brand} />
                  <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="Matched on">
                    {matched.map((term) => (
                      <li key={term} className="rounded-md bg-base-50 px-1.5 py-0.5 text-[11px]/4 text-base-700 ring-1 ring-base-200">
                        {term}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 block truncate font-mono text-[11px] text-base-500 underline decoration-base-300 underline-offset-2 transition-colors duration-150 hover:text-accent-600"
                  >
                    instagram.com/p/{post.shortCode}
                    <span className="sr-only"> (opens Instagram)</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <figcaption className="sr-only">
        The same question asked of an assistant twice. Without Curatit it offers ideas with no sources. With Curatit it searches the library and answers with real fintech
        carousels, each linked to the post on Instagram.
      </figcaption>
    </figure>
  );
}
