"use client";

// One post's analysis, /dashboard/review/<post id>: the slides on the left (with their zero-based
// positions and what was read off each), the Creative DNA on the right, every version of it, and
// the decisions. Evidence chips jump to the slide or the caption they cite. An editor approves
// (optionally publishing), rejects, reopens, unpublishes, edits (saved as a new version) or asks
// for a fresh analysis (filed as a proposal beside whatever has been reviewed). Previous and Next
// (or K and J) step through the queue list the post was opened from.
//
// Since 2026-10-24 on Glaze: the slide stage on the grey shell with its position and arrows in a
// row under it (Glaze puts no control over an image), the thumbnails as toggles, the slide record
// and the caption on the grey field, the decisions in a Card, the steps through the list and the
// slide arrows as icon Buttons, the version and slide-role chips as filter Chips pressed while
// theirs is on show, Compare with as a Field over a NativeSelect, a failed decision as a fail
// Alert, the wait as a page-shaped skeleton through SkeletonSwap, and the Instagram link as a
// TextLink. The post's brand, category and format sit under its title, not over it.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toggle } from "@base-ui/react/toggle";
import TextLink from "@/components/fundations/elements/TextLink";
import { Alert, AlertDescription } from "@/components/glaze/ui/alert";
import { Button } from "@/components/glaze/ui/button";
import { Card, CardContent } from "@/components/glaze/ui/card";
import { Chip } from "@/components/glaze/ui/chip";
import { Field, FieldLabel } from "@/components/glaze/ui/field";
import { Input } from "@/components/glaze/ui/input";
import { NativeSelect } from "@/components/glaze/ui/select";
import { Skeleton, SkeletonSwap, SkeletonText } from "@/components/glaze/ui/skeleton";
import { Check, ChevronLeft, ChevronRight, Icon } from "@/components/glaze/icon";
import { cx } from "@/lib/cx";
import type { CreativeDna, SlideObservation } from "@/lib/creative/schema";
import { refreshPostPage } from "@/app/dashboard/review/actions";
import { track } from "@/lib/analytics";
import {
  loadPostReview,
  reprocess,
  review,
  useIsEditor,
  type PostReview,
  type Version,
} from "./data";
import DnaEditor from "./DnaEditor";
import {
  ago,
  EvidenceChip,
  Frame,
  label,
  money,
  PageMessage,
  Pill,
  reviewHref,
  Section,
  seconds,
  sourceLabel,
  StatusPill,
  useBusy,
} from "./parts";
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

  let content = null;
  if (editor === false)
    content = (
      <PageMessage title="Editors only">
        The analysis review is for Curatit&apos;s editors.
      </PageMessage>
    );
  else if (failed)
    content = <PageMessage title="Couldn't load this analysis">{failed}</PageMessage>;
  else if (data === null)
    content = (
      <PageMessage title="No such post">
        The review covers posts in the library.
      </PageMessage>
    );
  else if (data) content = <PostReviewView data={data} onRefresh={refresh} />;
  return (
    <Frame>
      <SkeletonSwap loading={editor !== false && !failed && data === undefined} fallback={<PostSkeleton />} label="Loading the analysis">
        {content}
      </SkeletonSwap>
    </Frame>
  );
}

// The page's shape while it loads: the stage and its row on the left, the title, the labels, the
// decisions and a section on the right
function PostSkeleton() {
  return (
    <div className="flex max-w-288 flex-col gap-8 lg:flex-row">
      <div className="min-w-0 lg:w-104 lg:flex-none">
        <Skeleton className="aspect-4/5 w-full rounded-(--radius-float)" />
        <SkeletonText type="caption" className="mt-2 w-1/3" />
      </div>
      <div className="min-w-0 flex-1">
        <Skeleton className="h-(--control-sm) w-32 rounded-pill" />
        <SkeletonText type="heading" lines={2} className="mt-3" />
        <SkeletonText type="caption" className="mt-1 w-1/2" />
        <Skeleton className="mt-5 h-32 w-full rounded-panel" />
        <SkeletonText type="body-sm" lines={4} className="mt-6" />
      </div>
    </div>
  );
}

export function PostReviewView({
  data,
  onRefresh,
}: {
  data: PostReview;
  onRefresh: () => Promise<unknown>;
}) {
  const [versionId, setVersionId] = useState<string | null>(
    data.analysis?.current_version_id ?? data.versions[0]?.id ?? null,
  );
  const [compareId, setCompareId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  // What the last decision did to which version, shown with a link on to the next post while
  // that version is the one on screen
  const [done, setDone] = useState<{ versionId: string; text: string } | null>(
    null,
  );
  const { busy, error, run } = useBusy();
  // While one decision saves the others wait; the saving one keeps its name and shows its arc
  const waiting = (name: string) => !!busy && busy !== name;
  const walk = useWalk(data.post.id);
  // Arriving from another post (or a link), focus lands on this post's title, so a screen reader
  // says where you are and J / K carry on from here; never taken from anything already focused
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!document.activeElement || document.activeElement === document.body)
      title.current?.focus({ preventScroll: true });
  }, []);

  const { post, analysis } = data;
  const version =
    data.versions.find((v) => v.id === versionId) ??
    data.versions.find((v) => v.id === analysis?.current_version_id) ??
    data.versions[0] ??
    null;
  const compare =
    data.versions.find((v) => v.id === compareId && v.id !== version?.id) ??
    null;
  const slides = useMemo(
    () =>
      new Map(
        data.slides
          .filter((s) => s.version_id === version?.id)
          .map((row) => [row.position, row.observation]),
      ),
    [data, version],
  );
  const isCurrent = version && analysis?.current_version_id === version.id;
  // An undecided version older than the current one was passed over, not waiting
  const currentNo =
    data.versions.find((v) => v.id === analysis?.current_version_id)
      ?.version_no ?? null;
  const olderDraft = (v: {
    version_no: number;
    review_decision: string | null;
  }) => !v.review_decision && currentNo !== null && v.version_no < currentNo;
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
    if (position !== undefined)
      setSlide(Math.min(Number(position), post.images.length - 1));
    if (value === "caption")
      document
        .getElementById("review-caption")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const decide = (
    action: "approve" | "reject" | "reopen" | "unpublish",
    publish = false,
  ) => {
    if (!version) return;
    setDone(null);
    run(action + (publish ? "-publish" : ""), () =>
      review(version.id, action, { publish, note }),
    ).then((ok) => {
      if (!ok) return;
      setNote("");
      track("review_decision_recorded", { action, published: publish });
      setDone({ versionId: version.id, text: DONE[action](publish) });
      republish();
      refresh(version.id);
    });
  };

  return (
    <>
      <div className="flex max-w-288 flex-col gap-8 lg:flex-row">
        <SlideViewer
          images={post.images}
          slide={slide}
          onSlide={setSlide}
          slides={slides}
        />

        <div className="min-w-0 flex-1">
          <div className="flex min-h-9 items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              render={<Link href={reviewHref()} />}
              nativeButton={false}
            >
              <Icon icon={ChevronLeft} />
              Review queue
            </Button>
            {/* Not while a decision is saving: one that failed after you'd moved on would never show */}
            <ReviewNav
              {...walk}
              blocked={
                editing
                  ? "Save or cancel the edit first"
                  : busy
                    ? "Wait for this to save"
                    : null
              }
            />
          </div>
          <h1
            ref={title}
            tabIndex={-1}
            className="mt-3 type-title text-balance text-text-1"
          >
            {dna?.concept ?? "Not analysed yet"}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 type-caption text-text-2">
            <span className="font-medium text-text-1">{post.brand}</span>
            <span>{post.category}</span>
            <span>{post.format}</span>
            <TextLink variant="quiet" external href={post.url}>
              {post.short_code} on Instagram
            </TextLink>
          </p>

          {version && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {isCurrent && analysis ? (
                <StatusPill status={analysis.review_status} />
              ) : (
                <Pill>
                  {version.review_decision === "rejected"
                    ? "Rejected"
                    : version.review_decision === "approved"
                      ? "Approved earlier"
                      : olderDraft(version)
                        ? "Older draft"
                        : "Proposal"}
                </Pill>
              )}
              <Pill>{sourceLabel(version.source)}</Pill>
              {isCurrent && analysis?.published_at ? (
                <Pill tone="strong">Public</Pill>
              ) : (
                <Pill>Not public</Pill>
              )}
              <Pill
                tone={version.image_analysis_complete ? "plain" : "danger"}
                title="Slides the model was shown and recorded"
              >
                {version.image_analysis_complete
                  ? `All ${version.expected_slides} slides read`
                  : `Partial: ${version.processed_slides} of ${version.expected_slides} slides`}
              </Pill>
              {(version.validation.warnings?.length ?? 0) > 0 && (
                <Pill>
                  {version.validation.warnings!.length} checks to look at
                </Pill>
              )}
            </div>
          )}

          {/* Decisions */}
          {version && !editing && (
            <Card className="mt-5">
              <CardContent>
              <div className="flex flex-wrap gap-2">
                {(!isCurrent ||
                  analysis?.review_status !== "approved" ||
                  !analysis.published_at) && (
                  <Button
                    size="sm"
                    pending={busy === "approve-publish"}
                    pendingLabel="Publishing"
                    disabled={waiting("approve-publish")}
                    onClick={() => decide("approve", true)}
                  >
                    Approve and publish
                  </Button>
                )}
                {(!isCurrent || analysis?.review_status !== "approved") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    pending={busy === "approve"}
                    pendingLabel="Approving"
                    disabled={waiting("approve")}
                    onClick={() => decide("approve")}
                  >
                    Approve
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!!busy}
                  onClick={() => (setDone(null), setEditing(true))}
                >
                  Edit
                </Button>
                {version.review_decision !== "rejected" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    pending={busy === "reject"}
                    pendingLabel="Rejecting"
                    disabled={waiting("reject")}
                    onClick={() => decide("reject")}
                  >
                    Reject
                  </Button>
                )}
                {isCurrent && analysis?.review_status !== "needs_review" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!!busy}
                    onClick={() => decide("reopen")}
                  >
                    Reopen
                  </Button>
                )}
                {isCurrent && analysis?.published_at && (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!!busy}
                    onClick={() => decide("unpublish")}
                  >
                    Unpublish
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  pending={busy === "reprocess"}
                  pendingLabel="Queuing"
                  disabled={waiting("reprocess")}
                  title="Queue a fresh analysis; it lands as a proposal next to this one"
                  onClick={() => {
                    setDone(null);
                    run("reprocess", () => reprocess(post.id)).then((ok) => {
                      if (!ok) return;
                      track("analysis_reprocess_requested");
                      if (version)
                        setDone({
                          versionId: version.id,
                          text: "Queued a fresh analysis. It lands as a proposal next to this one.",
                        });
                      refresh();
                    });
                  }}
                >
                  Analyse again
                </Button>
              </div>
              {/* No visible label (the placeholder says what it's for), so a name of its own, no Field */}
              <Input
                aria-label="Note for the review history (optional)"
                value={note}
                onValueChange={setNote}
                maxLength={2000}
                autoComplete="off"
                placeholder="Note for the history (optional)"
                className="mt-3"
              />
              {error && (
                <Alert status="fail" className="mt-3">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div role="status">
                {done?.versionId === version.id && !busy && (
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 type-body-sm text-text-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon icon={Check} className="shrink-0" />
                      {done.text}
                    </span>
                    {walk.next && (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={reviewHref(walk.next.id)} />}
                        nativeButton={false}
                        className="-my-1"
                      >
                        Next: {walk.next.label}
                        <Icon icon={ChevronRight} />
                      </Button>
                    )}
                  </p>
                )}
              </div>
              </CardContent>
            </Card>
          )}

          {/* Versions */}
          {data.versions.length > 0 && (
            <Section title={`Versions (${data.versions.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {/* The shown version as a pressed Chip: on while it's the one on screen */}
                {data.versions.map((v) => (
                  <Chip
                    key={v.id}
                    pressed={v.id === versionId}
                    onPressedChange={() => (setVersionId(v.id), setEditing(false))}
                  >
                    v{v.version_no} ·{" "}
                    {v.source === "ai"
                      ? "AI"
                      : v.source === "mixed"
                        ? "edited"
                        : "editor"}
                    {analysis?.current_version_id === v.id && " · current"}
                    {v.review_decision
                      ? ` · ${v.review_decision}`
                      : olderDraft(v) && " · older draft"}
                  </Chip>
                ))}
              </div>
              {data.versions.length > 1 && version && (
                <Field className="mt-3 max-w-48">
                  <FieldLabel>Compare with</FieldLabel>
                  <NativeSelect
                    value={compareId ?? ""}
                    onChange={(e) => setCompareId(e.target.value || null)}
                  >
                    <option value="">nothing</option>
                    {data.versions
                      .filter((v) => v.id !== version.id)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          v{v.version_no}
                        </option>
                      ))}
                  </NativeSelect>
                </Field>
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
            dna &&
            version && (
              <DnaView
                dna={dna}
                version={version}
                focus={focus}
                onShow={show}
              />
            )
          )}

          <Section title="Caption">
            <p
              id="review-caption"
              className={cx(
                "rounded-panel border bg-field px-4 py-3 type-body-sm whitespace-pre-line text-text-2",
                focus === "caption" ? "border-line-strong" : "border-transparent",
              )}
            >
              {post.caption ? (
                <Highlight
                  text={post.caption}
                  quotes={dna ? quotesFor(dna, "caption") : []}
                />
              ) : (
                <span className="text-text-2">No caption.</span>
              )}
            </p>
          </Section>

          <History data={data} />
        </div>
      </div>
    </>
  );
}

const DONE: Record<
  "approve" | "reject" | "reopen" | "unpublish",
  (publish: boolean) => string
> = {
  approve: (publish) =>
    publish ? "Approved and published." : "Approved. Not public yet.",
  reject: () => "Rejected.",
  reopen: () => "Reopened for review.",
  unpublish: () => "Unpublished.",
};

// Previous and next in the list the post was opened from, with its place in it. K and J do the
// same from the keyboard (← and → already turn the slides). Off, with the reason on hover, while
// an edit is open (so a half-written edit isn't left behind) or a decision is saving.
function ReviewNav({
  walk,
  index,
  previous,
  next,
  ready,
  blocked,
}: ReturnType<typeof useWalk> & { blocked: string | null }) {
  const router = useRouter();
  useEffect(() => {
    if (blocked) return;
    function key(event: KeyboardEvent) {
      if (
        event.repeat ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          "input, textarea, select, [contenteditable], [role=menu], [role=dialog], dialog",
        )
      )
        return;
      // An open menu or dialog keeps the keyboard, wherever focus is
      if (document.querySelector("[role=menu], [role=dialog], dialog[open]"))
        return;
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
    <nav
      aria-label="Posts in this list"
      className="flex shrink-0 items-center gap-2"
    >
      <p className="type-caption whitespace-nowrap text-text-2 tabular-nums">
        <span className="max-sm:hidden">{walk.list} · </span>
        {index >= 0
          ? `${index + 1} of ${count}`
          : `${count} ${count === 1 ? "post" : "posts"}`}
      </p>
      <Step to={previous} direction="previous" blocked={blocked} />
      <Step to={next} direction="next" blocked={blocked} />
    </nav>
  );
}

function Step({
  to,
  direction,
  blocked,
}: {
  to: WalkItem | null;
  direction: "previous" | "next";
  blocked: string | null;
}) {
  const caret = direction === "previous" ? ChevronLeft : ChevronRight;
  const name = direction === "previous" ? "Previous post" : "Next post";
  const shortcut = direction === "previous" ? "K" : "J";
  // Nothing to go to, or not now: the same button, disabled, with the reason on hover
  if (!to || blocked)
    return (
      <Button
        variant="secondary"
        size="icon"
        disabled
        aria-label={name}
        title={to ? (blocked ?? undefined) : undefined}
      >
        <Icon icon={caret} />
      </Button>
    );
  return (
    <Button
      render={<Link href={reviewHref(to.id)} />}
      nativeButton={false}
      variant="secondary"
      size="icon"
      aria-label={`${name}: ${to.label}`}
      aria-keyshortcuts={shortcut}
      title={`${to.label} (${shortcut})`}
    >
      <Icon icon={caret} />
    </Button>
  );
}

function SlideViewer({
  images,
  slide,
  onSlide,
  slides,
}: {
  images: string[];
  slide: number;
  onSlide: (n: number) => void;
  slides: Map<number, SlideObservation>;
}) {
  const last = images.length - 1;
  const observation = slides.get(slide);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest("input, textarea, select, [contenteditable]")
      )
        return;
      if (event.key === "ArrowLeft" && slide > 0) onSlide(slide - 1);
      if (event.key === "ArrowRight" && slide < last) onSlide(slide + 1);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [slide, last, onSlide]);

  return (
    <aside className="min-w-0 lg:sticky lg:top-27 lg:max-h-[calc(100dvh-3*var(--space-10))] lg:w-104 lg:flex-none lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pb-2">
      {/* The stage: the slide on the grey shell, nothing over it. The position and the arrows sit
          in a row under it, the arrows Glaze's icon Buttons, off at either end */}
      <div className="relative aspect-4/5 overflow-hidden rounded-(--radius-float) bg-shell">
        {images[slide] && (
          <Image
            src={images[slide]}
            alt={`Slide at position ${slide}`}
            fill
            sizes="(min-width: 1024px) 416px, 100vw"
            className="object-contain"
            priority
          />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="type-caption text-text-2 tabular-nums" aria-live="polite">
          Position {slide} · slide {slide + 1} of {images.length}
        </p>
        {images.length > 1 && (
          <div className="flex gap-1">
            <Button variant="secondary" size="icon-sm" aria-label="Previous slide" disabled={slide === 0} onClick={() => onSlide(slide - 1)}>
              <Icon icon={ChevronLeft} />
            </Button>
            <Button variant="secondary" size="icon-sm" aria-label="Next slide" disabled={slide === last} onClick={() => onSlide(slide + 1)}>
              <Icon icon={ChevronRight} />
            </Button>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div
          className="mt-1 -mb-1 flex scrollbar-hide gap-1.5 overflow-x-auto py-1"
          role="group"
          aria-label="Slides"
        >
          {/* The thumbnails, toggles pressed while theirs is on the stage: the shown one in the
              strong line, the rest dimmed on the faint one, each with its zero-based position in
              the corner. Glaze has no image toggle, so this is Base UI's Toggle (Chip's own
              primitive) with Glaze's tokens, and Glaze's base draws its focus ring */}
          {images.map((src, i) => (
            <Toggle
              key={src}
              aria-label={`Position ${i}`}
              pressed={i === slide}
              onPressedChange={() => onSlide(i)}
              className={cx(
                "relative aspect-4/5 w-11 shrink-0 overflow-hidden rounded-(--corner-xs) border-2 transition-opacity duration-(--dur-state) ease-out",
                i === slide ? "border-line-strong" : "border-line-faint opacity-60 hover:opacity-100 focus-visible:opacity-100",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
              <span className="absolute end-0.5 bottom-0.5 rounded-tag bg-ink px-1 text-micro text-text-inverse tabular-nums">
                {i}
              </span>
            </Toggle>
          ))}
        </div>
      )}
      {observation ? (
        <div className="mt-3 rounded-panel bg-field px-4 py-3 type-body-sm text-text-2">
          <p className="type-caption text-text-2">
            Read off position {slide} · {label("slide_role", observation.role)}{" "}
            · {observation.confidence} confidence
          </p>
          {observation.visible_text?.headline && (
            <p className="mt-2 font-medium text-text-1">
              “{observation.visible_text.headline}”
            </p>
          )}
          {observation.visible_text?.body && (
            <p className="mt-1">“{observation.visible_text.body}”</p>
          )}
          <p className="mt-2 text-pretty">{observation.observation}</p>
          <dl className="mt-2 grid grid-cols-[fit-content(var(--label-col))_minmax(0,1fr)] gap-x-3 gap-y-0.5 type-caption">
            {(
              [
                [
                  "Type",
                  observation.typography.classes
                    .map((s) => label("typography", s))
                    .join(", ") +
                    ` (${label("type_weight", observation.typography.weight).toLowerCase()})`,
                ],
                [
                  "Layout",
                  observation.layout.map((s) => label("layout", s)).join(", "),
                ],
                [
                  "Imagery",
                  observation.imagery
                    .map((s) => label("imagery", s))
                    .join(", "),
                ],
                [
                  "Devices",
                  observation.devices
                    .map((s) => label("visual_device", s))
                    .join(", ") || "None",
                ],
                [
                  "Text",
                  `${label("level", observation.text_density)} density, ${observation.legibility}`,
                ],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-text-2">{k}</dt>
                <dd className="text-text-1">{v}</dd>
              </div>
            ))}
          </dl>
          {observation.palette.hex.length > 0 && (
            <div
              className="mt-2 flex gap-1"
              aria-label={`Colours: ${observation.palette.families.join(", ")}`}
            >
              {/* Each colour is data, so it reaches the swatch through a custom property */}
              {observation.palette.hex.map((hex) => (
                <span
                  key={hex}
                  title={hex}
                  className="size-5 rounded-full border border-line-faint bg-(--swatch)"
                  style={{ "--swatch": hex } as CSSProperties}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-panel bg-field px-4 py-3 type-caption text-text-2">
          No record of this slide in the selected version.
        </p>
      )}
    </aside>
  );
}



function quotesFor(dna: CreativeDna, ref: string) {
  return dna.evidence
    .filter((e) => e.ref === ref && e.quote)
    .map((e) => e.quote!);
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
    parts.push(
      text.slice(at, start),
      <mark
        key={start}
        className="rounded-tag bg-pressed text-text-1"
      >
        {text.slice(start, end)}
      </mark>,
    );
    at = end;
  }
  parts.push(text.slice(at));
  return <>{parts}</>;
}

function Refs({
  refs,
  focus,
  onShow,
}: {
  refs: string[];
  focus: string | null;
  onShow: (value: string) => void;
}) {
  return (
    <span className="ms-1 inline-flex flex-wrap gap-1 align-middle">
      {refs.map((ref) => (
        <EvidenceChip
          key={ref}
          value={ref}
          active={focus === ref}
          onShow={onShow}
        />
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

function DnaView({
  dna,
  version,
  focus,
  onShow,
}: {
  dna: CreativeDna;
  version: Version;
  focus: string | null;
  onShow: (value: string) => void;
}) {
  const warnings = version.validation.warnings ?? [];
  return (
    <>
      <Section title="Summary">
        {/* Creative Intelligence 3.0: the strategy line the post page leads with */}
        {dna.strategy_headline && (
          <p className="type-heading-sm text-pretty text-text-1">
            {dna.strategy_headline}
          </p>
        )}
        {dna.strategy_summary && (
          <p className="mt-1 type-body-sm text-pretty text-text-2">
            {dna.strategy_summary}
          </p>
        )}
        <p
          className={cx(
            "text-pretty text-text-1",
            dna.strategy_headline ? "mt-3 type-body-sm" : "type-body",
          )}
        >
          {dna.creative_summary}
        </p>
        <p className="mt-2 type-body-sm text-text-2">
          {dna.content_intent}
        </p>
      </Section>

      {/* Creative Intelligence 2.1 and 3.0: what the post page leads with, so it's reviewed first */}
      {dna.creative_decisions && dna.creative_decisions.length > 0 && (
        <Section
          title={`Creative decisions (${dna.creative_decisions.length})`}
        >
          <ol className="space-y-4">
            {dna.creative_decisions.map((d, i) => (
              <li key={i} className="type-body-sm">
                <p className="font-medium text-pretty text-text-1">
                  <span className="me-2 type-caption font-normal text-text-2 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {d.title}{" "}
                  <Refs refs={d.evidence} focus={focus} onShow={onShow} />
                  {d.confidence !== "high" && (
                    <span className="ms-2 type-caption font-normal text-text-2">
                      {d.confidence} confidence
                    </span>
                  )}
                </p>
                <dl className="mt-1.5 grid gap-x-3 gap-y-1 text-text-2 sm:grid-cols-[fit-content(var(--label-col))_minmax(0,1fr)]">
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
                        <dt className="type-caption text-text-2">
                          {name}
                        </dt>
                        <dd className="text-pretty">{value}</dd>
                      </div>
                    ))}
                </dl>
              </li>
            ))}
          </ol>
          {dna.creative_formula && (
            <p className="mt-4 type-body-sm text-text-2">
              <span className="me-2 type-caption text-text-2">
                Formula
              </span>
              {dna.creative_formula}
            </p>
          )}
          {dna.application && (
            <dl className="mt-3 grid gap-x-3 gap-y-1 type-body-sm text-text-2 sm:grid-cols-[fit-content(var(--label-col))_minmax(0,1fr)]">
              <dt className="type-caption text-text-2">
                When to use
              </dt>
              <dd className="text-pretty">
                {dna.application.when_to_use.join(" · ")}
              </dd>
              <dt className="type-caption text-text-2">
                When not to
              </dt>
              <dd className="text-pretty">
                {dna.application.when_not_to_use.join(" · ")}
              </dd>
            </dl>
          )}
          {dna.copywriting && (
            <p className="mt-3 type-body-sm text-pretty text-text-2">
              <span className="me-2 type-caption text-text-2">
                Copywriting
              </span>
              {dna.copywriting}
            </p>
          )}
        </Section>
      )}

      {dna.colour_roles && dna.colour_roles.length > 0 && (
        <Section title="Colours (measured)">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 type-body-sm">
            {dna.colour_roles.map((c) => (
              <li key={c.hex} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-4 rounded-tag border border-line-faint bg-(--swatch)"
                  style={{ "--swatch": c.hex } as CSSProperties}
                />
                <span className="text-text-1">{c.role}</span>
                <span className="type-code-xs text-text-2">
                  {c.hex}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {dna.integrity_notes && dna.integrity_notes.length > 0 && (
        <Section title="Data checks">
          <ul className="space-y-2 type-body-sm">
            {dna.integrity_notes.map((n, i) => (
              <li key={i} className="text-pretty text-text-1">
                <span
                  className={cx(
                    "me-2 type-caption",
                    n.status === "concern" || n.status === "potential_concern"
                      ? "font-medium text-fail-text"
                      : "text-text-2",
                  )}
                >
                  {STATUS_WORDS[n.status] ?? n.status}
                </span>
                <span className="font-medium">{n.aspect}:</span> {n.note}{" "}
                <Refs refs={n.evidence} focus={focus} onShow={onShow} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Classification">
        <dl className="grid gap-x-4 gap-y-2 type-body-sm sm:grid-cols-[fit-content(var(--label-col))_minmax(0,1fr)]">
          <dt className="text-text-2">Primary archetype</dt>
          <dd className="text-text-1">
            {label("archetype", dna.primary_archetype.slug)}{" "}
            <Refs
              refs={dna.primary_archetype.evidence}
              focus={focus}
              onShow={onShow}
            />
          </dd>
          <dt className="text-text-2">Also</dt>
          <dd className="text-text-1">
            {dna.secondary_archetypes.length
              ? dna.secondary_archetypes.map((s) => (
                  <span key={s.slug} className="me-3 inline-block">
                    {label("archetype", s.slug)}{" "}
                    <Refs refs={s.evidence} focus={focus} onShow={onShow} />
                  </span>
                ))
              : "—"}
          </dd>
          <dt className="text-text-2">Objective</dt>
          <dd className="text-text-1">
            {label("objective", dna.marketing_objective.slug)}{" "}
            <Refs
              refs={dna.marketing_objective.evidence}
              focus={focus}
              onShow={onShow}
            />
          </dd>
          <dt className="text-text-2">Hook</dt>
          <dd className="text-text-1">
            {label("hook_technique", dna.hook.technique)}
            {dna.hook.observed_text && (
              <span className="text-text-2">
                {" "}
                · “{dna.hook.observed_text}” ({dna.hook.location})
              </span>
            )}
            <Refs refs={dna.hook.evidence} focus={focus} onShow={onShow} />
          </dd>
          <dt className="text-text-2">Copy</dt>
          <dd className="text-text-1">
            {dna.copy_strategy.tone.map((t) => label("tone", t)).join(", ")} ·{" "}
            {dna.copy_strategy.persuasion
              .map((p) => label("persuasion", p))
              .join(", ")}{" "}
            · call to action:{" "}
            {label("cta", dna.copy_strategy.cta).toLowerCase()}
          </dd>
          <dt className="text-text-2">Visual system</dt>
          <dd className="text-text-1">
            {[
              ...dna.visual_system.composition.map((s) => label("layout", s)),
              ...dna.visual_system.typography.map((s) =>
                label("typography", s),
              ),
              ...dna.visual_system.imagery.map((s) => label("imagery", s)),
            ].join(", ")}
            <span className="block text-text-2">
              {dna.visual_system.text_hierarchy}
            </span>
            {dna.visual_notes &&
              (
                [
                  "composition",
                  "typography",
                  "colour",
                  "imagery",
                  "devices",
                  "branding",
                ] as const
              ).map((key) =>
                dna.visual_notes?.[key] ? (
                  <span key={key} className="mt-1 block text-text-2">
                    <span className="type-caption text-text-2">
                      {key}:
                    </span>{" "}
                    {dna.visual_notes[key]}
                  </span>
                ) : null,
              )}
          </dd>
        </dl>
      </Section>

      <Section
        title={`Narrative · ${label("narrative_pattern", dna.narrative.pattern)}`}
      >
        <p className="type-body-sm text-pretty text-text-2">
          {dna.narrative.arc}
        </p>
        <ol className="mt-2 flex flex-wrap gap-1.5">
          {dna.narrative.slide_roles.map((s) => (
            <li key={s.position}>
              {/* Each role shows its slide; a pressed Chip while that slide is the one on show */}
              <Chip
                pressed={focus === `slide:${s.position}`}
                onPressedChange={() => onShow(`slide:${s.position}`)}
              >
                <span className="text-text-2 tabular-nums">{s.position}</span>
                {label("slide_role", s.role)}
              </Chip>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Why it might work (hypotheses)">
        <ul className="space-y-2 type-body-sm text-text-1">
          {dna.creative_rationale.map((r, i) => (
            <li key={i} className="text-pretty">
              {r.hypothesis}{" "}
              <Refs refs={r.evidence} focus={focus} onShow={onShow} />
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-1 type-body-sm text-text-2">
          {dna.attention_mechanisms.map((m, i) => (
            <li key={i}>
              <span className="type-caption text-text-2">
                {m.kind}:
              </span>{" "}
              {m.statement}{" "}
              <Refs refs={m.evidence} focus={focus} onShow={onShow} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Takeaways">
        <ol className="list-decimal space-y-1 ps-5 type-body-sm text-text-1 marker:text-text-2">
          {dna.takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <p className="mt-3 type-caption text-text-2">
          Adapting the principle
        </p>
        <ul className="mt-1 space-y-1 type-body-sm text-text-2">
          {dna.adaptation_ideas.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Section>

      <Section title="Evidence">
        <ul className="space-y-1.5 type-body-sm text-text-2">
          {dna.evidence.map((e, i) => (
            <li key={i} className="flex items-baseline gap-2">
              <EvidenceChip
                value={e.ref}
                active={focus === e.ref}
                onShow={onShow}
              />
              <span>
                {e.observation}
                {e.quote && (
                  <span className="text-text-2">
                    {" "}
                    · “{e.quote}”
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {(warnings.length > 0 ||
        dna.constraints_or_uncertainties.length > 0 ||
        dna.quality.uncertainties.length > 0) && (
        <Section title="Look at before approving">
          <ul className="space-y-1 type-body-sm text-text-2">
            {warnings.map((w, i) => (
              <li key={`w${i}`}>
                {w.message}
                {w.path && (
                  <span className="mono text-text-2">
                    {" "}
                    {w.path}
                  </span>
                )}
              </li>
            ))}
            {[
              ...dna.constraints_or_uncertainties,
              ...dna.quality.uncertainties,
            ].map((u, i) => (
              <li key={`u${i}`}>{u}</li>
            ))}
          </ul>
        </Section>
      )}

      <p className="mt-6 type-caption text-text-2">
        v{version.version_no} · {version.model_id ?? "edited"} · prompt{" "}
        {version.prompt_version ?? "—"} · taxonomy {version.taxonomy_version} ·{" "}
        {ago(version.created_at)}
        {version.review_note && <> · note: {version.review_note}</>}
      </p>
    </>
  );
}

const DIFF_FIELDS: [string, (dna: CreativeDna, v: Version) => string][] = [
  ["Concept", (d) => d.concept],
  ["Summary", (d) => d.creative_summary],
  ["Primary archetype", (d) => label("archetype", d.primary_archetype.slug)],
  [
    "Also",
    (d) =>
      d.secondary_archetypes.map((s) => label("archetype", s.slug)).join(", "),
  ],
  ["Objective", (d) => label("objective", d.marketing_objective.slug)],
  [
    "Hook",
    (d) =>
      `${label("hook_technique", d.hook.technique)}${d.hook.observed_text ? ` · “${d.hook.observed_text}”` : ""}`,
  ],
  [
    "Narrative",
    (d) =>
      `${label("narrative_pattern", d.narrative.pattern)}: ${d.narrative.slide_roles.map((s) => `${s.position} ${s.role}`).join(", ")}`,
  ],
  [
    "Why it might work",
    (d) => d.creative_rationale.map((r) => r.hypothesis).join("\n"),
  ],
  ["Takeaways", (d) => d.takeaways.join("\n")],
  ["Slides read", (_d, v) => `${v.processed_slides} of ${v.expected_slides}`],
];

function Diff({ a, b }: { a: Version; b: Version }) {
  const rows = DIFF_FIELDS.map(
    ([name, get]) =>
      [name, get(a.creative_dna, a), get(b.creative_dna, b)] as const,
  ).filter(([, x, y]) => x !== y);
  if (!rows.length)
    return (
      <p className="mt-3 type-caption text-text-2">
        v{a.version_no} and v{b.version_no} say the same.
      </p>
    );
  return (
    <div className="mt-3 overflow-hidden rounded-panel border border-line-faint">
      {/* The cells on paper, ruled apart by the faint line showing through the gaps */}
      <div className="grid grid-cols-[fit-content(var(--label-col))_minmax(0,1fr)_minmax(0,1fr)] gap-px bg-line-faint type-body-sm">
        <div className="bg-paper px-3 py-2 type-caption text-text-2" />
        <div className="bg-paper px-3 py-2 type-label-sm text-text-1">
          v{a.version_no} (shown)
        </div>
        <div className="bg-paper px-3 py-2 type-label-sm text-text-1">
          v{b.version_no}
        </div>
        {rows.map(([name, x, y]) => (
          <div key={name} className="contents">
            <div className="bg-paper px-3 py-2 type-caption text-text-2">
              {name}
            </div>
            <div className="bg-paper px-3 py-2 whitespace-pre-line text-text-1">
              {x || "—"}
            </div>
            <div className="bg-paper px-3 py-2 whitespace-pre-line text-text-2">
              {y || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function History({ data }: { data: PostReview }) {
  if (!data.events.length && !data.runs.length && !data.jobs.length)
    return null;
  return (
    <Section title="History">
      <ul className="space-y-1 type-caption text-text-2">
        {data.events.map((e) => (
          <li key={e.id}>
            <span className="text-text-2">
              {ago(e.created_at)}
            </span> ·{" "}
            {e.action.replace("_", " ")}
            {e.version_id &&
              ` v${data.versions.find((v) => v.id === e.version_id)?.version_no ?? "?"}`}
            {e.note && ` · ${e.note}`}
          </li>
        ))}
        {data.runs.map((r) => (
          <li
            key={r.id}
            className={cx(
              (r.status === "failed" || r.status === "invalid") &&
                "text-fail-text",
            )}
          >
            <span className="text-text-2">
              {ago(r.started_at)}
            </span>{" "}
            · run{" "}
            {r.status}
            {r.failure_kind &&
              r.status !== "succeeded" &&
              ` (${r.failure_kind})`}{" "}
            · {r.model_id ?? r.provider} · {r.model_calls ?? 0} calls ·{" "}
            {money(r.estimated_cost_usd)} · {seconds(r.duration_ms)}
            {r.error && r.status !== "succeeded" && (
              <span className="block truncate">{r.error}</span>
            )}
          </li>
        ))}
        {data.jobs
          .filter(
            (j) =>
              j.state === "pending" ||
              j.state === "leased" ||
              j.state === "failed",
          )
          .map((j) => (
            <li
              key={j.id}
              className={cx(j.state === "failed" && "text-fail-text")}
            >
              <span className="text-text-2">
                {ago(j.created_at)}
              </span>{" "}
              · job{" "}
              {j.state} ({j.reason}, attempt {j.attempts} of {j.max_attempts})
              {j.last_error && ` · ${j.last_failure_kind}: ${j.last_error}`}
            </li>
          ))}
      </ul>
    </Section>
  );
}
