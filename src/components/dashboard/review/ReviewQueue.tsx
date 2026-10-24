"use client";

// The review queue, /dashboard/review: what Creative Intelligence has queued, drafted, published
// and failed, for editors. AI drafts wait here until an editor approves them; nothing an AI wrote
// is public before that. Analyses themselves run on a person's machine (npm run creative -- work),
// so the queue shows what's waiting for that, not a progress bar.
//
// Since 2026-10-24 on Glaze: the counts as a DataList on its own panel (Glaze has no row of
// number tiles), the lists in Glaze's Tabs with a TabsCount each, a failed load as a fail Alert,
// the wait as Item-shaped skeletons through SkeletonSwap, an empty list as Empty, the posts as
// Items in an ItemGroup (the concept the row's link, brand, category and short code under it),
// Approve all as a Card with its actions in the footer, and the runs as a table on a Panel.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import TextLink from "@/components/fundations/elements/TextLink";
import { Alert, AlertDescription } from "@/components/glaze/ui/alert";
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
import { Card, CardContent, CardFooter } from "@/components/glaze/ui/card";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/glaze/ui/empty-state";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemMedia, ItemTitle } from "@/components/glaze/ui/item";
import { Panel } from "@/components/glaze/ui/panel";
import { Skeleton, SkeletonSwap, SkeletonText } from "@/components/glaze/ui/skeleton";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/glaze/ui/tabs";
import { Failed, Icon } from "@/components/glaze/icon";
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
  sourceLabel,
  StatusPill,
  useBusy,
  useSoftNav,
} from "./parts";
import { saveWalk, walkOf } from "./walk";

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
        <Alert status="fail" className="mb-3">
          <AlertDescription>Couldn&apos;t load the queue: {failed}</AlertDescription>
        </Alert>
      )}
      <SkeletonSwap loading={!queue && !failed} fallback={<ListSkeleton />} label="Loading the queue">
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
      </SkeletonSwap>
    </>
  );

  return (
    <>
      <div>
        <h1 className="type-title text-text-1">Analysis review</h1>
        <p className="mt-1 max-w-measure type-body text-pretty text-text-2">
          AI drafts wait here until an editor approves them. Nothing is public
          before that, and a new analysis never replaces one you&apos;ve
          reviewed.
        </p>

        {/* The counts, a label and a number a row; a number still loading holds its place */}
        <DataList variant="panel" className="mt-6 max-w-md">
          {tiles.map(([name, value]) => (
            <DataListItem key={name}>
              <DataListLabel>{name}</DataListLabel>
              <DataListValue className={cx("tabular-nums", name === "Failed" && value ? "text-fail-text" : undefined)}>
                {value ?? <Skeleton className="h-4 w-6" />}
              </DataListValue>
            </DataListItem>
          ))}
        </DataList>
        {queue?.oldestPending && (
          <p className="mt-2 type-caption text-text-2">
            Oldest queued {ago(queue.oldestPending)}. Run{" "}
            <code className="mono">npm run creative -- work</code>{" "}
            to analyse the queue.
          </p>
        )}

        <Tabs value={tab} onValueChange={(next) => setTab(next as List)} className="mt-7">
          <TabsList aria-label="Lists">
            {TABS.map((name) => (
              <TabsTrigger key={name} value={name}>
                {name}
                {lists[name] !== undefined && <TabsCount>{lists[name]}</TabsCount>}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((name) => (
            <TabsContent key={name} value={name} className="mt-3">
              {tab === name && shown}
            </TabsContent>
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
    <Card className="mb-3" aria-live="polite">
      <CardContent>
        {phase === "idle" && (
          <p className="type-body-sm text-text-2">
            {n} {n === 1 ? "analysis is" : "analyses are"} waiting.
          </p>
        )}
        {phase === "confirm" && (
          <p className="type-body-sm text-text-1">
            Publish all {n}? Each goes live as it is. Any of them can be
            unpublished afterwards.
          </p>
        )}
        {phase === "running" && (
          <p className="type-body-sm text-text-1 tabular-nums">
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
              "type-body-sm",
              progress.failed ? "text-fail-text" : "text-text-1",
            )}
          >
            Published {progress.done} of {n}.
            {progress.failed
              ? ` ${progress.failed} failed: ${progress.error}`
              : ""}
          </p>
        )}
      </CardContent>
      {phase === "idle" && (
        <CardFooter>
          <Button size="sm" onClick={() => setPhase("confirm")}>
            Approve and publish all {n}
          </Button>
        </CardFooter>
      )}
      {phase === "confirm" && (
        <CardFooter>
          <Button variant="secondary" size="sm" onClick={() => setPhase("idle")}>
            Cancel
          </Button>
          <Button size="sm" onClick={run}>
            Publish all {n}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// An empty list: one line saying which list is empty
function EmptyList({ children }: { children: ReactNode }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{children}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

// Three rows shaped like the posts': the thumbnail, the title and two lines under it
function ListSkeleton() {
  return (
    <ItemGroup aria-label="Loading the queue">
      {[0, 1, 2].map((i) => (
        <Item key={i}>
          <ItemMedia>
            <Skeleton className="aspect-4/5 w-12" />
          </ItemMedia>
          <ItemContent>
            <SkeletonText type="label" className="w-1/2" />
            <SkeletonText type="body-sm" lines={2} />
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
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
  if (!rows.length) return <EmptyList>{empty}</EmptyList>;
  return (
    <ItemGroup aria-label="Posts">
      {rows.map((row) => (
        <Row key={row.post.id} row={row} onChange={onChange} />
      ))}
    </ItemGroup>
  );
}

function Row({ row, onChange }: { row: QueueRow; onChange: () => void }) {
  const { post, analysis, job, proposals } = row;
  const dna = analysis?.creative_dna;
  const { busy, error, run } = useBusy();
  const navigate = useSoftNav();
  return (
    <Item>
      {/* The cover, 4:5, with the image's hairline drawn over it */}
      <ItemMedia>
        <div className="relative aspect-4/5 w-12 overflow-hidden rounded-(--corner-xs) bg-field after:pointer-events-none after:absolute after:inset-0 after:rounded-(--corner-xs) after:border after:border-line-faint">
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
      </ItemMedia>
      <ItemContent>
        {/* The row's one link, covering it */}
        <ItemTitle>
          <ItemLink href={reviewHref(post.id)} onClick={navigate}>
            {dna?.concept ?? (job ? "Analysis failed" : "No analysis yet")}
          </ItemLink>
        </ItemTitle>
        <ItemDescription className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-text-1">{post.brand}</span>
          <span className="truncate">{post.category}</span>
          <span className="type-code-xs">{post.short_code}</span>
        </ItemDescription>
        {job?.state === "failed" ? (
          <ItemDescription className="truncate text-fail-text">
            {job.last_failure_kind}: {job.last_error}
          </ItemDescription>
        ) : (
          dna && (
            <ItemDescription className="truncate">
              {label("archetype", dna.primary_archetype.slug)} ·{" "}
              {label("objective", dna.marketing_objective.slug)}
            </ItemDescription>
          )
        )}
        {error && (
          <ItemDescription className="flex items-center gap-1.5 text-fail-text">
            <Icon icon={Failed} />
            {error}
          </ItemDescription>
        )}
      </ItemContent>
      <div className="relative z-(--z-raised) flex shrink-0 items-center gap-1.5">
        {proposals > 0 && (
          <Badge variant="outline" title="Newer analyses waiting beside the current one">
            {proposals} new
          </Badge>
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
      </div>
      {job?.state === "failed" && (
        <ItemActions>
          <Button
            variant="secondary"
            size="sm"
            pending={busy !== null}
            pendingLabel="Queuing"
            onClick={() =>
              run("retry", () => reprocess(post.id)).then(
                (ok) => ok && onChange(),
              )
            }
          >
            Retry ({job.attempts}/{job.max_attempts})
          </Button>
        </ItemActions>
      )}
    </Item>
  );
}

function Runs({ queue }: { queue: Queue }) {
  if (!queue.runs.length) return <EmptyList>No runs yet.</EmptyList>;
  return (
    <Panel padding="none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-start type-body-sm">
          <thead className="type-label-sm text-text-2">
            <tr className="border-b border-line-faint">
              {[
                "When",
                "Post",
                "Result",
                "Slides",
                "Calls",
                "Est. cost",
                "Time",
              ].map((h) => (
                <th key={h} scope="col" className="px-3 py-2 text-start">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-faint tabular-nums">
            {queue.runs.map((run) => (
              <tr key={run.id}>
                <td className="px-3 py-2 whitespace-nowrap text-text-2">
                  {ago(run.started_at)}
                </td>
                <td className="max-w-48 truncate px-3 py-2 text-text-1">
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
                      "text-fail-text",
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
      </div>
      <p className="border-t border-line-faint px-3 py-2 type-caption text-text-2">
        Costs are the model provider&apos;s list-price estimates; on a Claude
        subscription they count against its usage limits rather than being
        billed.
      </p>
    </Panel>
  );
}
