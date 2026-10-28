// A board taken out of Curatit, from its page's More menu (2026-10-28: two launch simulations and a
// QA run asked for it; agencies hand references to clients, students keep their own archive). Built
// from what BoardsProvider already holds, so it costs no database read: the board's name and
// description, then each post in the board's order (newest first, as the wall deals them) with its
// brand, its Instagram link, the caption's first line, the day it was saved and the note. Markdown
// for the clipboard, CSV for a spreadsheet.
import type { Board, DashPost } from "./types";

// Every published post's url is this (checked against the database on 2026-10-28: 291 of 291), so
// it's built from the short code rather than sent to the browser with every post
export const instagramUrl = (shortCode: string) => `https://www.instagram.com/p/${shortCode}/`;

// `now` and `timeZone` are for the tests; in the browser the dates are the reader's own
type Options = { now?: Date; timeZone?: string };

type Row = { brand: string; url: string; caption: string; saved: Date; note: string };

// The board's posts that are still in the library (an unpublished one can't be shown, as on the page)
function rows(board: Board, posts: Map<string, DashPost>): Row[] {
  return board.items.flatMap((item) => {
    const post = posts.get(item.post);
    return post ? [{ brand: post.brand.name, url: instagramUrl(post.shortCode), caption: post.hook, saved: new Date(item.addedAt), note: item.note?.trim() ?? "" }] : [];
  });
}

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim();

// "28 October 2026"
const longDate = (date: Date, timeZone?: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone }).format(date);

// "2026-10-28", which a spreadsheet sorts as a date
function isoDate(date: Date, timeZone?: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function boardMarkdown(board: Board, posts: Map<string, DashPost>, { now = new Date(), timeZone }: Options = {}) {
  const list = rows(board, posts);
  const count = list.length ? `${list.length} ${list.length === 1 ? "post" : "posts"}` : "No posts yet";
  const head = [`# ${oneLine(board.name)}`, board.description && oneLine(board.description), `${count}. Exported from Curatit on ${longDate(now, timeZone)}.`];
  const sections = list.map((row, index) => {
    const lines = [
      `- Post: ${row.url}`,
      row.caption && `- Caption (first line): ${row.caption}`,
      `- Saved: ${longDate(row.saved, timeZone)}`,
      // A note's later lines are indented, so they stay in its list item
      row.note && `- Note: ${row.note.split("\n").join("\n  ").replace(/ +$/gm, "")}`,
    ];
    return `## ${index + 1}. ${row.brand}\n\n${lines.filter(Boolean).join("\n")}`;
  });
  return `${[...head, ...sections].filter(Boolean).join("\n\n")}\n`;
}

// One cell: quoted when it holds a comma, a quote or a line break. A cell a spreadsheet would run as
// a formula (=, +, -, @, a tab or a return first) starts with an apostrophe, since captions are
// brands' words and notes are free text
function cell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function boardCsv(board: Board, posts: Map<string, DashPost>, { timeZone }: Options = {}) {
  const lines = [
    ["Brand", "Instagram link", "Caption (first line)", "Saved", "Note"],
    ...rows(board, posts).map((row) => [row.brand, row.url, row.caption, isoDate(row.saved, timeZone), row.note]),
  ];
  // The byte order mark makes Excel read UTF-8 (accents, curly quotes); lines end in CRLF, as RFC 4180 has them
  return `﻿${lines.map((line) => line.map(cell).join(",")).join("\r\n")}\r\n`;
}

// "spring-launch.csv": the name's letters and digits in any script, joined by hyphens
export function boardFileName(name: string) {
  const slug = name
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return `${slug || "curatit-board"}.csv`;
}
