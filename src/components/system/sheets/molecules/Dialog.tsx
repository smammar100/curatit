// /system/dialog: the shared Dialog (fundations/molecules/Dialog.tsx), live in both themes. The
// demos are client components in ../../demos/OverlayDemos.tsx; this sheet stays a server
// component. Every class is written out in full, never built from parts, so Tailwind sees it
import type { ReactNode } from "react";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";
import { ConfirmDialogDemo, FormDialogDemo, LongDialogDemo } from "../../demos/OverlayDemos";

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
    classes: ["<dialog> · showModal()", "bg-modal shadow-xl", "rounded-3xl p-0", "w-[calc(100%-2rem)]", "max-h-[calc(100dvh-2rem)]"],
    note: "The top layer: the modal surface, the extra large shadow, 16px corners. 16px from the screen's edges on a phone.",
  },
  {
    part: "radius",
    classes: ["default · rounded-3xl (16px)", "large · rounded-[28px]"],
    note: "Large is the new-board dialog's, kept from its Cosmos prototype: a dialog built round one large field and a full-width pill. Nothing else uses it.",
  },
  {
    part: "size",
    classes: ["sm · max-w-sm (384px)", "md · max-w-md (448px)", "lg · max-w-2xl (672px)"],
    note: "A confirmation, a short form (the default), a longer read.",
  },
  {
    part: "backdrop",
    classes: ["backdrop:bg-black/40"],
    note: "A scrim over the page in both themes, the one place black is used as a colour. No blur: it costs a frame on phones.",
  },
  {
    part: "title",
    classes: ["<h2> · aria-labelledby", "text-body-base font-medium", "default · text-primary-foreground", "quiet · text-secondary-foreground"],
    note: "Inter, 15/24: a dialog's title labels a task, it isn't a page heading, so not the serif. Quiet steps it back to a label when the first field is the subject (New board over the name set large); it still names the dialog.",
  },
  {
    part: "description",
    classes: ["<p> · aria-describedby", "mt-1 text-body-sm", "text-secondary-foreground"],
    note: "One or two sentences, read with the title as it opens.",
  },
  {
    part: "body",
    classes: ["px-6 pt-4", "min-h-0 flex-1 overflow-y-auto", "text-body-sm text-secondary-foreground"],
    note: "Scrolls on its own when it's taller than the screen; the title and footer stay.",
  },
  {
    part: "footer",
    classes: ["px-6 pt-6", "sm:flex-row sm:justify-end gap-2", "flex-col-reverse *:max-sm:w-full"],
    note: "Right-aligned, the primary last. On phones the buttons stack full width, the primary on top.",
  },
  {
    part: "close",
    classes: ['Button transparent base iconOnly', 'aria-label="Close"', "absolute top-4 right-4", "pointer-coarse: 44px"],
    note: "Top right to the eye, last in the tab order, so focus starts on the task.",
  },
  {
    part: "motion",
    classes: [".dialog-motion", "in: 200ms ease-out-quint", "out: 140ms ease-in-quart", "scale 0.97 + opacity"],
    note: "Scales in and fades with its backdrop, leaves faster. Nothing under reduced motion. Firefox closes it at once (no overlay transition).",
  },
];

const KEYS: { key: string; sub?: string; does: string }[] = [
  { key: "opening", does: "Focus goes to initialFocus, else the first field, else the first control (the footer's first button)." },
  { key: "Tab, Shift+Tab", does: "Move through the dialog's controls only; the page behind is inert." },
  { key: "Escape", does: "Calls onOpenChange(false). Always: dismissible only concerns the backdrop." },
  { key: "a press on the backdrop", does: "Calls onOpenChange(false), unless dismissible is false. A drag that starts inside doesn't count." },
  { key: "Enter", sub: "in a field", does: "Submits the form, when the body is a <form> and the primary is its submit button." },
  { key: "closing", does: "Focus goes back to whatever opened it (the browser's own restore)." },
];

type PropRow = { name: string; values: string; fallback: string; note: ReactNode };
const PROPS: PropRow[] = [
  { name: "open", values: "boolean", fallback: "required", note: "Always controlled: the page opens it." },
  { name: "onOpenChange", values: "(open) => void", fallback: "required", note: "Called with false on Escape, the ✕, the backdrop, or the browser closing it." },
  { name: "title", values: "string", fallback: "required", note: "A question or a task in a few words: Delete “Launch ideas”?, Rename board." },
  { name: "description", values: "ReactNode", fallback: "–", note: "One or two sentences under the title. Say what happens, not “Are you sure?”." },
  { name: "size", values: '"sm" | "md" | "lg"', fallback: '"md"', note: "384, 448 or 672px wide at most." },
  { name: "radius", values: '"default" | "large"', fallback: '"default"', note: "16px, or 28px for a dialog built round one large field (the new board). Never a className radius." },
  { name: "titleVariant", values: '"default" | "quiet"', fallback: '"default"', note: "Quiet: the title in the secondary colour, a label over a field that carries the subject. Still the accessible name." },
  { name: "role", values: '"dialog" | "alertdialog"', fallback: '"dialog"', note: "alertdialog for a decision with consequences: announced as urgent." },
  { name: "children", values: "ReactNode", fallback: "–", note: "The body. A form goes here, its submit button in the footer with form={id}." },
  { name: "footer", values: "ReactNode", fallback: "–", note: "Buttons, the primary last. One primary." },
  { name: "closeButton", values: "boolean", fallback: "true", note: "The ✕. Leave it on unless the footer's Cancel is right beside the eye." },
  { name: "dismissible", values: "boolean", fallback: "true", note: "Whether the backdrop closes it. Off while there's typing to lose." },
  { name: "initialFocus", values: "RefObject<HTMLElement>", fallback: "–", note: "What takes focus on open: Cancel in a destructive confirmation." },
];

export default function DialogSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Dialog">
        A task that takes the screen&rsquo;s focus until it&rsquo;s done or dismissed: a decision with consequences, or
        a short form that belongs to no page. It&rsquo;s a native <Mono>&lt;dialog&gt;</Mono>, so the browser keeps
        focus inside, makes the page inert and gives focus back when it closes.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                A decision that must be made before going on (delete for good, discard a draft), or a form of one to three
                fields that belongs to no page (name a new board, rename one).
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A message about the page: <Mono>Notice</Mono>. Word that an action worked: <Mono>Toast</Mono> (and
                an undo beats a confirmation for anything reversible). A choice from a list: <Mono>Menu</Mono>. A few
                words on a control: <Mono>Tooltip</Mono>. Anything long, worth a link or a Back button, or with more than
                three fields: its own page. A small confirmation tied to one control can be a small popover where its
                menu was, as BoardView&rsquo;s Delete is (a role=&quot;menu&quot; can&rsquo;t hold a question).
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>size=&quot;md&quot;</Mono>, <Mono>role=&quot;dialog&quot;</Mono>, the ✕ on, the backdrop
                dismissing. A confirmation is <Mono>size=&quot;sm&quot;</Mono> <Mono>role=&quot;alertdialog&quot;</Mono>{" "}
                with <Mono>initialFocus</Mono> on Cancel.
              </>
            ),
          },
          {
            term: "Footer",
            text: (
              <>
                The primary last (right on wide screens, top on phones): <Mono>default</Mono> for a task,{" "}
                <Mono>danger</Mono> for a destructive one, its words the verb (Delete board, Save), never OK or Yes. The
                other is <Mono>muted</Mono> Cancel. One primary, as everywhere.
              </>
            ),
          },
          {
            term: "Closing",
            text: (
              <>
                Controlled: Escape, the ✕ and the backdrop all call <Mono>onOpenChange(false)</Mono> and the page sets{" "}
                <Mono>open</Mono>. The contents unmount after the exit, so every open starts fresh. Turn{" "}
                <Mono>dismissible</Mono> off while a stray click would lose typing; Escape still closes, on purpose.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A <Mono>&lt;div&gt;</Mono> modal with <Mono>fixed inset-0</Mono> (no inert page, no focus trap, no
                Escape, no focus return); a dialog opened on page load or by a timer; a dialog from a dialog; a{" "}
                <Mono>className</Mono> radius or shadow (the new board&rsquo;s 28px is <Mono>radius=&quot;large&quot;</Mono>); &ldquo;Are you sure?&rdquo; as the title (say what will happen).
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Where does it go? (walk it top to bottom)
 ├── It's word that something happened → Toast (with Undo if it can be undone)
 ├── It's about the page or a field → Notice, or the field's error, inline
 ├── It's one small confirmation for one control (Delete in a menu)
 │     → a small alertdialog popover where the menu was
 ├── It's long, has more than three fields, or deserves a link and Back
 │     → its own page
 ├── It must be decided before going on, with consequences
 │     → Dialog size="sm" role="alertdialog", initialFocus on Cancel
 └── A short form that belongs to no page → Dialog size="md"`}
      />

      <SheetSection
        id="live"
        title="Live"
        description="Real dialogs, one set per theme panel, each taking that panel's tokens. Open one, then Tab, Escape, or click the backdrop."
      >
        <Sheet>
          {() => (
            <div className="grid gap-4 md:grid-cols-3">
              <DemoCard name='role="alertdialog" · sm' demo={<ConfirmDialogDemo />}>
                A destructive decision. Focus starts on Cancel, so Enter can&rsquo;t delete by accident.
              </DemoCard>
              <DemoCard name="a form · md" demo={<FormDialogDemo />}>
                Focus starts in the field; Enter saves. Once the name changes, the backdrop no longer closes it.
              </DemoCard>
              <DemoCard name="a longer read · lg" demo={<LongDialogDemo />}>
                The body scrolls; the title and the footer stay.
              </DemoCard>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="anatomy" title="Anatomy" description="What Dialog.tsx builds it from. Take the component whole.">
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

      <SheetSection id="keyboard" title="Keyboard and focus" description="Mostly the browser's: showModal() traps focus and restores it.">
        <Sheet>
          {() => (
            <Matrix
              first="minmax(10rem,max-content)"
              template="minmax(18rem,1fr)"
              columns={["does"]}
              rows={KEYS.map((k) => ({ label: k.key, sub: k.sub, cells: [<Note key="d">{k.does}</Note>] }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="props" title="Props" description="Everything it takes; nothing else passes through.">
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

      <SheetSection id="code" title="In code" description="The component, against the hand-wired dialogs it replaces.">
        <Code
          correct={`import Dialog from "@/components/fundations/molecules/Dialog";

const cancel = useRef<HTMLButtonElement>(null);
<Dialog
  open={confirming}
  onOpenChange={setConfirming}
  role="alertdialog"
  size="sm"
  title={\`Delete “\${board.name}”?\`}
  description="The board and its notes go for good. The posts stay in the library."
  initialFocus={cancel}
  footer={<>
    <Button ref={cancel} variant="muted" onClick={() => setConfirming(false)}>Cancel</Button>
    <Button variant="danger" onClick={remove}>Delete board</Button>
  </>}
/>`}
          incorrect={{
            why: "its own dialog: Escape, the backdrop and focus wired by hand, a radius and shadow off the scale, and a vague title",
            code: `useEffect(() => { open ? ref.current?.showModal() : ref.current?.close(); }, [open]);

<dialog ref={ref} onClick={(e) => e.target === e.currentTarget && onClose()}
  className="rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]">
  <h2 className="font-display text-2xl">Are you sure?</h2>
  <button onClick={onClose}>No</button>
  <button onClick={remove}>Yes</button>
</dialog>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
