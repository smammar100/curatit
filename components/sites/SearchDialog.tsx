"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { Close, Command } from "@/components/fundations/icons";

export type SearchItem = {
  id: string;
  title: string;
  tagline: string;
};

export default function SearchDialog({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "tagline"],
        threshold: 0.3,
        includeMatches: true,
      }),
    [items]
  );

  const results = useMemo(() => {
    const value = query.trim();
    return value ? fuse.search(value).map((result) => result.item) : [];
  }, [fuse, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Lock scrolling while the dialog is open, and focus the field.
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cmd/Ctrl + K to open, Escape to close.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modKey = event.metaKey || event.ctrlKey;
      if (modKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <div className="relative p-4">
      <div className="fixed bottom-6 left-1/2 w-fit max-w-xs justify-center -translate-x-1/2 z-50 flex bg-base-100 p-2 rounded-xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex gap-2 items-center w-full px-4 py-2 text-xs text-left leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
          aria-label="Search for tools"
        >
          Search for tools
          <span className="flex gap-0.5 items-center ml-auto">
            <Command className="size-4" />K
          </span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="min-h-screen px-4 text-center">
            <div
              className="fixed inset-0 bg-base-950/50 backdrop-blur transition-opacity"
              onClick={close}
            />
            <div className="inline-block w-full max-w-2xl p-8 mb-8 mt-12 lg:mt-48 bg-base-50 rounded-lg text-left align-middle transition-all transform relative">
              <div className="flex">
                <button
                  type="button"
                  onClick={close}
                  className="text-base-400 hover:text-base-500 cursor-pointer ml-auto"
                  aria-label="Close search"
                >
                  <Close className="size-4" />
                </button>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sites..."
                className="block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
              />
              {query.trim() && (
                <div className="max-h-100 rounded-lg mt-2 overflow-y-auto bg-base-50 w-full space-y-2 scrollbar-hide">
                  {results.length === 0 ? (
                    <div className="p-8">
                      <h3 className="font-medium text-base text-base-500">
                        There&rsquo;s nothing here,...
                      </h3>
                    </div>
                  ) : (
                    results.map((item) => (
                      <Link
                        key={item.id}
                        href={`/sites/site/${item.id}`}
                        onClick={close}
                        className="block bg-white rounded-lg px-8 py-4 hover:bg-base-100 duration-300 group"
                      >
                        <h3 className="font-medium text-base uppercase text-base-900 group-hover:text-accent-600">
                          {item.title}
                        </h3>
                        <p className="text-base-600 text-sm block">{item.tagline}</p>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
