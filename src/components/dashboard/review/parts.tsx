"use client";

// Small pieces the review pages share: the page frame, status pills, section headings, evidence
// chips and the formatting of costs and times.
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cx } from "@/lib/cx";
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

export const label = (dimension: Dimension, slug: string | null | undefined) => (slug ? (term(dimension, slug)?.label ?? slug) : "—");

const STATUS: Record<ReviewStatus, string> = { draft: "Draft", needs_review: "Needs review", approved: "Approved", rejected: "Rejected" };
const SOURCE: Record<Source, string> = { ai: "AI draft", human: "Written by an editor", mixed: "AI, edited" };

export function Pill({ children, tone = "plain", title }: { children: ReactNode; tone?: "plain" | "strong" | "danger"; title?: string }) {
  return (
    <span
      title={title}
      className={cx(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-caption font-medium whitespace-nowrap",
        tone === "strong" && "bg-base-900 text-white",
        tone === "plain" && "bg-base-50 text-base-700 ring-1 ring-base-200",
        tone === "danger" && "bg-danger-50 text-danger-700",
      )}
    >
      {children}
    </span>
  );
}

export const StatusPill = ({ status }: { status: ReviewStatus }) => <Pill tone={status === "approved" ? "strong" : status === "rejected" ? "danger" : "plain"}>{STATUS[status]}</Pill>;
export const SourcePill = ({ source }: { source: Source }) => <Pill>{SOURCE[source]}</Pill>;
export const sourceLabel = (source: Source) => SOURCE[source];

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mt-6 border-t border-base-100 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-caption font-medium text-base-500">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// An evidence reference, as written in the analysis (slide:N is zero-based); clicking shows it
export function EvidenceChip({ value, onShow, active }: { value: string; onShow: (value: string) => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onShow(value)}
      aria-pressed={active}
      title={value.startsWith("slide:") ? `Show position ${value.slice(6)}` : value === "caption" ? "Show the caption" : "From the post's metadata"}
      className="inline-flex h-6 items-center rounded-full bg-base-50 px-2 font-mono text-micro text-base-700 ring-1 ring-base-200 transition-[background-color,color] duration-150 hover:bg-base-100 hover:text-base-900 aria-pressed:bg-base-900 aria-pressed:text-white"
    >
      {value}
    </button>
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

export function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <h1 className="font-display text-display font-light text-balance text-base-900">{title}</h1>
      {children && <div className="mt-3 text-subtitle text-pretty text-base-500">{children}</div>}
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

// The dashboard's two button looks: solid for the main action, quiet for the rest
export const solidButton =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-base-900 px-4 text-body font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96] disabled:bg-base-100 disabled:text-base-500";
export const quietButton =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-base-50 px-4 text-body font-medium text-base-900 ring-1 ring-base-200 transition-[background-color,scale] duration-150 hover:bg-base-100 active:scale-[0.96] disabled:text-base-400";
