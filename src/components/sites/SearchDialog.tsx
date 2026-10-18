"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
// Fundation
import Button from "@/components/fundations/elements/Button";
// Icons
import Close from "@/components/fundations/icons/Close";
import Command from "@/components/fundations/icons/Command";

type SearchItem = { title: string; tagline: string; id: string };

// The field recipe's parts (inputClass in auth/AuthParts) at this field's 36px: border-0 clears
// the forms plugin's border, and focus swaps the default shadow for the 2px brand ring, so the
// shadow is what fades
const inputClass =
  "block h-9 w-full rounded-md border-0 bg-component-on-container-subtle px-4 text-caption-lg text-primary-foreground shadow-sm placeholder:text-tertiary-foreground transition-[box-shadow] duration-150 ease-out-quint focus:z-10 focus:shadow-[0_0_0_2px_var(--color-brand-border-focus)] focus:ring-0 focus:outline-hidden pointer-coarse:text-[16px]";

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
      {/* A floating bar over the page, so a solid surface with the large shadow: a tint would let
          the covers scrolling under it show through */}
      <div className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 justify-center rounded-xl bg-modal p-2 shadow-lg">
        {/* Looks like the field it opens: a tinted well, so it reads inset on the solid bar in
            both themes */}
        <button
          type="button"
          className="mx-auto flex gap-2 items-center w-full px-4 py-2 text-caption-lg text-left leading-tight align-middle cursor-pointer bg-component hover:bg-component-hover transition-colors duration-150 ease-out-quint h-9 rounded-md text-secondary-foreground focus:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus"
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
        aria-label="Search"
      >
        <div className="min-h-screen px-4 text-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur"
            onClick={close}
          ></div>
          {/* Shown and hidden with display, so nothing on the panel transitions */}
          <div className="inline-block w-full max-w-2xl p-8 mb-8 mt-12 lg:mt-48 bg-modal rounded-3xl shadow-xl text-left align-middle relative">
            <div className="hidden">
              <Button
                variant="transparent"
                size="xs"
                iconOnly
                aria-label="Close search"
                onClick={close}
                className="ml-auto"
              >
                <Close className="size-4" />
              </Button>
            </div>
            <input
              ref={inputRef}
              type="text"
              aria-label="Search sites"
              placeholder="Search posts..."
              className={inputClass}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div
              className={
                trimmed
                  ? "max-h-100 rounded-lg mt-2 overflow-y-auto bg-card overflow-hidden w-full space-y-2 scrollbar-hide"
                  : "max-h-100 rounded-lg mt-2 overflow-y-auto bg-card overflow-hidden w-full space-y-2 scrollbar-hide hidden"
              }
            >
              {trimmed && results.length === 0 && (
                <div className="p-8">
                  <h3 className="font-medium text-body-base text-secondary-foreground">There&apos;s nothing here,...</h3>
                </div>
              )}
              {results.map(({ item }) => (
                <Link
                  key={item.id}
                  href={`/sites/site/${item.id}`}
                  onClick={close}
                  className="block bg-container rounded-lg px-8 py-4 hover:bg-transparent-hover transition-colors duration-150 ease-out-quint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus group"
                >
                  <h3 className="font-medium text-body-base uppercase tracking-wider text-primary-foreground group-hover:text-brand-foreground transition-colors duration-150 ease-out-quint">
                    {item.title}
                  </h3>
                  <p className="text-secondary-foreground text-body-sm block">{item.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
