import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
// Fundations
import Text from "@/components/fundations/elements/Text";
import BaseLayout from "@/layouts/BaseLayout";
import { getSharedBoard } from "@/lib/boards";
import ShareHeader from "./share-header";

// A board's read-only link, the one the homepage's board demo shows: anyone with it sees the
// board's posts and notes, signed in or not. Read on every request, so a link that's been
// turned off stops working at once. Not indexed. Since 2026-10-24 on Glaze: the covers on the
// panel corner over the field grey with the image hairline, the brand's mark on the tag corner,
// the words in text-1 and text-2 (the brand in the label weight), Make your own board a small
// primary Button, and "Shared board, Read-only" moved from above the title to the line under it
// with the count (Glaze puts no label above a title). Every focus ring is Glaze's own.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

// A public page shows members' own words: direction overrides (U+202A–202E, U+2066–2069) are taken
// out, so no one can make a name or note read backwards, and one long word wraps rather than
// widening the page (2026-10-28, from a QA run)
const plain = (text: string) => text.replace(/[‪-‮⁦-⁩]/g, "");
const wrap = "[overflow-wrap:anywhere]";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const board = await getSharedBoard((await params).token);
  return { title: board ? plain(board.name) : { absolute: "Curatit" }, robots: { index: false, follow: false } };
}

export default async function SharedBoardPage({ params }: Props) {
  const board = await getSharedBoard((await params).token);
  if (!board) notFound();
  const count = board.posts.length;

  return (
    <BaseLayout hideNavigation hideFooter>
      <div className="min-h-dvh bg-page">
        <ShareHeader />
        <main className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-3xl pt-6 pb-12 text-center">
            <Text tag="h1" variant="h1" className={`text-balance text-text-1 ${wrap}`}>
              {plain(board.name)}
            </Text>
            {board.description && (
              <Text className={`mx-auto mt-4 max-w-xl text-pretty whitespace-pre-line text-text-2 ${wrap}`}>{plain(board.description)}</Text>
            )}
            <Text variant="bodySM" className="mt-3 text-text-2 tabular-nums">
              Shared board · Read-only · {count} {count === 1 ? "reference" : "references"}
            </Text>
          </div>
          {count ? (
            // Plain CSS columns: the page has no client code of its own, and order matters less here
            <ul className="columns-2 gap-6 md:columns-3 lg:gap-8 xl:columns-4">
              {board.posts.map((post) => {
                const name = post.brand?.name ?? (post.owner ? `@${post.owner}` : "Instagram");
                return (
                  <li key={post.shortCode} className="mb-8 break-inside-avoid">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      // Named here too: a post with no cover had a link with no name
                      aria-label={`${name} on Instagram`}
                      className="block rounded-panel"
                    >
                      {post.cover ? (
                        <Image
                          src={post.cover}
                          alt={`${name} on Instagram`}
                          width={post.width ?? 1080}
                          height={post.height ?? 1350}
                          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                          className="h-auto w-full rounded-panel bg-field outline-1 -outline-offset-1 outline-line-faint"
                        />
                      ) : (
                        <span className="block aspect-4/5 rounded-panel bg-field" />
                      )}
                    </a>
                    <p className="mt-2 flex min-w-0 items-center gap-1.5 type-label-sm text-text-1">
                      {post.brand?.logo && (
                        <Image src={post.brand.logo} alt="" width={16} height={16} className="size-4 shrink-0 rounded-tag outline-1 -outline-offset-1 outline-line-faint" />
                      )}
                      <span className="truncate">{name}</span>
                    </p>
                    {post.note && (
                      <Text variant="bodySM" className={`mt-1 text-pretty whitespace-pre-line text-text-2 ${wrap}`}>
                        {plain(post.note)}
                      </Text>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Text variant="bodySM" className="py-16 text-center text-text-2">
              Nothing on this board yet.
            </Text>
          )}
        </main>
      </div>
    </BaseLayout>
  );
}
