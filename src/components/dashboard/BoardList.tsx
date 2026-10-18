"use client";

// The signed-in person's boards as cards, at the top of the Saved view: a mosaic of the
// newest three covers (one large, two small, after Pinterest's board cards), the name, and how
// many posts. Each opens the board's page.
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
      <h2 id="boards-heading" className="mb-5 text-title font-medium text-primary-foreground">
        Boards
      </h2>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {boards.map((board) => (
          <li key={board.id}>
            <Link href={boardHref(board.id)} className="group block">
              <Mosaic board={board} />
              <p className="mt-2.5 truncate text-subtitle font-medium text-primary-foreground">{board.name}</p>
              <p className="text-body text-secondary-foreground tabular-nums">
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
    <span className={`relative block overflow-hidden bg-component ${className}`}>
      {src && <Image src={src} alt="" fill sizes={sizes} className="object-cover transition-transform duration-300 ease-out-quint group-hover:scale-[1.03] motion-reduce:transition-none" />}
    </span>
  );
  return (
    <div className="grid aspect-[4/3] grid-cols-[2fr_1fr] grid-rows-2 gap-0.5 overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-edge">
      {cell(covers[0], "(min-width: 1280px) 12vw, 30vw", "row-span-2")}
      {cell(covers[1], "10vw", "")}
      {cell(covers[2], "10vw", "")}
    </div>
  );
}
