"use client";

// Small pieces the review pages share: the page frame, status pills, section headings, evidence
// chips, the native select's recipe and the formatting of costs and times. Since 2026-10-23 on
// the design system: the pills are Badge, the evidence chips are pressed Buttons, the page-level
// message is the display role, and the selects wear the post page's field recipe (28px pill, the
// one stroke, the brand ring on focus) until there's a Select atom.
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import { term, type Dimension } from "@/lib/creative/taxonomy";
import { fontWeights } from "@/lib/font-weight";
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

// A status label: the shared Badge, outlined, inverted or danger
export function Pill({ children, tone = "plain", title }: { children: ReactNode; tone?: "plain" | "strong" | "danger"; title?: string }) {
  return (
    <Badge size="lg" variant={tone === "strong" ? "inverted" : tone === "danger" ? "danger" : "outline"} title={title}>
      {children}
    </Badge>
  );
}

export const StatusPill = ({ status }: { status: ReviewStatus }) => <Pill tone={status === "approved" ? "strong" : status === "rejected" ? "danger" : "plain"}>{STATUS[status]}</Pill>;
export const SourcePill = ({ source }: { source: Source }) => <Pill>{SOURCE[source]}</Pill>;
export const sourceLabel = (source: Source) => SOURCE[source];

export const semibold = { fontVariationSettings: fontWeights.semibold };

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="mt-6 border-t border-border pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-caption text-muted-foreground" style={semibold}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// An evidence reference, as written in the analysis (slide:N is zero-based); clicking shows it.
// A pressed Button: the ink while it's the one on show, the hairline otherwise
export function EvidenceChip({ value, onShow, active }: { value: string; onShow: (value: string) => void; active?: boolean }) {
  return (
    <Button
      variant={active ? "default" : "secondary"}
      size="xs"
      aria-pressed={active}
      onClick={() => onShow(value)}
      title={value.startsWith("slide:") ? `Show position ${value.slice(6)}` : value === "caption" ? "Show the caption" : "From the post's metadata"}
      className="font-mono"
    >
      {value}
    </Button>
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
// heading in the display role over a line of explanation. Not the Notice molecule, which is an
// inline banner beside content; this is the page
export function PageMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <h1 className="font-display text-display font-light text-balance text-foreground">{title}</h1>
      {children && <div className="mt-3 text-subtitle text-pretty text-muted-foreground">{children}</div>}
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

// The selects are native until the design system has a Select (a value in a form, which Menu
// leaves to the browser), so they wear the post page's field recipe: the Input's 28px pill, the
// one stroke, a faint hover tint, the card surface and the brand ring while focused, 16px on
// touch screens so iOS doesn't zoom. focus:outline-hidden takes off the ring @tailwindcss/forms
// draws on a focused select, which would sit over the brand ring
export const selectClass =
  "h-7 w-full rounded-full border-0 bg-transparent pr-8 pl-3 text-body pointer-coarse:text-[16px] text-foreground ring-1 ring-border transition-[box-shadow,background-color] duration-150 ease-out-quint hover:bg-hover focus:bg-surface-3 focus:ring-[var(--focus-ring)] focus:outline-hidden disabled:text-muted-foreground disabled:opacity-50";
