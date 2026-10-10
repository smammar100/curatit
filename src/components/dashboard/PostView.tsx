"use client";

// A post's detail page, after Cosmos's element page (Mobbin: cosmos.so element detail), with
// Telescope's slide arrows and thumbnail strip for carousels. One card: the post large on the
// left, its details on the right (brand, hook, counts, caption, the boards it's on) and a
// board picker with Save at the foot. More from the same category underneath.
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Icons
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
// Components
import BrandName from "@/components/home/BrandName";
import type { PostDetail } from "@/lib/posts";
import { cx } from "@/lib/cx";
import { BoardThumb, useBoards } from "./boards";
import { feedHref } from "./Feed";
import Grid, { ratio } from "./Grid";
import Header from "./Header";

const RELATED = 24;
const formats = { static: "Single image", carousel: "Carousel", video: "Video" } as const;
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function PostView({ post }: { post: PostDetail }) {
  const router = useRouter();
  const { list } = useBoards();
  const [query, setQuery] = useState("");

  // Same brand first, then the rest of the category, newest first within each
  const related = useMemo(() => {
    const others = list.filter((item) => item.category.slug === post.category.slug && item.shortCode !== post.shortCode);
    const sameBrand = others.filter((item) => item.brand.slug === post.brand.slug);
    const rest = others.filter((item) => item.brand.slug !== post.brand.slug);
    return [...sameBrand, ...rest].slice(0, RELATED);
  }, [list, post]);

  return (
    <div className="min-h-dvh bg-white">
      <Header
        view={null}
        onView={(view) => router.push(feedHref(view))}
        query={query}
        onQuery={setQuery}
        onSearch={(text) => router.push(feedHref("For you", text))}
      />
      <main className="px-4 pb-24 sm:px-6">
        <article className="grid overflow-hidden rounded-[28px] ring-1 ring-base-200 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Stage post={post} />
          <Details post={post} />
        </article>
        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="related-heading">
            <h2 id="related-heading" className="mb-6 text-[17px] font-medium text-base-900">
              More in {post.category.name}
            </h2>
            <Grid posts={related} priority={false} />
          </section>
        )}
      </main>
    </div>
  );
}

// The post itself: one slide at a time, with arrows, a counter and thumbnails for carousels
function Stage({ post }: { post: PostDetail }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const count = post.images.length;
  const go = (next: number) => setIndex(Math.min(count - 1, Math.max(0, next)));

  // ← and → step through the slides, unless you're typing
  useEffect(() => {
    if (count < 2) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable || event.metaKey || event.ctrlKey) return;
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (event.key === "ArrowRight") setIndex((i) => Math.min(count - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  // Back to wherever you came from on the site, or the feed if you arrived here directly
  const back = () => {
    const fromSite = document.referrer.startsWith(location.origin);
    if (fromSite && history.length > 1) router.back();
    else router.push("/dashboard");
  };

  const r = ratio(post);
  return (
    <div className="relative flex flex-col items-center justify-center gap-5 px-6 py-16 sm:px-16 lg:min-h-[min(calc(100dvh-8rem),56rem)]">
      <button
        type="button"
        onClick={back}
        aria-label="Back"
        className="absolute top-5 left-5 flex size-10 items-center justify-center rounded-full text-base-900 ring-1 ring-base-200 transition-[background-color,scale] duration-150 hover:bg-base-50 active:scale-[0.96]"
      >
        <CaretLeft className="size-4" />
      </button>

      {/* As tall as the window allows under the header: the stage's padding, plus the counter
          and thumbnails on a carousel, come off the height */}
      <div className="relative w-full" style={{ maxWidth: `min(100%, calc((min(100dvh, 64rem) - ${count > 1 ? 22 : 16}rem) * ${r}))` }}>
        <div className="relative w-full overflow-hidden rounded bg-base-100 outline-1 -outline-offset-1 outline-edge" style={{ aspectRatio: r }}>
          <Image
            key={post.images[index]}
            src={post.images[index]}
            alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={index === 0}
            className="object-cover"
          />
        </div>
        {count > 1 && (
          <>
            <SlideButton side="left" disabled={index === 0} onClick={() => go(index - 1)} />
            <SlideButton side="right" disabled={index === count - 1} onClick={() => go(index + 1)} />
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-base-500 tabular-nums" aria-live="polite">
            {index + 1} / {count}
          </p>
          <ol className="flex max-w-full gap-1.5 overflow-x-auto p-1 scrollbar-hide" aria-label="Slides">
            {post.images.map((src, i) => (
              <li key={src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className="relative block w-10 overflow-hidden rounded-sm bg-base-100 opacity-60 transition-opacity duration-150 hover:opacity-100 aria-[current]:opacity-100 aria-[current]:ring-2 aria-[current]:ring-base-900 aria-[current]:ring-offset-2 aria-[current]:ring-offset-white"
                  style={{ aspectRatio: r }}
                >
                  <Image src={src} alt="" fill sizes="40px" className="object-cover" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function SlideButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      className={cx(
        "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-base-900 shadow-md ring-1 ring-edge transition-[opacity,scale] duration-150 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-0",
        side === "left" ? "-left-5" : "-right-5",
      )}
    >
      {side === "left" ? <CaretLeft className="size-4" /> : <CaretRight className="size-4" />}
    </button>
  );
}

// The right-hand panel: who posted it, what it is, what it did, and saving it
function Details({ post }: { post: PostDetail }) {
  const { boards, save, notify } = useBoards();
  const [expanded, setExpanded] = useState(false);
  const [board, setBoard] = useState(boards[0]?.id ?? "");
  const savedIn = boards.filter((b) => b.items.some((item) => item.post === post.shortCode));
  const inChosen = savedIn.some((b) => b.id === board);
  const slides = post.images.length;

  return (
    <aside className="flex flex-col border-t border-base-200 p-6 lg:border-t-0 lg:border-l">
      <div className="flex items-start justify-between gap-3">
        <BrandName brand={post.brand} />
        <MoreMenu url={post.url} onCopy={notify} />
      </div>

      <h1 className="mt-4 text-[17px] leading-snug font-medium text-pretty text-base-900">
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="group">
          {post.hook || `${post.brand.name} on Instagram`}
          <ArrowUpRight className="ml-1 inline size-3.5 align-[-1px] text-base-500 transition-colors group-hover:text-base-900" />
        </a>
      </h1>
      <p className="mt-2 text-sm text-base-500">
        {formats[post.format]}
        {slides > 1 && ` · ${slides} slides`} · {longDate.format(new Date(post.postedAt))}
      </p>
      {(post.likes != null || post.comments != null) && (
        <p className="mt-1 text-sm text-base-500 tabular-nums">
          {post.likes != null && `${compact.format(post.likes)} likes`}
          {post.likes != null && post.comments != null && " · "}
          {post.comments != null && `${compact.format(post.comments)} comments`}
        </p>
      )}

      {post.caption && (
        <div className="mt-5">
          <p className={cx("text-sm leading-relaxed whitespace-pre-line text-base-600", !expanded && "line-clamp-5")}>{post.caption}</p>
          {post.caption.length > 220 && (
            <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-1.5 text-sm font-medium text-base-900">
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center gap-1.5 rounded-full bg-base-50 px-4 text-sm font-medium text-base-900 transition-[background-color,scale] duration-150 hover:bg-base-100 active:scale-[0.96]"
        >
          View on Instagram
          <ArrowUpRight className="size-3.5" />
        </a>
        <Link
          href={feedHref("For you", post.category.name)}
          className="flex h-9 items-center rounded-full px-4 text-sm text-base-600 ring-1 ring-base-200 transition-colors duration-150 hover:text-base-900"
        >
          {post.category.name}
        </Link>
      </div>

      <div className="mt-8">
        <p className="text-sm text-base-500">{savedIn.length ? `On ${savedIn.length === 1 ? "1 board" : `${savedIn.length} boards`}` : "Not on a board yet"}</p>
        {savedIn.length > 0 && (
          <ul className="mt-3 space-y-2">
            {savedIn.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl p-2 ring-1 ring-base-200">
                <BoardThumb board={b} className="size-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-base-900">{b.name}</p>
                  <p className="text-xs text-base-500 tabular-nums">
                    {b.items.length} {b.items.length === 1 ? "post" : "posts"}
                    {b.shared && " · Shared"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* The board picker and Save sit at the foot of the panel, like Cosmos */}
      <form
        className="mt-auto flex gap-2 pt-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (board) save(post.shortCode, board);
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Board</span>
          <select
            value={board}
            onChange={(event) => setBoard(event.target.value)}
            className="h-12 w-full truncate rounded-full border-0 bg-white pr-10 pl-5 text-base text-base-900 ring-1 ring-base-200 focus:ring-2 focus:ring-base-300"
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={!board || inChosen}
          className="h-12 shrink-0 rounded-full bg-base-900 px-6 text-base font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96] disabled:bg-base-100 disabled:text-base-500"
        >
          {inChosen ? "Saved" : "Save"}
        </button>
      </form>
    </aside>
  );
}

function MoreMenu({ url, onCopy }: { url: string; onCopy: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative -m-1 flex size-9 items-center justify-center rounded-full text-base-900 hover:bg-base-50"
      >
        <span aria-hidden="true" className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-[3px] rounded-full bg-current" />
          ))}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-52 origin-top-right animate-[menu-in_150ms_cubic-bezier(0.23,1,0.32,1)] rounded-2xl bg-white p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.3)] ring-1 ring-edge motion-reduce:animate-none"
        >
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(location.href);
                onCopy("Link copied");
              } catch {
                onCopy("Couldn’t copy the link");
              }
              setOpen(false);
            }}
            className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-base-900 hover:bg-base-50"
          >
            Copy link
          </button>
          <a
            role="menuitem"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-base-900 hover:bg-base-50"
          >
            Open on Instagram
            <ArrowUpRight className="size-3.5 text-base-500" />
          </a>
        </div>
      )}
    </div>
  );
}
