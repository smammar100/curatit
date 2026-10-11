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

const SOURCE = { brand: "Example Sports", url: "https://www.instagram.com/p/EXAMPLE/", format: "carousel" as const, slides: 7 };

type Gallery = ReturnType<typeof galleryFixture>;
function galleryAnalysis(edit?: (dna: Gallery["dna"], slides: Gallery["slides"]) => void): PublicAnalysis {
  const { dna, slides } = galleryFixture();
  edit?.(dna, slides);
  const rows: SlideRecord[] = slides.map((observation) => ({ version_id: "v", position: observation.position, observation }));
  return toPublicAnalysis({ creative_dna: dna, current_version_id: "v", image_analysis_complete: true, expected_slides: 7, processed_slides: 7 }, rows, 7)!;
}

// PostView in miniature: one slide index for a stand-in stage, the breakdown and the slide rows,
// and the modal's document-level ← / → handler, which skips a key something already handled
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
        <CreativeBreakdown analysis={analysis} index={index} onSlide={setIndex} videos={flags} source={{ ...SOURCE, slides: count, format: count > 1 ? "carousel" : "static" }} />
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
const panel = () => container.querySelector("#breakdown-panel")!;
const tabNames = () => [...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent);
const tab = (name: string) => [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((t) => t.textContent === name);
const button = (scope: Element, label: RegExp) => [...scope.querySelectorAll<HTMLButtonElement>("button")].find((b) => label.test(b.getAttribute("aria-label") ?? b.textContent ?? ""));
const click = (element: Element | undefined) => {
  if (!element) throw new Error("No such element");
  act(() => (element as HTMLElement).click());
};
const key = (target: EventTarget, name: string) => {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
  act(() => void target.dispatchEvent(event));
  return event;
};

describe("CreativeBreakdown: Breakdown", () => {
  it("opens on the idea, the strategy and the creative decisions, closed", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    expect(tabNames()).toEqual(["Breakdown", "Visual DNA", "Apply"]);
    expect(tab("Breakdown")!.getAttribute("aria-selected")).toBe("true");
    expect(panel().textContent).toContain("A tight-crop portrait roll call");
    expect([...panel().querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual(["Archetype", "Inferred goal", "Hook", "Format"]);
    const cards = [...panel().querySelectorAll("button[aria-expanded]")];
    expect(cards.map((b) => b.getAttribute("aria-expanded"))).toEqual(["false", "false"]);
    expect(cards[0].textContent).toContain("Keep one name treatment across every portrait");
    expect(cards[0].textContent).toContain("Slides 1–6");
    expect(panel().textContent).not.toContain("What they did");
  });

  it("shows a decision's slide on the stage when it's opened, and its evidence links move it too", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    click(button(panel(), /Hold the product back/));
    expect(stage()).toBe("image 6");
    expect(button(panel(), /Hold the product back/)!.getAttribute("aria-expanded")).toBe("true");
    for (const field of ["What they did", "Why it might work", "Use it when", "Avoid it when"]) expect(panel().textContent).toContain(field);
    expect(panel().textContent).toContain("Let people carry the story and bring the product in once, at the end.");
    expect(within("slides").querySelector('button[aria-pressed="true"]')!.getAttribute("aria-label")).toMatch(/^Slide 7/);
    click(button(panel(), /Keep one name treatment/));
    expect(stage()).toBe("image 0");
    click(button(panel(), /^Slides 1–6$/));
    expect(stage()).toBe("image 0");
  });

  it("shows three decisions and offers the rest", () => {
    const analysis = galleryAnalysis((dna) => {
      const [a, b] = dna.creative_decisions!;
      dna.creative_decisions = [a, b, { ...a, title: "Third" }, { ...b, title: "Fourth" }, { ...a, title: "Fifth" }];
    });
    render(<Harness analysis={analysis} />);
    expect(panel().querySelectorAll("button[aria-expanded]").length).toBe(3);
    click(button(panel(), /^2 more decisions$/));
    expect(panel().querySelectorAll("button[aria-expanded]").length).toBe(5);
  });

  it("shows an older analysis's observations, labelled for what they are, instead of decisions", () => {
    const analysis = galleryAnalysis((dna) => {
      delete dna.creative_decisions;
    });
    render(<Harness analysis={analysis} />);
    expect(panel().textContent).toContain("What it does");
    expect(panel().textContent).not.toContain("Creative decisions");
    expect(panel().textContent).toContain("Observed");
  });

  it("folds the data checks behind what needs noting", () => {
    const analysis = galleryAnalysis((dna) => {
      dna.integrity_notes = [
        { aspect: "Start values", status: "sound", note: "Every series starts at the same amount.", evidence: ["slide:0"] },
        { aspect: "Sources", status: "unverified", note: "The figures can't be checked from the post.", evidence: ["slide:6"] },
      ];
    });
    render(<Harness analysis={analysis} />);
    const fold = [...panel().querySelectorAll("details")].find((d) => d.textContent!.startsWith("Data checks"))!;
    expect(fold.querySelector("summary")!.textContent).toContain("1 to note");
    act(() => fold.querySelector("summary")!.click());
    expect(fold.textContent).toContain("Unverified");
  });

  it("turns tabs, not slides, with the arrow keys on the tab list", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    act(() => tab("Breakdown")!.focus());
    expect(key(tab("Breakdown")!, "ArrowRight").defaultPrevented).toBe(true);
    expect(tab("Visual DNA")!.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tab("Visual DNA"));
    expect(stage()).toBe("image 0");
  });
});

describe("CreativeBreakdown: Visual DNA", () => {
  it("explains each part in a sentence, with the slides that show it, and the sequence as a bar", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    click(tab("Visual DNA"));
    const text = panel().textContent!;
    expect(text).toContain("Tight crops fill each frame");
    expect(text).toContain("The logo appears once, oversized, on slide 7.");
    expect(panel().querySelector('[aria-label="Approximate colours"]')).not.toBeNull();
    click(button(panel(), /^Slide 7: /));
    expect(stage()).toBe("image 6");
    expect(text).not.toMatch(/Unknown|Other\b/);
  });

  it("keeps the bar on the stage's slide when the arrows move it", () => {
    render(<Harness analysis={galleryAnalysis()} videos={[false, false, false, true, false, false, false]} />);
    click(tab("Visual DNA"));
    key(document, "ArrowRight");
    key(document, "ArrowRight");
    key(document, "ArrowRight");
    expect(stage()).toBe("image 3");
    expect(panel().querySelector('[aria-label="Slides"] button[aria-pressed="true"]')!.getAttribute("aria-label")).toMatch(/^Slide 4/);
    expect(panel().textContent).toContain("video cover");
  });
});

describe("CreativeBreakdown: Apply", () => {
  it("leads with the formula and the steps, and copies a creative brief", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Harness analysis={galleryAnalysis()} />);
    click(tab("Apply"));
    const text = panel().textContent!;
    expect(text).toContain("Hook portrait → Repeated portraits → Product reveal");
    for (const heading of ["How to apply", "Adapt it elsewhere", "When it's useful", "Pitfalls"]) expect(text).toContain(heading);
    await act(async () => button(panel(), /^Copy creative brief$/)!.click());
    const brief = writeText.mock.calls[0][0] as string;
    expect(brief).toContain("CREATIVE PRINCIPLE");
    expect(brief).toContain("https://www.instagram.com/p/EXAMPLE/");
    expect(panel().querySelector('[role="status"]')!.textContent).toContain("Paste it");
    writeText.mockRejectedValueOnce(new Error("denied"));
    await act(async () => button(panel(), /^Cop/)!.click());
    expect(panel().querySelector('[role="status"]')!.textContent).toContain("Couldn't copy");
  });
});

describe("CreativeBreakdown: thin and single records", () => {
  it("gives a single image no sequence and no slide rows", () => {
    const dna = clone(FIXTURE_DNA);
    dna.narrative = { pattern: "single-image", arc: "One image.", slide_roles: [{ position: 0, role: "hook" }] };
    dna.creative_decisions = [{ ...dna.creative_decisions![0], evidence: ["slide:0"] }];
    const analysis = toPublicAnalysis({ creative_dna: dna, current_version_id: "v", image_analysis_complete: true, expected_slides: 1, processed_slides: 1 }, [{ version_id: "v", position: 0, observation: FIXTURE_PERCEPTION.slides[0] }], 1)!;
    render(<Harness analysis={analysis} />);
    click(tab("Visual DNA"));
    expect(panel().querySelector('[aria-label="Slides"]')).toBeNull();
    expect(container.querySelector('[data-testid="slides"]')).toBeNull();
    expect(traits(analysis).map((t) => t.label)).not.toContain("Format");
  });

  it("shows only what a thin record has, and says it may be incomplete", () => {
    const { dna } = galleryFixture();
    const bare = toPublicAnalysis({ creative_dna: { concept: dna.concept }, current_version_id: null, image_analysis_complete: false, expected_slides: 7, processed_slides: 0 }, [], 7)!;
    render(<Harness analysis={bare} />);
    expect(tabNames()).toEqual(["Breakdown", "Visual DNA"]);
    expect(panel().querySelectorAll("dt").length).toBe(0);
    expect(within("breakdown").textContent).toContain("may be incomplete");
  });

  it("leaves the slide alone when the panel scrolls, and never prints a zero-based number", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    click(button(within("slides"), /^Slide 5/));
    const pane = container.querySelector("#scroll-pane")!;
    act(() => {
      pane.scrollTop = 150;
      pane.dispatchEvent(new Event("scroll"));
    });
    expect(stage()).toBe("image 4");
    for (const name of ["Breakdown", "Visual DNA", "Apply"]) {
      click(tab(name));
      for (const card of panel().querySelectorAll("button[aria-expanded='false']")) click(card);
      for (const fold of panel().querySelectorAll("details")) act(() => fold.querySelector("summary")!.click());
      expect(container.textContent).not.toMatch(/\bslides? 0\b/i);
    }
  });
});

describe("SlideBreakdown", () => {
  it("counts the decisions and insights that rest on each slide", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    const badge = (n: number) => button(within("slides"), new RegExp(`^Slide ${n}:`))!.querySelector("[aria-label$='point here']")?.textContent ?? null;
    expect(badge(1)).toBe("4");
    expect(badge(7)).toBe("3");
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
