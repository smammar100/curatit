"use client";

import { useState } from "react";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Search from "@/components/fundations/icons/Search";
// Components
import AppWindow from "./AppWindow";
import PostCover from "./PostCover";
import { brands, briefs, posts, type Post } from "./demo";

export default function SearchDemo() {
  const [active, setActive] = useState(0);
  const brief = briefs[active];

  return (
    <AppWindow title="Library">
      <div className="p-4 sm:p-6">
        <div className="flex h-9 items-center gap-2 rounded-md bg-white px-4 text-xs ring-1 ring-base-200 shadow-sm">
          <Search className="size-3.5 shrink-0 text-base-400" />
          <span className="sr-only">Brief:</span>
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
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3" aria-live="polite">
          {brief.results.map(({ post: id, matched }, i) => {
            const post: Post = posts[id];
            return (
              <li key={id} className={i === 2 ? "hidden sm:block" : undefined}>
                <PostCover brand={post.brand} slide={post.slides[0]} className="rounded shadow" />
                <p className="mt-3 text-xs font-medium text-base-900">{brands[post.brand].name}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-base-600">{post.hook}</p>
                <p className="mt-2 text-xs text-base-500">Matched {matched.join(", ")}</p>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-base-100 px-4 py-3 sm:px-6">
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
    </AppWindow>
  );
}
