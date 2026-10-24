"use client";

// The signed-in person's boards as cards, at the top of the Saved view: a mosaic of the
// newest three covers (one large, two small, after Pinterest's board cards), the name, and how
// many posts. Each opens the board's page. The mosaic is a drawing, kept as one since 2026-10-24
// on Glaze: a panel-cornered tile on the shell's grey with a faint line inside its edge, the words
// in Glaze's type roles, the card's focus Glaze's ring.
import Image from "next/image";
import Link from "next/link";
import { useBoards } from "./boards";
import { boardHref } from "./BoardView";
import type { Board } from "./types";

export default function BoardList() {
  const { boards } = useBoards();
  if (!boards.length) return null;
  return (
    <section aria-labelledby="boards-heading" className="mb-14">
      <h2 id="boards-heading" className="mb-5 type-heading text-text-1">
        Boards
      </h2>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {boards.map((board) => (
          <li key={board.id}>
            <Link href={boardHref(board.id)} className="group block rounded-panel">
              <Mosaic board={board} />
              <p className="mt-2.5 truncate type-heading-sm text-text-1">{board.name}</p>
              <p className="type-body-sm text-text-2 tabular-nums">
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
    <span className={`relative block overflow-hidden bg-field ${className}`}>
      {src && (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-(--dur-overlay) ease-out group-hover:scale-103 motion-reduce:transition-none"
        />
      )}
    </span>
  );
  return (
    <div className="relative grid aspect-4/3 grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 overflow-hidden rounded-panel bg-shell after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-line-faint">
      {cell(covers[0], "(min-width: 1280px) 12vw, 30vw", "row-span-2")}
      {cell(covers[1], "10vw", "")}
      {cell(covers[2], "10vw", "")}
    </div>
  );
}
