import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Wrapper from "@/components/fundations/containers/Wrapper";
import BoardEditor from "@/components/boards/BoardEditor";
import { requireViewer } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getBoard, type BoardDetail } from "@/lib/services/boards";
import { track } from "@/lib/services/events";

// Board names are private, so the page title stays generic.
export const metadata: Metadata = { title: "Board", robots: { index: false } };

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer(`/boards/${id}`);

  let board: BoardDetail;
  try {
    board = getBoard(viewer, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  }
  track("board_reopened", { viewer, resourceId: board.id });

  return (
    <Wrapper variant="standard" className="pb-24">
      <BoardEditor key={`${board.id}-${board.version}`} initial={board} />
    </Wrapper>
  );
}
