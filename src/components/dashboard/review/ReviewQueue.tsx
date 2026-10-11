"use client";

// The review queue, /dashboard/review: what Creative Intelligence has queued, drafted, published
// and failed, for editors. AI drafts wait here until an editor approves them; nothing an AI wrote
// is public before that. Analyses themselves run on a person's machine (npm run creative -- work),
// so the queue shows what's waiting for that, not a progress bar.
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { loadQueue, reprocess, useIsEditor, type Queue, type QueueRow } from "./data";
import { ago, Frame, label, money, Notice, Pill, quietButton, reviewHref, seconds, sourceLabel, StatusPill, useBusy } from "./parts";

const TABS = ["Needs review", "Failed", "Published", "Recent runs"] as const;
type Tab = (typeof TABS)[number];

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
      {editor === false ? <Notice title="Editors only">The analysis review is for Curatit&apos;s editors.</Notice> : <QueueView queue={queue} failed={failed} onRefresh={refresh} />}
    </Frame>
  );
}

export function QueueView({ queue, failed, onRefresh }: { queue: Queue | null; failed: string | null; onRefresh: () => void }) {
  const [tab, setTab] = useState<Tab>("Needs review");
  const counts = queue?.counts;
  const tiles: [string, number | undefined][] = [
    ["Queued", counts?.pending],
    ["Being analysed", counts?.leased],
    ["Needs review", counts?.needs_review],
    ["Approved, not public", counts?.approved],
    ["Published", counts?.published],
    ["Failed", counts?.failed],
  ];
  const lists: Record<Tab, number | undefined> = {
    "Needs review": queue?.review.length,
    Failed: queue?.failed.length,
    Published: queue?.published.length,
    "Recent runs": queue?.runs.length,
  };

  return (
    <>
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-display font-light text-base-900">Analysis review</h1>
        <p className="mt-1 max-w-2xl text-subtitle text-pretty text-base-500">
          AI drafts wait here until an editor approves them. Nothing is public before that, and a new analysis never replaces one you&apos;ve reviewed.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {tiles.map(([name, value]) => (
            <div key={name} className="flex min-w-0 flex-col-reverse rounded-2xl bg-base-50 px-3.5 py-3">
              <dt className="truncate text-caption text-base-500">{name}</dt>
              <dd className={cx("text-title font-medium tabular-nums", name === "Failed" && value ? "text-danger-600" : "text-base-900")}>{value ?? "–"}</dd>
            </div>
          ))}
        </dl>
        {queue?.oldestPending && (
          <p className="mt-2 text-caption text-base-500">
            Oldest queued {ago(queue.oldestPending)}. Run <code className="font-mono text-micro">npm run creative -- work</code> to analyse the queue.
          </p>
        )}

        <div role="tablist" aria-label="Lists" className="mt-8 flex flex-wrap gap-1.5">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-body font-medium text-base-600 transition-[background-color,color] duration-150 hover:bg-base-50 hover:text-base-900 aria-selected:bg-base-900 aria-selected:text-white"
            >
              {name}
              {lists[name] !== undefined && <span className="tabular-nums opacity-70">{lists[name]}</span>}
            </button>
          ))}
        </div>

        <div role="tabpanel" aria-label={tab} className="mt-4">
          {failed && <p className="rounded-2xl bg-danger-50 px-4 py-3 text-body text-danger-700">Couldn&apos;t load the queue: {failed}</p>}
          {!queue && !failed && <ListSkeleton />}
          {queue && tab === "Recent runs" && <Runs queue={queue} />}
          {queue && tab !== "Recent runs" && (
            <Rows
              rows={tab === "Needs review" ? queue.review : tab === "Failed" ? queue.failed : queue.published}
              empty={tab === "Needs review" ? "Nothing to review." : tab === "Failed" ? "No failed analyses." : "No published analyses yet."}
              onChange={onRefresh}
            />
          )}
        </div>
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-20 animate-pulse rounded-2xl bg-base-50" />
      ))}
    </ul>
  );
}

function Rows({ rows, empty, onChange }: { rows: QueueRow[]; empty: string; onChange: () => void }) {
  if (!rows.length) return <p className="rounded-2xl bg-base-50 px-4 py-6 text-center text-body text-base-500">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <Row key={row.post.id} row={row} onChange={onChange} />
      ))}
    </ul>
  );
}

function Row({ row, onChange }: { row: QueueRow; onChange: () => void }) {
  const { post, analysis, job, proposals } = row;
  const dna = analysis?.creative_dna;
  const { busy, error, run } = useBusy();
  return (
    <li className="relative flex items-center gap-3 rounded-2xl p-2 pr-3 ring-1 ring-base-200 transition-[background-color] duration-150 hover:bg-base-50">
      <div className="relative aspect-4/5 w-12 shrink-0 overflow-hidden rounded-lg bg-base-100 outline-1 -outline-offset-1 outline-edge">
        {post.images[0] && <Image src={post.images[0]} alt="" fill sizes="48px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-caption text-base-500">
          <span className="font-medium text-base-700">{post.brand}</span>
          <span>{post.category}</span>
          <span className="font-mono text-micro">{post.short_code}</span>
        </p>
        <Link href={reviewHref(post.id)} className="mt-0.5 block truncate text-subtitle font-medium text-base-900 after:absolute after:inset-0 after:rounded-2xl">
          {dna?.concept ?? (job ? "Analysis failed" : "No analysis yet")}
        </Link>
        {job?.state === "failed" ? (
          <p className="truncate text-caption text-danger-600">
            {job.last_failure_kind}: {job.last_error}
          </p>
        ) : (
          dna && <p className="truncate text-caption text-base-500">{label("archetype", dna.primary_archetype.slug)} · {label("objective", dna.marketing_objective.slug)}</p>
        )}
        {error && <p className="text-caption text-danger-600">{error}</p>}
      </div>
      <div className="relative z-10 flex shrink-0 items-center gap-1.5">
        {proposals > 0 && <Pill title="Newer analyses waiting beside the current one">{proposals} new</Pill>}
        {analysis && <span className="hidden sm:contents">{analysis.analysis_source !== "ai" && <Pill>{sourceLabel(analysis.analysis_source)}</Pill>}</span>}
        {analysis && <StatusPill status={analysis.review_status} />}
        {analysis?.published_at && <Pill tone="strong">Public</Pill>}
        {job?.state === "failed" && (
          <button type="button" className={cx(quietButton, "h-8 px-3")} disabled={busy !== null} onClick={() => run("retry", () => reprocess(post.id)).then((ok) => ok && onChange())}>
            {busy ? "Queuing…" : `Retry (${job.attempts}/${job.max_attempts})`}
          </button>
        )}
      </div>
    </li>
  );
}

function Runs({ queue }: { queue: Queue }) {
  if (!queue.runs.length) return <p className="rounded-2xl bg-base-50 px-4 py-6 text-center text-body text-base-500">No runs yet.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-base-200">
      <table className="w-full min-w-[40rem] text-left text-body">
        <thead className="text-caption text-base-500">
          <tr className="border-b border-base-100">
            {["When", "Post", "Result", "Slides", "Calls", "Est. cost", "Time"].map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-100 tabular-nums">
          {queue.runs.map((run) => (
            <tr key={run.id}>
              <td className="px-3 py-2 whitespace-nowrap text-base-500">{ago(run.started_at)}</td>
              <td className="max-w-48 truncate px-3 py-2">
                {run.post ? (
                  <Link href={reviewHref(run.post_id)} className="text-base-900 hover:text-accent-600">
                    {run.post.brand} · {run.post.short_code}
                  </Link>
                ) : (
                  run.post_id
                )}
              </td>
              <td className={cx("px-3 py-2", (run.status === "failed" || run.status === "invalid") && "text-danger-600")} title={run.error ?? undefined}>
                {run.status}
                {run.failure_kind && run.status !== "succeeded" ? ` · ${run.failure_kind}` : ""}
              </td>
              <td className="px-3 py-2">{run.expected_slides ? `${run.processed_slides ?? 0}/${run.expected_slides}` : "—"}</td>
              <td className="px-3 py-2">{run.model_calls ?? "—"}</td>
              <td className="px-3 py-2">{money(run.estimated_cost_usd)}</td>
              <td className="px-3 py-2">{seconds(run.duration_ms)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-base-100 px-3 py-2 text-caption text-base-500">
        Costs are the model provider&apos;s list-price estimates; on a Claude subscription they count against its usage limits rather than being billed.
      </p>
    </div>
  );
}
