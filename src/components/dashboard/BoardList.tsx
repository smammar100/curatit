"use client";

// The signed-in person's boards as cards, at the top of the Saved view: a mosaic of the
// newest three covers (one large, two small, after Pinterest's board cards), the name, and how
// many posts. Each opens the board's page. The mosaic is a drawing, kept as one since 2026-10-23
// on the system's tokens: a 12px tile on the grey mat with the one stroke inside its edge, the
// words in the dashboard's roles, the card's focus the one ring.
import Image from "next/image";
import Link from "next/link";
import { fontWeights } from "@/lib/font-weight";
import { useBoards } from "./boards";
import { boardHref } from "./BoardView";
import type { Board } from "./types";

export default function BoardList() {
  const { boards } = useBoards();
  if (!boards.length) return null;
  return (
    <section aria-labelledby="boards-heading" className="mb-14">
      <h2 id="boards-heading" className="mb-5 text-title text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
        Boards
      </h2>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {boards.map((board) => (
          <li key={board.id}>
            <Link href={boardHref(board.id)} className="group block rounded-[12px] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]">
              <Mosaic board={board} />
              <p className="mt-2.5 truncate text-subtitle text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>
                {board.name}
              </p>
              <p className="text-body text-muted-foreground tabular-nums">
                {board.items.length} {board.items.length === 1 ? "post" : "posts"}
                {board.shareToken && " · Shared"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Mosaic({ board }: { board: Board }) {
  const { posts } = useBoards();
  const covers = board.items.slice(0, 3).map((item) => posts.get(item.post)?.cover);
  const cell = (src: string | undefined, sizes: string, className: string) => (
    <span className={`relative block overflow-hidden bg-muted ${className}`}>
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-cover transition-transform duration-300 ease-out-quint group-hover:scale-[1.03] motion-reduce:transition-none" />}
    </span>
  );
  return (
    <div className="relative grid aspect-[4/3] grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 overflow-hidden rounded-[12px] bg-card after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:outline-1 after:-outline-offset-1 after:outline-border">
      {cell(covers[0], "(min-width: 1280px) 12vw, 30vw", "row-span-2")}
      {cell(covers[1], "10vw", "")}
      {cell(covers[2], "10vw", "")}
    </div>
  );
}
