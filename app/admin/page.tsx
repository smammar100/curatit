import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import SlideArt from "@/components/product/SlideArt";
import Tag from "@/components/product/Tag";
import { formatDate } from "@/components/product/format";
import { curateAction } from "@/app/actions/admin";
import { isAdmin, requireViewer } from "@/lib/auth";
import { coverage, listQueue, type QueueView } from "@/lib/services/admin";
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

const tones = {
  muted: "bg-base-50 text-base-900 hover:bg-base-100 ring-1 ring-base-200",
  dark: "text-white bg-base-800 hover:bg-base-700",
  danger: "text-red-700 hover:bg-red-50 ring-1 ring-red-200",
};

function ActionButton({
  postId,
  view,
  action,
  label,
  tone = "muted",
}: {
  postId: string;
  view: string;
  action: string;
  label: string;
  tone?: keyof typeof tones;
}) {
  return (
    <form action={curateAction}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="view" value={view} />
      <button type="submit" name="action" value={action} className={`w-full h-8 px-3 rounded-lg text-xs font-medium ${tones[tone]}`}>
        {label}
      </button>
    </form>
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
    <section>
      <Wrapper variant="standard" className="pt-28 pb-24 lg:pt-32">
        <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
          Curation
        </Text>
        <p className="mt-2 max-w-2xl text-sm text-base-600">
          Shortlist candidates, publish after final QA, and remove anything with a credible dispute. Removal takes
          effect immediately across search, boards, and share links, and nothing republishes automatically.
        </p>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="pb-2 text-left text-xs font-medium uppercase tracking-wide text-base-500">
              Category coverage · ready = 60+ published, 4+ brands, 3+ objectives
            </caption>
            <thead className="text-xs text-base-500">
              <tr className="border-b border-base-200">
                <th scope="col" className="py-2 font-medium">Category</th>
                <th scope="col" className="py-2 font-medium">Brands</th>
                <th scope="col" className="py-2 font-medium">Published</th>
                <th scope="col" className="py-2 font-medium">Objectives</th>
                <th scope="col" className="py-2 font-medium">In review</th>
                <th scope="col" className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => (
                <tr key={cell.id} className="border-b border-base-100">
                  <th scope="row" className="py-2 font-normal text-base-900">{cell.name}</th>
                  <td className="py-2">{cell.brands}</td>
                  <td className="py-2">{cell.published}</td>
                  <td className="py-2">{cell.objectives}</td>
                  <td className="py-2">{cell.queued}</td>
                  <td className="py-2">{cell.ready ? <Tag tone="accent">Ready</Tag> : <Tag>Pilot</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Queue views">
          {views.map((item) => (
            <Link
              key={item.id}
              href={`/admin?view=${item.id}`}
              aria-current={item.id === view ? "page" : undefined}
              className={`h-9 px-4 inline-flex items-center rounded-lg text-sm font-medium ${
                item.id === view ? "text-white bg-base-800" : "bg-base-50 text-base-900 hover:bg-base-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div role="status" aria-live="polite" className="mt-4 min-h-5 text-sm">
          {kind === "ok" && <span className="text-accent-700">{pastTense[detail] ?? "Done"}.</span>}
          {kind === "error" && <span className="text-red-700">{detail}</span>}
        </div>

        {items.length === 0 ? (
          <p className="mt-6 rounded-lg bg-base-50 p-8 text-sm text-base-600">Nothing here.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="grid grid-cols-1 gap-4 rounded-lg bg-base-50 p-4 md:grid-cols-[1fr_14rem]">
                <div className="min-w-0">
                  <ul className="flex gap-2 overflow-x-auto pb-2" aria-label={`${item.slides.length} slides`}>
                    {item.slides.map((slide, index) => (
                      <li key={index} className="w-24 shrink-0 rounded overflow-hidden shadow-sm">
                        <SlideArt art={slide.art} alt={slide.alt} />
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-base-500">
                    <span className="font-medium text-base-900">{item.brandName}</span>
                    {item.brandIsDemo && <Tag tone="warning">Demo</Tag>}
                    <span>{termName("category", item.categoryId)}</span>
                    <span>· {item.mediaType}</span>
                    <span>· posted {formatDate(item.publishedAt)}</span>
                    <span>· captured {formatDate(item.capturedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-base-900">{item.hook ?? "No analysis yet"}</p>
                  {item.summary && <p className="mt-1 text-sm text-base-600">{item.summary}</p>}
                  {item.caption && <p className="mt-1 text-xs text-base-500">Caption: “{item.caption}”</p>}
                  {item.rejectionReason && <p className="mt-1 text-xs text-red-700">Rejected: {item.rejectionReason}</p>}
                  <p className="mt-2 text-[11px] text-base-400">
                    editorial: {item.editorialStatus} · processing: {item.processingStatus} · publication:{" "}
                    {item.publicationStatus}
                    {item.confidence !== null && ` · AI confidence ${item.confidence.toFixed(2)} (routing signal only)`}
                    {" · "}
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                      source
                    </a>
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {item.publicationStatus === "unpublished" && item.editorialStatus === "candidate" && (
                    <ActionButton postId={item.id} view={view} action="shortlist" label="Shortlist" tone="dark" />
                  )}
                  {item.publicationStatus === "unpublished" && item.editorialStatus === "shortlisted" && (
                    <ActionButton postId={item.id} view={view} action="publish" label="Publish after QA" tone="dark" />
                  )}
                  {item.publicationStatus === "unpublished" && item.editorialStatus !== "rejected" && (
                    <form action={curateAction} className="flex flex-col gap-1">
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
                        className="h-8 rounded-md px-2 text-xs ring-1 ring-base-200 border-transparent"
                      />
                      <button
                        type="submit"
                        name="action"
                        value="reject"
                        className="h-8 px-3 rounded-lg text-xs font-medium bg-white text-base-900 ring-1 ring-base-200 hover:bg-base-100"
                      >
                        Reject
                      </button>
                    </form>
                  )}
                  {item.publicationStatus === "published" && (
                    <ActionButton postId={item.id} view={view} action="remove" label="Remove (takedown)" tone="danger" />
                  )}
                  {item.publicationStatus === "removed" && (
                    <ActionButton postId={item.id} view={view} action="restore" label="Restore to review" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Wrapper>
    </section>
  );
}
