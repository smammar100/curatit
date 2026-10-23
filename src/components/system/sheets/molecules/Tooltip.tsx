// /system/tooltip: the shared Tooltip (fundations/molecules/Tooltip.tsx), live in both themes.
// Since 2026-10-23 it is Fluid Functionalism's Tooltip (src/components/ui/tooltip.tsx, on Radix's)
// behind the same API. The demos are client components in ../../demos/OverlayDemos.tsx; this sheet
// stays a server component. Every class is written out in full, never built from parts, so
// Tailwind sees it
import type { ReactNode } from "react";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";
import {
  DescriptionTooltipDemo,
  MenuTooltipDemo,
  SidesTooltipDemo,
  ToolbarTooltipDemo,
} from "../../demos/OverlayDemos";

function Note({ children }: { children: ReactNode }) {
  return <span className="text-body-sm text-secondary-foreground">{children}</span>;
}

function MonoList({ items }: { items: string[] }) {
  return (
    <span className="flex flex-col gap-0.5">
      {items.map((item) => (
        <Mono key={item}>{item}</Mono>
      ))}
    </span>
  );
}

function DemoCard({ name, children, demo }: { name: string; children: ReactNode; demo: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl bg-card p-5">
      <h4 className="font-mono text-caption-lg text-primary-foreground">{name}</h4>
      <p className="mt-1.5 text-body-sm text-secondary-foreground">{children}</p>
      <div className="mt-5">{demo}</div>
    </div>
  );
}

const PARTS: { part: string; sub?: string; classes: string[]; note: ReactNode }[] = [
  {
    part: "surface",
    classes: ["bg-foreground text-background", "rounded-[20px] px-2 py-1", "max-w-64 text-pretty"],
    note: "The ink, with the page's colour for the words: near-black on the light site, white on the dark. The pill corners of the site's shape (shape.bg), the same as a button's. Up to 256px, then it wraps.",
  },
  {
    part: "type",
    classes: [
      "text-[length:var(--fs-caption,12px)] leading-[var(--lh-caption,16px)]",
      "'wght' 400, 'opsz' 14",
      "[text-box:trim-both_cap_alphabetic] supports-[text-box:trim-both]:py-2",
    ],
    note: "The caption role, 12/16, regular (the library pins the default step here, not the compact one). The text-box trim centres the words in the pill; where a browser supports it the padding grows to keep the pill about 24px tall.",
  },
  {
    part: "layer",
    classes: ["Radix Tooltip.Portal", 'role="tooltip"', "z-50"],
    note: "In a portal at the end of the body, so no overflow or z-index clips it, placed by Radix's popper beside its trigger. On this page's side-by-side panels it takes the site's theme, not the panel's.",
  },
  {
    part: "placement",
    classes: ['side="top" (default)', "sideOffset={6}", "collision padding · Radix's"],
    note: "6px from the trigger. Radix keeps it in the window and flips it to the other side when there's no room, following the trigger while the page scrolls.",
  },
  {
    part: "motion",
    classes: ["initial · opacity 0, + 4px from the trigger's side", "in · spring.fast (80ms, no bounce)", "out · spring.fast.exit (60ms)"],
    note: "Fluid Functionalism's fast spring: it slides 4px toward its rest while fading in (y for top and bottom, x for left and right), and leaves on the tier's quicker tween, kept mounted until that finishes. Under reduced motion (MotionConfig reducedMotion=\"user\") only the fade runs.",
  },
  {
    part: "wiring",
    classes: ["aria-describedby on the trigger while open", "Radix Tooltip.Trigger asChild"],
    note: "Radix composes onto the child and describes it by the tooltip while it's shown, so a screen reader hears the words after the control's name.",
  },
];

const TIMING: { when: string; sub?: string; does: string }[] = [
  { when: "a mouse rests", does: "Shows after 200ms (Radix's delayDuration); moving off before then shows nothing." },
  {
    when: "the next trigger",
    does: "Waits the full 200ms again. The library skips the delay for 300ms after one closes only under an app-level TooltipProvider; the site mounts none, so each tooltip carries its own provider and no grouping.",
  },
  { when: "keyboard focus", does: "Shows at once (Radix opens on focus that didn't come from a pointer press)." },
  { when: "touch", does: "Never: Radix ignores touch pointers. A tap has no hover, so nothing a tooltip says may be needed to use the control." },
  { when: "the pointer leaves", does: "Hides, unless it moved onto the tooltip itself (Radix's hoverable content), so the words can be read up close." },
  { when: "Escape, blur", does: "Hides." },
  { when: "a press or click", does: "Hides, and stays hidden over a menu the trigger opened." },
  { when: "a scroll", does: "Hides (Radix closes a tooltip when its trigger scrolls)." },
];

type PropRow = { name: string; values: string; fallback: string; note: ReactNode };
const PROPS: PropRow[] = [
  { name: "label", values: "string", fallback: "required", note: "The words. A string, so a link or a button can never go inside." },
  { name: "side", values: '"top" | "right" | "bottom" | "left"', fallback: '"top"', note: "The side it prefers; it flips when there's no room." },
  {
    name: "children",
    values: "one element",
    fallback: "required",
    note: "A Button, a link: anything that takes a ref and pointer and focus handlers. Radix composes its trigger onto it; its own handlers still run.",
  },
  {
    name: "other props",
    values: "trigger props",
    fallback: "–",
    note: "Cloned onto the child before Radix sees it, so a Menu can use a Tooltip as its trigger and the menu's props reach the button.",
  },
];

export default function TooltipSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Tooltip">
        A few words about one control, for a mouse and the keyboard: the name of an icon-only button, or the detail its
        label leaves out. Since 2026-10-23 it is Fluid Functionalism&rsquo;s Tooltip on Radix&rsquo;s: an ink pill
        in the caption role, sliding 4px from the trigger&rsquo;s side on the fast spring. Never on touch, never
        holding a control, never the only place something is said.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                On icon-only buttons, with the same words as their <Mono>aria-label</Mono> (Copy link, Share). On a
                labelled control, for one phrase its label leaves out (Anyone with the link can view it).
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Anything someone needs in order to act: visible text beside the control, or a field&rsquo;s hint (a
                tooltip never shows on a phone). A sentence or more: a <Mono>Notice</Mono>. Links or buttons: a{" "}
                <Mono>Menu</Mono> or a <Mono>Dialog</Mono>. A keyboard shortcut: a <Mono>Kbd</Mono> beside the label.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>side=&quot;top&quot;</Mono>. Below for a trigger at the top of the screen (the header), left or right
                in a vertical toolbar.
              </>
            ),
          },
          {
            term: "Words",
            text: (
              <>
                Sentence case, a few words, no full stop. On an icon button, exactly its <Mono>aria-label</Mono>: a
                screen reader then hears the name and, while the tooltip shows, the same words as its description,
                which is harmless.
              </>
            ),
          },
          {
            term: "Timing",
            text: (
              <>
                Fixed by the library: 200ms after the pointer rests, at once from the keyboard, never on touch. Nothing
                about it is a prop. The 300ms skip between neighbours needs an app-level{" "}
                <Mono>TooltipProvider</Mono>, which the site doesn&rsquo;t mount, so a row of icon buttons waits
                200ms on each.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                The <Mono>title</Mono> attribute (a second, slower, unstyled tooltip that touch and keyboard never see);
                a tooltip on a disabled control (it gets no pointer or focus events: say why it&rsquo;s disabled in
                words); a tooltip repeating a visible label; a tooltip as the only explanation of a control; a{" "}
                <Mono>className</Mono> colour or radius on it (the ink pill is the system&rsquo;s).
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Where do the words go? (walk it top to bottom)
 ├── Needed to use the control, or on a phone → visible text beside it
 ├── A hint about what to type → the Field's description
 ├── A sentence or more → Notice
 ├── Holds a link or a button → Menu or Dialog
 ├── The name of an icon-only control → Tooltip, label = aria-label
 └── A short phrase a visible label leaves out → Tooltip`}
      />

      <SheetSection
        id="live"
        title="Live"
        description="Rest a mouse on a trigger, or Tab to one. The tooltip renders in a portal, so both panels' tooltips wear the site's theme."
      >
        <Sheet>
          {() => (
            <div className="grid gap-4 sm:grid-cols-2">
              <DemoCard name="icon-only, echoing aria-label" demo={<ToolbarTooltipDemo />}>
                The common case. The tooltip shows the name; a screen reader already has it. Each button waits its own
                200ms.
              </DemoCard>
              <DemoCard name="side" demo={<SidesTooltipDemo />}>
                Each side, each sliding in from its own direction. Near the window&rsquo;s edge it flips rather than
                clipping.
              </DemoCard>
              <DemoCard name="describing" demo={<DescriptionTooltipDemo />}>
                Words the label leaves out, read after the name as the button&rsquo;s description.
              </DemoCard>
              <DemoCard name="on a menu's trigger" demo={<MenuTooltipDemo />}>
                Menu composes onto the Tooltip, which passes the menu&rsquo;s props on to the button. The press that
                opens the menu hides it.
              </DemoCard>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="anatomy" title="Anatomy" description="What the library draws under Tooltip.tsx.">
        <Sheet>
          {() => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="minmax(17rem,max-content) minmax(16rem,1fr)"
              align="start"
              columns={["classes", "notes"]}
              rows={PARTS.map((p) => ({
                label: p.part,
                sub: p.sub,
                cells: [<MonoList key="c" items={p.classes} />, <Note key="n">{p.note}</Note>],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="timing" title="When it shows and hides" description="Radix's, with the library's 200ms delay; nothing about it is a prop.">
        <Sheet>
          {() => (
            <Matrix
              first="minmax(10rem,max-content)"
              template="minmax(18rem,1fr)"
              columns={["does"]}
              rows={TIMING.map((t) => ({ label: t.when, sub: t.sub, cells: [<Note key="d">{t.does}</Note>] }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="props" title="Props" description="Everything it takes.">
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="minmax(10rem,max-content) minmax(7rem,max-content) minmax(18rem,1fr)"
              align="start"
              columns={["values", "default", "notes"]}
              rows={PROPS.map((p) => ({
                label: p.name,
                cells: [<Mono key="v">{p.values}</Mono>, <Mono key="d">{p.fallback}</Mono>, <Note key="n">{p.note}</Note>],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="code" title="In code">
        <Code
          correct={`import Tooltip from "@/components/fundations/molecules/Tooltip";

<Tooltip label="Copy link">
  <Button variant="transparent" iconOnly aria-label="Copy link"><Copy className="size-4" /></Button>
</Tooltip>

{/* On a menu's trigger: the Tooltip is the trigger */}
<Menu label="Board actions" trigger={
  <Tooltip label="More"><Button iconOnly aria-label="More"><Dots /></Button></Tooltip>
}>…</Menu>`}
          incorrect={{
            why: "title attributes (the account menu's options, before Segmented): slow, unstyled, and never seen on touch or from the keyboard",
            code: `<button
  type="button"
  aria-label={option.label}
  title={option.label}
  onClick={() => onChange(option.value)}
>
  {option.icon}
</button>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
