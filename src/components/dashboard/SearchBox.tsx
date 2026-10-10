"use client";

// The dashboard's search, after Cosmos: a pill in the header that, when focused, opens a panel
// under it over a dimmed page, with your recent searches, the library's categories and what
// you saved last. Anything picked there becomes the query. Press / anywhere to focus it.
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
// Icons
import Close from "@/components/fundations/icons/Close";
import Search from "@/components/fundations/icons/Search";
import { categories } from "@/components/home/demo";
import { cx } from "@/lib/cx";
import { useBoards } from "./boards";

const RECENT_KEY = "curatit-recent-searches";
const RECENT_MAX = 8;

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export default function SearchBox({
  query,
  onQuery,
  onSearch,
  className,
}: {
  query: string;
  onQuery: (query: string) => void;
  // A search was committed (Enter, or a pick from the panel)
  onSearch?: (query: string) => void;
  className?: string;
}) {
  const { boards, list, posts } = useBoards();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRecent(readRecent()), []);

  const remember = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recent.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, RECENT_MAX);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };
  const clearRecent = () => {
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
  };
  const pick = (text: string) => {
    onQuery(text);
    remember(text);
    onSearch?.(text.trim());
    setOpen(false);
    inputRef.current?.blur();
  };

  // Close on a click outside or Escape; "/" focuses the field from anywhere
  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (open && !rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
      if (event.key === "Escape" && open) {
        setOpen(false);
        inputRef.current?.blur();
      } else if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The homepage's category tabs, but named as the library names them ("Fintech", not the
  // tab's "Finance"), since that's what the search matches against
  const chips = categories.map((category) => ({
    ...category,
    name: list.find((post) => post.category.slug === category.category)?.category.name ?? category.name,
  }));

  // The newest post on each board first, then the rest, without repeats
  const saved = [...new Set(boards.flatMap((board) => board.items.map((item) => item.post)))]
    .slice(0, 6)
    .flatMap((code) => posts.get(code) ?? []);

  return (
    <>
      {/* Dims the page while the panel is open; inside the header's stacking context, so the
          field and panel stay above it */}
      {open && <div aria-hidden="true" className="fixed inset-0 z-10 animate-[fade-in_150ms_ease-out] bg-black/25 motion-reduce:animate-none" />}
      <div ref={rootRef} className={cx("relative z-20", className)}>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            pick(query);
          }}
        >
          <label className="relative flex h-13 items-center rounded-full bg-white ring-1 ring-base-200 transition-[box-shadow] duration-150 focus-within:ring-base-300">
            <Search className="pointer-events-none absolute left-5 size-4.5 text-base-500" />
            <span className="sr-only">Search the library</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="Try ‘launch carousel that shows the product’"
              autoComplete="off"
              className="h-full w-full rounded-full border-0 bg-transparent pr-12 pl-12 text-base text-base-900 placeholder-base-500 focus:ring-0 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  onQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 flex size-8 items-center justify-center rounded-full text-base-500 hover:bg-base-50 hover:text-base-900"
              >
                <Close className="size-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-4 hidden h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-sans text-xs text-base-500 ring-1 ring-base-200 md:flex">
                /
              </kbd>
            )}
          </label>
        </form>

        {open && (
          <div className="absolute inset-x-0 top-full mt-3 origin-top animate-[menu-in_150ms_cubic-bezier(0.23,1,0.32,1)] rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)] dark:ring-1 dark:ring-edge motion-reduce:animate-none">
            {recent.length > 0 && (
              <Section title="Recent" onClear={clearRecent}>
                <Row>
                  {recent.map((item) => (
                    <Chip key={item} onClick={() => pick(item)}>
                      <Search className="size-4 shrink-0 text-base-500" />
                      {item}
                    </Chip>
                  ))}
                </Row>
              </Section>
            )}
            <Section title="Categories">
              <Row>
                {chips.map((category) => (
                  <Chip key={category.category} onClick={() => pick(category.name)}>
                    <span
                      aria-hidden="true"
                      className="size-5 shrink-0 rounded-md"
                      style={{ background: `oklch(0.7 0.12 ${category.hue})` }}
                    />
                    {category.name}
                  </Chip>
                ))}
              </Row>
            </Section>
            {saved.length > 0 && (
              <Section title="Recently saved">
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {saved.map((post) => (
                    <li key={post.shortCode}>
                      <button
                        type="button"
                        aria-label={`Posts from ${post.brand.name}`}
                        onClick={() => pick(post.brand.name)}
                        className="relative block aspect-4/5 w-full overflow-hidden rounded-lg bg-base-100 outline-1 -outline-offset-1 outline-edge transition-[filter] duration-150 hover:brightness-95"
                      >
                        <Image src={post.cover} alt="" fill sizes="120px" className="object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Section({ title, onClear, children }: { title: string; onClear?: () => void; children: ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-base-900">{title}</h2>
        {onClear && (
          <button type="button" onClick={onClear} className="text-sm text-base-500 hover:text-base-900">
            Clear
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

// One row that scrolls sideways when it runs out of room
function Row({ children }: { children: ReactNode }) {
  return <div className="-mx-6 flex gap-2 overflow-x-auto px-6 scrollbar-hide">{children}</div>;
}

function Chip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-base-50 px-4 text-sm font-medium whitespace-nowrap text-base-900 transition-[background-color,scale] duration-150 hover:bg-base-100 active:scale-[0.96]"
    >
      {children}
    </button>
  );
}
