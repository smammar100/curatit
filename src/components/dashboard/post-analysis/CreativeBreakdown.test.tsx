// @vitest-environment happy-dom
import { act, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clone, FIXTURE_DNA, FIXTURE_PERCEPTION, galleryFixture } from "@/lib/creative/fixtures";
import { toPublicAnalysis, type PublicAnalysis, type SlideRecord } from "@/lib/creative/publicAnalysis";
import CreativeBreakdown, { traits } from "./CreativeBreakdown";
import ObservedEngagement, { countLabel } from "./ObservedEngagement";
import SlideBreakdown from "./SlideBreakdown";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SOURCE = { brand: "Example Sports", url: "https://www.instagram.com/p/EXAMPLE/" };

function galleryAnalysis(edit?: (slides: ReturnType<typeof galleryFixture>["slides"]) => void): PublicAnalysis {
  const { dna, slides } = galleryFixture();
  edit?.(slides);
  const rows: SlideRecord[] = slides.map((observation) => ({ version_id: "v", position: observation.position, observation }));
  return toPublicAnalysis({ creative_dna: dna, current_version_id: "v", image_analysis_complete: true, expected_slides: 7, processed_slides: 7 }, rows, 7)!;
}

// PostView in miniature: one slide index for a stand-in stage, the spec sheet and the slide rows,
// and the same document-level ← / → handler the modal has
function Harness({ analysis, videos }: { analysis: PublicAnalysis; videos?: boolean[] }) {
  const count = analysis.slides.length;
  const [index, setIndex] = useState(0);
  const flags = videos ?? Array(count).fill(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (event.key === "ArrowRight") setIndex((i) => Math.min(count - 1, i + 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [count]);
  return (
    <div id="scroll-pane" style={{ overflowY: "auto", height: "200px" }}>
      <p data-testid="stage">image {index}</p>
      <section data-testid="breakdown">
        <CreativeBreakdown analysis={analysis} index={index} onSlide={setIndex} videos={flags} source={SOURCE} />
      </section>
      {count > 1 && (
        <section data-testid="slides">
          <SlideBreakdown analysis={analysis} index={index} onSlide={setIndex} images={Array(count).fill("")} videos={flags} />
        </section>
      )}
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

const render = (ui: React.ReactNode) => act(() => root.render(ui));
const stage = () => container.querySelector('[data-testid="stage"]')!.textContent;
const within = (id: string) => container.querySelector(`[data-testid="${id}"]`)!;
const position = () => within("breakdown").querySelector("p.tabular-nums")!.textContent;
const pressed = (id: string) => within(id).querySelector('button[aria-pressed="true"]')?.getAttribute("aria-label");
const button = (id: string, label: RegExp) => [...within(id).querySelectorAll<HTMLButtonElement>("button")].find((b) => label.test(b.getAttribute("aria-label") ?? b.textContent ?? ""));
const click = (element: Element | undefined) => {
  if (!element) throw new Error("No such element");
  act(() => (element as HTMLElement).click());
};
const key = (name: string) => act(() => void document.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true })));

describe("CreativeBreakdown (spec sheet)", () => {
  it("shows the post as short traits, with nothing unknown", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    const labels = [...within("breakdown").querySelectorAll("dt")].map((dt) => dt.textContent);
    expect(labels).toEqual(["Archetype", "Inferred goal", "Hook", "Format", "Typography", "Imagery", "Layout", "Devices", "Colours (approximate)"]);
    expect(within("breakdown").textContent).not.toMatch(/Unknown|Other|None/);
    expect(within("breakdown").querySelectorAll('[role="img"]').length).toBeGreaterThan(0);
  });

  it("moves the stage, the sequence label and the slide rows together from the bar", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    click(button("breakdown", /^Slide 7/));
    expect(stage()).toBe("image 6");
    expect(position()).toContain("7 / 7");
    expect(pressed("breakdown")).toMatch(/^Slide 7/);
    expect(pressed("slides")).toMatch(/^Slide 7/);
    expect(within("slides").textContent).toContain("Legs and a green cleat on grass");
  });

  it("keeps the bar and the open slide row on the stage's slide when the arrows move it", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    key("ArrowRight");
    key("ArrowRight");
    expect(stage()).toBe("image 2");
    expect(position()).toContain("3 / 7");
    expect(pressed("slides")).toMatch(/^Slide 3/);
    key("ArrowLeft");
    expect(pressed("breakdown")).toMatch(/^Slide 2/);
  });

  it("folds every list behind a count, and opens it on a tap", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    const folds = [...within("breakdown").querySelectorAll("details")];
    expect(folds.map((d) => d.querySelector("summary")!.textContent)).toEqual(["Why it might work2", "How to apply3", "Adapt it elsewhere2", "Caveats1"]);
    expect(folds.every((d) => !d.open)).toBe(true);
    act(() => folds[1].querySelector("summary")!.click());
    expect(folds[1].open).toBe(true);
    expect(folds[1].textContent).toContain("Fix one name style and position across a portrait set.");
  });

  it("copies the recipe with its credit, and says when it can't", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Harness analysis={galleryAnalysis()} />);
    const copy = button("breakdown", /^Copy recipe$/)!;
    await act(async () => copy.click());
    expect(writeText.mock.calls[0][0]).toContain("Source: Example Sports on Instagram, https://www.instagram.com/p/EXAMPLE/");
    expect(within("breakdown").querySelector('[role="status"]')!.textContent).toContain("credit");
    writeText.mockRejectedValueOnce(new Error("denied"));
    await act(async () => button("breakdown", /^Cop/)!.click());
    expect(within("breakdown").querySelector('[role="status"]')!.textContent).toContain("Couldn't copy");
  });

  it("gives a single image no sequence bar", () => {
    const dna = clone(FIXTURE_DNA);
    dna.narrative = { pattern: "single-image", arc: "One image.", slide_roles: [{ position: 0, role: "hook" }] };
    const analysis = toPublicAnalysis({ creative_dna: dna, current_version_id: "v", image_analysis_complete: true, expected_slides: 1, processed_slides: 1 }, [{ version_id: "v", position: 0, observation: FIXTURE_PERCEPTION.slides[0] }], 1)!;
    render(<Harness analysis={analysis} />);
    expect(within("breakdown").querySelector('[aria-label="Slides"]')).toBeNull();
    expect(container.querySelector('[data-testid="slides"]')).toBeNull();
    expect(traits(analysis).map((t) => t.label)).not.toContain("Format");
  });

  it("shows only what a thin record has, and says it may be incomplete", () => {
    const { dna } = galleryFixture();
    const bare = toPublicAnalysis({ creative_dna: { concept: dna.concept }, current_version_id: null, image_analysis_complete: false, expected_slides: 7, processed_slides: 0 }, [], 7)!;
    render(<Harness analysis={bare} />);
    expect(within("breakdown").querySelectorAll("dt").length).toBe(0);
    expect(within("breakdown").querySelectorAll("details").length).toBe(0);
    expect(within("breakdown").textContent).toContain("may be incomplete");
  });

  it("marks a video slide and a blank frame for what they are", () => {
    const analysis = galleryAnalysis((slides) => {
      slides[3] = { ...slides[3], visible_text: { headline: null, body: null }, legibility: "no-text", imagery: ["video-frame"], objects: [], confidence: "low", observation: "Blank: the saved cover frame of this video slide is one flat colour, so what the video shows can't be told." };
    });
    render(<Harness analysis={analysis} videos={[false, false, false, true, false, false, false]} />);
    click(button("slides", /^Slide 4/));
    expect(position()).toContain("video cover");
    const row = button("slides", /^Slide 4/)!;
    expect(row.textContent).toContain("Blank frame");
    expect(row.textContent).toContain("Video cover");
    expect(within("slides").textContent).not.toContain("flat colour");
  });

  it("leaves the slide alone when the panel scrolls, and never prints a zero-based number", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    click(button("slides", /^Slide 5/));
    const pane = container.querySelector("#scroll-pane")!;
    act(() => {
      pane.scrollTop = 150;
      pane.dispatchEvent(new Event("scroll"));
    });
    expect(stage()).toBe("image 4");
    for (const fold of container.querySelectorAll("details")) act(() => fold.querySelector("summary")!.click());
    expect(container.textContent).not.toMatch(/\bslides? 0\b/i);
  });
});

describe("SlideBreakdown", () => {
  it("counts the insights that rest on each slide", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    const badge = (n: number) => button("slides", new RegExp(`^Slide ${n}:`))!.querySelector("[aria-label$='point here']")?.textContent ?? null;
    expect(badge(1)).toBe("3");
    expect(badge(7)).toBe("2");
  });
});

describe("ObservedEngagement", () => {
  it("tells a missing count from zero", () => {
    expect(countLabel(0)).toBe("0");
    expect(countLabel(null)).toBe("Not available");
    expect(countLabel(-1)).toBe("Not available");
    expect(countLabel(12_400)).toBe("12.4K");
  });

  it("shows the counts with no ratio, rank or verdict", () => {
    render(<ObservedEngagement likes={3} comments={null} />);
    const text = container.textContent!;
    expect(text).toContain("3");
    expect(text).toContain("Not available");
    expect(text).not.toMatch(/×|avg|average|#\d|rank|viral|success/i);
  });
});
