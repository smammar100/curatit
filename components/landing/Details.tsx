import type { ReactNode } from "react";
import { EyeOff, Link2, Lock } from "lucide-react";

/** The actual UI fragment each detail refers to, at real size. */
function Fragment({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} className="pointer-events-none select-none">
      {children}
    </div>
  );
}

const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium";

const details: { title: string; body: string; fragment: ReactNode; label: string }[] = [
  {
    title: "Private by default.",
    body: "Boards and notes are yours alone until you choose to share one.",
    label: "A board marked private",
    fragment: (
      <span className={`${pill} bg-surface-sunken text-ink-muted ring-1 ring-line`}>
        <Lock size={12} aria-hidden="true" /> Private
      </span>
    ),
  },
  {
    title: "Links that expire.",
    body: "Read-only links last up to 30 days. Revoking one stops it working immediately.",
    label: "A share link that expires in 7 days",
    fragment: (
      <span className={`${pill} bg-brand-soft text-accent-700 ring-1 ring-inset ring-accent-100`}>
        <Link2 size={12} aria-hidden="true" /> Expires in 7 days
      </span>
    ),
  },
  {
    title: "Credit, always.",
    body: "Every reference names its brand and links to the original post.",
    label: "Attribution link to the original post",
    fragment: (
      <span className="text-xs text-ink-muted">
        Original post by <span className="font-medium text-ink underline decoration-line underline-offset-2">Stridewise</span> ↗
      </span>
    ),
  },
  {
    title: "Takedowns honoured.",
    body: "Remove a post once and it disappears everywhere: search, boards and shared links.",
    label: "A removed post, hidden everywhere",
    fragment: (
      <span className={`${pill} bg-surface-sunken text-ink-subtle ring-1 ring-line`}>
        <EyeOff size={12} aria-hidden="true" /> Removed · hidden everywhere
      </span>
    ),
  },
];

export default function Details() {
  return (
    <section className="px-8 py-24 md:px-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 border-t border-line pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <h2 className="max-w-xs font-display text-3xl font-light leading-tight text-ink">
          Safe to share with clients.
        </h2>
        <ul className="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          {details.map((detail) => (
            <li key={detail.title} className="flex flex-col gap-3">
              <Fragment label={detail.label}>{detail.fragment}</Fragment>
              <p className="max-w-[34ch] text-sm text-ink-muted">
                <span className="font-medium text-ink">{detail.title}</span> {detail.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
