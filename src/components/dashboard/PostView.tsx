"use client";

// A post, opened over the feed as a page: the "Card" direction, chosen from a five-way prototype
// on 2026-10-23 (after lafys.com's detail page, which the owner shared; the others were a
// three-column Studio, Pinterest's pin page, Dribbble's shot page and a Savee-style Inspector).
// It replaced the 2026-10-10 "Closeup" dialog (a centred card over the dimmed feed, the post on a
// black stage beside a 27rem panel). A slim app bar (Library, the lockup, the feed's previous and
// next post, Close) over two columns: the post large on a grey mat on the left, sticky while the
// right column scrolls, its slides as thumbnails under it; on the right one ruled card (the hook as
// the title with the rest of the caption, the brand, the board picker and Save, the strategy's
// traits and the post's categories as chips, the observed counts, the boards it's on), then the
// creative breakdown (post-analysis/CreativeBreakdown, the "Document" direction) and the slide
// breakdown (post-analysis/SlideBreakdown) as cards of their own when it has a published analysis.
// One slide index drives the stage, the arrows, the thumbnails, the sequence bar and the slide
// rows, so they never disagree. Close (or Escape) goes back to the feed. From the feed this
// renders in the layout's @modal slot over the live feed (an intercepted route); opened from a
// link, the page puts the feed underneath, so both look the same.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Icons
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
import ChatCircle from "@/components/fundations/icons/ChatCircle";
import Close from "@/components/fundations/icons/Close";
import Heart from "@/components/fundations/icons/Heart";
import Play from "@/components/fundations/icons/Play";
import SealCheck from "@/components/fundations/icons/SealCheck";
// Components
import Lockup from "@/components/assets/Lockup";
import Avatar from "@/components/fundations/elements/Avatar";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import type { PublicAnalysis } from "@/lib/creative/publicView";
import { fontWeights } from "@/lib/font-weight";
import type { PostDetail } from "@/lib/posts";
import { cx } from "@/lib/cx";
import { BoardThumb, NAME_MAX, useBoards } from "./boards";
import { boardHref } from "./BoardView";
import { feedHref } from "./Feed";
import { backToPage, postHref, ratio } from "./Grid";
import CreativeBreakdown, { traits } from "./post-analysis/CreativeBreakdown";
import { countLabel } from "./post-analysis/ObservedEngagement";
import SlideBreakdown from "./post-analysis/SlideBreakdown";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const semibold = { fontVariationSettings: fontWeights.semibold };

// The page under the post, which goes inert while it's open (the id is set in the dashboard layout)
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
  const source = { brand: post.brand.name, shortCode: post.shortCode, url: post.url, format: post.format, slides: post.images.length, images: post.images, videos: post.videos, width: post.width, height: post.height };

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="post-title" tabIndex={-1} className="fixed inset-0 z-40 overflow-y-auto bg-page text-body text-foreground outline-none">
      {/* The app bar: back to the feed, the lockup, the feed's neighbours and Close */}
      <header className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8">
        <div>
          <Button variant="secondary" size="sm" leftIcon={<CaretLeft className="size-3.5" />} onClick={close}>
            Library
          </Button>
        </div>
        <Lockup />
        <div className="flex items-center justify-end gap-1.5">
          <StepLink side="left" shortCode={previous?.shortCode} />
          <StepLink side="right" shortCode={next?.shortCode} />
          <Button variant="secondary" iconOnly aria-label="Close" onClick={close}>
            <Close className="size-3.5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[96rem] grid-cols-1 gap-6 px-4 pt-2 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-10 lg:pt-4">
        {/* The post, sticky while the column beside it scrolls */}
        <div className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <div className="relative flex items-center justify-center overflow-hidden rounded-[24px] bg-muted p-4 shadow-surface-1 sm:p-8 lg:h-[calc(100dvh-10rem)]">
            <div className="relative h-full max-h-full w-full max-w-full" style={{ aspectRatio: r, maxWidth: `calc((100dvh - 14rem) * (${r}))` }}>
              <Image
                key={post.images[index]}
                src={post.images[index]}
                alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority
                className="rounded-[12px] object-contain"
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5 text-caption">
              {count > 1 && (
                <p className="rounded-full bg-[var(--foreground)] px-2.5 py-1 text-[var(--background)] tabular-nums" aria-live="polite">
                  {index + 1} / {count}
                  {role && <span className="opacity-70"> · {role}</span>}
                </p>
              )}
              {video && (
                <p className="flex items-center gap-1 rounded-full bg-[var(--foreground)] px-2.5 py-1 text-[var(--background)]" title="A video on Instagram; the library keeps its cover frame">
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
          {/* Under the stage: the slide count as a quiet chip and every slide as a thumbnail */}
          <div className="mt-3 flex items-center gap-3 overflow-x-auto [scrollbar-width:none]">
            <Badge variant="outline" className="shrink-0 font-mono tracking-[0.08em] uppercase">
              {count} {count === 1 ? "slide" : "slides"}
            </Badge>
            {count > 1 && (
              <ol className="flex gap-1.5">
                {post.images.map((src, i) => (
                  <li key={src}>
                    <button
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      aria-pressed={i === index}
                      onClick={() => go(i)}
                      className={cx(
                        "relative block size-11 overflow-hidden rounded-[10px] transition-opacity duration-150 ease-out-quint focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
                        i === index ? "ring-2 ring-foreground" : "opacity-60 ring-1 ring-border hover:opacity-100",
                      )}
                    >
                      <Image src={src} alt="" fill sizes="44px" className="object-cover" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {/* The card: one cell per thing, ruled apart */}
          <section className="divide-y divide-border rounded-[24px] bg-surface-3 shadow-surface-2">
            <div className="p-5">
              <h1 id="post-title" className="font-display text-[22px] leading-7 text-balance text-foreground">
                {caption.title}
              </h1>
              {/* The rest of the caption reads on from the title (2026-10-13, at the person's request) */}
              {caption.body.length > 0 && (
                <div className="mt-2.5">
                  <Caption paragraphs={caption.body} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <Avatar src={post.brand.logo} name={post.brand.name} size="md" decorative />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-foreground" style={semibold}>
                  <span className="truncate">{post.brand.name}</span>
                  {post.verified && <SealCheck className="size-3.5 shrink-0 text-muted-foreground" aria-label="Verified" />}
                </p>
                <p className="truncate text-caption text-muted-foreground">
                  {post.handle && <>@{post.handle} · </>}
                  {day.format(new Date(post.postedAt))}
                </p>
              </div>
              <Button variant="transparent" size="sm" isLink href={post.url} target="_blank" rel="noopener noreferrer" rightIcon={<ArrowUpRight className="size-3.5" />}>
                Instagram
              </Button>
            </div>
            <div className="p-5">
              <SaveForm post={post} />
            </div>
            {analysis && traits(analysis).length > 0 && (
              <Cell label="Traits">
                <ul className="flex flex-wrap gap-1.5">
                  {traits(analysis).map((trait) => (
                    <li key={trait.label}>
                      <Badge>
                        <span className="text-muted-foreground">{trait.label}</span>
                        <span className="ml-1" style={semibold}>
                          {trait.value}
                        </span>
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Cell>
            )}
            <Cell label="Categories">
              {/* The main category, then any extra ones; each opens Discover on it */}
              <ul className="flex flex-wrap gap-1.5">
                {post.categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={feedHref("Discover", "", category.slug)} className="block rounded-full focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]">
                      <Badge variant="outline" className="font-mono">
                        <span className="text-muted-foreground">#</span>
                        {category.name}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Cell>
            <Cell label="Observed">
              {/* The public counts as scraped, and nothing more: no ratio against the brand's average
                  or rank in the category (too few posts a brand for a fair benchmark) */}
              <dl className="flex flex-wrap gap-x-5 gap-y-1 text-body text-foreground">
                <div className="flex items-center gap-1.5">
                  <Heart className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <dt className="sr-only">Likes</dt>
                  <dd className="tabular-nums" style={semibold}>
                    {countLabel(post.likes)}
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <ChatCircle className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <dt className="sr-only">Comments</dt>
                  <dd className="tabular-nums" style={semibold}>
                    {countLabel(post.comments)}
                  </dd>
                </div>
              </dl>
              <p className="mt-1.5 text-caption text-muted-foreground">As scraped. Not a verdict on whether it worked.</p>
            </Cell>
            <Cell label="Boards">
              <BoardsOn post={post} />
            </Cell>
          </section>

          {/* The breakdown, then the slides */}
          {analysis ? (
            <>
              <section aria-label="Creative breakdown" className="rounded-[24px] bg-surface-3 px-6 pb-5 shadow-surface-2">
                <CreativeBreakdown analysis={analysis} index={index} onSlide={go} videos={post.videos} source={source} />
              </section>
              {count > 1 && analysis.slides.some(Boolean) && (
                <section aria-labelledby="slides-heading" className="rounded-[24px] bg-surface-3 p-5 shadow-surface-2">
                  <h2 id="slides-heading" className="mb-3 text-subtitle text-foreground" style={semibold}>
                    Slide breakdown
                  </h2>
                  <SlideBreakdown analysis={analysis} index={index} onSlide={go} images={post.images} videos={post.videos} />
                </section>
              )}
            </>
          ) : (
            <p className="px-5 text-caption text-muted-foreground">No creative breakdown for this post yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

// One cell of the card: a small label over its content
function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="p-5">
      <p className="mb-2.5 text-micro tracking-[0.08em] text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  );
}

// The previous or next post in the feed, in the app bar. It replaces the address rather than
// adding to it, so Back still closes the post instead of stepping through every one seen.
// A plain next/link rather than Button isLink: the step needs Link's `replace` and `scroll`,
// which Button's link form doesn't pass through; styled as the bar's other secondary buttons
function StepLink({ side, shortCode }: { side: "left" | "right"; shortCode?: string }) {
  const Caret = side === "left" ? CaretLeft : CaretRight;
  const label = side === "left" ? "Previous post" : "Next post";
  const cls = "flex size-7 items-center justify-center rounded-full bg-muted text-foreground transition-colors duration-150 ease-out-quint hover:bg-hover focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]";
  if (!shortCode) {
    return (
      <span aria-label={label} aria-disabled="true" className={cx(cls, "opacity-40")}>
        <Caret className="size-3.5" />
      </span>
    );
  }
  return (
    <Link href={postHref(shortCode)} replace scroll={false} aria-label={label} className={cls}>
      <Caret className="size-3.5" />
    </Link>
  );
}

// The slide arrows on the stage. The wrapper places them and fades one out at either end
function SlideButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  const Caret = side === "left" ? CaretLeft : CaretRight;
  return (
    <div className={cx("absolute top-1/2 -translate-y-1/2 transition-opacity duration-150 ease-out-quint", side === "left" ? "left-3" : "right-3", disabled && "pointer-events-none opacity-0")}>
      <Button variant="secondary" iconOnly aria-label={side === "left" ? "Previous slide" : "Next slide"} disabled={disabled} onClick={onClick}>
        <Caret className="size-3.5" />
      </Button>
    </div>
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

// The rest of the caption after the title, with @mentions and #hashtags as links, clamped to three
// lines under the title until "Show more"
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
      <div ref={ref} className={cx("space-y-2 text-body text-pretty text-muted-foreground", !open && "line-clamp-3")}>
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {linkify(paragraph)}
          </p>
        ))}
      </div>
      {(clipped || open) && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1.5 text-caption text-foreground hover:underline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]" style={semibold}>
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
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className="text-foreground underline-offset-2 hover:underline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]" style={semibold}>
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
  if (status === "loading") return <p className="text-body text-muted-foreground">Loading your boards…</p>;
  return (
    <>
      <p className="text-body text-muted-foreground">{on.length ? `On ${on.length === 1 ? "1 board" : `${on.length} boards`}` : "Not on a board yet"}</p>
      {on.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {on.map((b) => (
            <li key={b.id} className="flex items-center gap-3 rounded-[14px] bg-muted p-2 shadow-surface-1">
              <Link href={boardHref(b.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-[10px] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]">
                <BoardThumb board={b} className="size-8" />
                <div className="min-w-0">
                  <p className="truncate text-body text-foreground" style={semibold}>
                    {b.name}
                  </p>
                  <p className="text-caption text-muted-foreground tabular-nums">
                    {b.items.length} {b.items.length === 1 ? "post" : "posts"}
                    {b.shareToken && " · Shared"}
                  </p>
                </div>
              </Link>
              <Button variant="transparent" size="sm" iconOnly onClick={() => remove(post.shortCode, b.id)} aria-label={`Remove from ${b.name}`}>
                <Close className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// The board picker and Save, in the card's third cell like lafys.com's one primary action.
// "New board…" swaps the picker for a name field (and is all there is before the first board),
// and Save then makes the board with this post on it. The picker is a native <select> (a value
// in a form, which Menu's own notes leave to the browser; there's no Select atom yet), set as the
// system's field (28px pill, the one stroke, the brand ring on focus) so it matches the Input.
const NEW = "new";
const fieldClass =
  "h-7 w-full rounded-full border-0 bg-transparent pr-8 pl-3 text-body pointer-coarse:text-[16px] text-foreground ring-1 ring-border transition-[box-shadow,background-color] duration-150 ease-out-quint hover:bg-hover focus:bg-surface-3 focus:ring-[var(--focus-ring)] focus:outline-hidden disabled:text-muted-foreground";

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
        if (inChosen && !naming) return;
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
          <input autoFocus={choice === NEW} value={name} onChange={(event) => setName(event.target.value)} maxLength={NAME_MAX} placeholder={boards.length ? "Name the new board" : "Name your first board"} className={cx(fieldClass, "placeholder:text-muted-foreground")} />
          {boards.length > 0 && (
            <span className="absolute top-1/2 right-0 -translate-y-1/2">
              <Button variant="transparent" size="sm" iconOnly onClick={() => setChoice(null)} aria-label="Back to your boards">
                <Close className="size-3.5" />
              </Button>
            </span>
          )}
        </label>
      ) : (
        <label className="min-w-0 flex-1">
          <span className="sr-only">Board</span>
          <select value={status === "loading" ? "" : board} disabled={status === "loading"} onChange={(event) => setChoice(event.target.value)} className={cx(fieldClass, "truncate")}>
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
      {/* "Saved" is a confirmation, not a dead control: it stays legible on a quiet grey fill
          and is only aria-disabled (the submit above ignores it); loading and an empty name
          still disable Save outright */}
      {inChosen && !naming ? (
        <Button type="submit" variant="muted" aria-disabled className="aria-disabled:cursor-default">
          Saved
        </Button>
      ) : (
        <Button type="submit" disabled={status === "loading" || (naming && !name.trim())}>
          Save
        </Button>
      )}
    </form>
  );
}
