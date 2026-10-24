"use client";

// A post, opened over the feed as a page: the "Card" direction, chosen from a five-way prototype
// on 2026-10-23 (after lafys.com's detail page, which the owner shared; the others were a
// three-column Studio, Pinterest's pin page, Dribbble's shot page and a Savee-style Inspector).
// It replaced the 2026-10-10 "Closeup" dialog (a centred card over the dimmed feed, the post on a
// black stage beside a 27rem panel). A slim app bar (Library, the lockup, the feed's previous and
// next post, Close) over two columns: the post large on a grey mat on the left, sticky while the
// right column scrolls, its slides as thumbnails under it; on the right one ruled card (the hook as
// the title with the rest of the caption, the brand, the board picker and Save, the strategy's
// traits and the post's categories, the observed counts; the list of the boards a post is on was
// taken out on 2026-10-24 at the owner's request), then the creative
// breakdown (post-analysis/CreativeBreakdown) and the slide breakdown (post-analysis/SlideBreakdown)
// as cards of their own when it has a published analysis.
// One slide index drives the stage, the arrows, the thumbnails, the sequence bar and the slide
// rows, so they never disagree. Close (or Escape) goes back to the feed. From the feed this
// renders in the layout's @modal slot over the live feed (an intercepted route); opened from a
// link, the page puts the feed underneath, so both look the same.
// Since 2026-10-24 it is built from Glaze: Buttons in the app bar and on the stage, the cards
// Glaze's Card (shell and panel, the cells split on its row rule), the traits Badges, the
// categories secondary Buttons that link to Discover, and the board picker a Select beside an
// Input.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import Lockup from "@/components/assets/Lockup";
import { ArrowUpRight, ChatCircle, ChevronLeft, ChevronRight, Close, Heart, Icon, Play, SealCheck } from "@/components/glaze/icon";
import { Avatar } from "@/components/glaze/ui/avatar";
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
import { Card, CardContent } from "@/components/glaze/ui/card";
import { Input, InputAction } from "@/components/glaze/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/glaze/ui/select";
import type { PublicAnalysis } from "@/lib/creative/publicView";
import { cn } from "@/lib/glaze/utils";
import type { PostDetail } from "@/lib/posts";
import { NAME_MAX, useBoards } from "./boards";
import { feedHref } from "./Feed";
import { backToPage, postHref, ratio } from "./Grid";
import CreativeBreakdown, { traits } from "./post-analysis/CreativeBreakdown";
import { countLabel } from "./post-analysis/ObservedEngagement";
import SlideBreakdown from "./post-analysis/SlideBreakdown";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// The page under the post, which goes inert while it's open (the id is set in the dashboard layout)
const PAGE_ID = "dashboard-page";

export default function PostView({ post, analysis }: { post: PostDetail; analysis: PublicAnalysis | null }) {
  const router = useRouter();
  const { list } = useBoards();
  const dialogRef = useRef<HTMLDivElement>(null);
  const count = post.images.length;
  const [index, setIndex] = useState(0);
  const go = (next: number) => setIndex(Math.min(count - 1, Math.max(0, next)));
  // Keeps the slide on stage in view in the indicator row, scrolling the row alone (never the page)
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector<HTMLElement>(`[data-slide="${index}"]`);
    if (!strip || !thumb || strip.scrollWidth <= strip.clientWidth) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: still ? "auto" : "smooth" });
  }, [index]);

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
  // The frame is the feed's (Feed and Header): a 92px bar (5.75rem), 8px down to the content, 24px
  // gutters from sm. From lg the stage takes the rest of the window less 16px at the foot (7.25rem),
  // and the image keeps the post's shape inside it, its width capped by the height left after the
  // stage's 32px padding each way (11.25rem) and the slide row under it
  const below = count > 1 ? "5.25rem" : video ? "2rem" : "0rem";
  const stage = { "--stage-h": "calc(100dvh - 7.25rem)", "--ratio": String(r), "--stage-w": `min(100%, calc((100dvh - 11.25rem - ${below}) * ${r}))` } as CSSProperties;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="post-title" tabIndex={-1} style={stage} className="fixed inset-0 z-(--z-overlay) overflow-y-auto bg-page type-body-sm text-text-1">
      {/* The app bar: back to the feed, the lockup, the feed's neighbours and Close. It stays at the
          top while the details scroll, so the stage under it can keep the window's full height */}
      <header className="sticky top-0 z-10 flex h-23 items-center bg-page px-4 sm:px-6">
        <div className="flex-1">
          <Button variant="secondary" size="lg" onClick={close}>
            <Icon icon={ChevronLeft} />
            Library
          </Button>
        </div>
        <Lockup />
        <div className="flex flex-1 items-center justify-end gap-1.5">
          <StepLink side="left" shortCode={previous?.shortCode} />
          <StepLink side="right" shortCode={next?.shortCode} />
          <Button variant="secondary" size="icon-lg" aria-label="Close" onClick={close}>
            <Icon icon={Close} />
          </Button>
        </div>
      </header>

      <main className="flex flex-col gap-6 px-4 pt-2 pb-16 sm:px-6 lg:flex-row lg:items-start lg:gap-10">
        {/* The post, sticky while the column beside it scrolls */}
        <div className="min-w-0 flex-1 lg:sticky lg:top-25">
          {/* The stage: the post on a grey mat, the slide arrows at its sides, and under the image (never
              over it) where you are in the carousel: the slides themselves as the indicator, small at
              the post's shape, the one on stage in full with an ink ring and the rest dimmed until
              pointed at (the row scrolls sideways when they don't fit), and the slide's number and role */}
          <div className="relative flex flex-col items-center overflow-hidden rounded-(--radius-float) bg-shell p-4 sm:p-8 lg:h-(--stage-h)">
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <div className="relative aspect-(--ratio) h-full max-h-full w-full max-w-(--stage-w)">
                <Image
                  key={post.images[index]}
                  src={post.images[index]}
                  alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  priority
                  className="rounded-(--radius-nested) object-contain"
                />
              </div>
            </div>
            {(count > 1 || video) && (
              <div className="mt-3 flex w-full flex-col items-center gap-1.5">
                {count > 1 && (
                  <div ref={stripRef} role="group" aria-label="Slides" className="relative flex max-w-full gap-1.5 overflow-x-auto p-1 [scrollbar-width:none]">
                    {post.images.map((src, i) => (
                      <ButtonPrimitive
                        key={src}
                        data-slide={i}
                        aria-label={`Slide ${i + 1}`}
                        aria-pressed={i === index}
                        onClick={() => go(i)}
                        className={cn(
                          "relative block aspect-(--ratio) w-8 shrink-0 overflow-hidden rounded-(--radius-nested) bg-field transition-opacity duration-(--dur-state) ease-out",
                          i === index ? "outline-2 outline-offset-2 outline-ink" : "opacity-45 hover:opacity-100",
                        )}
                      >
                        <Image src={src} alt="" fill sizes="32px" className="object-cover" />
                      </ButtonPrimitive>
                    ))}
                  </div>
                )}
                <p className="max-w-full truncate type-caption text-text-2" aria-live="polite">
                  {count > 1 && (
                    <>
                      <span className="data font-medium text-text-1">{index + 1}</span> of <span className="data">{count}</span>
                      {role && <span className="text-text-1"> · {role}</span>}
                    </>
                  )}
                  {video && (
                    <span title="A video on Instagram; the library keeps its cover frame">
                      {count > 1 && " · "}
                      <Icon icon={Play} size={12} className="inline align-text-bottom" /> Video cover
                    </span>
                  )}
                </p>
              </div>
            )}
            {count > 1 && (
              <>
                <SlideButton side="left" disabled={index === 0} onClick={() => go(index - 1)} />
                <SlideButton side="right" disabled={index === count - 1} onClick={() => go(index + 1)} />
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:w-104 lg:shrink-0">
          {/* The card: one cell per thing, ruled apart */}
          <Card>
            <CardContent flush>
              <div className="rule-row p-4">
                <h1 id="post-title" className="type-title text-balance text-text-1">
                  {caption.title}
                </h1>
                {/* The rest of the caption reads on from the title (2026-10-13, at the person's request) */}
                {caption.body.length > 0 && (
                  <div className="mt-2.5">
                    <Caption paragraphs={caption.body} />
                  </div>
                )}
              </div>
              <div className="rule-row flex items-center gap-3 px-4 py-3">
                <Avatar src={post.brand.logo ?? undefined} name={post.brand.name} size="lg" decorative />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 type-label text-text-1">
                    <span className="truncate">{post.brand.name}</span>
                    {post.verified && <Icon icon={SealCheck} label="Verified" className="text-text-2" />}
                  </p>
                  <p className="truncate type-caption text-text-2">
                    {post.handle && <>@{post.handle} · </>}
                    {day.format(new Date(post.postedAt))}
                  </p>
                </div>
                <Button variant="ghost" size="sm" render={<a href={post.url} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
                  Instagram
                  <Icon icon={ArrowUpRight} />
                </Button>
              </div>
              <div className="rule-row p-4">
                <SaveForm post={post} />
              </div>
              <Cell label="Observed">
                {/* The public counts as scraped, and nothing more: no ratio against the brand's average
                    or rank in the category (too few posts a brand for a fair benchmark) */}
                <dl className="flex flex-wrap gap-x-5 gap-y-1 type-body-sm text-text-1">
                  <div className="flex items-center gap-1.5">
                    <Icon icon={Heart} className="text-text-2" />
                    <dt className="sr-only">Likes</dt>
                    <dd className="data font-medium">{countLabel(post.likes)}</dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon icon={ChatCircle} className="text-text-2" />
                    <dt className="sr-only">Comments</dt>
                    <dd className="data font-medium">{countLabel(post.comments)}</dd>
                  </div>
                </dl>
                <p className="mt-1.5 type-caption text-text-2">As scraped. Not a verdict on whether it worked.</p>
              </Cell>
              {analysis && traits(analysis).length > 0 && (
                <Cell label="Traits">
                  <ul className="flex flex-wrap gap-1.5">
                    {traits(analysis).map((trait) => (
                      <li key={trait.label}>
                        <Badge>
                          <span className="text-text-2">{trait.label}</span>
                          {trait.value}
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
                      <Button variant="secondary" size="sm" render={<Link href={feedHref("Discover", "", category.slug)} />} nativeButton={false}>
                        <span className="text-text-3">#</span>
                        {category.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              </Cell>
            </CardContent>
          </Card>

          {/* The breakdown, then the slides */}
          {analysis ? (
            <>
              <Card role="region" aria-label="Creative breakdown">
                <CardContent className="px-4 pt-0 pb-4">
                  <CreativeBreakdown analysis={analysis} index={index} onSlide={go} videos={post.videos} source={source} />
                </CardContent>
              </Card>
              {count > 1 && analysis.slides.some(Boolean) && (
                <Card role="region" aria-labelledby="slides-heading">
                  <CardContent className="p-4">
                    <h2 id="slides-heading" className="type-heading-sm text-text-1">
                      Slide breakdown
                    </h2>
                    <SlideBreakdown analysis={analysis} index={index} onSlide={go} images={post.images} videos={post.videos} />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="px-4 type-caption text-text-2">No creative breakdown for this post yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

// One cell of the card: its name over its content
function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rule-row p-4">
      <p className="mb-2 type-label-sm text-text-2">{label}</p>
      {children}
    </div>
  );
}

// The previous or next post in the feed, in the app bar. It replaces the address rather than
// adding to it, so Back still closes the post instead of stepping through every one seen. At
// either end of the feed it's a disabled button
function StepLink({ side, shortCode }: { side: "left" | "right"; shortCode?: string }) {
  const caret = side === "left" ? ChevronLeft : ChevronRight;
  const label = side === "left" ? "Previous post" : "Next post";
  if (!shortCode) {
    return (
      <Button variant="secondary" size="icon-lg" aria-label={label} disabled>
        <Icon icon={caret} />
      </Button>
    );
  }
  return (
    <Button variant="secondary" size="icon-lg" aria-label={label} render={<Link href={postHref(shortCode)} replace scroll={false} />} nativeButton={false}>
      <Icon icon={caret} />
    </Button>
  );
}

// The slide arrows on the stage. The wrapper places them and fades one out at either end
function SlideButton({ side, disabled, onClick }: { side: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <div className={cn("absolute top-1/2 -translate-y-1/2 transition-opacity duration-(--dur-state) ease-out", side === "left" ? "left-3" : "right-3", disabled && "pointer-events-none opacity-0")}>
      <Button variant="secondary" size="icon" aria-label={side === "left" ? "Previous slide" : "Next slide"} disabled={disabled} onClick={onClick}>
        <Icon icon={side === "left" ? ChevronLeft : ChevronRight} />
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
      <div ref={ref} className={cn("space-y-2 type-body-sm text-pretty text-text-2", !open && "line-clamp-3")}>
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line">
            {linkify(paragraph)}
          </p>
        ))}
      </div>
      {(clipped || open) && (
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} className="mt-1 -ms-2.5">
          {open ? "Show less" : "Show more"}
        </Button>
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
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className="rounded-tag font-medium text-text-1 underline-offset-2 hover:underline">
        {token}
      </a>,
    );
    last = match.index + token.length;
  }
  out.push(text.slice(last));
  return out;
}

// The board picker and Save, in the card's third cell like lafys.com's one primary action.
// "New board…" swaps the picker for a name field (and is all there is before the first board),
// and Save then makes the board with this post on it. The picker is Glaze's Select (its own popup,
// a check beside the chosen board) and the name field its Input, both on the field pill.
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
        <Input
          aria-label="New board name"
          autoFocus={choice === NEW}
          value={name}
          onValueChange={setName}
          maxLength={NAME_MAX}
          placeholder={boards.length ? "Name the new board" : "Name your first board"}
          className="min-w-0 flex-1"
          trailing={
            boards.length > 0 ? (
              <InputAction onClick={() => setChoice(null)} aria-label="Back to your boards">
                <Icon icon={Close} />
              </InputAction>
            ) : undefined
          }
        />
      ) : (
        <Select
          items={[...boards.map((b) => ({ value: b.id, label: b.name })), { value: NEW, label: "New board…" }]}
          value={status === "loading" ? null : board}
          onValueChange={(value) => value && setChoice(value)}
          disabled={status === "loading"}
        >
          <SelectTrigger aria-label="Board" className="min-w-0 flex-1">
            <SelectValue placeholder="Loading boards…" />
          </SelectTrigger>
          <SelectContent>
            {boards.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
            {boards.length > 0 && <SelectSeparator />}
            <SelectItem value={NEW}>New board…</SelectItem>
          </SelectContent>
        </Select>
      )}
      {/* "Saved" is a confirmation, not a dead control: it stays legible as a flat secondary and
          is only aria-disabled (the submit above ignores it); loading and an empty name still
          disable Save outright */}
      {inChosen && !naming ? (
        <Button type="submit" variant="secondary" aria-disabled className="aria-disabled:cursor-default">
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
