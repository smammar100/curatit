import type { Metadata } from "next";
import Link from "next/link";
import { Folder } from "lucide-react";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardGroup, CardHeader, CardTitle } from "@/components/ui/card";
import CreateBoardForm from "@/components/boards/CreateBoardForm";
import CommandSearch from "@/components/product/CommandSearch";
import SlideArt from "@/components/product/SlideArt";
import { formatDate } from "@/components/product/format";
import { requireViewer } from "@/lib/auth";
import { listBoards, type BoardSummary } from "@/lib/services/boards";
import { quickSearchIndex } from "@/lib/services/creatives";

export const metadata: Metadata = { title: "Boards", robots: { index: false } };

/** Leading media for a board row: up to 3 covers, or a folder tile when the board is empty. */
function BoardMedia({ board }: { board: BoardSummary }) {
  const covers = board.covers.slice(0, 3);
  if (covers.length === 0) {
    return (
      <span data-slot="card-media" className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-hover">
        <Folder size={18} strokeWidth={1.5} className="text-muted-foreground" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span data-slot="card-media" className="flex shrink-0 gap-1" aria-hidden="true">
      {covers.map((cover, slot) => (
        <span key={slot} className="block w-8 overflow-hidden rounded-[2px] shadow-surface-1">
          <SlideArt art={cover} alt="" />
        </span>
      ))}
    </span>
  );
}

export default async function BoardsPage() {
  const viewer = await requireViewer("/boards");
  const boards = listBoards(viewer);

  return (
    <>
      <CommandSearch items={quickSearchIndex()} />
      <Wrapper variant="standard" className="pb-24">
        <PageHeader
          title="Your boards"
          description="Collect references for a brief, note what to adapt, and share a read-only link when you're ready."
          actions={
            <>
              <Button asChild variant="secondary">
                <Link href="/library">Browse the library</Link>
              </Button>
              <CreateBoardForm />
            </>
          }
        />

        {boards.length === 0 ? (
          <div className="flex max-w-md flex-col items-start gap-2 border-t border-border py-12">
            <h2 className="heading-section text-foreground">No boards yet</h2>
            <p className="text-[14px] leading-6 text-muted-foreground">
              Create one above, or press Save on any reference in the library and make a board as you go.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-[13px] tabular-nums text-muted-foreground">
              {boards.length} board{boards.length === 1 ? "" : "s"}
            </p>
            <CardGroup orientation="inline" className="border-y border-border">
              {boards.map((board) => (
                <Card key={board.id} href={`/boards/${board.id}`} label={board.name}>
                  <BoardMedia board={board} />
                  <CardHeader>
                    <CardTitle className="max-w-full whitespace-nowrap">{board.name}</CardTitle>
                    <CardDescription className="text-[13px] tabular-nums">
                      {board.itemCount} reference{board.itemCount === 1 ? "" : "s"} · Updated {formatDate(board.updatedAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    {board.hasActiveShare ? (
                      <Badge variant="dot" color="green">
                        Shared link active
                      </Badge>
                    ) : (
                      <Badge variant="dot" color="gray">
                        Private
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </CardGroup>
          </>
        )}
      </Wrapper>
    </>
  );
}
