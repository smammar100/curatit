"use client";

// Small pieces the review pages share: the page frame, status labels, section headings, evidence
// chips and the formatting of costs and times. Since 2026-10-24 on Glaze: the labels are Badges
// (Approved and Rejected the ok and fail outcomes, the rest outlined, Public on the grey field),
// the evidence chips are filter Chips pressed while theirs is on show, the page-level message is
// the title role, and the selects are Glaze's NativeSelect where they're used.
import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/glaze/ui/badge";
import { Chip } from "@/components/glaze/ui/chip";
import { term, type Dimension } from "@/lib/creative/taxonomy";
import { feedHref } from "../Feed";
import Header from "../Header";
import type { ReviewStatus, Source } from "./data";

export const reviewHref = (postId?: string) => (postId ? `/dashboard/review/${encodeURIComponent(postId)}` : "/dashboard/review");

export function Frame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  return (
    <>
      <Header
        view={null}
        onView={(view) => router.push(feedHref(view))}
        query={query}
        onQuery={setQuery}
        onSearch={(text) => router.push(feedHref("For you", text))}
      />
      <main className="px-4 pt-4 pb-24 sm:px-6">{children}</main>
    </>
  );
}

// Glaze's row and card links (ItemLink, CardLink) are plain anchors. This keeps a plain left
// click on one inside the app, as next/link would; a click with a modifier (a new tab, a new
// window) is left to the browser
export function useSoftNav() {
  const router = useRouter();
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = event.currentTarget.getAttribute("href");
    if (!href) return;
    event.preventDefault();
    router.push(href);
  };
}

export const label = (dimension: Dimension, slug: string | null | undefined) => (slug ? (term(dimension, slug)?.label ?? slug) : "—");

const STATUS: Record<ReviewStatus, string> = { draft: "Draft", needs_review: "Needs review", approved: "Approved", rejected: "Rejected" };
const SOURCE: Record<Source, string> = { ai: "Written by AI", human: "Written by an editor", mixed: "AI, edited by an editor" };

// A label: Glaze's Badge, outlined, on the grey field (strong), or an outcome (ok, fail)
export function Pill({ children, tone = "plain", title }: { children: ReactNode; tone?: "plain" | "strong" | "ok" | "danger"; title?: string }) {
  return (
    <Badge variant={tone === "strong" ? "neutral" : tone === "ok" ? "ok" : tone === "danger" ? "fail" : "outline"} title={title}>
      {children}
    </Badge>
  );
}

export const StatusPill = ({ status }: { status: ReviewStatus }) => <Pill tone={status === "approved" ? "ok" : status === "rejected" ? "danger" : "plain"}>{STATUS[status]}</Pill>;
export const SourcePill = ({ source }: { source: Source }) => <Pill>{SOURCE[source]}</Pill>;
export const sourceLabel = (source: Source) => SOURCE[source];

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mt-6 border-t border-line-faint pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="type-label-sm text-text-2">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// An evidence reference, as written in the analysis (slide:N is zero-based); pressing shows it.
// A filter Chip, on (the pressed wash, aria-pressed) while it's the one on show. The reference is
// what an editor reads back against the analysis, so it's set in mono
export function EvidenceChip({ value, onShow, active }: { value: string; onShow: (value: string) => void; active?: boolean }) {
  return (
    <Chip
      pressed={!!active}
      onPressedChange={() => onShow(value)}
      title={value.startsWith("slide:") ? `Show position ${value.slice(6)}` : value === "caption" ? "Show the caption" : "From the post's metadata"}
    >
      <span className="mono">{value}</span>
    </Chip>
  );
}

export const money = (usd: number | null | undefined) => (usd == null ? "—" : usd < 0.01 && usd > 0 ? "<$0.01" : `$${usd.toFixed(2)}`);
export const seconds = (ms: number | null | undefined) => (ms == null ? "—" : `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)}s`);

export function ago(iso: string | null | undefined) {
  if (!iso) return "—";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// A message that stands in for the whole page ("Editors only", "No such post"): the page's own
// heading in the title role over a line of explanation. Not an Alert, which sits beside
// content; this is the page
export function PageMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <h1 className="type-title text-balance text-text-1">{title}</h1>
      {children && <div className="mt-3 type-body text-pretty text-text-2">{children}</div>}
    </div>
  );
}

export function useBusy() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function run(name: string, task: () => Promise<unknown>) {
    setBusy(name);
    setError(null);
    try {
      await task();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  }
  return { busy, error, setError, run };
}
