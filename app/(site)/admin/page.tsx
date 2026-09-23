import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/fundations/containers/PageHeader";
import Wrapper from "@/components/fundations/containers/Wrapper";
import SlideArt from "@/components/product/SlideArt";
import { formatDate } from "@/components/product/format";
import { Badge, type BadgeColor } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { curateAction } from "@/app/actions/admin";
import { fontWeights } from "@/lib/font-weight";
import { isAdmin, requireViewer } from "@/lib/auth";
import { coverage, listQueue, type QueueItem, type QueueView } from "@/lib/services/admin";
import { termName } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Curation", robots: { index: false } };

const views: { id: QueueView; label: string }[] = [
  { id: "review", label: "Review queue" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
  { id: "removed", label: "Removed" },
];

const pastTense: Record<string, string> = {
  shortlist: "Shortlisted",
  reject: "Rejected",
  publish: "Published",
  remove: "Removed from search, boards, and share links",
  restore: "Restored to the review queue",
};

// One dot color per state, always paired with the state in words.
const editorialColor: Record<string, BadgeColor> = { candidate: "gray", shortlisted: "blue", rejected: "red" };
const processingColor: Record<string, BadgeColor> = { pending: "amber", ready: "green", failed: "red" };
const publicationColor: Record<string, BadgeColor> = { unpublished: "gray", published: "green", removed: "red" };

const sentence = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

// The plain-input recipe at the compact 28px step, so it lines up with the action buttons. The inset
// border hairline (instead of shadow-surface-1, which all but disappears in dark) pairs it with the
// tertiary Reject button underneath.
const inputClass =
  "h-7 w-full rounded-lg bg-background px-2.5 text-[12px] text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground outline-none focus-visible:ring-[color:var(--focus-ring,#6B97FF)]";

function ActionButton({
  postId,
  view,
  action,
  label,
  variant = "secondary",
  className,
}: {
  postId: string;
  view: string;
  action: string;
  label: string;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  return (
    <form action={curateAction}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="view" value={view} />
      <Button type="submit" name="action" value={action} variant={variant} size="compact" className={`w-full ${className ?? ""}`}>
        {label}
      </Button>
    </form>
  );
}

function Actions({ item, view }: { item: QueueItem; view: QueueView }) {
  const unpublished = item.publicationStatus === "unpublished";
  return (
    <div className="flex w-48 flex-col gap-2">
      {unpublished && item.editorialStatus === "candidate" && (
        <ActionButton postId={item.id} view={view} action="shortlist" label="Shortlist" variant="primary" />
      )}
      {unpublished && item.editorialStatus === "shortlisted" && (
        <ActionButton postId={item.id} view={view} action="publish" label="Publish after QA" variant="primary" />
      )}
      {unpublished && item.editorialStatus !== "rejected" && (
        <form action={curateAction} className="flex flex-col gap-2">
          <input type="hidden" name="postId" value={item.id} />
          <input type="hidden" name="view" value={view} />
          <label htmlFor={`reason-${item.id}`} className="sr-only">
            Rejection reason
          </label>
          <input
            id={`reason-${item.id}`}
            name="reason"
            required
            minLength={3}
            maxLength={300}
            placeholder="Rejection reason"
            className={inputClass}
          />
          <Button type="submit" name="action" value="reject" variant="tertiary" size="compact" className="w-full">
            Reject
          </Button>
        </form>
      )}
      {item.publicationStatus === "published" && (
        <ActionButton
          postId={item.id}
          view={view}
          action="remove"
          label="Remove (takedown)"
          variant="tertiary"
          className="text-destructive"
        />
      )}
      {item.publicationStatus === "removed" && (
        <ActionButton postId={item.id} view={view} action="restore" label="Restore to review" />
      )}
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; result?: string }>;
}) {
  const viewer = await requireViewer("/admin");
  // Non-admins get a 404 so the route's existence isn't confirmed.
  if (!isAdmin(viewer)) notFound();

  const params = await searchParams;
  const view = views.find((item) => item.id === params.view)?.id ?? "review";
  const items = listQueue(viewer, view);
  const cells = coverage(viewer);

  const result = params.result ?? "";
  const separator = result.indexOf(":");
  const kind = separator > 0 ? result.slice(0, separator) : "";
  const detail = separator > 0 ? result.slice(separator + 1, separator + 201) : "";

  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader
        title="Curation"
        description="Shortlist candidates, publish after final QA, and remove anything with a credible dispute. Removal takes effect at once across search, boards, and share links, and nothing republishes on its own."
      />

      <section aria-labelledby="coverage-heading">
        <h2 id="coverage-heading" className="heading-section text-foreground">
          Category coverage
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
          A category is ready at 60+ published posts, 4+ brands, and 3+ objectives.
        </p>
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[40rem]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Category</TableHead>
                  <TableHead scope="col" className="text-right">Brands</TableHead>
                  <TableHead scope="col" className="text-right">Published</TableHead>
                  <TableHead scope="col" className="text-right">Objectives</TableHead>
                  <TableHead scope="col" className="text-right">In review</TableHead>
                  <TableHead scope="col">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cells.map((cell, index) => (
                  <TableRow key={cell.id} index={index}>
                    <TableHead scope="row" style={{ fontVariationSettings: fontWeights.normal }}>
                      {cell.name}
                    </TableHead>
                    <TableCell className="text-right tabular-nums">{cell.brands}</TableCell>
                    <TableCell className="text-right tabular-nums">{cell.published}</TableCell>
                    <TableCell className="text-right tabular-nums">{cell.objectives}</TableCell>
                    <TableCell className="text-right tabular-nums">{cell.queued}</TableCell>
                    <TableCell>
                      {cell.ready ? (
                        <Badge variant="dot" color="green">
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="dot" color="gray">
                          Pilot
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section aria-labelledby="queue-heading" className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="queue-heading" className="heading-section text-foreground">
              Queue
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground tabular-nums">
              {items.length} {items.length === 1 ? "post" : "posts"} in this view
            </p>
          </div>
          <nav className="flex flex-wrap gap-1" aria-label="Queue views">
            {views.map((item) => (
              <Button
                key={item.id}
                asChild
                variant="ghost"
                size="compact"
                active={item.id === view}
                className={item.id === view ? "text-foreground" : undefined}
              >
                <Link href={`/admin?view=${item.id}`} aria-current={item.id === view ? "page" : undefined}>
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div role="status" aria-live="polite" className="mt-4 empty:hidden">
          {kind === "ok" && (
            <p className="rounded-xl bg-muted px-3 py-2.5 text-[13px] text-foreground">{pastTense[detail] ?? "Done"}.</p>
          )}
          {kind === "error" && (
            <p className="rounded-xl bg-destructive-light px-3 py-2.5 text-[13px] text-destructive">{detail}</p>
          )}
        </div>

        {items.length === 0 ? (
          <p className="mt-6 rounded-xl bg-muted px-3 py-2.5 text-[13px] text-muted-foreground">Nothing in this view.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[52rem]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Post</TableHead>
                    <TableHead scope="col" className="w-44">
                      State
                    </TableHead>
                    <TableHead scope="col" className="w-52">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id} index={index} className="align-top">
                      <TableCell className="py-4">
                        <div className="flex items-start gap-4">
                          <ul className="flex max-w-44 shrink-0 items-start gap-1.5 overflow-x-auto" aria-label={`${item.slides.length} slides`}>
                            {item.slides.map((slide, slideIndex) => (
                              <li key={slideIndex} className="w-12 shrink-0 overflow-hidden rounded-[2px] shadow-surface-1">
                                <SlideArt art={slide.art} alt={slide.alt} />
                              </li>
                            ))}
                          </ul>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-4 text-muted-foreground">
                              <span className="text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                                {item.brandName}
                              </span>
                              {item.brandIsDemo && (
                                <Badge variant="dot" color="amber" size="compact">
                                  Demo
                                </Badge>
                              )}
                              <span>{termName("category", item.categoryId)}</span>
                              <span>· {item.mediaType}</span>
                              <span className="tabular-nums">· posted {formatDate(item.publishedAt)}</span>
                              <span className="tabular-nums">· captured {formatDate(item.capturedAt)}</span>
                            </div>
                            <p
                              className="mt-2 text-[13px] leading-5 text-foreground"
                              style={{ fontVariationSettings: fontWeights.medium }}
                            >
                              {item.hook ?? "No analysis yet"}
                            </p>
                            {item.summary && <p className="mt-0.5 text-[13px] leading-5">{item.summary}</p>}
                            {item.caption && <p className="mt-1 text-[12px] leading-4">Caption: “{item.caption}”</p>}
                            {item.rejectionReason && (
                              <p className="mt-1 text-[12px] leading-4 text-destructive">Rejected: {item.rejectionReason}</p>
                            )}
                            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[12px] leading-4">
                              {item.confidence !== null && (
                                <span className="tabular-nums">
                                  AI confidence {item.confidence.toFixed(2)} (routing signal only)
                                </span>
                              )}
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="inline-flex items-center gap-0.5 text-foreground underline decoration-border underline-offset-[3px] hover:decoration-foreground"
                              >
                                Source
                                <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden="true" />
                              </a>
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <ul className="flex flex-col items-start gap-1.5" aria-label="State">
                          <li>
                            <Badge variant="dot" color={editorialColor[item.editorialStatus] ?? "gray"} size="compact">
                              {sentence(item.editorialStatus)}
                            </Badge>
                          </li>
                          <li>
                            <Badge variant="dot" color={processingColor[item.processingStatus] ?? "gray"} size="compact">
                              Analysis {item.processingStatus}
                            </Badge>
                          </li>
                          <li>
                            <Badge variant="dot" color={publicationColor[item.publicationStatus] ?? "gray"} size="compact">
                              {sentence(item.publicationStatus)}
                            </Badge>
                          </li>
                        </ul>
                      </TableCell>
                      <TableCell className="py-4">
                        <Actions item={item} view={view} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>
    </Wrapper>
  );
}
