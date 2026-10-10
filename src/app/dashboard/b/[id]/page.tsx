import BoardView from "@/components/dashboard/BoardView";

// A board's page. Boards are per person and load in the browser, so this is the same shell for
// every id: built on its first visit, then cached (there's nothing personal in it).
export function generateStaticParams() {
  return [];
}

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  return <BoardView id={(await params).id} />;
}
