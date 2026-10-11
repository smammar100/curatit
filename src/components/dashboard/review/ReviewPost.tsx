"use client";

// One post's analysis, /dashboard/review/<post id>: the slides on the left (with their zero-based
// positions and what was read off each), the Creative DNA on the right, every version of it, and
// the decisions. Evidence chips jump to the slide or the caption they cite. An editor approves
// (optionally publishing), rejects, reopens, unpublishes, edits (saved as a new version) or asks
// for a fresh analysis (filed as a proposal beside whatever has been reviewed). Previous and Next
// (or K and J) step through the queue list the post was opened from.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
import Check from "@/components/fundations/icons/Check";
import { cx } from "@/lib/cx";
import type { CreativeDna, SlideObservation } from "@/lib/creative/schema";
import { refreshPostPage } from "@/app/dashboard/review/actions";
import { loadPostReview, reprocess, review, useIsEditor, type PostReview, type Version } from "./data";
import DnaEditor from "./DnaEditor";
import { ago, EvidenceChip, Frame, label, money, Notice, Pill, quietButton, reviewHref, Section, seconds, solidButton, sourceLabel, StatusPill, useBusy } from "./parts";
import { useWalk, type WalkItem } from "./walk";

export default function ReviewPost({ postId }: { postId: string }) {
  const editor = useIsEditor();
  const [data, setData] = useState<PostReview | null | undefined>(undefined);
  const [failed, setFailed] = useState<string | null>(null);
  const refresh = useCallback(
    () =>
      loadPostReview(postId)
        .then(setData)
        .catch((e: Error) => setFailed(e.message)),
    [postId],
  );
  useEffect(() => {
    if (editor) refresh();
  }, [editor, refresh]);

  let content;
  if (editor === false) content = <Notice title="Editors only">The analysis review is for Curatit&apos;s editors.</Notice>;
  else if (failed) content = <Notice title="Couldn't load this analysis">{failed}</Notice>;
  else if (data === undefined) content = <div aria-hidden="true" className="mx-auto mt-6 h-[70vh] max-w-6xl animate-pulse rounded-3xl bg-base-50" />;
  else if (data === null) content = <Notice title="No such post">The review covers posts in the library.</Notice>;
  else content = <PostReviewView data={data} onRefresh={refresh} />;
  return <Frame>{content}</Frame>;
}

export function PostReviewView({ data, onRefresh }: { data: PostReview; onRefresh: () => Promise<unknown> }) {
  const [versionId, setVersionId] = useState<string | null>(data.analysis?.current_version_id ?? data.versions[0]?.id ?? null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  // What the last decision did to which version, shown with a link on to the next post while
  // that version is the one on screen
  const [done, setDone] = useState<{ versionId: string; text: string } | null>(null);
  const { busy, error, run } = useBusy();
  const walk = useWalk(data.post.id);
  // Arriving from another post (or a link), focus lands on this post's title, so a screen reader
  // says where you are and J / K carry on from here; never taken from anything already focused
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!document.activeElement || document.activeElement === document.body) title.current?.focus({ preventScroll: true });
  }, []);

  const { post, analysis } = data;
  const version = data.versions.find((v) => v.id === versionId) ?? data.versions.find((v) => v.id === analysis?.current_version_id) ?? data.versions[0] ?? null;
  const compare = data.versions.find((v) => v.id === compareId && v.id !== version?.id) ?? null;
  const slides = useMemo(() => new Map(data.slides.filter((s) => s.version_id === version?.id).map((row) => [row.position, row.observation])), [data, version]);
  const isCurrent = version && analysis?.current_version_id === version.id;
  const dna = version?.creative_dna;

  // The post's page in the dashboard shows the published analysis; rebuild it now, not within the hour
  const republish = () => void refreshPostPage(post.short_code).catch(() => {});

  // Reload, then show this version
  const refresh = async (select?: string) => {
    await onRefresh();
    if (select) setVersionId(select);
  };

  function show(value: string) {
    setFocus((current) => (current === value ? null : value));
    const position = /^slide:(\d+)$/.exec(value)?.[1];
    if (position !== undefined) setSlide(Math.min(Number(position), post.images.length - 1));
    if (value === "caption") document.getElementById("review-caption")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const decide = (action: "approve" | "reject" | "reopen" | "unpublish", publish = false) => {
    if (!version) return;
    setDone(null);
    run(action + (publish ? "-publish" : ""), () => review(version.id, action, { publish, note })).then((ok) => {
      if (!ok) return;
      setNote("");
      setDone({ versionId: version.id, text: DONE[action](publish) });
      republish();
      refresh(version.id);
    });
  };

  return (
    <>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <SlideViewer images={post.images} slide={slide} onSlide={setSlide} slides={slides} />

        <div className="min-w-0">
          <div className="flex min-h-9 items-center justify-between gap-3">
            <Link href={reviewHref()} className="text-caption font-medium whitespace-nowrap text-base-500 hover:text-base-900">
              ← Review queue
            </Link>
            {/* Not while a decision is saving: one that failed after you'd moved on would never show */}
            <ReviewNav {...walk} blocked={editing ? "Save or cancel the edit first" : busy ? "Wait for this to save" : null} />
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-caption text-base-500">
            <span className="font-medium text-base-700">{post.brand}</span>
            <span>{post.category}</span>
            <span>{post.format}</span>
            <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-accent-600">
              {post.short_code} on Instagram <ArrowUpRight className="size-3" />
            </a>
          </p>
          <h1 ref={title} tabIndex={-1} className="mt-1 font-display text-display font-light text-balance text-base-900 outline-none">
            {dna?.concept ?? "Not analysed yet"}
          </h1>

          {version && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {isCurrent && analysis ? <StatusPill status={analysis.review_status} /> : <Pill>{version.review_decision === "rejected" ? "Rejected" : version.review_decision === "approved" ? "Approved earlier" : "Proposal"}</Pill>}
              <Pill>{sourceLabel(version.source)}</Pill>
              {isCurrent && analysis?.published_at ? <Pill tone="strong">Public</Pill> : <Pill>Not public</Pill>}
              <Pill tone={version.image_analysis_complete ? "plain" : "danger"} title="Slides the model was shown and recorded">
                {version.image_analysis_complete ? `All ${version.expected_slides} slides read` : `Partial: ${version.processed_slides} of ${version.expected_slides} slides`}
              </Pill>
              {(version.validation.warnings?.length ?? 0) > 0 && <Pill>{version.validation.warnings!.length} checks to look at</Pill>}
            </div>
          )}

          {/* Decisions */}
          {version && !editing && (
            <div className="mt-5 rounded-2xl bg-base-50 p-3">
              <div className="flex flex-wrap gap-2">
                {(!isCurrent || analysis?.review_status !== "approved" || !analysis.published_at) && (
                  <button type="button" className={solidButton} disabled={!!busy} onClick={() => decide("approve", true)}>
                    {busy === "approve-publish" ? "Publishing…" : "Approve and publish"}
                  </button>
                )}
                {(!isCurrent || analysis?.review_status !== "approved") && (
                  <button type="button" className={quietButton} disabled={!!busy} onClick={() => decide("approve")}>
                    {busy === "approve" ? "Approving…" : "Approve"}
                  </button>
                )}
                <button type="button" className={quietButton} disabled={!!busy} onClick={() => (setDone(null), setEditing(true))}>
                  Edit
                </button>
                {version.review_decision !== "rejected" && (
                  <button type="button" className={quietButton} disabled={!!busy} onClick={() => decide("reject")}>
                    {busy === "reject" ? "Rejecting…" : "Reject"}
                  </button>
                )}
                {isCurrent && analysis?.review_status !== "needs_review" && (
                  <button type="button" className={quietButton} disabled={!!busy} onClick={() => decide("reopen")}>
                    Reopen
                  </button>
                )}
                {isCurrent && analysis?.published_at && (
                  <button type="button" className={quietButton} disabled={!!busy} onClick={() => decide("unpublish")}>
                    Unpublish
                  </button>
                )}
                <button
                  type="button"
                  className={quietButton}
                  disabled={!!busy}
                  title="Queue a fresh analysis; it lands as a proposal next to this one"
                  onClick={() => {
                    setDone(null);
                    run("reprocess", () => reprocess(post.id)).then((ok) => {
                      if (!ok) return;
                      if (version) setDone({ versionId: version.id, text: "Queued a fresh analysis. It lands as a proposal next to this one." });
                      refresh();
                    });
                  }}
                >
                  {busy === "reprocess" ? "Queuing…" : "Analyse again"}
                </button>
              </div>
              <label className="mt-3 block">
                <span className="sr-only">Note for the review history (optional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  placeholder="Note for the history (optional)"
                  className="h-9 w-full rounded-full border-0 bg-white px-4 text-body pointer-coarse:text-[16px] text-base-900 ring-1 ring-base-200 placeholder:text-base-400 focus:ring-2 focus:ring-base-300"
                />
              </label>
              {error && <p className="mt-2 text-caption text-danger-600">{error}</p>}
              <div role="status">
                {done?.versionId === version.id && !busy && (
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-body text-base-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="size-3.5 shrink-0" />
                      {done.text}
                    </span>
                    {walk.next && (
                      <Link href={reviewHref(walk.next.id)} className="relative font-medium text-base-900 before:absolute before:-inset-x-1 before:-inset-y-3 hover:text-accent-600">
                        Next: {walk.next.label} →
                      </Link>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Versions */}
          {data.versions.length > 0 && (
            <Section title={`Versions (${data.versions.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {data.versions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={v.id === versionId}
                    onClick={() => (setVersionId(v.id), setEditing(false))}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-caption font-medium text-base-700 ring-1 ring-base-200 hover:bg-base-50 aria-pressed:bg-base-900 aria-pressed:text-white aria-pressed:ring-base-900"
                  >
                    v{v.version_no} · {v.source === "ai" ? "AI" : v.source === "mixed" ? "edited" : "editor"}
                    {analysis?.current_version_id === v.id && " · current"}
                    {v.review_decision && ` · ${v.review_decision}`}
                  </button>
                ))}
              </div>
              {data.versions.length > 1 && version && (
                <label className="mt-3 flex items-center gap-2 text-caption text-base-500">
                  Compare with
                  <select
                    value={compareId ?? ""}
                    onChange={(e) => setCompareId(e.target.value || null)}
                    className="h-8 rounded-full border-0 bg-base-50 py-0 pr-8 pl-3 text-caption pointer-coarse:text-[16px] text-base-900 ring-1 ring-base-200 focus:ring-2 focus:ring-base-300"
                  >
                    <option value="">nothing</option>
                    {data.versions.filter((v) => v.id !== version.id).map((v) => (
                      <option key={v.id} value={v.id}>
                        v{v.version_no}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {version && compare && <Diff a={version} b={compare} />}
            </Section>
          )}

          {editing && version ? (
            <DnaEditor
              postId={post.id}
              caption={post.caption ?? ""}
              version={version}
              slides={slides}
              onCancel={() => setEditing(false)}
              onSaved={(id) => {
                setEditing(false);
                republish();
                refresh(id);
              }}
            />
          ) : (
            dna && version && <DnaView dna={dna} version={version} focus={focus} onShow={show} />
          )}

          <Section title="Caption">
            <p id="review-caption" className={cx("rounded-2xl px-3.5 py-3 text-body whitespace-pre-line text-base-700", focus === "caption" ? "bg-base-100 ring-2 ring-base-900" : "bg-base-50")}>
              {post.caption ? <Highlight text={post.caption} quotes={dna ? quotesFor(dna, "caption") : []} /> : <span className="text-base-500">No caption.</span>}
            </p>
          </Section>

          <History data={data} />
        </div>
      </div>
    </>
  );
}

const DONE: Record<"approve" | "reject" | "reopen" | "unpublish", (publish: boolean) => string> = {
  approve: (publish) => (publish ? "Approved and published." : "Approved. Not public yet."),
  reject: () => "Rejected.",
  reopen: () => "Reopened for review.",
  unpublish: () => "Unpublished.",
};

// Previous and next in the list the post was opened from, with its place in it. K and J do the
// same from the keyboard (← and → already turn the slides). Off, with the reason on hover, while
// an edit is open (so a half-written edit isn't left behind) or a decision is saving.
function ReviewNav({ walk, index, previous, next, ready, blocked }: ReturnType<typeof useWalk> & { blocked: string | null }) {
  const router = useRouter();
  useEffect(() => {
    if (blocked) return;
    function key(event: KeyboardEvent) {
      if (event.repeat || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable], [role=menu], [role=dialog], dialog")) return;
      // An open menu or dialog keeps the keyboard, wherever focus is
      if (document.querySelector("[role=menu], [role=dialog], dialog[open]")) return;
      const letter = event.key.toLowerCase();
      const to = letter === "j" ? next : letter === "k" ? previous : null;
      if (!to) return;
      event.preventDefault();
      router.push(reviewHref(to.id));
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [blocked, next, previous, router]);

  if (!ready || !walk || (!previous && !next && index < 0)) return null;
  const count = walk.items.length;
  return (
    <nav aria-label="Posts in this list" className="flex shrink-0 items-center gap-2">
      <p className="text-caption whitespace-nowrap text-base-500 tabular-nums">
        <span className="max-sm:hidden">{walk.list} · </span>
        {index >= 0 ? `${index + 1} of ${count}` : `${count} ${count === 1 ? "post" : "posts"}`}
      </p>
      <Step to={previous} direction="previous" blocked={blocked} />
      <Step to={next} direction="next" blocked={blocked} />
    </nav>
  );
}

function Step({ to, direction, blocked }: { to: WalkItem | null; direction: "previous" | "next"; blocked: string | null }) {
  const Caret = direction === "previous" ? CaretLeft : CaretRight;
  const name = direction === "previous" ? "Previous post" : "Next post";
  const shortcut = direction === "previous" ? "K" : "J";
  // 36px to look at, 44px to hit
  const look = "relative flex size-9 items-center justify-center rounded-full before:absolute before:-inset-1 before:rounded-full";
  if (!to || blocked)
    return (
      <span aria-hidden="true" title={to ? (blocked ?? undefined) : undefined} className={cx(look, "text-base-300")}>
        <Caret className="size-4" />
      </span>
    );
  return (
    <Link
      href={reviewHref(to.id)}
      aria-label={`${name}: ${to.label}`}
      aria-keyshortcuts={shortcut}
      title={`${to.label} (${shortcut})`}
      className={cx(look, "bg-base-50 text-base-900 ring-1 ring-base-200 transition-[background-color,scale] duration-150 hover:bg-base-100 active:scale-[0.96]")}
    >
      <Caret className="size-4" />
    </Link>
  );
}

function SlideViewer({ images, slide, onSlide, slides }: { images: string[]; slide: number; onSlide: (n: number) => void; slides: Map<number, SlideObservation> }) {
  const last = images.length - 1;
  const observation = slides.get(slide);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowLeft" && slide > 0) onSlide(slide - 1);
      if (event.key === "ArrowRight" && slide < last) onSlide(slide + 1);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [slide, last, onSlide]);

  return (
    <aside className="min-w-0 lg:sticky lg:top-27 lg:max-h-[calc(100dvh-7.5rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pb-2">
      <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-base-100">
        {images[slide] && <Image src={images[slide]} alt={`Slide at position ${slide}`} fill sizes="(min-width: 1024px) 416px, 100vw" className="object-contain" priority />}
        <p className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-caption text-white tabular-nums" aria-live="polite">
          Position {slide} · slide {slide + 1} of {images.length}
        </p>
        {slide > 0 && (
          <button type="button" aria-label="Previous slide" onClick={() => onSlide(slide - 1)} className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-[0.96]">
            <CaretLeft className="size-4" />
          </button>
        )}
        {slide < last && (
          <button type="button" aria-label="Next slide" onClick={() => onSlide(slide + 1)} className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 active:scale-[0.96]">
            <CaretRight className="size-4" />
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex scrollbar-hide gap-1.5 overflow-x-auto" role="group" aria-label="Slides">
          {images.map((src, i) => (
            <button key={src} type="button" aria-label={`Position ${i}`} aria-pressed={i === slide} onClick={() => onSlide(i)} className="relative aspect-4/5 w-11 shrink-0 overflow-hidden rounded-lg opacity-60 ring-base-900 transition-opacity hover:opacity-100 aria-pressed:opacity-100 aria-pressed:ring-2">
              <Image src={src} alt="" fill sizes="44px" className="object-cover" />
              <span className="absolute right-0.5 bottom-0.5 rounded bg-black/60 px-1 text-micro text-white tabular-nums">{i}</span>
            </button>
          ))}
        </div>
      )}
      {observation ? (
        <div className="mt-3 rounded-2xl bg-base-50 px-3.5 py-3 text-body text-base-700">
          <p className="text-caption text-base-500">
            Read off position {slide} · {label("slide_role", observation.role)} · {observation.confidence} confidence
          </p>
          {observation.visible_text?.headline && <p className="mt-2 font-medium text-base-900">“{observation.visible_text.headline}”</p>}
          {observation.visible_text?.body && <p className="mt-1">“{observation.visible_text.body}”</p>}
          <p className="mt-2 text-pretty">{observation.observation}</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-caption">
            {(
              [
                ["Type", observation.typography.classes.map((s) => label("typography", s)).join(", ") + ` (${label("type_weight", observation.typography.weight).toLowerCase()})`],
                ["Layout", observation.layout.map((s) => label("layout", s)).join(", ")],
                ["Imagery", observation.imagery.map((s) => label("imagery", s)).join(", ")],
                ["Devices", observation.devices.map((s) => label("visual_device", s)).join(", ") || "None"],
                ["Text", `${label("level", observation.text_density)} density, ${observation.legibility}`],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-base-500">{k}</dt>
                <dd className="text-base-800">{v}</dd>
              </div>
            ))}
          </dl>
          {observation.palette.hex.length > 0 && (
            <div className="mt-2 flex gap-1" aria-label={`Colours: ${observation.palette.families.join(", ")}`}>
              {observation.palette.hex.map((hex) => (
                <span key={hex} title={hex} className="size-5 rounded-full outline-1 -outline-offset-1 outline-edge" style={{ background: hex }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-2xl bg-base-50 px-3.5 py-3 text-caption text-base-500">No record of this slide in the selected version.</p>
      )}
    </aside>
  );
}

function quotesFor(dna: CreativeDna, ref: string) {
  return dna.evidence.filter((e) => e.ref === ref && e.quote).map((e) => e.quote!);
}

// The caption with the analysis's quotes from it marked
function Highlight({ text, quotes }: { text: string; quotes: string[] }) {
  const lower = text.toLowerCase();
  const marks: [number, number][] = [];
  for (const quote of quotes) {
    const at = lower.indexOf(quote.toLowerCase());
    if (at >= 0) marks.push([at, at + quote.length]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const [start, end] of marks) {
    if (start < at) continue;
    parts.push(text.slice(at, start), <mark key={start} className="rounded bg-base-200 text-base-900">{text.slice(start, end)}</mark>);
    at = end;
  }
  parts.push(text.slice(at));
  return <>{parts}</>;
}

function Refs({ refs, focus, onShow }: { refs: string[]; focus: string | null; onShow: (value: string) => void }) {
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {refs.map((ref) => (
        <EvidenceChip key={ref} value={ref} active={focus === ref} onShow={onShow} />
      ))}
    </span>
  );
}

// A data check's status in words, for the 3.0 statuses and the 2.1 ones they replaced
const STATUS_WORDS: Record<string, string> = {
  observed: "observed",
  potential_concern: "potential concern",
  cannot_verify: "cannot verify",
  sound: "sound (2.1)",
  concern: "concern (2.1)",
  unverified: "unverified (2.1)",
};

function DnaView({ dna, version, focus, onShow }: { dna: CreativeDna; version: Version; focus: string | null; onShow: (value: string) => void }) {
  const warnings = version.validation.warnings ?? [];
  return (
    <>
      <Section title="Summary">
        {/* Creative Intelligence 3.0: the strategy line the post page leads with */}
        {dna.strategy_headline && <p className="text-subtitle font-medium text-pretty text-base-900">{dna.strategy_headline}</p>}
        {dna.strategy_summary && <p className="mt-1 text-body text-pretty text-base-700">{dna.strategy_summary}</p>}
        <p className={cx("text-pretty text-base-800", dna.strategy_headline ? "mt-3 text-body" : "text-subtitle")}>{dna.creative_summary}</p>
        <p className="mt-2 text-body text-base-600">{dna.content_intent}</p>
      </Section>

      {/* Creative Intelligence 2.1 and 3.0: what the post page leads with, so it's reviewed first */}
      {dna.creative_decisions && dna.creative_decisions.length > 0 && (
        <Section title={`Creative decisions (${dna.creative_decisions.length})`}>
          <ol className="space-y-4">
            {dna.creative_decisions.map((d, i) => (
              <li key={i} className="text-body">
                <p className="font-medium text-pretty text-base-900">
                  <span className="mr-2 font-mono text-micro text-base-400">{String(i + 1).padStart(2, "0")}</span>
                  {d.title} <Refs refs={d.evidence} focus={focus} onShow={onShow} />
                  {d.confidence !== "high" && <span className="ml-2 text-caption font-normal text-base-500">{d.confidence} confidence</span>}
                </p>
                <dl className="mt-1.5 grid gap-x-3 gap-y-1 text-base-700 sm:grid-cols-[7.5rem_1fr]">
                  {(
                    [
                      ["Explanation", d.explanation],
                      ["Observed", d.observation],
                      ["Possible effect", d.rationale],
                      ["Principle", d.principle],
                      ["Watch out", d.watch_out],
                      ["Use it when", d.use_when],
                      ["Avoid it when", d.avoid_when],
                    ] as const
                  )
                    .filter(([, value]) => value)
                    .map(([name, value]) => (
                      <div key={name} className="contents">
                        <dt className="text-caption text-base-500">{name}</dt>
                        <dd className="text-pretty">{value}</dd>
                      </div>
                    ))}
                </dl>
              </li>
            ))}
          </ol>
          {dna.creative_formula && <p className="mt-4 text-body text-base-700"><span className="mr-2 text-caption text-base-500">Formula</span>{dna.creative_formula}</p>}
          {dna.application && (
            <dl className="mt-3 grid gap-x-3 gap-y-1 text-body text-base-700 sm:grid-cols-[7.5rem_1fr]">
              <dt className="text-caption text-base-500">When to use</dt>
              <dd className="text-pretty">{dna.application.when_to_use.join(" · ")}</dd>
              <dt className="text-caption text-base-500">When not to</dt>
              <dd className="text-pretty">{dna.application.when_not_to_use.join(" · ")}</dd>
            </dl>
          )}
          {dna.copywriting && <p className="mt-3 text-body text-pretty text-base-700"><span className="mr-2 text-caption text-base-500">Copywriting</span>{dna.copywriting}</p>}
        </Section>
      )}

      {dna.colour_roles && dna.colour_roles.length > 0 && (
        <Section title="Colours (measured)">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-body">
            {dna.colour_roles.map((c) => (
              <li key={c.hex} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-4 rounded outline-1 -outline-offset-1 outline-edge" style={{ background: c.hex }} />
                <span className="text-base-900">{c.role}</span>
                <span className="font-mono text-micro text-base-500 uppercase">{c.hex}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {dna.integrity_notes && dna.integrity_notes.length > 0 && (
        <Section title="Data checks">
          <ul className="space-y-2 text-body">
            {dna.integrity_notes.map((n, i) => (
              <li key={i} className="text-pretty text-base-800">
                <span className={cx("mr-2 text-caption", n.status === "concern" || n.status === "potential_concern" ? "font-medium text-danger-600" : "text-base-500")}>{STATUS_WORDS[n.status] ?? n.status}</span>
                <span className="font-medium">{n.aspect}:</span> {n.note} <Refs refs={n.evidence} focus={focus} onShow={onShow} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Classification">
        <dl className="grid gap-x-4 gap-y-2 text-body sm:grid-cols-[10rem_1fr]">
          <dt className="text-base-500">Primary archetype</dt>
          <dd className="text-base-900">
            {label("archetype", dna.primary_archetype.slug)} <Refs refs={dna.primary_archetype.evidence} focus={focus} onShow={onShow} />
          </dd>
          <dt className="text-base-500">Also</dt>
          <dd className="text-base-900">
            {dna.secondary_archetypes.length
              ? dna.secondary_archetypes.map((s) => (
                  <span key={s.slug} className="mr-3 inline-block">
                    {label("archetype", s.slug)} <Refs refs={s.evidence} focus={focus} onShow={onShow} />
                  </span>
                ))
              : "—"}
          </dd>
          <dt className="text-base-500">Objective</dt>
          <dd className="text-base-900">
            {label("objective", dna.marketing_objective.slug)} <Refs refs={dna.marketing_objective.evidence} focus={focus} onShow={onShow} />
          </dd>
          <dt className="text-base-500">Hook</dt>
          <dd className="text-base-900">
            {label("hook_technique", dna.hook.technique)}
            {dna.hook.observed_text && <span className="text-base-600"> · “{dna.hook.observed_text}” ({dna.hook.location})</span>}
            <Refs refs={dna.hook.evidence} focus={focus} onShow={onShow} />
          </dd>
          <dt className="text-base-500">Copy</dt>
          <dd className="text-base-900">
            {dna.copy_strategy.tone.map((t) => label("tone", t)).join(", ")} · {dna.copy_strategy.persuasion.map((p) => label("persuasion", p)).join(", ")} · call to action: {label("cta", dna.copy_strategy.cta).toLowerCase()}
          </dd>
          <dt className="text-base-500">Visual system</dt>
          <dd className="text-base-900">
            {[...dna.visual_system.composition.map((s) => label("layout", s)), ...dna.visual_system.typography.map((s) => label("typography", s)), ...dna.visual_system.imagery.map((s) => label("imagery", s))].join(", ")}
            <span className="block text-base-600">{dna.visual_system.text_hierarchy}</span>
            {dna.visual_notes &&
              (["composition", "typography", "colour", "imagery", "devices", "branding"] as const).map((key) =>
                dna.visual_notes?.[key] ? (
                  <span key={key} className="mt-1 block text-base-600">
                    <span className="text-caption text-base-500">{key}:</span> {dna.visual_notes[key]}
                  </span>
                ) : null,
              )}
          </dd>
        </dl>
      </Section>

      <Section title={`Narrative · ${label("narrative_pattern", dna.narrative.pattern)}`}>
        <p className="text-body text-pretty text-base-700">{dna.narrative.arc}</p>
        <ol className="mt-2 flex flex-wrap gap-1.5">
          {dna.narrative.slide_roles.map((s) => (
            <li key={s.position}>
              <button type="button" onClick={() => onShow(`slide:${s.position}`)} className="inline-flex h-7 items-center gap-1 rounded-full bg-base-50 px-2.5 text-caption text-base-700 ring-1 ring-base-200 hover:bg-base-100">
                <span className="font-mono text-micro text-base-500">{s.position}</span> {label("slide_role", s.role)}
              </button>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Why it might work (hypotheses)">
        <ul className="space-y-2 text-body text-base-800">
          {dna.creative_rationale.map((r, i) => (
            <li key={i} className="text-pretty">
              {r.hypothesis} <Refs refs={r.evidence} focus={focus} onShow={onShow} />
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1 text-body text-base-600">
          {dna.attention_mechanisms.map((m, i) => (
            <li key={i}>
              <span className="text-caption text-base-500">{m.kind}:</span> {m.statement} <Refs refs={m.evidence} focus={focus} onShow={onShow} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Takeaways">
        <ol className="list-decimal space-y-1 pl-5 text-body text-base-800 marker:text-base-400">
          {dna.takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <p className="mt-3 text-caption text-base-500">Adapting the principle</p>
        <ul className="mt-1 space-y-1 text-body text-base-700">
          {dna.adaptation_ideas.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Section>

      <Section title="Evidence">
        <ul className="space-y-1.5 text-body text-base-700">
          {dna.evidence.map((e, i) => (
            <li key={i} className="flex items-baseline gap-2">
              <EvidenceChip value={e.ref} active={focus === e.ref} onShow={onShow} />
              <span>
                {e.observation}
                {e.quote && <span className="text-base-500"> · “{e.quote}”</span>}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {(warnings.length > 0 || dna.constraints_or_uncertainties.length > 0 || dna.quality.uncertainties.length > 0) && (
        <Section title="Look at before approving">
          <ul className="space-y-1 text-body text-base-700">
            {warnings.map((w, i) => (
              <li key={`w${i}`}>
                {w.message}
                {w.path && <span className="font-mono text-micro text-base-500"> {w.path}</span>}
              </li>
            ))}
            {[...dna.constraints_or_uncertainties, ...dna.quality.uncertainties].map((u, i) => (
              <li key={`u${i}`}>{u}</li>
            ))}
          </ul>
        </Section>
      )}

      <p className="mt-6 text-caption text-base-500">
        v{version.version_no} · {version.model_id ?? "edited"} · prompt {version.prompt_version ?? "—"} · taxonomy {version.taxonomy_version} · {ago(version.created_at)}
        {version.review_note && <> · note: {version.review_note}</>}
      </p>
    </>
  );
}

const DIFF_FIELDS: [string, (dna: CreativeDna, v: Version) => string][] = [
  ["Concept", (d) => d.concept],
  ["Summary", (d) => d.creative_summary],
  ["Primary archetype", (d) => label("archetype", d.primary_archetype.slug)],
  ["Also", (d) => d.secondary_archetypes.map((s) => label("archetype", s.slug)).join(", ")],
  ["Objective", (d) => label("objective", d.marketing_objective.slug)],
  ["Hook", (d) => `${label("hook_technique", d.hook.technique)}${d.hook.observed_text ? ` · “${d.hook.observed_text}”` : ""}`],
  ["Narrative", (d) => `${label("narrative_pattern", d.narrative.pattern)}: ${d.narrative.slide_roles.map((s) => `${s.position} ${s.role}`).join(", ")}`],
  ["Why it might work", (d) => d.creative_rationale.map((r) => r.hypothesis).join("\n")],
  ["Takeaways", (d) => d.takeaways.join("\n")],
  ["Slides read", (_d, v) => `${v.processed_slides} of ${v.expected_slides}`],
];

function Diff({ a, b }: { a: Version; b: Version }) {
  const rows = DIFF_FIELDS.map(([name, get]) => [name, get(a.creative_dna, a), get(b.creative_dna, b)] as const).filter(([, x, y]) => x !== y);
  if (!rows.length) return <p className="mt-3 text-caption text-base-500">v{a.version_no} and v{b.version_no} say the same.</p>;
  return (
    <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-base-200">
      <div className="grid grid-cols-[8rem_1fr_1fr] gap-px bg-base-100 text-body">
        <div className="bg-white px-3 py-2 text-caption text-base-500" />
        <div className="bg-white px-3 py-2 text-caption font-medium text-base-700">v{a.version_no} (shown)</div>
        <div className="bg-white px-3 py-2 text-caption font-medium text-base-700">v{b.version_no}</div>
        {rows.map(([name, x, y]) => (
          <div key={name} className="contents">
            <div className="bg-white px-3 py-2 text-caption text-base-500">{name}</div>
            <div className="bg-white px-3 py-2 whitespace-pre-line text-base-900">{x || "—"}</div>
            <div className="bg-white px-3 py-2 whitespace-pre-line text-base-600">{y || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function History({ data }: { data: PostReview }) {
  if (!data.events.length && !data.runs.length && !data.jobs.length) return null;
  return (
    <Section title="History">
      <ul className="space-y-1 text-caption text-base-600">
        {data.events.map((e) => (
          <li key={e.id}>
            <span className="text-base-500">{ago(e.created_at)}</span> · {e.action.replace("_", " ")}
            {e.version_id && ` v${data.versions.find((v) => v.id === e.version_id)?.version_no ?? "?"}`}
            {e.note && ` · ${e.note}`}
          </li>
        ))}
        {data.runs.map((r) => (
          <li key={r.id} className={cx((r.status === "failed" || r.status === "invalid") && "text-danger-600")}>
            <span className="text-base-500">{ago(r.started_at)}</span> · run {r.status}
            {r.failure_kind && r.status !== "succeeded" && ` (${r.failure_kind})`} · {r.model_id ?? r.provider} · {r.model_calls ?? 0} calls · {money(r.estimated_cost_usd)} · {seconds(r.duration_ms)}
            {r.error && r.status !== "succeeded" && <span className="block truncate">{r.error}</span>}
          </li>
        ))}
        {data.jobs
          .filter((j) => j.state === "pending" || j.state === "leased" || j.state === "failed")
          .map((j) => (
            <li key={j.id} className={cx(j.state === "failed" && "text-danger-600")}>
              <span className="text-base-500">{ago(j.created_at)}</span> · job {j.state} ({j.reason}, attempt {j.attempts} of {j.max_attempts})
              {j.last_error && ` · ${j.last_failure_kind}: ${j.last_error}`}
            </li>
          ))}
      </ul>
    </Section>
  );
}
