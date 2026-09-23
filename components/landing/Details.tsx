import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fontWeights } from "@/lib/font-weight";

/** The actual UI fragment each detail refers to, at real size. */
function Fragment({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div role="img" aria-label={label} className="pointer-events-none select-none">
      {children}
    </div>
  );
}

const details: { title: string; body: string; fragment: ReactNode; label: string }[] = [
  {
    title: "Private by default.",
    body: "Boards and notes are yours alone until you choose to share one.",
    label: "A board marked private",
    fragment: (
      <Badge variant="dot" color="gray">
        Only you
      </Badge>
    ),
  },
  {
    title: "Links that expire.",
    body: "Read-only links last up to 30 days. Revoking one stops it working immediately.",
    label: "A share link that expires in 7 days",
    fragment: (
      <Badge variant="dot" color="green">
        Expires in 7 days
      </Badge>
    ),
  },
  {
    title: "Credit, always.",
    body: "Every reference names its brand and links to the original post.",
    label: "Attribution link to the original post",
    fragment: (
      <span className="inline-flex items-center gap-0.5 text-[12px] text-muted-foreground">
        Original post by{" "}
        <span className="ml-1 text-foreground underline decoration-border underline-offset-[3px]">Stridewise</span>
        <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden="true" />
      </span>
    ),
  },
  {
    title: "Takedowns honoured.",
    body: "Remove a post once and it disappears everywhere: search, boards and shared links.",
    label: "A removed post, hidden everywhere",
    fragment: (
      <Badge variant="dot" color="red">
        Removed · hidden everywhere
      </Badge>
    ),
  },
];

export default function Details() {
  return (
    <section className="px-6 py-24 md:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 border-t border-border pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <h2 className="heading-section max-w-xs text-foreground">Safe to share with clients.</h2>
        <ul className="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          {details.map((detail) => (
            <li key={detail.title} className="flex flex-col items-start gap-3">
              <Fragment label={detail.label}>{detail.fragment}</Fragment>
              <p className="max-w-[34ch] text-[14px] leading-6 text-muted-foreground">
                <span className="text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                  {detail.title}
                </span>{" "}
                {detail.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
