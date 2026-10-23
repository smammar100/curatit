import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
// Assets
import Lockup from "@/components/assets/Lockup";
// Fundations
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";
import BaseLayout from "@/layouts/BaseLayout";
import { getSharedBoard } from "@/lib/boards";

// A board's read-only link, the one the homepage's board demo shows: anyone with it sees the
// board's posts and notes, signed in or not. Read on every request, so a link that's been
// turned off stops working at once. Not indexed.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const board = await getSharedBoard((await params).token);
  return { title: board ? `${board.name} | Curatit` : "Curatit", robots: { index: false, follow: false } };
}

export default async function SharedBoardPage({ params }: Props) {
  const board = await getSharedBoard((await params).token);
  if (!board) notFound();
  const count = board.posts.length;

  return (
    <BaseLayout hideNavigation hideFooter>
      <div className="min-h-dvh bg-page">
        <header className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Curatit home" className="text-primary-foreground">
            <Lockup />
          </Link>
          <Button isLink href="/signup" size="sm" variant="default">
            Make your own board
          </Button>
        </header>
        <main className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-3xl pt-6 pb-12 text-center">
            <Text variant="bodySM" className="text-secondary-foreground">
              Shared board · Read-only
            </Text>
            <Text tag="h1" variant="h1" className="mt-3 text-balance text-primary-foreground">
              {board.name}
            </Text>
            {board.description && (
              <Text className="mx-auto mt-4 max-w-xl text-pretty whitespace-pre-line text-secondary-foreground">{board.description}</Text>
            )}
            <Text variant="bodySM" className="mt-3 text-secondary-foreground tabular-nums">
              {count} {count === 1 ? "reference" : "references"}
            </Text>
          </div>
          {count ? (
            // Plain CSS columns: the page has no client code of its own, and order matters less here
            <ul className="columns-2 gap-6 md:columns-3 lg:gap-8 xl:columns-4 2xl:columns-5">
              {board.posts.map((post) => {
                const name = post.brand?.name ?? (post.owner ? `@${post.owner}` : "Instagram");
                return (
                  <li key={post.shortCode} className="mb-8 break-inside-avoid">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="block">
                      {post.cover ? (
                        <Image
                          src={post.cover}
                          alt={`${name} on Instagram`}
                          width={post.width ?? 1080}
                          height={post.height ?? 1350}
                          sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                          className="h-auto w-full rounded bg-component outline-1 -outline-offset-1 outline-edge"
                        />
                      ) : (
                        <span className="block aspect-[4/5] rounded bg-component" />
                      )}
                    </a>
                    <Text variant="captionLG" className="mt-2 flex min-w-0 items-center gap-1.5 font-medium text-primary-foreground">
                      {post.brand?.logo && <Image src={post.brand.logo} alt="" width={16} height={16} className="size-4 shrink-0 rounded-sm outline-1 -outline-offset-1 outline-edge" />}
                      <span className="truncate">{name}</span>
                    </Text>
                    {post.note && (
                      <Text variant="bodySM" className="mt-1 text-pretty whitespace-pre-line text-secondary-foreground">
                        {post.note}
                      </Text>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Text variant="bodySM" className="py-16 text-center text-secondary-foreground">
              Nothing on this board yet.
            </Text>
          )}
        </main>
      </div>
    </BaseLayout>
  );
}
