"use client";

// The live keyboard demo on the Tabs sheet (/system/tabs). It waits for a person: nothing moves
// on load. It's rendered once per theme panel; Tabs makes its own ids, so the two never clash.
import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Segmented from "@/components/fundations/elements/Segmented";
import Tabs, { Tab, TabList, TabPanel } from "@/components/fundations/molecules/Tabs";

const VIEWS = [
  { value: "breakdown", label: "Breakdown" },
  { value: "visual", label: "Visual DNA" },
  { value: "slides", label: "Slides", disabled: true },
  { value: "caveats", label: "Caveats" },
];
const KEYS = ["ArrowLeft", "ArrowRight", "Home", "End"];
const labelOf = (value: string | null) => VIEWS.find((v) => v.value === value)?.label ?? "none";

/** The row with a switch for its activation, and what a listener on the document sees: the
 *  post overlay's own arrows (PostView) listen there and leave the keys the tabs handled */
export function KeyboardDemo() {
  const [activation, setActivation] = useState<"automatic" | "manual">("automatic");
  const [view, setView] = useState("breakdown");
  const [focus, setFocus] = useState<string | null>(null);
  const [seen, setSeen] = useState<{ key: string; handled: boolean } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const label = useId();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!KEYS.includes(event.key) || !root.current?.contains(event.target as Node)) return;
      const held = [event.altKey && "Alt", event.ctrlKey && "Ctrl", event.metaKey && "Meta", event.shiftKey && "Shift"];
      setSeen({ key: [...held.filter(Boolean), event.key].join("+"), handled: event.defaultPrevented });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={root}
      onFocus={(event) => {
        const tab = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
        setFocus(tab?.dataset.value ?? null);
      }}
      onBlur={() => setFocus(null)}
      className="flex max-w-xl flex-col gap-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span id={label} className="text-body-sm font-medium text-primary-foreground">
          Activation
        </span>
        <Segmented
          aria-labelledby={label}
          value={activation}
          onValueChange={setActivation}
          options={[
            { value: "automatic", label: "Automatic" },
            { value: "manual", label: "Manual" },
          ]}
        />
      </div>

      <Tabs value={view} onValueChange={setView} activation={activation}>
        <TabList aria-label="Creative breakdown" variant="pill">
          {VIEWS.map((v) => (
            <Tab key={v.value} value={v.value} disabled={v.disabled}>
              {v.label}
            </Tab>
          ))}
        </TabList>
        <TabPanel value="breakdown" className="mt-3 text-body-sm text-secondary-foreground">
          <p>This panel holds a button, so Tab goes from the row straight to it.</p>
          <Button variant="secondary" size="sm" className="mt-3">
            Copy brief
          </Button>
        </TabPanel>
        <TabPanel value="visual" className="mt-3 text-body-sm text-secondary-foreground">
          Only text here, so the panel itself is the next tab stop, and shows the focus ring.
        </TabPanel>
        <TabPanel value="slides" className="mt-3 text-body-sm text-secondary-foreground">
          Never shown: the tab is disabled, and the arrow keys skip it.
        </TabPanel>
        <TabPanel value="caveats" className="mt-3 text-body-sm text-secondary-foreground">
          Only text here too. End lands here; → from here wraps to Breakdown.
        </TabPanel>
      </Tabs>

      <dl className="grid gap-x-4 gap-y-1 font-mono text-caption-lg sm:grid-cols-[9rem_minmax(0,1fr)]">
        <dt className="text-secondary-foreground">selected</dt>
        <dd className="text-primary-foreground">{labelOf(view)}</dd>
        <dt className="text-secondary-foreground">focus</dt>
        <dd className="text-primary-foreground">{labelOf(focus)}</dd>
        <dt className="text-secondary-foreground">document saw</dt>
        <dd className="text-primary-foreground">
          {seen
            ? `${seen.key}: ${seen.handled ? "defaultPrevented, so it's left alone" : "not handled, free for the page"}`
            : "press an arrow key in the row"}
        </dd>
      </dl>
    </div>
  );
}
