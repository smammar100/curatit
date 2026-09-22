import type { Metadata } from "next";
import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import CreateBoardForm from "@/components/boards/CreateBoardForm";
import CommandSearch from "@/components/product/CommandSearch";
import SlideArt from "@/components/product/SlideArt";
import { formatDate } from "@/components/product/format";
import { requireViewer } from "@/lib/auth";
import { listBoards } from "@/lib/services/boards";
import { quickSearchIndex } from "@/lib/services/creatives";

export const metadata: Metadata = { title: "Boards", robots: { index: false } };

export default async function BoardsPage() {
  const viewer = await requireViewer("/boards");
  const boards = listBoards(viewer);

  return (
    <>
      <CommandSearch items={quickSearchIndex()} />
      <section>
        <Wrapper variant="standard" className="py-24 lg:pt-48">
          <div className="mx-auto max-w-xl text-balance text-center">
            <Text tag="h1" variant="displayLG" className="font-display font-thin text-base-900">
              Your boards
            </Text>
            <Text tag="p" variant="textBase" className="mt-4 text-base-600">
              Collect references for a brief, note what to adapt, and share a read-only link when you&rsquo;re ready.
            </Text>
            <div className="mt-8 flex justify-center gap-2">
              <CreateBoardForm />
              <Button isLink size="base" variant="muted" href="/library">
                Browse the library
              </Button>
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="mx-auto mt-16 max-w-xl rounded-lg bg-base-50 p-12 text-center">
              <Text tag="h2" variant="displaySM" className="font-display font-light text-base-900">
                No boards yet
              </Text>
              <p className="mt-3 text-sm text-base-600">
                Create one above, or press Save on any reference in the library and make a board as you go.
              </p>
            </div>
          ) : (
            <ul className="group mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {boards.map((board) => (
                <li
                  key={board.id}
                  className="peer relative duration-300 group-hover:opacity-30 hover:opacity-100 hover:peer-hover:opacity-30 focus-within:opacity-100"
                >
                  <Link
                    href={`/boards/${board.id}`}
                    className="block rounded-lg focus:outline-2 focus:outline-offset-4 focus:outline-accent-500"
                  >
                    <div className="grid grid-cols-3 gap-3 rounded-lg bg-base-50 p-8">
                      {[0, 1, 2].map((slot) =>
                        board.covers[slot] ? (
                          <div key={slot} className="overflow-hidden rounded shadow">
                            <SlideArt art={board.covers[slot]} alt="" />
                          </div>
                        ) : (
                          <div key={slot} className="aspect-[4/5] rounded bg-base-100" aria-hidden="true" />
                        )
                      )}
                    </div>
                    <div className="mt-2">
                      <Text tag="h3" variant="textSM" className="text-base-600">
                        <span className="text-base-900">{board.name}</span> — {board.itemCount} reference
                        {board.itemCount === 1 ? "" : "s"}
                      </Text>
                      <p className="mt-0.5 text-xs text-base-500">
                        {board.hasActiveShare ? "Shared link active" : "Private"} · Updated {formatDate(board.updatedAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Wrapper>
      </section>
    </>
  );
}
