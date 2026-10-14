"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
// Icons
import Close from "@/components/fundations/icons/Close";
import Command from "@/components/fundations/icons/Command";

type SearchItem = { title: string; tagline: string; id: string };

const inputClass =
  "block w-full px-4 py-2 text-xs leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm";

export default function SearchDialog({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fuzzy search over titles and taglines
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "tagline"],
        threshold: 0.3, // Lower is stricter
        includeMatches: true,
      }),
    [items]
  );
  const trimmed = query.trim();
  const results = trimmed ? fuse.search(trimmed) : [];

  function close() {
    setOpen(false);
    setQuery("");
  }

  // Cmd/Ctrl + K opens the search, Escape closes it
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? event.metaKey : event.ctrlKey;
      if (modKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lock page scroll and focus the input while open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="relative">
      <div className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 justify-center rounded-xl bg-base-100 p-2">
        <button
          type="button"
          className="mx-auto flex gap-2 items-center block w-full px-4 py-2 text-xs text-left leading-tight align-middle bg-white border border-transparent transition duration-300 ease-in-out focus:z-10 h-9 rounded-md text-base-500 ring-1 ring-base-200 placeholder-base-400 focus:border-accent-500 focus:ring-accent-100 focus:ring-2 focus:outline-none shadow-sm"
          aria-label="Search for tools"
          onClick={() => setOpen(true)}
        >
          <span className="sr-only">Search</span>
          Search for tools
          <span className="flex gap-0.5 items-center ml-auto">
            <Command className="size-4" />K
          </span>
        </button>
      </div>
      <div
        className={open ? "fixed inset-0 z-50 overflow-y-auto" : "fixed inset-0 z-50 overflow-y-auto hidden"}
        role="dialog"
        aria-modal="true"
      >
        <div className="min-h-screen px-4 text-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur transition-opacity"
            onClick={close}
          ></div>
          <div className="inline-block w-full max-w-2xl p-8 b- mb-8 mt-12 lg:mt-48 bg-base-50 rounded-lg text-left align-middle transition-all transform relative">
            <div className="hidden">
              <button
                type="button"
                className="text-base-400 hover:text-base-500 cursor-pointer ml-auto"
                aria-label="Close search"
                onClick={close}
              >
                <Close className="size-4" />
              </button>
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts..."
              className={inputClass}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div
              className={
                trimmed
                  ? "max-h-100 rounded-lg mt-2 overflow-y-auto bg-base-50 overflow-hidden w-full space-y-2 scrollbar-hide"
                  : "max-h-100 rounded-lg mt-2 overflow-y-auto bg-base-50 overflow-hidden w-full space-y-2 scrollbar-hide hidden"
              }
            >
              {trimmed && results.length === 0 && (
                <div className="p-8">
                  <h3 className="font-medium text-base text-base-500">There&apos;s nothing here,...</h3>
                </div>
              )}
              {results.map(({ item }) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
