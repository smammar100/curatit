"use client";

// Fundation
import Search from "@/components/fundations/icons/Search";
// Components
import AppWindow from "./AppWindow";
import BrandName from "./BrandName";
import PostCover from "./PostCover";
import { board, briefs } from "./demo";
import { usePosts } from "./HomePosts";
import { cx } from "@/lib/cx";

const brief = briefs[0];
const boards = [board.name, "Q3 banking campaign", "Harlo — site refresh"];

// The solution: one Curatit window with the brief, its results and a board, all in one place.
export default function LibraryWindow({ className }: { className?: string }) {
  const results = usePosts(brief.results.map((result) => result.post));
  const references = usePosts(board.references.map((reference) => reference.post));

  return (
    <div
      role="img"
      aria-label="The Curatit library: a brief typed into search, the posts it returned with why each matched, and a board of saved references"
      className={cx("pointer-events-none select-none", className)}
    >
      <AppWindow title="Curatit — Library" className="h-full">
        <div className="flex h-full">
          <nav className="hidden w-44 shrink-0 border-r border-base-100 p-4 text-xs md:block">
            <p className="rounded-md bg-base-50 px-2 py-1.5 font-medium text-base-900">Library</p>
            <p className="px-2 py-1.5 text-base-600">Boards</p>
            <p className="px-2 py-1.5 text-base-600">Shared with me</p>
            <p className="mt-4 px-2 text-[11px] font-medium uppercase tracking-wide text-base-500">Boards</p>
            {boards.map((name) => (
              <p key={name} className="truncate px-2 py-1.5 text-base-600">
                {name}
              </p>
            ))}
          </nav>
          <div className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="flex h-9 items-center gap-2 rounded-md bg-white px-4 text-xs ring-1 ring-base-200 shadow-sm">
              <Search className="size-3.5 shrink-0 text-base-400" />
              <span className="truncate text-base-900">{brief.query}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-base-500">Read as</span>
              {brief.readAs.map((term) => (
                <span key={term} className="rounded-md bg-base-50 px-2 py-1 text-base-900">
                  {term}
                </span>
              ))}
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {results.map((post, i) => {
                const { matched } = brief.results.find((result) => result.post === post.shortCode)!;
                return (
                  <li key={post.shortCode} className={i === 2 ? "hidden sm:block" : undefined}>
                    <PostCover post={post} sizes="(min-width: 640px) 180px, 40vw" className="rounded shadow" />
                    <BrandName brand={post.brand} className="mt-2" />
                    <p className="mt-0.5 line-clamp-1 text-xs text-base-600">{post.hook}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-base-500">Matched {matched.join(", ")}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <aside className="hidden w-64 shrink-0 border-l border-base-100 p-4 lg:block">
            <p className="font-display text-base text-base-900">{board.name}</p>
            <p className="mt-0.5 text-xs text-base-500">Private · {references.length} references</p>
            <ul className="mt-3 divide-y divide-base-100">
              {references.map((post) => {
                const { note } = board.references.find((reference) => reference.post === post.shortCode)!;
                return (
                  <li key={post.shortCode} className="flex items-center gap-3 py-2.5">
                    <PostCover post={post} sizes="36px" className="w-9 shrink-0 rounded shadow-sm" />
                    <div className="min-w-0">
                      <BrandName brand={post.brand} />
                      <p className="line-clamp-2 text-xs text-base-600">{note}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 rounded-md bg-base-50 px-3 py-2 text-center text-xs font-medium text-base-900">Share read-only link</p>
          </aside>
        </div>
      </AppWindow>
    </div>
  );
}
