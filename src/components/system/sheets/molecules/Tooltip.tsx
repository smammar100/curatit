// /system/tooltip: the shared Tooltip (fundations/molecules/Tooltip.tsx), live in both themes. The
// demos are client components in ../../demos/OverlayDemos.tsx; this sheet stays a server
// component. Every class is written out in full, never built from parts, so Tailwind sees it
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
    classes: ["bg-inverted-solid", "text-on-inverted-foreground", "rounded-md px-2 py-1", "w-max max-w-64"],
    note: "The primary button's fill: near-black on the light site, near-white on the dark. Up to 256px, then it wraps.",
  },
  {
    part: "type",
    classes: ["text-caption-lg", "text-pretty"],
    note: "12/16, regular. A name or a short phrase, no full stop.",
  },
  {
    part: "layer",
    classes: ['popover="manual"', 'role="tooltip"', "fixed inset-auto m-0"],
    note: "In the top layer, so no overflow or z-index clips it, while it stays beside its trigger in the page and takes the tokens there.",
  },
  {
    part: "placement",
    classes: ['side="top" (default)', "6px from the trigger", "8px from the window's edges"],
    note: "Measured once on show (it hides on scroll, so it never has to follow). It flips to the other side when there's no room.",
  },
  {
    part: "motion",
    classes: ["animate-fade-in · 150ms", "+ 4px slide from the trigger's side", "animate-fade-out · 120ms"],
    note: "The slide eases on ease-out-quint. Shown from the keyboard or within 300ms of another: at once, no animation. Reduced motion: the fade only.",
  },
  {
    part: "wiring",
    classes: ["aria-describedby on the trigger", "aria-hidden when it echoes aria-label"],
    note: "Read with the control. When the words are the control's own aria-label, it adds nothing for a screen reader, so it's hidden from one.",
  },
];

const TIMING: { when: string; sub?: string; does: string }[] = [
  { when: "a mouse rests", does: "Shows after 400ms; moving off before then shows nothing." },
  { when: "the next trigger", sub: "within 300ms", does: "Shows at once, without animating: a row of icon buttons reads like one strip of labels." },
  { when: "keyboard focus", does: "Shows at once (focus-visible only: a click's focus shows nothing)." },
  { when: "touch", does: "Never. A tap has no hover, so nothing a tooltip says may be needed to use the control." },
  { when: "the pointer leaves", does: "Hides after 100ms, time to cross onto the tooltip and read it (WCAG 1.4.13)." },
  { when: "Escape, blur", does: "Hides." },
  { when: "a press or click", does: "Hides, and stays hidden over a menu the trigger opened." },
  { when: "a scroll, a resize", does: "Hides, anywhere on the page." },
];

type PropRow = { name: string; values: string; fallback: string; note: ReactNode };
const PROPS: PropRow[] = [
  { name: "label", values: "string", fallback: "required", note: "The words. A string, so a link or a button can never go inside." },
  { name: "side", values: '"top" | "right" | "bottom" | "left"', fallback: '"top"', note: "The side it prefers; it flips when there's no room." },
  {
    name: "children",
    values: "one element",
    fallback: "required",
    note: "A Button, a link: anything that takes a ref and pointer and focus handlers. Cloned with aria-describedby; its own handlers still run.",
  },
  {
    name: "other props",
    values: "trigger props",
    fallback: "–",
    note: "Passed on to the trigger, handlers chained after its own, so a Menu can clone a Tooltip as its trigger.",
  },
];

export default function TooltipSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Tooltip">
        A few words about one control, for a mouse and the keyboard: the name of an icon-only button, or the detail its
        label leaves out. Never on touch, never holding a control, never the only place something is said.
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
                Sentence case, a few words, no full stop. On an icon button, exactly its <Mono>aria-label</Mono>: the
                tooltip then only echoes it, hidden from screen readers.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                The <Mono>title</Mono> attribute (a second, slower, unstyled tooltip that touch and keyboard never see);
                a tooltip on a disabled control (it gets no pointer or focus events: say why it&rsquo;s disabled in
                words); a tooltip repeating a visible label; a tooltip as the only explanation of a control.
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
        description="Rest a mouse on a trigger, or Tab to one. Run the pointer along the toolbar: the first waits, the rest show at once."
      >
        <Sheet>
          {() => (
            <div className="grid gap-4 sm:grid-cols-2">
              <DemoCard name="icon-only, echoing aria-label" demo={<ToolbarTooltipDemo />}>
                The common case. The tooltip shows the name; a screen reader already has it.
              </DemoCard>
              <DemoCard name="side" demo={<SidesTooltipDemo />}>
                Each side. Near the window&rsquo;s edge it flips rather than clipping.
              </DemoCard>
              <DemoCard name="describing" demo={<DescriptionTooltipDemo />}>
                Words the label leaves out, read after the name as the button&rsquo;s description.
              </DemoCard>
              <DemoCard name="on a menu's trigger" demo={<MenuTooltipDemo />}>
                Menu clones the Tooltip, which passes the menu&rsquo;s props on. It doesn&rsquo;t show over the open menu.
              </DemoCard>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="anatomy" title="Anatomy" description="What Tooltip.tsx builds it from.">
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

      <SheetSection id="timing" title="When it shows and hides" description="The delays are fixed; nothing about them is a prop.">
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
