import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
// Assets
import Lockup from "@/components/assets/Lockup";
// Fundations
import Button from "@/components/fundations/elements/Button";
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
      <div className="min-h-dvh bg-white">
        <header className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Curatit home" className="text-base-900">
            <Lockup />
          </Link>
          <Button isLink href="/signup" size="sm" variant="default">
            Make your own board
          </Button>
        </header>
        <main className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-3xl pt-6 pb-12 text-center">
            <p className="text-sm text-base-500">Shared board · Read-only</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.1] font-light text-balance text-base-900 sm:text-5xl">{board.name}</h1>
            {board.description && <p className="mx-auto mt-4 max-w-xl text-pretty whitespace-pre-line text-base-600">{board.description}</p>}
            <p className="mt-3 text-sm text-base-500 tabular-nums">
              {count} {count === 1 ? "reference" : "references"}
            </p>
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
                          className="h-auto w-full rounded bg-base-100 outline-1 -outline-offset-1 outline-edge"
                        />
                      ) : (
                        <span className="block aspect-[4/5] rounded bg-base-100" />
                      )}
                    </a>
                    <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs font-medium text-base-900">
                      {post.brand?.logo && <Image src={post.brand.logo} alt="" width={16} height={16} className="size-4 shrink-0 rounded-sm outline-1 -outline-offset-1 outline-edge" />}
                      <span className="truncate">{name}</span>
                    </p>
                    {post.note && <p className="mt-1 text-sm text-pretty whitespace-pre-line text-base-600">{post.note}</p>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-16 text-center text-sm text-base-500">Nothing on this board yet.</p>
          )}
        </main>
      </div>
    </BaseLayout>
  );
}
