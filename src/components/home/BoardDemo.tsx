"use client";

import { useState } from "react";
// Fundations
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
// Components
import AppWindow from "./AppWindow";
import PostCover from "./PostCover";
import { board, brands, posts, type Post } from "./demo";

// Layout follows the window's own width (AppWindow is a container), so it works inside a card
export default function BoardDemo() {
  const [shared, setShared] = useState(false);

  return (
    <AppWindow title="Boards">
      <div className="p-4 @sm:p-5">
        <Text tag="p" variant="displayXS" className="text-base-900 font-display font-light">
          {board.name}
        </Text>
        <p className="mt-1 text-xs text-base-500">
          {shared ? "Shared, read-only" : "Private"} · {board.references.length} references
        </p>
        {/* The share controls stay at the top left, clear of the card's fades */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" size="xs" variant={shared ? "muted" : "default"} onClick={() => setShared(!shared)}>
            {shared ? "Revoke link" : "Share"}
          </Button>
          {shared && (
            <>
              <input
                readOnly
                value="curatit.com/s/k7Qm2xVbR4"
                aria-label="Share link"
                onFocus={(event) => event.currentTarget.select()}
                className="block h-8 w-52 rounded-md border border-transparent bg-white px-3 py-2 text-xs leading-tight text-base-500 shadow-sm ring-1 ring-base-200 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 focus:outline-none"
              />
              <span className="text-xs text-base-500">Expires in 7 days</span>
            </>
          )}
        </div>
        <ul className="mt-3 divide-y divide-base-100">
          {board.references.map(({ post: id, note }) => {
            const post: Post = posts[id];
            return (
              <li key={id} className="flex items-center gap-3 py-2.5">
                <PostCover brand={post.brand} slide={post.slides[0]} className="w-10 shrink-0 rounded shadow-sm" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-base-900">
                    {brands[post.brand].name} — {post.hook}
                  </p>
                  <p className="mt-0.5 text-xs text-base-600">{note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </AppWindow>
  );
}
