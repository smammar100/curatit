import type { Metadata } from "next";
import Link from "next/link";
import { Folder } from "lucide-react";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardGroup } from "@/components/ui/card";
import CreateBoardForm from "@/components/boards/CreateBoardForm";
import CommandSearch from "@/components/product/CommandSearch";
import SlideArt from "@/components/product/SlideArt";
import { formatDate } from "@/components/product/format";
import { requireViewer } from "@/lib/auth";
import { fontWeights } from "@/lib/font-weight";
import { cn } from "@/lib/utils";
import { listBoards, type BoardSummary } from "@/lib/services/boards";
import { quickSearchIndex } from "@/lib/services/creatives";

export const metadata: Metadata = { title: "Boards", robots: { index: false } };

/** A board's cover: one large post and two small ones, or a quiet empty state. */
function BoardCover({ board }: { board: BoardSummary }) {
  const covers = board.covers.slice(0, 3);
  if (covers.length === 0) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground">
        <Folder size={20} strokeWidth={1.5} aria-hidden="true" />
        <span className="text-[12px]">Nothing saved yet</span>
      </div>
    );
  }
  const slots = [0, 1, 2].map((slot) => covers[slot]);
  return (
    <div className="grid aspect-[4/3] grid-cols-[2fr_1fr] grid-rows-2 gap-1 overflow-hidden rounded-lg" aria-hidden="true">
      {slots.map((cover, slot) => (
        <div key={slot} className={cn("overflow-hidden bg-muted", slot === 0 && "row-span-2")}>
          {cover && <SlideArt art={cover} alt="" crop="cover" />}
        </div>
      ))}
    </div>
  );
}

export default async function BoardsPage() {
  const viewer = await requireViewer("/boards");
  const boards = listBoards(viewer);
  const count = `${boards.length} board${boards.length === 1 ? "" : "s"}`;

  return (
    <Wrapper variant="standard" className="pb-24">
      <PageHeader
        title="Boards"
        description={`${boards.length ? `${count}. ` : ""}Collect references for a brief, note what to adapt, and share a read-only link when you're ready.`}
        actions={
          <>
            <CommandSearch items={quickSearchIndex()} variant="button" />
            <CreateBoardForm />
          </>
        }
      />

      {boards.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card px-6 py-16 text-center shadow-surface-3">
          <h2 className="heading-section text-foreground">No boards yet</h2>
          <p className="max-w-sm text-pretty text-[15px] leading-6 text-muted-foreground">
            Press Save on any reference in the library and make a board as you go.
          </p>
          <Button asChild variant="secondary" className="mt-3">
            <Link href="/library">Browse the library</Link>
          </Button>
        </div>
      ) : (
        <div className="-mx-2">
          {/* Fixed-column CardGroup; the grid template collapses on small screens. */}
          <CardGroup columns={3} separated className="gap-x-2 gap-y-3 max-md:grid-cols-2! max-sm:grid-cols-1!">
            {[
              ...boards.map((board) => (
                <Card key={board.id} href={`/boards/${board.id}`} label={board.name} className="p-2 pb-3">
                  <BoardCover board={board} />
                  <div className="flex min-w-0 items-center justify-between gap-3 px-1 pt-3">
                    <span className="truncate text-[15px] text-foreground" style={{ fontVariationSettings: fontWeights.medium }}>
                      {board.name}
                    </span>
                    {board.hasActiveShare ? (
                      <Badge variant="dot" color="green">
                        Shared
                      </Badge>
                    ) : (
                      <Badge variant="dot" color="gray">
                        Private
                      </Badge>
                    )}
                  </div>
                  <p className="px-1 pt-0.5 text-[13px] tabular-nums text-muted-foreground">
                    {board.itemCount} reference{board.itemCount === 1 ? "" : "s"} · Updated {formatDate(board.updatedAt)}
                  </p>
                </Card>
              )),
              <CreateBoardForm key="new" variant="tile" label="New board" />,
            ]}
          </CardGroup>
        </div>
      )}
    </Wrapper>
  );
}
