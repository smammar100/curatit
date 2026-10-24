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

const SOURCE = { brand: "Example Sports", shortCode: "EXAMPLE", images: Array.from({ length: 7 }, (_, i) => `/lib/example/${i + 1}.webp`), url: "https://www.instagram.com/p/EXAMPLE/", format: "carousel" as const, slides: 7 };

type Gallery = ReturnType<typeof galleryFixture>;
function galleryAnalysis(edit?: (dna: Gallery["dna"], slides: Gallery["slides"]) => void): PublicAnalysis {
  const { dna, slides } = galleryFixture();
  edit?.(dna, slides);
  const rows: SlideRecord[] = slides.map((observation) => ({ version_id: "v", position: observation.position, observation }));
  return toPublicAnalysis({ creative_dna: dna, current_version_id: "v", image_analysis_complete: true, expected_slides: 7, processed_slides: 7 }, rows, 7)!;
}

const scrollPane = (el: HTMLDivElement | null) => {
  if (!el) return;
  el.style.overflowY = "auto";
  el.style.height = "200px";
};

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
    // The scrolling pane, its overflow set on the element (Glaze's lint keeps style props to custom properties)
    <div id="scroll-pane" ref={scrollPane}>
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
// The shown view: the panel the selected tab labels. Glaze's Tabs (Base UI) gives each view its own
// panel with a generated id, and keeps the one it leaves in the page for a frame as it goes
const panel = () => {
  const selected = container.querySelector('[role="tab"][aria-selected="true"]')!;
  return container.querySelector(`[role="tabpanel"][aria-labelledby="${selected.id}"]`)!;
};
// A tab's words: Glaze's tab holds its label as plain text
const tabName = (t: Element) => t.textContent;
const tabNames = () => [...container.querySelectorAll('[role="tab"]')].map(tabName);
const tab = (name: string) => [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((t) => tabName(t) === name);
const button = (scope: Element, label: RegExp) => [...scope.querySelectorAll<HTMLButtonElement>("button")].find((b) => label.test(b.getAttribute("aria-label") ?? b.textContent ?? ""));
// A press and a click, as a pointer gives them
const click = (element: Element | undefined) => {
  if (!element) throw new Error("No such element");
  act(() => {
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }));
    (element as HTMLElement).click();
  });
};
const key = (target: EventTarget, name: string) => {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
  act(() => void target.dispatchEvent(event));
  return event;
};

// The decisions: Glaze's Collapsible rows, each trigger in its heading
const cards = () => [...panel().querySelectorAll<HTMLButtonElement>("ol > li > h3 > button[aria-expanded]")];

describe("CreativeBreakdown: Breakdown", () => {
  it("opens on the strategy, its traits and the key decisions, the first open on its explanation", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    expect(tabNames()).toEqual(["Breakdown", "Visual DNA"]);
    expect(tab("Breakdown")!.getAttribute("aria-selected")).toBe("true");
    expect(panel().textContent).toContain("Six named faces carry the emotion before one logo signs off");
    expect(panel().textContent).toContain("A fixed name label turns six close portraits into one lineup");
    expect([...panel().querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual(["Archetype", "Inferred goal", "Hook", "Format"]);
    expect(cards().map((b) => b.getAttribute("aria-expanded"))).toEqual(["true", "false"]);
    expect(cards()[0].textContent).toContain("Keep one name treatment across every portrait");
    expect(cards()[0].textContent).toContain("Slides 1–6");
    expect(panel().textContent).toContain("Every player gets the same spaced white capitals");
    // The reasoning waits until it's asked for, and opening by default doesn't move the stage
    expect(panel().textContent).not.toContain("Possible effect");
    expect(stage()).toBe("image 0");
  });

  it("shows a decision's slide when it's opened, its reasoning on request, and marks the one on screen", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    expect(cards()[0].textContent).toContain("on screen");
    click(button(panel(), /Hold the product back/));
    expect(stage()).toBe("image 6");
    expect(cards().map((b) => b.getAttribute("aria-expanded"))).toEqual(["false", "true"]);
    expect(cards()[1].textContent).toContain("on screen");
    expect(cards()[0].textContent).not.toContain("on screen");
    expect(within("slides").querySelector('button[aria-pressed="true"]')!.getAttribute("aria-label")).toMatch(/^Slide 7/);

    click(button(panel(), /^Show the reasoning$/));
    for (const field of ["Observed", "Possible effect", "Reusable principle", "Watch out"]) expect(panel().textContent).toContain(field);
    expect(panel().textContent).toContain("Let people carry the story and bring the product in once, at the end.");
    expect(panel().textContent).toContain("People who stop swiping early never see the brand.");
    expect(button(panel(), /^Hide the reasoning$/)!.getAttribute("aria-expanded")).toBe("true");

    click(button(panel(), /Keep one name treatment/));
    expect(stage()).toBe("image 0");
    click(button(panel(), /^Show the reasoning$/));
    // Where it shows is the line under its title; the reasoning repeats no slide tags
    expect(button(panel(), /^Slides? \d+(–\d+)?$/)).toBeFalsy();
  });

  it("shows an older analysis's observations, labelled for what they are, instead of decisions", () => {
    const analysis = galleryAnalysis((dna) => {
      delete dna.creative_decisions;
    });
    render(<Harness analysis={analysis} />);
    expect(panel().textContent).toContain("What it does");
    expect(panel().textContent).not.toContain("Key creative decisions");
    expect(panel().textContent).toContain("Observed");
    expect(panel().textContent).toContain("Why it might work");
  });

  it("shows no data checks on the post, though the analysis has them", () => {
    const analysis = galleryAnalysis((dna) => {
      dna.integrity_notes = [
        { aspect: "Start values", status: "observed", note: "Every series starts at the same amount.", evidence: ["slide:0"] },
        { aspect: "Disclaimer", status: "potential_concern", note: "The fine print is small and low-contrast.", evidence: ["slide:6"] },
      ];
    });
    expect(analysis.integrity).toHaveLength(2);
    render(<Harness analysis={analysis} />);
    const text = panel().textContent!;
    expect(text).not.toContain("Data checks");
    expect(text).not.toContain("The fine print is small");
    expect(button(panel(), /potential concern/)).toBeFalsy();
  });

  it("turns tabs, not slides, with the arrow keys on the tab list", async () => {
    render(<Harness analysis={galleryAnalysis()} />);
    act(() => tab("Breakdown")!.focus());
    expect(key(tab("Breakdown")!, "ArrowRight").defaultPrevented).toBe(true);
    // Base UI moves focus to the next tab a tick later, and the selection follows the focus
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(tab("Visual DNA")!.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tab("Visual DNA"));
    expect(stage()).toBe("image 0");
  });

  it("brings the new tab's start into view when the panel had scrolled past it, and otherwise stays put", () => {
    render(<Harness analysis={galleryAnalysis()} />);
    const pane = container.querySelector<HTMLElement>("#scroll-pane")!;
    const marker = within("breakdown").querySelector<HTMLElement>('div[aria-hidden="true"]')!;
    vi.spyOn(pane, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
    const at = vi.spyOn(marker, "getBoundingClientRect").mockReturnValue({ top: -20 } as DOMRect);
    act(() => void (pane.scrollTop = 300));
    click(tab("Visual DNA"));
    expect(pane.scrollTop).toBe(180);
    at.mockReturnValue({ top: 140 } as DOMRect);
    click(tab("Breakdown"));
    expect(pane.scrollTop).toBe(180);
  });
});

describe("CreativeBreakdown: Visual DNA", () => {
  it("gives each part an insight and a few attributes with no slide tags, and the colours as a palette to copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Harness analysis={galleryAnalysis()} />);
    click(tab("Visual DNA"));
    const text = panel().textContent!;
    for (const title of ["Composition", "Typography", "Colour", "Imagery", "Visual devices", "Branding & consistency", "Sequence"]) expect(text).toContain(title);
    expect(text).toContain("Tight crops fill each frame");
    expect(text).toContain("The logo appears once, oversized, on slide 7.");
    expect(text).toContain("Layout changes on");
    expect(text).not.toMatch(/Unknown|Other\b/);
    expect(button(panel(), /^Slides? \d+(–\d+)?$/)).toBeFalsy();
    const colours = panel().querySelector('[aria-label="Colours (measured from the image)"]')!;
    expect(text).toContain("#0b0a10");
    await act(async () => button(colours, /^Copy #0b0a10, Background$/)!.click());
    expect(writeText).toHaveBeenCalledWith("#0b0a10");
    expect(panel().textContent).toContain("Copied #0b0a10");
    click(button(panel(), /^Slide 7: /));
    expect(stage()).toBe("image 6");
    expect(panel().textContent).toContain("Changes from slide 6");
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

describe("CreativeBreakdown: Copy brief", () => {
  it("sits beside the tabs in place of an Apply tab and copies the brief as a Markdown prompt", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Harness analysis={galleryAnalysis()} />);
    expect(tabNames()).not.toContain("Apply");
    await act(async () => button(container, /^Copy brief$/)!.click());
    const brief = writeText.mock.calls[0][0] as string;
    expect(brief.startsWith("# Instagram post — visual adaptation brief")).toBe(true);
    expect(brief).toContain("closely match its colours");
    expect(brief).toContain("## Visual matching requirements");
    expect(brief).toContain("## Execution and deliverables");
    expect(brief).toContain("https://www.instagram.com/p/EXAMPLE/");
    expect(button(container, /^Copied$/)).toBeTruthy();
    expect(container.textContent).toContain("Design brief copied. Paste it into your AI tool.");
    writeText.mockRejectedValueOnce(new Error("denied"));
    await act(async () => button(container, /^Cop/)!.click());
    expect(container.textContent).toContain("Couldn't copy the brief here.");
  });

  it("says so when clipboard access is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    render(<Harness analysis={galleryAnalysis()} />);
    await act(async () => button(container, /^Copy brief$/)!.click());
    expect(container.textContent).toContain("Couldn't copy the brief here.");
    expect(button(container, /Download/)).toBeFalsy();
  });

});

describe("CreativeBreakdown: thin and single records", () => {
  it("gives a single image no sequence, no slide rows and no Slide 1 links", () => {
    const dna = clone(FIXTURE_DNA);
    dna.narrative = { pattern: "single-image", arc: "One image.", slide_roles: [{ position: 0, role: "hook" }] };
    dna.creative_decisions = dna.creative_decisions!.map((decision) => ({ ...decision, evidence: ["slide:0"] }));
    dna.integrity_notes = [{ aspect: "Figures", status: "cannot_verify", note: "Can't be checked from the post.", evidence: ["slide:0"] }];
    const analysis = toPublicAnalysis({ creative_dna: dna, current_version_id: "v", image_analysis_complete: true, expected_slides: 1, processed_slides: 1 }, [{ version_id: "v", position: 0, observation: FIXTURE_PERCEPTION.slides[0] }], 1)!;
    render(<Harness analysis={analysis} />);
    click(button(panel(), /^Show the reasoning$/));
    for (const name of ["Breakdown", "Visual DNA"]) {
      click(tab(name));
      expect(panel().textContent).not.toMatch(/\bSlides? \d/);
    }
    click(tab("Visual DNA"));
    expect(panel().querySelector('[aria-label="Slides"]')).toBeNull();
    expect(panel().textContent).not.toContain("Seen on");
    expect(container.querySelector('[data-testid="slides"]')).toBeNull();
    expect(traits(analysis).map((t) => t.label)).not.toContain("Format");
  });

  it("shows only what a thin record has, and says it may be incomplete", () => {
    const { dna } = galleryFixture();
    const bare = toPublicAnalysis({ creative_dna: { concept: dna.concept }, current_version_id: null, image_analysis_complete: false, expected_slides: 7, processed_slides: 0 }, [], 7)!;
    render(<Harness analysis={bare} />);
    expect(tabNames()).toEqual(["Breakdown", "Visual DNA"]);
    expect(panel().querySelectorAll("dt").length).toBe(0);
    expect(panel().textContent).toContain(dna.concept);
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
    for (const name of ["Breakdown", "Visual DNA"]) {
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
