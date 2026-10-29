// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DashPost } from "./types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { boards } = vi.hoisted(() => ({ boards: { list: [] as DashPost[] } }));
vi.mock("./boards", () => ({ useBoards: () => boards }));
vi.mock("next/image", () => ({ default: ({ src }: { src: string }) => <img src={src} alt="" /> }));
const { default: SearchEmptyArt } = await import("./SearchEmptyArt");

const post = (code: string, brand: string) => ({ shortCode: code, cover: `/lib/${code}.webp`, brand: { slug: brand, name: brand } }) as unknown as DashPost;

function render() {
  const host = document.createElement("div");
  const root = createRoot(host);
  act(() => root.render(<SearchEmptyArt />));
  return { host, unmount: () => act(() => root.unmount()) };
}

afterEach(() => {
  boards.list = [];
});

describe("the empty search's illustration", () => {
  it("fans four real posts from different brands and turns a fifth over to its blank back", () => {
    boards.list = [post("a", "nike"), post("b", "nike"), post("c", "wise"), post("d", "uber"), post("e", "kfc"), post("f", "zara"), post("g", "bolt")];
    const { host, unmount } = render();
    expect(host.querySelector('[aria-hidden="true"]')).not.toBeNull();
    // One post per brand, in the feed's order: b is Nike's second
    expect([...host.querySelectorAll(".search-art-card img")].map((img) => img.getAttribute("src"))).toEqual(["/lib/a.webp", "/lib/c.webp", "/lib/d.webp", "/lib/e.webp"]);
    expect(host.querySelector(".search-art-flip img")?.getAttribute("src")).toBe("/lib/f.webp");
    expect(host.querySelector(".search-art-back svg")).not.toBeNull();
    unmount();
  });

  it("draws nothing until there are five brands to show", () => {
    boards.list = [post("a", "nike"), post("b", "wise"), post("c", "uber"), post("d", "kfc"), post("e", "kfc")];
    const { host, unmount } = render();
    expect(host.innerHTML).toBe("");
    unmount();
  });
});
