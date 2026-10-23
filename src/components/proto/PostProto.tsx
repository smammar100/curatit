"use client";

// Prototype (2026-10-23): the post as a page, after lafys.com's detail page. The post large on
// the left and sticky while the right column scrolls; on the right one ruled card (title and
// Save, the brand, a full-width Copy brief, traits and categories as chips, the observed counts)
// and under it the breakdown in the "Document" direction from BreakdownProto.
import { useState, type ReactNode } from "react";
import Image from "next/image";
import { MotionConfig } from "motion/react";
import Lockup from "@/components/assets/Lockup";
import Avatar from "@/components/fundations/elements/Avatar";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import CaretDown from "@/components/fundations/icons/CaretDown";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
import Close from "@/components/fundations/icons/Close";
import Info from "@/components/fundations/icons/Info";
import ChatCircle from "@/components/fundations/icons/ChatCircle";
import FilmStrip from "@/components/fundations/icons/FilmStrip";
import Heart from "@/components/fundations/icons/Heart";
import ListChecks from "@/components/fundations/icons/ListChecks";
import Palette from "@/components/fundations/icons/Palette";
import Play from "@/components/fundations/icons/Play";
import Plugs from "@/components/fundations/icons/Plugs";
import SealCheck from "@/components/fundations/icons/SealCheck";
import ShareNetwork from "@/components/fundations/icons/ShareNetwork";
import Sparkle from "@/components/fundations/icons/Sparkle";
import { Document, traits, type Stage } from "@/components/proto/BreakdownProto";
import { fontWeights } from "@/lib/font-weight";
import type { PublicAnalysis } from "@/lib/creative/publicView";
import type { PostDetail } from "@/lib/posts";
import { cn } from "@/lib/utils";

const semibold = { fontVariationSettings: fontWeights.semibold };
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const countLabel = (value: number | null) => (value == null ? "Not available" : compact.format(value));
const dateLabel = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" });

function Label({ children }: { children: string }) {
  return <p className="text-micro tracking-[0.08em] text-muted-foreground uppercase">{children}</p>;
}

type Related = { shortCode: string; hook: string; cover: string; brand: string; width: number | null; height: number | null };
import { type Direction } from "@/components/proto/postDirections";
type Props = { post: PostDetail; analysis: PublicAnalysis | null; related: Related[]; direction: Direction; theme: "light" | "dark" };

export default function PostProto({ direction, theme, ...rest }: Props) {
  const Variant = { card: Card, studio: Studio, pin: Pin, shot: Shot, inspector: Inspector }[direction];
  return (
    <MotionConfig reducedMotion="user">
      <div data-theme-scope={theme} data-theme={theme} className="min-h-dvh bg-page text-body text-foreground">
        <Variant {...rest} />
      </div>
    </MotionConfig>
  );
}

function usePost(post: PostDetail, analysis: PublicAnalysis | null) {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<"breakdown" | "visual">("breakdown");
  const [saved, setSaved] = useState(false);
  const count = post.images.length;
  const stage: Stage = { index, onSlide: setIndex, count };
  const role = analysis?.sequence.roles[index] ?? analysis?.slides[index]?.role ?? null;
  const ratio = post.width && post.height ? `${post.width} / ${post.height}` : "4 / 5";
  return { index, setIndex, view, setView, saved, setSaved, count, stage, role, ratio };
}

// The slide count as a quiet chip and every slide as a thumbnail, shared by both directions
function Thumbs({ post, index, onIndex }: { post: PostDetail; index: number; onIndex: (i: number) => void }) {
  const count = post.images.length;
  return (
    <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:none]">
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
                onClick={() => onIndex(i)}
                className={cn(
                  "relative block size-11 overflow-hidden rounded-[10px] transition-opacity duration-80 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
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
  );
}

// ---- 1. Card: after lafys.com's detail page ----

function Card({ post, analysis }: Omit<Props, "direction" | "theme">) {
  const { index, setIndex, view, setView, saved, setSaved, count, stage, role, ratio } = usePost(post, analysis);
  return (
    <>
        {/* A slim app bar: back, the lockup, the account */}
        <header className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8">
          <div>
            <Button variant="secondary" size="sm" leftIcon={<CaretLeft className="size-3.5" />}>
              Library
            </Button>
          </div>
          <Lockup />
          <div className="flex justify-end">
            <Avatar name="Ammar" size="sm" decorative />
          </div>
        </header>

        <main className="mx-auto grid max-w-[96rem] grid-cols-1 gap-6 px-4 pt-4 pb-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-10 lg:pt-8">
          {/* The post, sticky while the column beside it scrolls */}
          <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
            <div className="relative flex items-center justify-center overflow-hidden rounded-[24px] bg-muted p-4 shadow-surface-1 sm:p-8 lg:h-[calc(100dvh-10rem)]">
              <div className="relative h-full max-h-full w-full max-w-full" style={{ aspectRatio: ratio, maxWidth: `calc((100dvh - 14rem) * (${ratio}))` }}>
                <Image key={post.images[index]} src={post.images[index]} alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook} fill sizes="(min-width: 1024px) 60vw, 100vw" priority className="rounded-[12px] object-contain" />
              </div>
              {count > 1 && (
                <>
                  <p className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[var(--foreground)] px-2.5 py-1 text-caption text-[var(--background)] tabular-nums" aria-live="polite">
                    {index + 1} / {count}
                    {role && <span className="opacity-70"> · {role}</span>}
                    {post.videos[index] && <Play className="size-3" aria-label="Video cover" />}
                  </p>
                  <div className="absolute inset-y-0 left-3 flex items-center">
                    <Button variant="secondary" iconOnly aria-label="Previous slide" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                      <CaretLeft className="size-3.5" />
                    </Button>
                  </div>
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <Button variant="secondary" iconOnly aria-label="Next slide" disabled={index === count - 1} onClick={() => setIndex(index + 1)}>
                      <CaretRight className="size-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="mt-3">
              <Thumbs post={post} index={index} onIndex={setIndex} />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            {/* The card: one cell per thing, ruled apart */}
            <section className="divide-y divide-border rounded-[24px] bg-surface-3 shadow-surface-2">
              <div className="flex items-start justify-between gap-4 p-5">
                <h1 className="font-display text-[22px] leading-7 text-balance text-foreground">{post.hook}</h1>
                <Button variant={saved ? "default" : "secondary"} iconOnly aria-label={saved ? "Saved" : "Save"} aria-pressed={saved} onClick={() => setSaved((v) => !v)}>
                  <BookmarkSimple className="size-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Avatar src={post.brand.logo} name={post.brand.name} size="md" decorative />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-foreground" style={semibold}>
                    {post.brand.name}
                    {post.verified && <SealCheck className="size-3.5 shrink-0 text-muted-foreground" aria-label="Verified" />}
                  </p>
                  <p className="truncate text-caption text-muted-foreground">
                    {post.handle && `@${post.handle} · `}
                    {dateLabel.format(new Date(post.postedAt))}
                  </p>
                </div>
                <Button variant="transparent" size="sm" isLink href={post.url} target="_blank" rel="noreferrer" rightIcon={<ArrowUpRight className="size-3.5" />}>
                  Instagram
                </Button>
              </div>
              <div className="p-5">
                <Button className="w-full" leftIcon={<Sparkle className="size-3.5" />}>
                  Copy brief
                </Button>
              </div>
              {analysis && (
                <div className="p-5">
                  <Label>Traits</Label>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {traits(analysis).map((t) => (
                      <li key={t.label}>
                        <Badge>
                          <span className="text-muted-foreground">{t.label}</span>
                          <span className="ml-1" style={semibold}>
                            {t.value}
                          </span>
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="p-5">
                <Label>Categories</Label>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {post.categories.map((c) => (
                    <li key={c.slug}>
                      <Badge variant="outline" className="font-mono">
                        <span className="text-muted-foreground">#</span>
                        {c.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5">
                <Label>Observed</Label>
                <dl className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Heart className="size-3.5 text-muted-foreground" />
                    <dt className="sr-only">Likes</dt>
                    <dd className="tabular-nums" style={semibold}>
                      {countLabel(post.likes)}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ChatCircle className="size-3.5 text-muted-foreground" />
                    <dt className="sr-only">Comments</dt>
                    <dd className="tabular-nums" style={semibold}>
                      {countLabel(post.comments)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-1.5 text-caption text-muted-foreground">As scraped. Not a verdict on whether it worked.</p>
              </div>
            </section>

            {/* The breakdown, in the Document direction */}
            {analysis ? (
              <section className="rounded-[24px] bg-surface-5 px-6 pb-5 shadow-surface-2">
                <Document analysis={analysis} stage={stage} view={view} onView={setView} />
              </section>
            ) : (
              <p className="px-5 text-caption text-muted-foreground">No published breakdown for this post yet.</p>
            )}
          </div>
        </main>
    </>
  );
}

// ---- 2. Studio: three columns after a reference app's detail page the owner shared. A top bar
// (back, the title centred, Use with agents, share, Save), the brand and folds on the left,
// the post in the middle, the breakdown on the right ----

function Fold({ icon: Glyph, label, accessory, open, onToggle, children }: { icon: typeof Palette; label: string; accessory?: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex h-10 w-full items-center gap-3 rounded-[12px] px-2 text-left text-foreground transition-colors duration-80 hover:bg-hover">
        <Glyph className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate" style={semibold}>
          {label}
        </span>
        {accessory}
        <CaretDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="px-2 pt-1 pb-3">{children}</div>}
    </div>
  );
}

function Studio({ post, analysis, related }: Omit<Props, "direction" | "theme">) {
  const { index, setIndex, view, setView, saved, setSaved, count, stage, role, ratio } = usePost(post, analysis);
  const [fold, setFold] = useState<"breakdown" | "colours" | "boards" | null>("breakdown");
  const toggle = (key: typeof fold) => setFold((f) => (f === key ? null : key));
  const details: [string, string][] = [
    ["Likes", countLabel(post.likes)],
    ["Comments", countLabel(post.comments)],
    ["Posted", dateLabel.format(new Date(post.postedAt))],
    ["Format", post.format === "carousel" ? `Carousel · ${count} slides` : post.format === "video" ? "Video" : "Image"],
    ["Category", post.category.name],
  ];
  return (
    <div className="flex flex-col lg:h-dvh">
      <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-4">
        <div>
          <Button variant="transparent" size="sm" leftIcon={<CaretLeft className="size-3.5" />}>
            Library
          </Button>
        </div>
        <h1 className="max-w-[40rem] truncate text-subtitle text-foreground" style={semibold}>
          {post.hook}
        </h1>
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="transparent" size="sm" leftIcon={<Plugs className="size-3.5" />}>
            Use with agents
          </Button>
          <Button variant="transparent" iconOnly aria-label="Share">
            <ShareNetwork className="size-3.5" />
          </Button>
          <Button variant={saved ? "secondary" : "default"} leftIcon={<BookmarkSimple className="size-3.5" />} rightIcon={<CaretDown className="size-3" />} aria-pressed={saved} onClick={() => setSaved((v) => !v)}>
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)_26rem] lg:divide-x lg:divide-border">
        {/* Left: who posted it, the folds, the details */}
        <aside className="min-w-0 lg:min-h-0 lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <Avatar src={post.brand.logo} name={post.brand.name} size="lg" decorative />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-foreground" style={semibold}>
                {post.brand.name}
                {post.verified && <SealCheck className="size-3.5 shrink-0 text-muted-foreground" aria-label="Verified" />}
              </p>
              {post.handle && <p className="truncate text-caption text-muted-foreground">@{post.handle}</p>}
            </div>
            <Button variant="secondary" size="sm">
              Follow
            </Button>
          </div>
          <div className="space-y-0.5 border-b border-border p-2">
            <Fold icon={ListChecks} label="Creative breakdown" accessory={<Badge variant="inverted">AI</Badge>} open={fold === "breakdown"} onToggle={() => toggle("breakdown")}>
              {analysis ? (
                <>
                  <p className="text-pretty text-foreground">{analysis.headline}</p>
                  <ol className="mt-2 space-y-1.5">
                    {analysis.creativeDecisions.map((d, i) => (
                      <li key={i} className="flex gap-2 text-caption text-muted-foreground">
                        <span className="tabular-nums" style={semibold}>
                          {i + 1}
                        </span>
                        <span className="text-foreground">{d.title}</span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-caption text-muted-foreground">Not published yet.</p>
              )}
            </Fold>
            <Fold
              icon={Palette}
              label="Colour palette"
              accessory={
                analysis && (
                  <span className="flex -space-x-1">
                    {analysis.colours.slice(0, 4).map((c) => (
                      <span key={c.hex} className="size-4 rounded-full outline-2 outline-[var(--background)]" style={{ background: c.hex }} />
                    ))}
                  </span>
                )
              }
              open={fold === "colours"}
              onToggle={() => toggle("colours")}
            >
              <ul className="space-y-1.5">
                {(analysis?.colours ?? []).map((c) => (
                  <li key={c.hex} className="flex items-center gap-2">
                    <span className="size-5 rounded-full outline-1 -outline-offset-1 outline-border" style={{ background: c.hex }} />
                    <span className="min-w-0 flex-1 truncate text-caption text-foreground">{c.role ?? "Colour"}</span>
                    <span className="font-mono text-micro text-muted-foreground uppercase">{c.hex}</span>
                  </li>
                ))}
              </ul>
            </Fold>
            <Fold icon={BookmarkSimple} label="In 3 boards" open={fold === "boards"} onToggle={() => toggle("boards")}>
              <ul className="space-y-1 text-caption text-foreground">
                <li>Launch references</li>
                <li>Charity storytelling</li>
                <li>Q4 brief</li>
              </ul>
            </Fold>
          </div>
          <div className="border-b border-border p-4">
            <p className="text-caption text-muted-foreground">Details</p>
            <dl className="mt-2 space-y-1.5">
              {details.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right text-foreground tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="border-b border-border p-4">
            <p className="text-caption text-muted-foreground">Keep exploring</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {[...post.categories.map((c) => c.name), ...(analysis ? traits(analysis).map((t) => t.value) : [])].slice(0, 6).map((label) => (
                <li key={label}>
                  <Badge>{label}</Badge>
                </li>
              ))}
            </ul>
          </div>
          {related.length > 0 && (
            <div className="p-4">
              <p className="text-caption text-muted-foreground">More from {post.brand.name}</p>
              <ul className="mt-2 space-y-1">
                {related.map((r) => (
                  <li key={r.shortCode}>
                    <a href={`?post=${r.shortCode}&direction=studio`} className="flex items-center gap-3 rounded-[12px] p-1.5 transition-colors duration-80 hover:bg-hover">
                      <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-[8px] bg-muted">
                        <Image src={r.cover} alt="" fill sizes="64px" className="object-cover" />
                      </span>
                      <span className="line-clamp-2 text-caption text-foreground">{r.hook}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Middle: the post */}
        <div className="flex min-w-0 flex-col items-center gap-4 p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto lg:p-10">
          <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
            <div className="relative h-full max-h-full w-full max-w-full" style={{ aspectRatio: ratio, maxWidth: `calc((100dvh - 14rem) * (${ratio}))` }}>
              <Image key={post.images[index]} src={post.images[index]} alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook} fill sizes="(min-width: 1024px) 50vw, 100vw" priority className="rounded-[16px] object-contain" />
            </div>
            {count > 1 && (
              <>
                <p className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[var(--foreground)] px-2.5 py-1 text-caption text-[var(--background)] tabular-nums" aria-live="polite">
                  {index + 1} / {count}
                  {role && <span className="opacity-70"> · {role}</span>}
                  {post.videos[index] && <Play className="size-3" aria-label="Video cover" />}
                </p>
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <Button variant="secondary" iconOnly aria-label="Previous slide" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                    <CaretLeft className="size-3.5" />
                  </Button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button variant="secondary" iconOnly aria-label="Next slide" disabled={index === count - 1} onClick={() => setIndex(index + 1)}>
                    <CaretRight className="size-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="flex w-full items-center justify-between gap-4">
            <Thumbs post={post} index={index} onIndex={setIndex} />
            <Button variant="transparent" size="sm" isLink href={post.url} target="_blank" rel="noreferrer" rightIcon={<ArrowUpRight className="size-3.5" />}>
              Instagram
            </Button>
          </div>
        </div>

        {/* Right: the breakdown */}
        <aside className="min-w-0 bg-surface-5 px-6 pb-6 lg:min-h-0 lg:overflow-y-auto">
          {analysis ? (
            <Document analysis={analysis} stage={stage} view={view} onView={setView} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <FilmStrip className="size-5" />
              </span>
              <p className="text-foreground" style={semibold}>
                No breakdown yet
              </p>
              <p className="text-caption text-muted-foreground">An editor hasn&rsquo;t published this post&rsquo;s analysis.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---- 3. Pin: after Pinterest's pin page (mobbin.com/screens/f7e3f19d-2ee1-4b87-a91d-38bf0a9f023a).
// One rounded card over the page, the post on its left half and the actions, title, brand,
// caption and breakdown on its right; "More like this" as a masonry of real posts under it ----

function Pin({ post, analysis, related }: Omit<Props, "direction" | "theme">) {
  const { index, setIndex, view, setView, saved, setSaved, count, stage, role, ratio } = usePost(post, analysis);
  return (
    <>
      <header className="flex h-14 items-center justify-between px-4 sm:px-8">
        <Button variant="transparent" size="sm" leftIcon={<CaretLeft className="size-3.5" />}>
          Library
        </Button>
        <Lockup />
        <Avatar name="Ammar" size="sm" decorative />
      </header>
      <main className="mx-auto max-w-[64rem] px-4 pb-16 sm:px-8">
        <article className="grid grid-cols-1 overflow-hidden rounded-[24px] bg-surface-3 shadow-surface-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative flex items-center justify-center bg-muted lg:min-h-[40rem]">
            <div className="relative w-full" style={{ aspectRatio: ratio }}>
              <Image key={post.images[index]} src={post.images[index]} alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook} fill sizes="(min-width: 1024px) 32rem, 100vw" priority className="object-cover" />
            </div>
            {count > 1 && (
              <>
                <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--foreground)] px-2.5 py-1 text-caption text-[var(--background)] tabular-nums">
                  {index + 1} / {count}
                  {role && <span className="opacity-70"> · {role}</span>}
                </p>
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <Button variant="secondary" iconOnly aria-label="Previous slide" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                    <CaretLeft className="size-3.5" />
                  </Button>
                </div>
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <Button variant="secondary" iconOnly aria-label="Next slide" disabled={index === count - 1} onClick={() => setIndex(index + 1)}>
                    <CaretRight className="size-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="flex min-w-0 flex-col lg:max-h-[46rem]">
            {/* Pinterest's top row: reactions on the left, the board and Save on the right */}
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
              <div className="flex items-center gap-1">
                <Button variant="transparent" size="sm" leftIcon={<Heart className="size-3.5" />}>
                  {countLabel(post.likes)}
                </Button>
                <Button variant="transparent" size="sm" leftIcon={<ChatCircle className="size-3.5" />}>
                  {countLabel(post.comments)}
                </Button>
                <Button variant="transparent" iconOnly aria-label="Share">
                  <ShareNetwork className="size-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="transparent" size="sm" rightIcon={<CaretDown className="size-3" />}>
                  Launch references
                </Button>
                <Button variant={saved ? "secondary" : "accent"} aria-pressed={saved} onClick={() => setSaved((v) => !v)}>
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
              <h1 className="font-display text-[22px] leading-7 text-balance text-foreground">{post.hook}</h1>
              <div className="mt-3 flex items-center gap-3">
                <Avatar src={post.brand.logo} name={post.brand.name} size="md" decorative />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-foreground" style={semibold}>
                    {post.brand.name}
                    {post.verified && <SealCheck className="size-3.5 text-muted-foreground" aria-label="Verified" />}
                  </p>
                  <p className="truncate text-caption text-muted-foreground">{post.categories.map((c) => c.name).join(" · ")}</p>
                </div>
                <Button variant="secondary" size="sm" isLink href={post.url} target="_blank" rel="noreferrer">
                  Instagram
                </Button>
              </div>
              {post.caption && <p className="mt-3 line-clamp-3 text-pretty text-muted-foreground">{post.caption}</p>}
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" leftIcon={<Sparkle className="size-3.5" />}>
                  Copy brief
                </Button>
                <Thumbs post={post} index={index} onIndex={setIndex} />
              </div>
              {analysis && (
                <div className="mt-5 border-t border-border pt-1">
                  <Document analysis={analysis} stage={stage} view={view} onView={setView} />
                </div>
              )}
            </div>
          </div>
        </article>
        <h2 className="mt-10 text-center text-subtitle text-foreground" style={semibold}>
          More like this
        </h2>
        <div className="mt-4 columns-2 gap-3 sm:columns-3 lg:columns-4">
          {related.map((r) => (
            <a key={r.shortCode} href={`?post=${r.shortCode}&direction=pin`} className="group mb-3 block break-inside-avoid">
              <span className="relative block w-full overflow-hidden rounded-[16px] bg-muted" style={{ aspectRatio: r.width && r.height ? `${r.width} / ${r.height}` : "4 / 5" }}>
                <Image src={r.cover} alt="" fill sizes="(min-width: 1024px) 16rem, 50vw" className="object-cover transition-opacity duration-150 group-hover:opacity-90" />
              </span>
              <span className="mt-1.5 block truncate px-1 text-caption text-muted-foreground">{r.brand}</span>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}

// ---- 4. Shot: after Dribbble's shot page (mobbin.com/screens/e6ee3ed0-cab4-4751-8db4-13a8293655e7).
// Title and brand above, the post as wide as the column, a floating rail of round actions on
// the right, then the breakdown and the Visual DNA side by side under it ----

function Shot({ post, analysis }: Omit<Props, "direction" | "theme">) {
  const { index, setIndex, view, setView, saved, setSaved, count, stage, role, ratio } = usePost(post, analysis);
  const rail = [
    { label: saved ? "Saved" : "Save", icon: BookmarkSimple, on: saved, onClick: () => setSaved((v) => !v) },
    { label: "Share", icon: ShareNetwork },
    { label: "Details", icon: Info },
  ];
  return (
    <>
      <header className="flex h-14 items-center justify-between px-4 sm:px-8">
        <Lockup />
        <div className="flex items-center gap-2">
          <Button variant="transparent" size="sm" leftIcon={<CaretLeft className="size-3.5" />}>
            Library
          </Button>
          <Avatar name="Ammar" size="sm" decorative />
        </div>
      </header>
      <main className="relative mx-auto max-w-[72rem] px-4 pt-6 pb-16 sm:px-8 lg:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] leading-8 text-balance text-foreground lg:text-[32px] lg:leading-9">{post.hook}</h1>
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar src={post.brand.logo} name={post.brand.name} size="md" decorative />
              <p className="flex items-center gap-1 text-foreground" style={semibold}>
                {post.brand.name}
                {post.verified && <SealCheck className="size-3.5 text-muted-foreground" aria-label="Verified" />}
              </p>
              <p className="text-caption text-muted-foreground">
                {post.handle && `@${post.handle} · `}
                {dateLabel.format(new Date(post.postedAt))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" iconOnly aria-label={saved ? "Saved" : "Save"} aria-pressed={saved} onClick={() => setSaved((v) => !v)}>
              <BookmarkSimple className="size-3.5" />
            </Button>
            <Button variant="secondary" iconOnly aria-label="Share">
              <ShareNetwork className="size-3.5" />
            </Button>
            <Button leftIcon={<Sparkle className="size-3.5" />}>Copy brief</Button>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[20px] bg-muted">
          <div className="relative mx-auto max-h-[80dvh]" style={{ aspectRatio: ratio, maxWidth: `calc(80dvh * (${ratio}))` }}>
            <Image key={post.images[index]} src={post.images[index]} alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook} fill sizes="(min-width: 1024px) 72rem, 100vw" priority className="object-contain" />
          </div>
          {count > 1 && (
            <>
              <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--foreground)] px-2.5 py-1 text-caption text-[var(--background)] tabular-nums">
                {index + 1} / {count}
                {role && <span className="opacity-70"> · {role}</span>}
              </p>
              <div className="absolute inset-y-0 left-3 flex items-center">
                <Button variant="secondary" iconOnly aria-label="Previous slide" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                  <CaretLeft className="size-3.5" />
                </Button>
              </div>
              <div className="absolute inset-y-0 right-3 flex items-center">
                <Button variant="secondary" iconOnly aria-label="Next slide" disabled={index === count - 1} onClick={() => setIndex(index + 1)}>
                  <CaretRight className="size-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Thumbs post={post} index={index} onIndex={setIndex} />
          <div className="flex items-center gap-4 text-caption text-muted-foreground">
            <span className="flex items-center gap-1 tabular-nums">
              <Heart className="size-3.5" /> {countLabel(post.likes)}
            </span>
            <span className="flex items-center gap-1 tabular-nums">
              <ChatCircle className="size-3.5" /> {countLabel(post.comments)}
            </span>
            <Button variant="transparent" size="sm" isLink href={post.url} target="_blank" rel="noreferrer" rightIcon={<ArrowUpRight className="size-3.5" />}>
              Instagram
            </Button>
          </div>
        </div>

        {/* Dribbble's floating rail, from lg */}
        <ul className="sticky top-1/2 z-10 -mt-24 ml-auto hidden w-fit -translate-y-1/2 flex-col gap-2 lg:flex" style={{ marginRight: "-3.5rem" }}>
          {rail.map(({ label, icon: Glyph, on, onClick }) => (
            <li key={label}>
              <button type="button" aria-label={label} aria-pressed={on} onClick={onClick} className={cn("flex size-10 items-center justify-center rounded-full bg-surface-4 text-foreground shadow-surface-3 transition-colors duration-80 hover:bg-hover", on && "bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)]")}>
                <Glyph className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        {analysis ? (
          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="min-w-0 px-6">
              <Document analysis={analysis} stage={stage} view="breakdown" onView={setView} />
            </section>
            <section className="min-w-0 rounded-[24px] bg-surface-3 px-6 pb-5 shadow-surface-1">
              <Document analysis={analysis} stage={stage} view="visual" onView={setView} />
            </section>
          </div>
        ) : (
          <p className="mt-12 text-caption text-muted-foreground">No published breakdown for this post yet.</p>
        )}
      </main>
    </>
  );
}

// ---- 5. Inspector: after Savee's post view (mobbin.com/screens/82495bf4-5c65-4f73-ae61-f5e75934aa24)
// and Magnific's (mobbin.com/screens/9ce59f92-107f-4407-9b4a-462cf2f9eb9e). A dark lightbox the
// post fills, an Info panel on the right (the colours as dots, Add to a board, then the breakdown),
// a filmstrip of other posts along the foot ----

function Inspector({ post, analysis, related }: Omit<Props, "direction" | "theme">) {
  const { index, setIndex, view, setView, saved, setSaved, count, stage, role, ratio } = usePost(post, analysis);
  const [open, setOpen] = useState(true);
  return (
    <div className="flex h-dvh flex-col bg-[#0b0a10] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Back" className="flex size-7 items-center justify-center rounded-full text-white/70 hover:text-white">
            <CaretLeft className="size-4" />
          </button>
          <span className="flex -space-x-2">
            {related.slice(0, 4).map((r) => (
              <span key={r.shortCode} className="relative size-7 overflow-hidden rounded-full outline-2 outline-[#0b0a10]">
                <Image src={r.cover} alt="" fill sizes="28px" className="object-cover" />
              </span>
            ))}
            <span className="flex size-7 items-center justify-center rounded-full bg-white/10 text-micro text-white/80 outline-2 outline-[#0b0a10] tabular-nums">+{Math.max(0, related.length - 4)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-pressed={saved} onClick={() => setSaved((v) => !v)} className={cn("flex h-7 items-center gap-1.5 rounded-full px-3 text-caption transition-colors duration-80", saved ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15")} style={semibold}>
            <BookmarkSimple className="size-3.5" />
            {saved ? "Saved" : "Save"}
            <CaretDown className="size-3" />
          </button>
          <button type="button" aria-label="Info" aria-pressed={open} onClick={() => setOpen((v) => !v)} className={cn("flex size-7 items-center justify-center rounded-full text-white/70 hover:text-white", open && "bg-white/10 text-white")}>
            <Info className="size-4" />
          </button>
          <button type="button" aria-label="Share" className="flex size-7 items-center justify-center rounded-full text-white/70 hover:text-white">
            <ShareNetwork className="size-4" />
          </button>
        </div>
      </header>

      <div className={cn("grid min-h-0 flex-1", open && "lg:grid-cols-[minmax(0,1fr)_24rem]")}>
        <div className="relative flex min-h-0 flex-col">
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-6">
            <div className="relative h-full max-h-full w-full" style={{ aspectRatio: ratio, maxWidth: `calc((100dvh - 12rem) * (${ratio}))` }}>
              <Image key={post.images[index]} src={post.images[index]} alt={count > 1 ? `${post.hook} (slide ${index + 1} of ${count})` : post.hook} fill sizes="(min-width: 1024px) 60vw, 100vw" priority className="object-contain" />
            </div>
            {count > 1 && (
              <>
                <p className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-caption text-white tabular-nums">
                  {index + 1} / {count}
                  {role && <span className="opacity-70"> · {role}</span>}
                </p>
                <button type="button" aria-label="Previous slide" disabled={index === 0} onClick={() => setIndex(index - 1)} className="absolute top-1/2 left-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30">
                  <CaretLeft className="size-4" />
                </button>
                <button type="button" aria-label="Next slide" disabled={index === count - 1} onClick={() => setIndex(index + 1)} className="absolute top-1/2 right-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30">
                  <CaretRight className="size-4" />
                </button>
              </>
            )}
          </div>
          {/* The foot: this post's slides, then other posts */}
          <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-white/10 px-4 py-3 [scrollbar-width:none]">
            {post.images.map((src, i) => (
              <button key={src} type="button" aria-label={`Slide ${i + 1}`} aria-pressed={i === index} onClick={() => setIndex(i)} className={cn("relative h-16 w-12 shrink-0 overflow-hidden rounded-[8px] transition-opacity duration-80", i === index ? "ring-2 ring-white" : "opacity-50 hover:opacity-100")}>
                <Image src={src} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
            <span className="mx-2 h-10 w-px shrink-0 bg-white/15" />
            {related.map((r) => (
              <a key={r.shortCode} href={`?post=${r.shortCode}&direction=inspector`} className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[8px] opacity-50 transition-opacity duration-80 hover:opacity-100">
                <Image src={r.cover} alt={r.hook} fill sizes="48px" className="object-cover" />
              </a>
            ))}
          </div>
        </div>

        {open && (
          <aside data-theme-scope="dark" data-theme="dark" className="flex min-h-0 flex-col border-l border-white/10 bg-surface-3 text-body text-foreground">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <p className="text-foreground" style={semibold}>
                Info
              </p>
              <Button variant="transparent" iconOnly aria-label="Close info" onClick={() => setOpen(false)}>
                <Close className="size-3.5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
              <div className="flex items-center gap-3">
                <Avatar src={post.brand.logo} name={post.brand.name} size="md" decorative />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-foreground" style={semibold}>
                    {post.brand.name}
                    {post.verified && <SealCheck className="size-3.5 text-muted-foreground" aria-label="Verified" />}
                  </p>
                  <p className="truncate text-caption text-muted-foreground">{post.handle ? `@${post.handle}` : post.category.name}</p>
                </div>
              </div>
              <p className="mt-3 text-pretty text-foreground">{post.hook}</p>
              <p className="mt-1 flex items-center gap-3 text-caption text-muted-foreground">
                <span>{dateLabel.format(new Date(post.postedAt))}</span>
                <span className="flex items-center gap-1 tabular-nums">
                  <Heart className="size-3" /> {countLabel(post.likes)}
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                  <ChatCircle className="size-3" /> {countLabel(post.comments)}
                </span>
              </p>
              {analysis && analysis.colours.length > 0 && (
                <ul className="mt-4 flex gap-2">
                  {analysis.colours.map((c) => (
                    <li key={c.hex} title={c.role ?? c.hex} className="size-8 rounded-full outline-1 -outline-offset-1 outline-border" style={{ background: c.hex }} />
                  ))}
                </ul>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1" rightIcon={<CaretDown className="size-3" />}>
                  Add to a board
                </Button>
                <Button leftIcon={<Sparkle className="size-3.5" />}>Copy brief</Button>
              </div>
              <ul className="mt-3 space-y-1">
                {["Launch references", "Charity storytelling"].map((b, i) => (
                  <li key={b} className="flex items-center gap-2.5 rounded-[12px] px-2 py-1.5 hover:bg-hover">
                    <span className="relative size-7 overflow-hidden rounded-[8px] bg-muted">{related[i] && <Image src={related[i].cover} alt="" fill sizes="28px" className="object-cover" />}</span>
                    <span className="min-w-0 flex-1 truncate text-caption text-foreground">{b}</span>
                    <span className="text-micro text-muted-foreground tabular-nums">{12 - i * 5}</span>
                  </li>
                ))}
              </ul>
              {analysis && (
                <div className="mt-5 border-t border-border pt-1">
                  <Document analysis={analysis} stage={stage} view={view} onView={setView} />
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
