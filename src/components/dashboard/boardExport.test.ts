import { describe, expect, it } from "vitest";
import { boardCsv, boardFileName, boardMarkdown, instagramUrl } from "./boardExport";
import type { Board, DashPost } from "./types";

const post = (shortCode: string, brand: string, hook: string): DashPost => ({
  id: `id-${shortCode}`,
  shortCode,
  hook,
  brand: { name: brand, slug: brand.toLowerCase(), logo: null },
  category: { name: "Finance", slug: "finance" },
  categories: [{ name: "Finance", slug: "finance" }],
  format: "static",
  width: null,
  height: null,
  postedAt: "2026-09-01T00:00:00Z",
  addedAt: "2026-10-10T09:00:00Z",
  cover: "",
});

const posts = new Map(
  [post("DeJsl6abc", "Wise", "Send money home for less."), post("Dd6t2Uxyz", "Airbnb", ""), post("DdscgUqrs", "H&M", "@hm x @loewe, out now.")].map((p) => [p.shortCode, p]),
);

const board = (patch: Partial<Board> = {}): Board => ({
  id: "board-1",
  name: "Spring launch",
  description: "Ideas for the April campaign.",
  shareToken: null,
  updatedAt: "2026-10-28T10:00:00Z",
  items: [
    { post: "DeJsl6abc", note: "Use this layout for the hero.\n\nAsk Sara about the type.", addedAt: "2026-10-28T09:00:00Z" },
    { post: "Dd6t2Uxyz", addedAt: "2026-10-27T12:00:00Z" },
  ],
  ...patch,
});

const options = { now: new Date("2026-10-28T12:00:00Z"), timeZone: "UTC" };

describe("boardMarkdown", () => {
  it("writes the board, then each post in the board's order", () => {
    expect(boardMarkdown(board(), posts, options)).toBe(
      [
        "# Spring launch",
        "",
        "Ideas for the April campaign.",
        "",
        "2 posts. Exported from Curatit on 28 October 2026.",
        "",
        "## 1. Wise",
        "",
        "- Post: https://www.instagram.com/p/DeJsl6abc/",
        "- Caption (first line): Send money home for less.",
        "- Saved: 28 October 2026",
        "- Note: Use this layout for the hero.",
        "",
        "  Ask Sara about the type.",
        "",
        "## 2. Airbnb",
        "",
        "- Post: https://www.instagram.com/p/Dd6t2Uxyz/",
        "- Saved: 27 October 2026",
        "",
      ].join("\n"),
    );
  });

  it("leaves out a missing description and posts no longer in the library", () => {
    const text = boardMarkdown(board({ description: undefined, items: [{ post: "gone", addedAt: "2026-10-01T00:00:00Z" }, ...board().items] }), posts, options);
    expect(text.startsWith("# Spring launch\n\n2 posts. Exported")).toBe(true);
    expect(text).not.toContain("gone");
    expect(text).toContain("## 1. Wise");
  });

  it("says when a board is empty, and keeps the name and description on one line each", () => {
    expect(boardMarkdown(board({ name: "  Mood\n board ", description: "For\nclients", items: [] }), posts, options)).toBe(
      "# Mood board\n\nFor clients\n\nNo posts yet. Exported from Curatit on 28 October 2026.\n",
    );
  });

  it("counts one post in the singular", () => {
    expect(boardMarkdown(board({ items: [board().items[1]] }), posts, options)).toContain("1 post. Exported");
  });

  it("gives the day in the reader's time zone", () => {
    const late = board({ items: [{ post: "DeJsl6abc", addedAt: "2026-10-27T20:30:00Z" }] });
    expect(boardMarkdown(late, posts, { ...options, timeZone: "UTC" })).toContain("- Saved: 27 October 2026");
    expect(boardMarkdown(late, posts, { ...options, timeZone: "Asia/Karachi" })).toContain("- Saved: 28 October 2026");
  });
});

describe("boardCsv", () => {
  it("has a header row, ISO dates, CRLF lines and a byte order mark", () => {
    const csv = boardCsv(board(), posts, options);
    expect(csv.startsWith("﻿Brand,Instagram link,Caption (first line),Saved,Note\r\n")).toBe(true);
    expect(csv.split("\r\n")).toEqual([
      "﻿Brand,Instagram link,Caption (first line),Saved,Note",
      'Wise,https://www.instagram.com/p/DeJsl6abc/,Send money home for less.,2026-10-28,"Use this layout for the hero.\n\nAsk Sara about the type."',
      "Airbnb,https://www.instagram.com/p/Dd6t2Uxyz/,,2026-10-27,",
      "",
    ]);
  });

  it("quotes commas and quotes, and keeps a spreadsheet from running a cell as a formula", () => {
    const risky = board({
      items: [
        { post: "DdscgUqrs", note: '=HYPERLINK("http://x.example")', addedAt: "2026-10-28T09:00:00Z" },
        { post: "DeJsl6abc", note: "- keep the grid", addedAt: "2026-10-28T08:00:00Z" },
      ],
    });
    const [, first, second] = boardCsv(risky, posts, options).split("\r\n");
    expect(first).toBe(`H&M,${instagramUrl("DdscgUqrs")},"'@hm x @loewe, out now.",2026-10-28,"'=HYPERLINK(""http://x.example"")"`);
    expect(second.endsWith(",'- keep the grid")).toBe(true);
  });
});

describe("boardFileName", () => {
  it("makes a file name from the board's name", () => {
    expect(boardFileName("Spring launch: Q2 / ideas")).toBe("spring-launch-q2-ideas.csv");
    expect(boardFileName("Idées für Café")).toBe("idées-für-café.csv");
    expect(boardFileName("★★★")).toBe("curatit-board.csv");
  });
});
