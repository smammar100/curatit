import type { Metadata } from "next";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
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
      <section>
        <Wrapper variant="narrow" className="py-48 text-center">
          <Text tag="h1" variant="displayMD" className="font-display font-light text-base-900">
            This link isn&rsquo;t available
          </Text>
          <p className="mt-4 text-sm text-base-600">
            It may have expired or been revoked by the person who shared it. Ask them for a new link.
          </p>
        </Wrapper>
      </section>
    );
  }

  track("shared_board_viewed", { success: true });
  const visible = board.items.filter((item) => item.available);
  const hidden = board.items.length - visible.length;

  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <p className="text-xs font-medium uppercase tracking-wide text-base-500">Shared reference board · read-only</p>
        <Text tag="h1" variant="displayLG" className="mt-3 font-display font-thin text-base-900 text-balance break-words">
          {board.title}
        </Text>
        <p className="mt-3 text-sm text-base-600">
          {visible.length} reference{visible.length === 1 ? "" : "s"} · link expires {formatDate(board.expiresAt)}
          {hidden > 0 && ` · ${hidden} no longer available`}
        </p>

        <ol className="group mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {visible.map((item, index) => (
            <li key={item.postId} className="peer duration-300 group-hover:opacity-30 hover:opacity-100 hover:peer-hover:opacity-30">
              <div className="rounded-lg bg-base-50 p-8">
                <div className="rounded overflow-hidden shadow">
                  <SlideArt art={item.cover} alt={item.coverAlt} />
                </div>
              </div>
              <p className="mt-3 text-xs text-base-500">
                {index + 1}. {item.brandName}
                {item.mediaType === "carousel" && ` · Carousel, ${item.slideCount} slides`}
              </p>
              <p className="mt-1 text-sm text-base-900">{item.hook}</p>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 inline-block text-xs text-accent-600 hover:text-base-900 underline"
              >
                Original post by {item.brandName} ↗
              </a>
            </li>
          ))}
        </ol>

        <p className="mt-16 text-xs text-base-500">
          References are credited to the brands that posted them. Made with{" "}
          <Link href="/" className="underline hover:text-base-900">
            Curatit
          </Link>
          .
        </p>
      </Wrapper>
    </section>
  );
}
