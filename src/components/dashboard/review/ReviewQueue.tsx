"use client";

// The review queue, /dashboard/review: what Creative Intelligence has queued, drafted, published
// and failed, for editors. AI drafts wait here until an editor approves them; nothing an AI wrote
// is public before that. Analyses themselves run on a person's machine (npm run creative -- work),
// so the queue shows what's waiting for that, not a progress bar.
//
// Since 2026-10-23 on the design system, after the post page's Card look: the counts as quiet
// grey tiles (bg-muted, the first step of depth), the lists in the shared Tabs, a failed load as
// a Notice, the wait as Skeleton rows, an empty list as EmptyState with the cleared-queue drawing,
// each post a ruled row with a 10px-cornered thumbnail, and the runs as a table in one hairline.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/fundations/elements/Button";
import Skeleton from "@/components/fundations/elements/Skeleton";
import TextLink from "@/components/fundations/elements/TextLink";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import Card from "@/components/fundations/molecules/Card";
import EmptyState from "@/components/fundations/molecules/EmptyState";
import Notice from "@/components/fundations/molecules/Notice";
import Tabs, {
  Tab,
  TabList,
  TabPanel,
} from "@/components/fundations/molecules/Tabs";
import { cx } from "@/lib/cx";
import { refreshPostPage } from "@/app/dashboard/review/actions";
import { track } from "@/lib/analytics";
import {
  loadQueue,
  reprocess,
  review,
  useIsEditor,
  type Queue,
  type QueueRow,
} from "./data";
import {
  ago,
  Frame,
  label,
  money,
  PageMessage,
  Pill,
  reviewHref,
  seconds,
  semibold,
  sourceLabel,
  StatusPill,
  useBusy,
} from "./parts";
import { saveWalk, walkOf } from "./walk";
import { ReviewArt } from "../EmptyArt";

const TABS = ["Needs review", "Failed", "Published", "Recent runs"] as const;
type List = (typeof TABS)[number];

export default function ReviewQueue() {
  const editor = useIsEditor();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const refresh = useCallback(() => {
    loadQueue()
      .then(setQueue)
      .catch((error: Error) => setFailed(error.message));
  }, []);
  useEffect(() => {
    if (editor) refresh();
  }, [editor, refresh]);

  return (
    <Frame>
      {editor === false ? (
        <PageMessage title="Editors only">
          The analysis review is for Curatit&apos;s editors.
        </PageMessage>
      ) : (
        <QueueView queue={queue} failed={failed} onRefresh={refresh} />
      )}
    </Frame>
  );
}

export function QueueView({
  queue,
  failed,
  onRefresh,
}: {
  queue: Queue | null;
  failed: string | null;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState<List>("Needs review");
  const counts = queue?.counts;
  const tiles: [string, number | undefined][] = [
    ["Queued", counts?.pending],
    ["Being analysed", counts?.leased],
    ["Needs review", counts?.needs_review],
    ["Approved, not public", counts?.approved],
    ["Published", counts?.published],
    ["Failed", counts?.failed],
  ];
  // The list a post opened from here steps through with Previous and Next
  useEffect(() => {
    if (!queue) return;
    const rows =
      tab === "Needs review"
        ? queue.review
        : tab === "Failed"
          ? queue.failed
          : tab === "Published"
            ? queue.published
            : null;
    saveWalk(
      walkOf(
        tab,
        rows
          ? rows.map((row) => row.post)
          : queue.runs.flatMap((run) => (run.post ? [run.post] : [])),
      ),
    );
  }, [queue, tab]);
  const lists: Record<List, number | undefined> = {
    "Needs review": queue?.review.length,
    Failed: queue?.failed.length,
    Published: queue?.published.length,
    "Recent runs": queue?.runs.length,
  };

  // The open list, rendered only while its tab is selected
  const shown: ReactNode = (
    <>
      {failed && (
        <Notice tone="danger" live className="mb-3">
          Couldn&apos;t load the queue: {failed}
        </Notice>
      )}
      {!queue && !failed && <ListSkeleton />}
      {queue && tab === "Recent runs" && <Runs queue={queue} />}
      {queue && tab === "Needs review" && queue.review.length > 1 && (
        <ApproveAll rows={queue.review} onDone={onRefresh} />
      )}
      {queue && tab !== "Recent runs" && (
        <Rows
          rows={
            tab === "Needs review"
              ? queue.review
              : tab === "Failed"
                ? queue.failed
                : queue.published
          }
          empty={
            tab === "Needs review"
              ? "Nothing to review."
              : tab === "Failed"
                ? "No failed analyses."
                : "No published analyses yet."
          }
          onChange={onRefresh}
        />
      )}
    </>
  );

  return (
    <>
      <div>
        <h1 className="font-display text-display font-light text-foreground">
          Analysis review
        </h1>
        <p className="mt-1 max-w-2xl text-subtitle text-pretty text-muted-foreground">
          AI drafts wait here until an editor approves them. Nothing is public
          before that, and a new analysis never replaces one you&apos;ve
          reviewed.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map(([name, value]) => (
            <div
              key={name}
              className="flex min-w-0 flex-col-reverse rounded-[20px] bg-muted px-4 py-3 shadow-surface-1"
            >
              <dt className="truncate text-caption text-muted-foreground">
                {name}
              </dt>
              <dd
                className={cx(
                  "text-title tabular-nums",
                  name === "Failed" && value
                    ? "text-destructive"
                    : "text-foreground",
                )}
                style={semibold}
              >
                {value ?? "–"}
              </dd>
            </div>
          ))}
        </dl>
        {queue?.oldestPending && (
          <p className="mt-2 text-caption text-muted-foreground">
            Oldest queued {ago(queue.oldestPending)}. Run{" "}
            <code className="font-mono text-micro">
              npm run creative -- work
            </code>{" "}
            to analyse the queue.
          </p>
        )}

        {/* The shared Tabs: one tab stop, ← / → / Home / End marked handled so the dashboard's
            own arrow handlers leave them be; the row wraps on a narrow screen */}
        <Tabs value={tab} onValueChange={setTab} className="mt-7">
          <TabList aria-label="Lists" wrap>
            {TABS.map((name) => (
              <Tab key={name} value={name} count={lists[name]}>
                {name}
              </Tab>
            ))}
          </TabList>
          {TABS.map((name) => (
            <TabPanel key={name} value={name} className="mt-3">
              {tab === name && shown}
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </>
  );
}

// Approve and publish everything waiting for review in one go (2026-10-15, after an import of
// 55 posts: the owner reviews a whole import at once, and one by one took the afternoon). It asks
// first, in place, then records each decision through the same creative_review call the Approve
// button makes, so every post gets its review event and its page is rebuilt, and says how it went.
function ApproveAll({
  rows,
  onDone,
}: {
  rows: QueueRow[];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "confirm" | "running" | "done">(
    "idle",
  );
  const [progress, setProgress] = useState({
    done: 0,
    failed: 0,
    total: 0,
    error: "",
  });
  const targets = rows.flatMap((row) =>
    row.analysis?.current_version_id
      ? [
          {
            versionId: row.analysis.current_version_id,
            shortCode: row.post.short_code,
          },
        ]
      : [],
  );

  async function run() {
    setPhase("running");
    let done = 0;
    let failed = 0;
    let error = "";
    setProgress({ done, failed, total: targets.length, error });
    for (const target of targets) {
      try {
        await review(target.versionId, "approve", {
          publish: true,
          note: "Approved with the rest of the import",
        });
        track("review_decision_recorded", {
          action: "approve",
          published: true,
          bulk: true,
        });
        void refreshPostPage(target.shortCode).catch(() => {});
        done += 1;
      } catch (e) {
        failed += 1;
        error ||= (e as Error).message;
      }
      setProgress({ done, failed, total: targets.length, error });
    }
    setPhase("done");
    onDone();
  }

  const n = targets.length;
  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[20px] bg-muted px-4 py-3 shadow-surface-1"
      aria-live="polite"
    >
      {phase === "idle" && (
        <>
          <p className="text-body text-muted-foreground">
            {n} {n === 1 ? "analysis is" : "analyses are"} waiting.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => setPhase("confirm")}
          >
            Approve and publish all {n}
          </Button>
        </>
      )}
      {phase === "confirm" && (
        <>
          <p className="text-body text-foreground">
            Publish all {n}? Each goes live as it is. Any of them can be
            unpublished afterwards.
          </p>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={run}>
              Publish all {n}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPhase("idle")}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
      {phase === "running" && (
        <p className="text-body text-foreground tabular-nums">
          Publishing{" "}
          {progress.done + progress.failed + 1 > n
            ? n
            : progress.done + progress.failed + 1}{" "}
          of {n}…
        </p>
      )}
      {phase === "done" && (
        <p
          className={cx(
            "text-body",
            progress.failed
              ? "text-destructive"
              : "text-foreground",
          )}
        >
          Published {progress.done} of {n}.
          {progress.failed
            ? ` ${progress.failed} failed: ${progress.error}`
            : ""}
        </p>
      )}
    </div>
  );
}

// An empty list: the cleared-queue drawing over one line saying which list is empty
function Empty({ children }: { children: ReactNode }) {
  return (
    <Card variant="mat" padding="sm">
      <EmptyState illustration={<ReviewArt className="w-56" />} title={children} />
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading the queue" className="space-y-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} radius="lg" className="h-20" />
      ))}
    </div>
  );
}

function Rows({
  rows,
  empty,
  onChange,
}: {
  rows: QueueRow[];
  empty: string;
  onChange: () => void;
}) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <Row key={row.post.id} row={row} onChange={onChange} />
      ))}
    </ul>
  );
}

// The hairline round a picture, drawn over it so the image can't cover it (as CardMedia does)
const edge =
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline-1 after:-outline-offset-1 after:outline-border";

function Row({ row, onChange }: { row: QueueRow; onChange: () => void }) {
  const { post, analysis, job, proposals } = row;
  const dna = analysis?.creative_dna;
  const { busy, error, run } = useBusy();
  return (
    <li className="relative flex items-center gap-3 rounded-[20px] p-2 pr-3 ring-1 ring-border transition-[background-color] duration-80 hover:bg-hover">
      <div className={cx("relative aspect-4/5 w-12 shrink-0 overflow-hidden rounded-[10px] bg-muted", edge)}>
        {post.images[0] && (
          <Image
            src={post.images[0]}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-caption text-muted-foreground">
          <span className="text-foreground" style={semibold}>
            {post.brand}
          </span>
          <span>{post.category}</span>
          <span className="font-mono text-micro">{post.short_code}</span>
        </p>
        {/* The row's one link, stretched over it; the focus ring goes round the row */}
        <Link
          href={reviewHref(post.id)}
          className="mt-0.5 block truncate text-subtitle text-foreground outline-none after:absolute after:inset-0 after:rounded-[20px] focus-visible:after:outline-1 focus-visible:after:outline-offset-2 focus-visible:after:outline-[color:var(--focus-ring)]"
          style={semibold}
        >
          {dna?.concept ?? (job ? "Analysis failed" : "No analysis yet")}
        </Link>
        {job?.state === "failed" ? (
          <p className="truncate text-caption text-destructive">
            {job.last_failure_kind}: {job.last_error}
          </p>
        ) : (
          dna && (
            <p className="truncate text-caption text-muted-foreground">
              {label("archetype", dna.primary_archetype.slug)} ·{" "}
              {label("objective", dna.marketing_objective.slug)}
            </p>
          )
        )}
        {error && (
          <p className="flex items-center gap-1.5 text-caption text-destructive">
            <WarningCircle className="size-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
      <div className="relative z-10 flex shrink-0 items-center gap-1.5">
        {proposals > 0 && (
          <Pill title="Newer analyses waiting beside the current one">
            {proposals} new
          </Pill>
        )}
        {analysis && (
          <span className="hidden sm:contents">
            {analysis.analysis_source !== "ai" && (
              <Pill>{sourceLabel(analysis.analysis_source)}</Pill>
            )}
          </span>
        )}
        {analysis && <StatusPill status={analysis.review_status} />}
        {analysis?.published_at && <Pill tone="strong">Public</Pill>}
        {job?.state === "failed" && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() =>
              run("retry", () => reprocess(post.id)).then(
                (ok) => ok && onChange(),
              )
            }
          >
            {busy ? "Queuing…" : `Retry (${job.attempts}/${job.max_attempts})`}
          </Button>
        )}
      </div>
    </li>
  );
}

function Runs({ queue }: { queue: Queue }) {
  if (!queue.runs.length) return <Empty>No runs yet.</Empty>;
  return (
    <div className="overflow-x-auto rounded-[20px] ring-1 ring-border">
      <table className="w-full min-w-[40rem] text-left text-body">
        <thead className="text-caption text-muted-foreground">
          <tr className="border-b border-border">
            {[
              "When",
              "Post",
              "Result",
              "Slides",
              "Calls",
              "Est. cost",
              "Time",
            ].map((h) => (
              <th key={h} scope="col" className="px-3 py-2" style={semibold}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border tabular-nums">
          {queue.runs.map((run) => (
            <tr key={run.id}>
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                {ago(run.started_at)}
              </td>
              <td className="max-w-48 truncate px-3 py-2 text-foreground">
                {run.post ? (
                  <TextLink href={reviewHref(run.post_id)}>
                    {run.post.brand} · {run.post.short_code}
                  </TextLink>
                ) : (
                  run.post_id
                )}
              </td>
              <td
                className={cx(
                  "px-3 py-2",
                  (run.status === "failed" || run.status === "invalid") &&
                    "text-destructive",
                )}
                title={run.error ?? undefined}
              >
                {run.status}
                {run.failure_kind && run.status !== "succeeded"
                  ? ` · ${run.failure_kind}`
                  : ""}
              </td>
              <td className="px-3 py-2">
                {run.expected_slides
                  ? `${run.processed_slides ?? 0}/${run.expected_slides}`
                  : "—"}
              </td>
              <td className="px-3 py-2">{run.model_calls ?? "—"}</td>
              <td className="px-3 py-2">{money(run.estimated_cost_usd)}</td>
              <td className="px-3 py-2">{seconds(run.duration_ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-caption text-muted-foreground">
        Costs are the model provider&apos;s list-price estimates; on a Claude
        subscription they count against its usage limits rather than being
        billed.
      </p>
    </div>
  );
}
