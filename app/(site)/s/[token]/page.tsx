import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
import SlideArt from "@/components/product/SlideArt";
import { formatDate } from "@/components/product/format";
import { getSharedBoard } from "@/lib/services/boards";
import { track } from "@/lib/services/events";

// Never cache: expiry and revocation are rechecked on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared board",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SharedBoardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const board = getSharedBoard(token);

  if (!board) {
    return (
      <Wrapper variant="standard" className="pb-24">
        <div className="flex max-w-md flex-col items-start gap-2 pb-12 pt-24 sm:pt-28">
          <h1 className="heading-display text-balance text-foreground">This link isn&rsquo;t available</h1>
          <p className="text-[14px] leading-6 text-muted-foreground">
            It may have expired or been revoked by the person who shared it. Ask them for a new link.
          </p>
        </div>
      </Wrapper>
    );
  }

  track("shared_board_viewed", { success: true });
  const visible = board.items.filter((item) => item.available);
  const hidden = board.items.length - visible.length;

  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader
        eyebrow="Shared reference board, read-only"
        title={board.title}
        description={
          <span className="tabular-nums">
            {visible.length} reference{visible.length === 1 ? "" : "s"} · link expires {formatDate(board.expiresAt)}
            {hidden > 0 && ` · ${hidden} no longer available`}
          </span>
        }
      />

      <ol className="grid grid-cols-1 gap-x-6 gap-y-10 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((item, index) => (
          <li key={item.postId} className="flex min-w-0 flex-col">
            <div className="overflow-hidden rounded-[2px] shadow-surface-1">
              <SlideArt art={item.cover} alt={item.coverAlt} />
            </div>
            <p className="mt-3 text-[12px] tabular-nums text-muted-foreground">
              {index + 1}. {item.brandName}
              {item.mediaType === "carousel" && ` · Carousel, ${item.slideCount} slides`}
            </p>
            <p className="mt-1 text-[14px] leading-6 text-foreground">{item.hook}</p>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-1 inline-flex w-fit items-center gap-1 text-[12px] text-foreground underline decoration-border underline-offset-[3px] transition-colors duration-80 hover:decoration-foreground"
            >
              Original post by {item.brandName}
              <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-16 text-[12px] text-muted-foreground">
        References are credited to the brands that posted them. Made with{" "}
        <Link
          href="/"
          className="text-foreground underline decoration-border underline-offset-[3px] transition-colors duration-80 hover:decoration-foreground"
        >
          Curatit
        </Link>
        .
      </p>
    </Wrapper>
  );
}
