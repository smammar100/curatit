"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Command } from "@/components/fundations/icons";
import type { QuickSearchItem } from "@/lib/services/creatives";

const fieldClass =
  "block w-full px-4 py-2 text-sm leading-tight bg-white border border-transparent transition duration-300 ease-in-out h-10 rounded-md text-base-900 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm";

/**
 * Carbon's floating "Search ⌘K" pill. Instant fuzzy matches over the library
 * run locally (no API calls per keystroke); Enter runs a full search.
 */
export default function CommandSearch({ items }: { items: QuickSearchItem[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isMac, setIsMac] = useState(true);

  const fuse = useMemo(
    () => new Fuse(items, { keys: ["brand", "hook", "category", "labels"], threshold: 0.35, ignoreLocation: true }),
    [items]
  );
  const results = useMemo(() => (query.trim() ? fuse.search(query.trim()).slice(0, 8).map((r) => r.item) : []), [fuse, query]);

  function open() {
    dialogRef.current?.showModal();
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  function close() {
    dialogRef.current?.close();
    setQuery("");
  }

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-30 flex w-fit -translate-x-1/2 rounded-xl bg-base-100 p-2">
        <button
          type="button"
          onClick={open}
          aria-haspopup="dialog"
          className="flex h-9 w-72 max-w-[calc(100vw-4rem)] items-center gap-2 rounded-md bg-white px-4 text-left text-xs text-base-500 shadow-sm ring-1 ring-base-200 transition duration-300 hover:ring-base-300 focus:outline-none focus:ring-2 focus:ring-accent-100"
        >
          Search the library
          <span className="ml-auto flex items-center gap-0.5" aria-hidden="true">
            {isMac ? <Command className="size-4" /> : "Ctrl"} K
          </span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Search the library"
        onClose={() => setQuery("")}
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="mx-auto mt-12 w-[min(42rem,calc(100vw-2rem))] rounded-lg bg-base-50 p-0 backdrop:bg-base-950/50 backdrop:backdrop-blur lg:mt-48"
      >
        <form
          className="p-8"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            const value = query.trim();
            if (!value) return;
            close();
            router.push(`/library?q=${encodeURIComponent(value)}`);
          }}
        >
          <label htmlFor="command-search" className="sr-only">
            Describe what you&rsquo;re looking for
          </label>
          <input
            id="command-search"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Describe the brief, e.g. “finance carousels explaining a feature”"
            maxLength={1000}
            autoComplete="off"
            className={fieldClass}
          />

          {query.trim() && (
            <div className="mt-2 max-h-96 space-y-2 overflow-y-auto scrollbar-hide">
              <button
                type="submit"
                className="block w-full rounded-lg bg-white px-8 py-4 text-left text-sm text-base-900 duration-300 hover:bg-base-100"
              >
                Search the whole library for &ldquo;{query.trim()}&rdquo; →
              </button>
              {results.length === 0 ? (
                <p className="px-8 py-4 text-sm text-base-500">No quick matches. Press Enter for a full search.</p>
              ) : (
                results.map((item) => (
                  <Link
                    key={item.id}
                    href={`/creatives/${item.id}`}
                    onClick={close}
                    className="group block rounded-lg bg-white px-8 py-4 duration-300 hover:bg-base-100"
                  >
                    <span className="block text-sm font-medium text-base-900 group-hover:text-accent-600">{item.hook}</span>
                    <span className="block text-xs text-base-600">
                      {item.brand} · {item.category}
                    </span>
                  </Link>
                ))
              )}
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}
