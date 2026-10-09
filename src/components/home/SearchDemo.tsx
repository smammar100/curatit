"use client";

import { useState } from "react";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Search from "@/components/fundations/icons/Search";
// Components
import AppWindow from "./AppWindow";
import PostCover from "./PostCover";
import { briefs } from "./demo";
import { usePosts } from "./HomePosts";

// Layout follows the window's own width (AppWindow is a container), so it works inside a card
export default function SearchDemo() {
  const [active, setActive] = useState(0);
  const brief = briefs[active];
  const posts = usePosts(brief.results.map((result) => result.post));

  return (
    <AppWindow title="Library">
      <div className="p-4 @sm:p-5">
        <div className="flex h-8 items-center gap-2 rounded-md bg-white px-3 text-xs ring-1 ring-base-200 shadow-sm">
          <Search className="size-3.5 shrink-0 text-base-400" />
          <span className="sr-only">Brief:</span>
          <span className="truncate text-base-900">{brief.query}</span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-base-500">Read as</span>
          {brief.readAs.map((term) => (
            <span key={term} className="rounded-md bg-base-50 px-2 py-1 text-base-900">
              {term}
            </span>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-base-500">Try a brief</span>
          {briefs.map((option, i) => (
            <Button
              key={option.label}
              type="button"
              size="xxs"
              variant={i === active ? "default" : "muted"}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 @md:grid-cols-3" aria-live="polite">
          {posts.map((post, i) => {
            const { matched } = brief.results.find((result) => result.post === post.shortCode)!;
            return (
              <li key={post.shortCode} className={i === 2 ? "hidden @md:block" : undefined}>
                <PostCover post={post} sizes="(min-width: 1024px) 120px, 40vw" className="rounded shadow" />
                <p className="mt-2 text-xs font-medium text-base-900">{post.brand.name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-base-600">{post.hook}</p>
                <p className="mt-1.5 text-xs text-base-500">Matched {matched.join(", ")}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </AppWindow>
  );
}
