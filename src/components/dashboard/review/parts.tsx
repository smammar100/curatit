"use client";

// Small pieces the review pages share: the page frame, status pills, section headings, evidence
// chips, the selects' recipe and the formatting of costs and times.
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Badge from "@/components/fundations/elements/Badge";
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
const SOURCE: Record<Source, string> = { ai: "Written by AI", human: "Written by an editor", mixed: "AI, edited by an editor" };

// A status label: the shared Badge at 24px with round ends, outlined, inverted or danger
export function Pill({ children, tone = "plain", title }: { children: ReactNode; tone?: "plain" | "strong" | "danger"; title?: string }) {
  return (
    <Badge
      size="lg"
      shape="pill"
      variant={tone === "strong" ? "inverted" : tone === "danger" ? "danger" : "outline"}
      title={title}
    >
      {children}
    </Badge>
  );
}

export const StatusPill = ({ status }: { status: ReviewStatus }) => <Pill tone={status === "approved" ? "strong" : status === "rejected" ? "danger" : "plain"}>{STATUS[status]}</Pill>;
export const SourcePill = ({ source }: { source: Source }) => <Pill>{SOURCE[source]}</Pill>;
export const sourceLabel = (source: Source) => SOURCE[source];

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mt-6 border-t border-border-default pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-caption font-medium text-secondary-foreground">{title}</h2>
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
      className="inline-flex h-6 items-center rounded-full bg-card px-2 font-mono text-micro text-secondary-foreground ring-1 ring-border-default transition-[background-color,color] duration-150 ease-out-quint hover:bg-transparent-hover hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus aria-pressed:bg-inverted-solid aria-pressed:text-on-inverted-foreground"
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
      <h1 className="font-display text-display font-light text-balance text-primary-foreground">{title}</h1>
      {children && <div className="mt-3 text-subtitle text-pretty text-secondary-foreground">{children}</div>}
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

// The buttons are the shared Button (`default` for the main action, `secondary` for the rest, at
// size sm with round ends), the text fields the shared Field with Input and Textarea (since
// 2026-10-19). The selects are native until the design system has a Select, so they keep the
// field recipe's parts here (surface, default shadow, brand focus ring, 16px on touch screens so
// iOS doesn't zoom) at their own heights, in the dashboard's body role. focus:ring-0 takes off the
// 1px blue ring @tailwindcss/forms draws on a focused select, which would sit over the brand ring
const focusRing = "focus:shadow-[0_0_0_2px_var(--color-brand-border-focus)]";
export const fieldParts = `border-0 bg-component-on-container-subtle text-primary-foreground shadow-sm placeholder:text-tertiary-foreground transition-[box-shadow] duration-150 ease-out-quint focus:ring-0 focus:outline-hidden pointer-coarse:text-[16px] ${focusRing}`;
export const selectClass = `h-10 rounded-lg py-0 pr-8 pl-3 text-body ${fieldParts}`;
