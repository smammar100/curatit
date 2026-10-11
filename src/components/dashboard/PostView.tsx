"use client";

// A post, opened over the feed: the "Closeup" direction, chosen from a five-way prototype on
// 2026-10-10 (after Pinterest's and Savee's closeups). The post sits large on a dark stage on
// the left; the panel on the right has the brand, the hook as its title, its public counts
// (ObservedEngagement, no benchmark), the creative breakdown (post-analysis/CreativeBreakdown, the
// "Spec sheet") and the slide breakdown (post-analysis/SlideBreakdown) when it has a published
// analysis, the caption, the boards it's on, and a board picker with Save at its foot. One slide
// index drives the stage, the arrows, the sequence bar and the slide rows, so they never disagree.
// Arrows at the window's edges step through the feed; Close (or Escape) goes back to it. From the feed this renders in the layout's @modal slot over the live feed (an intercepted
// route); opened from a link, the page puts the feed underneath, so both look the same.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Icons
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
import Close from "@/components/fundations/icons/Close";
import Play from "@/components/fundations/icons/Play";
import SealCheck from "@/components/fundations/icons/SealCheck";
// Components
import type { PublicAnalysis } from "@/lib/creative/publicView";
import type { PostDetail } from "@/lib/posts";
import { cx } from "@/lib/cx";
import { BoardThumb, NAME_MAX, useBoards } from "./boards";
import { boardHref } from "./BoardView";
import { feedHref } from "./Feed";
import { backToPage, postHref, ratio } from "./Grid";
import CreativeBreakdown from "./post-analysis/CreativeBreakdown";
import ObservedEngagement from "./post-analysis/ObservedEngagement";
import SlideBreakdown from "./post-analysis/SlideBreakdown";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// The page under the modal, which goes inert while it's open (the id is set in the dashboard layout)
const PAGE_ID = "dashboard-page";

export default function PostView({ post, analysis }: { post: PostDetail; analysis: PublicAnalysis | null }) {
  const router = useRouter();
  const { list } = useBoards();
  const dialogRef = useRef<HTMLDivElement>(null);
  const count = post.images.length;
  const [index, setIndex] = useState(0);
  const go = (next: number) => setIndex(Math.min(count - 1, Math.max(0, next)));

  // The posts either side of this one in the feed
  const at = list.findIndex((item) => item.shortCode === post.shortCode);
  const previous = at > 0 ? list[at - 1] : null;
  const next = at >= 0 && at < list.length - 1 ? list[at + 1] : null;

  const close = () => (backToPage() ? router.back() : router.push("/dashboard"));
  const closeRef = useRef(close);
  closeRef.current = close;

  // While open: the page underneath can't be scrolled, focused or read, focus moves into the
  // post (and back to what opened it after), Escape closes it and ← / → step through slides
  useEffect(() => {
    const page = document.getElementById(PAGE_ID);
    const opener = document.activeElement as HTMLElement | null;
    page?.setAttribute("inert", "");
    // Hiding the scrollbar would widen the page and reflow the grid behind, so pad it back
    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return closeRef.current();
      // A key something inside already handled. Next runs React from the document, the same node
      // as this listener, so stopPropagation can't keep the event from arriving here
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable || event.metaKey || event.ctrlKey) return;
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (event.key === "ArrowRight") setIndex((i) => Math.min(count - 1, i + 1));
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      page?.removeAttribute("inert");
      root.style.overflow = "";
      root.style.paddingRight = "";
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [count]);

  const r = ratio(post);
  const video = post.videos[index];
  // Read defensively: a page open across a deploy can briefly get an analysis shaped for newer code
  const role = analysis?.sequence?.roles?.[index] ?? analysis?.slides?.[index]?.role ?? null;
  const caption = useMemo(() => splitCaption(post), [post]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-title"
      tabIndex={-1}
      className="fixed inset-0 z-40 flex items-center justify-center p-3 outline-none sm:p-10 lg:px-24"
    >
      {/* The dimmed feed; a click on it closes the post */}
      <div aria-hidden="true" onClick={close} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="absolute top-5 right-5 z-10 flex size-11 items-center justify-center rounded-full bg-black/50 text-white transition-[background-color,scale] duration-150 hover:bg-white/20 active:scale-[0.96] lg:bg-white/10"
      >
        <Close className="size-4" />
      </button>
      {previous && <StepLink side="left" shortCode={previous.shortCode} />}
      {next && <StepLink side="right" shortCode={next.shortCode} />}

      <article className="relative grid h-full max-h-[54rem] w-full max-w-[76rem] grid-cols-[minmax(0,1fr)] overflow-y-auto rounded-[28px] bg-white shadow-2xl lg:grid-cols-[minmax(0,1fr)_27rem] lg:overflow-hidden">
        {/* The post */}
        <div className="relative flex h-[62dvh] items-center justify-center bg-black p-6 sm:p-10 lg:h-auto">
          <div className="relative h-full max-h-full max-w-full" style={{ aspectRatio: r }}>
            <Image
              key={post.images[index]}
              src={post.images[index]}
              alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority
              className="object-contain"
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 text-caption text-white">
            {count > 1 && (
              <p className="rounded-full bg-black/60 px-2.5 py-1 tabular-nums" aria-live="polite">
                {index + 1} / {count}
                {role && ` · ${role}`}
              </p>
            )}
            {video && (
              <p className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1" title="A video on Instagram; the library keeps its cover frame">
                <Play className="size-3" />
                Video cover
              </p>
            )}
          </div>
          {count > 1 && (
            <>
              <SlideButton side="left" disabled={index === 0} onClick={() => go(index - 1)} />
              <SlideButton side="right" disabled={index === count - 1} onClick={() => go(index + 1)} />
            </>
          )}
        </div>

        {/* The panel */}
        <div className="flex flex-col lg:min-h-0">
          <header className="flex items-center gap-3.5 px-6 pt-6 pb-5">
            <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-100 text-title font-medium text-base-700 outline-1 -outline-offset-1 outline-edge">
              {post.brand.logo ? <Image src={post.brand.logo} alt="" fill sizes="48px" className="object-cover" /> : post.brand.name[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-title font-medium text-base-900">
                <span className="truncate">{post.brand.name}</span>
                {post.verified && <SealCheck className="size-4 shrink-0" aria-label="Verified" />}
              </p>
              <p className="mt-0.5 truncate text-body text-base-500">
                {post.handle && <>@{post.handle} · </>}
                <Link href={feedHref("For you", post.category.name)} className="hover:text-base-900">
                  {post.category.name}
                </Link>
              </p>
            </div>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-base-50 pr-3 pl-3.5 text-body font-medium text-base-900 transition-[background-color,scale] duration-150 hover:bg-base-100 active:scale-[0.96]"
            >
              Instagram
              <ArrowUpRight className="size-3.5" />
            </a>
          </header>

          <div className="px-6 pb-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <h1 id="post-title" className="font-display text-display font-light text-pretty text-base-900">
              {caption.title}
            </h1>
            <p className="mt-2 text-body text-base-500">Posted {day.format(new Date(post.postedAt))}</p>
            <Section title="Observed engagement">
              <ObservedEngagement likes={post.likes} comments={post.comments} />
            </Section>
            {analysis ? (
              <>
                <Section title="Creative breakdown">
                  <CreativeBreakdown analysis={analysis} index={index} onSlide={go} videos={post.videos} source={{ brand: post.brand.name, url: post.url }} />
                </Section>
                {count > 1 && analysis.slides.some(Boolean) && (
                  <Section title="Slide breakdown">
                    <SlideBreakdown analysis={analysis} index={index} onSlide={go} images={post.images} videos={post.videos} />
                  </Section>
                )}
                {caption.body.length > 0 && (
                  <Section title="Caption">
                    <Caption paragraphs={caption.body} />
                  </Section>
                )}
              </>
            ) : (
              <>
                {caption.body.length > 0 && (
                  <Section title="Caption">
                    <Caption paragraphs={caption.body} />
                  </Section>
                )}
                <Section title="Creative breakdown">
                  <p className="text-body text-pretty text-base-500">Not available for this post yet.</p>
                </Section>
              </>
            )}
            <Section title="Boards">
              <BoardsOn post={post} />
            </Section>
          </div>

          <footer className="sticky bottom-0 border-t border-base-100 bg-white p-4">
            <SaveForm post={post} />
          </footer>
        </div>
      </article>
    </div>
  );
}

// The previous or next post in the feed, at the window's edge. It replaces the address rather
// than adding to it, so Back still closes the post instead of stepping through every one seen.
function StepLink({ side, shortCode }: { side: "left" | "right"; shortCode: string }) {
  const Caret = side === "left" ? CaretLeft : CaretRight;
  return (
    <Link
      href={postHref(shortCode)}
      replace
      scroll={false}
      aria-label={side === "left" ? "Previous post" : "Next post"}
      className={cx(
        "absolute top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-[background-color,scale] duration-150 hover:bg-white/20 active:scale-[0.96] lg:flex",
        side === "left" ? "left-5" : "right-5",
      )}
    >
      <Caret className="size-5" />
    </Link>
  );
}

function SlideButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  const Caret = side === "left" ? CaretLeft : CaretRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-base-900 transition-[opacity,scale] duration-150 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-0",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Caret className="size-4" />
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 border-t border-base-100 pt-5">
      <h2 className="mb-3 text-caption font-medium text-base-500">{title}</h2>
      {children}
    </section>
  );
}

// The title and the body: the caption's first sentence (whole, up to 160 characters; the
// feed's hook is cut at 90) and the rest of it in paragraphs, without Instagram's spacer lines
// ("." or "·" on their own)
const TITLE_MAX = 160;
function splitCaption(post: PostDetail) {
  const paragraphs = (text: string) =>
    text
      .split(/\n\s*\n/)
      .map((paragraph) =>
        paragraph
          .split("\n")
          .filter((line) => !/^\s*[.·•\-_]?\s*$/.test(line))
          .join("\n")
          .trim(),
      )
      .filter(Boolean);
  const [first, ...rest] = post.caption.split("\n");
  const line = first.replace(/\s+/g, " ").trim();
  const sentence = line.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? line;
  if (sentence && sentence.length <= TITLE_MAX) {
    return { title: sentence, body: paragraphs([line.slice(sentence.length).trim(), ...rest].join("\n")) };
  }
  return { title: post.hook || `${post.brand.name} on Instagram`, body: paragraphs(post.caption) };
}

// The rest of the caption after the title, with @mentions and #hashtags as links, clamped until
// "Show more"
function Caption({ paragraphs }: { paragraphs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [clipped, setClipped] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, paragraphs]);

  if (!paragraphs.length) return null;
  return (
    <div>
      <div ref={ref} className={cx("space-y-3 text-subtitle text-pretty text-base-700", !open && "line-clamp-6")}>
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {linkify(paragraph)}
          </p>
        ))}
      </div>
      {(clipped || open) && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 text-body font-medium text-base-900 hover:underline">
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

// @handle (not inside an email address) and #tag, as links to Instagram
const TOKEN = /(?<![\w@])@([A-Za-z0-9_](?:[A-Za-z0-9_.]*[A-Za-z0-9_])?)|(?<![\w#&])#([\p{L}\p{N}_]+)/gu;

function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [token, handle, tag] = match;
    out.push(text.slice(last, match.index));
    const href = handle ? `https://www.instagram.com/${handle}/` : `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;
    out.push(
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-base-900 underline-offset-2 hover:underline">
        {token}
      </a>,
    );
    last = match.index + token.length;
  }
  out.push(text.slice(last));
  return out;
}

// The boards this post is on, each with a way to take it off
function BoardsOn({ post }: { post: PostDetail }) {
  const { boards, status, remove } = useBoards();
  const on = boards.filter((b) => b.items.some((item) => item.post === post.shortCode));
  if (status === "loading") return <p className="text-body text-base-500">Loading your boards…</p>;
  return (
    <>
      <p className="text-body text-base-500">{on.length ? `On ${on.length === 1 ? "1 board" : `${on.length} boards`}` : "Not on a board yet"}</p>
      {on.length > 0 && (
        <ul className="mt-3 space-y-2">
          {on.map((b) => (
            <li key={b.id} className="flex items-center gap-3 rounded-xl p-2 ring-1 ring-base-200">
              <Link href={boardHref(b.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:text-accent-600">
                <BoardThumb board={b} className="size-9" />
                <div className="min-w-0">
                  <p className="truncate text-body font-medium">{b.name}</p>
                  <p className="text-caption text-base-500 tabular-nums">
                    {b.items.length} {b.items.length === 1 ? "post" : "posts"}
                    {b.shareToken && " · Shared"}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => remove(post.shortCode, b.id)}
                aria-label={`Remove from ${b.name}`}
                className="relative flex size-8 shrink-0 items-center justify-center rounded-full text-base-500 transition-[background-color,color,scale] duration-150 before:absolute before:-inset-1 hover:bg-base-50 hover:text-base-900 active:scale-[0.96]"
              >
                <Close className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// The board picker and Save, at the foot of the panel like Cosmos. "New board…" swaps the
// picker for a name field (and is all there is before the first board), and Save then makes
// the board with this post on it.
const NEW = "new";

function SaveForm({ post }: { post: PostDetail }) {
  const { boards, status, save, createBoard } = useBoards();
  const [choice, setChoice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const board = choice ?? boards[0]?.id ?? NEW;
  const naming = status !== "loading" && board === NEW;
  const inChosen = boards.some((b) => b.id === board && b.items.some((item) => item.post === post.shortCode));

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (naming) {
          const trimmed = name.trim();
          if (!trimmed) return;
          setChoice(createBoard(trimmed, { firstPost: post.shortCode }));
          setName("");
        } else if (board) save(post.shortCode, board);
      }}
    >
      {naming ? (
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">New board name</span>
          <input
            autoFocus={choice === NEW}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={NAME_MAX}
            placeholder={boards.length ? "Name the new board" : "Name your first board"}
            className="h-12 w-full rounded-full border-0 bg-base-50 pr-10 pl-5 text-body pointer-coarse:text-[16px] text-base-900 placeholder:text-base-400 focus:ring-2 focus:ring-base-300"
          />
          {boards.length > 0 && (
            <button
              type="button"
              onClick={() => setChoice(null)}
              aria-label="Back to your boards"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-base-500 hover:bg-base-100 hover:text-base-900"
            >
              <Close className="size-3.5" />
            </button>
          )}
        </label>
      ) : (
        <label className="min-w-0 flex-1">
          <span className="sr-only">Board</span>
          <select
            value={status === "loading" ? "" : board}
            disabled={status === "loading"}
            onChange={(event) => setChoice(event.target.value)}
            className="h-12 w-full truncate rounded-full border-0 bg-base-50 pr-10 pl-5 text-body pointer-coarse:text-[16px] text-base-900 focus:ring-2 focus:ring-base-300 disabled:text-base-500"
          >
            {status === "loading" && <option value="">Loading boards…</option>}
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            <option value={NEW}>New board…</option>
          </select>
        </label>
      )}
      <button
        type="submit"
        disabled={status === "loading" || (naming ? !name.trim() : inChosen)}
        className="h-12 shrink-0 rounded-full bg-base-900 px-6 text-subtitle font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96] disabled:bg-base-100 disabled:text-base-500"
      >
        {inChosen && !naming ? "Saved" : "Save"}
      </button>
    </form>
  );
}
