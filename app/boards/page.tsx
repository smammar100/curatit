import type { Metadata } from "next";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
import CreateBoardForm from "@/components/boards/CreateBoardForm";
import SlideArt from "@/components/product/SlideArt";
import Tag from "@/components/product/Tag";
import { formatDate } from "@/components/product/format";
import { requireViewer } from "@/lib/auth";
import { listBoards } from "@/lib/services/boards";

export const metadata: Metadata = { title: "Boards", robots: { index: false } };

export default async function BoardsPage() {
  const viewer = await requireViewer("/boards");
  const boards = listBoards(viewer);

  return (
    <section>
      <Wrapper variant="standard" className="pt-28 pb-24 lg:pt-32">
        <div className="max-w-2xl">
          <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
            Your boards
          </Text>
          <Text tag="p" variant="textBase" className="mt-3 text-base-600">
            Collect references for a brief, note what to adapt, and share a read-only link when you&rsquo;re ready.
          </Text>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            {boards.length === 0 ? (
              <div className="rounded-lg border border-dashed border-base-200 p-10 text-center">
                <p className="font-display text-2xl text-base-900">No boards yet</p>
                <p className="mt-2 text-sm text-base-600">
                  Create one here, or save a reference from the{" "}
                  <Link href="/library" className="text-accent-600 hover:text-base-900 underline">
                    library
                  </Link>{" "}
                  and make a board as you go.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {boards.map((board) => (
                  <li key={board.id}>
                    <Link href={`/boards/${board.id}`} className="group block rounded-lg focus:outline-2 focus:outline-offset-4 focus:outline-accent-500">
                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-base-50 p-4">
                        {[0, 1, 2].map((slot) =>
                          board.covers[slot] ? (
                            <div key={slot} className="rounded overflow-hidden shadow-sm">
                              <SlideArt art={board.covers[slot]} alt="" />
                            </div>
                          ) : (
                            <div key={slot} className="aspect-[4/5] rounded bg-base-100" aria-hidden="true" />
                          )
                        )}
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-base-900 group-hover:text-accent-600">{board.name}</p>
                          <p className="text-xs text-base-500">
                            {board.itemCount} reference{board.itemCount === 1 ? "" : "s"} · Updated {formatDate(board.updatedAt)}
                          </p>
                        </div>
                        {board.hasActiveShare ? <Tag tone="accent">Shared link active</Tag> : <Tag>Private</Tag>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <CreateBoardForm />
        </div>
      </Wrapper>
    </section>
  );
}
