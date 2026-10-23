// /system/dialog: the shared Dialog (fundations/molecules/Dialog.tsx), live in both themes. Since
// 2026-10-23 it is Fluid Functionalism's Dialog (src/components/ui/dialog.tsx, on Radix's dialog)
// behind the same API. The demos are client components in ../../demos/OverlayDemos.tsx; this sheet
// stays a server component. Every class is written out in full, never built from parts, so
// Tailwind sees it
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

// The parts, as the library's DialogContent draws them under Dialog.tsx
const PARTS: { part: string; sub?: string; classes: string[]; note: ReactNode }[] = [
  {
    part: "layer",
    classes: ["Radix Dialog.Portal", "fixed left-1/2 top-1/2 z-50", "w-[calc(100%-2rem)]"],
    note: "In a portal at the end of the body, centred by Radix's Content, 16px from the screen's edges on a phone. On this page's side-by-side panels it takes the site's theme, not the panel's.",
  },
  {
    part: "surface",
    sub: "Elevated offset 4",
    classes: ["bg-surface-5 shadow-surface-5", "rounded-[24px] p-6", "focus:outline-none"],
    note: "Four steps up the surface ladder from the page, with the step's own shadow (the dropdown keeps a fixed shadow; a dialog's grows with its height). The container corners of the pill shape. A Menu opened inside it walks on up to surface 7.",
  },
  {
    part: "size",
    classes: ["sm · max-w-[360px]", "md · max-w-[480px]", "lg · max-w-[800px]"],
    note: "A confirmation, a short form, a longer read, on the library's sm, lg and xl (400, 540 and 880px), which it narrows one notch in a compact region: the whole site is one (FluidRoot), so these are the widths drawn.",
  },
  {
    part: "height",
    classes: ["flex max-h-[calc(100dvh-2rem)] flex-col", "header shrink-0 · body min-h-0 flex-1 overflow-y-auto · footer shrink-0"],
    note: "Never taller than the screen less 16px a side: the body scrolls on its own while the title and footer stay.",
  },
  {
    part: "overlay",
    classes: ["fixed inset-0 z-50 bg-black/40 dark:bg-black/80", "fades on spring.slow, out on spring.slow.exit"],
    note: "The library's scrim, fading with the panel: 40% black on the light site, 80% on the dark (the one dark: in the system, inside the vendored file). No blur: it costs a frame on phones.",
  },
  {
    part: "motion",
    classes: ["initial · opacity 0, scale 0.97", "in · spring.slow (240ms, bounce 0.12)", "out · spring.slow.exit (160ms)"],
    note: "Fluid Functionalism's slow spring: a short grow from 97% with a fade and a touch of overshoot; it leaves on the tier's quicker tween and stays mounted until that finishes (a fallback timer releases a throttled tab). Under reduced motion (MotionConfig reducedMotion=\"user\") only the fade runs.",
  },
  {
    part: "header",
    classes: ["flex flex-col gap-1.5 mb-4", "closeButton · pr-10"],
    note: "Title over description, with room on the right for the ✕ so a long title never runs under it.",
  },
  {
    part: "title",
    classes: [
      "Radix Dialog.Title (h2) · aria-labelledby",
      "text-[length:var(--fs-title-compact,15px)] leading-[var(--lh-title-compact,20px)]",
      "'wght' 550, 'opsz' 18 · text-balance",
      "default · text-foreground · quiet · text-muted-foreground",
    ],
    note: "The compact title role in the semibold weight: a dialog's title labels a task, it isn't a page heading, so not the serif. Quiet steps it back to a grey label when the first field is the subject (New board over the name set large); it still names the dialog.",
  },
  {
    part: "description",
    classes: ["Radix Dialog.Description (p) · aria-describedby", "text-[length:var(--fs-body-compact,12px)] leading-[var(--lh-body-compact,18px)]", "text-muted-foreground text-pretty"],
    note: "One or two sentences, read with the title as it opens.",
  },
  {
    part: "body",
    classes: ["min-h-0 flex-1 overflow-y-auto", "text-body text-muted-foreground"],
    note: "The dashboard's body role, grey; a form goes here with its submit button in the footer.",
  },
  {
    part: "footer",
    classes: ["flex justify-end gap-2 mt-6", "flex-col-reverse *:max-sm:w-full sm:flex-row"],
    note: "Right-aligned, the primary last. On phones the buttons stack full width, the primary on top.",
  },
  {
    part: "close",
    classes: ['the library\'s Button variant="ghost" size="icon-sm" (28px)', "absolute right-3 top-3", 'Phosphor X · <span class="sr-only">Close</span>'],
    note: "Radix's Close round the library's ghost icon button, rendered after the content, so it's top right to the eye and last in the tab order: focus starts on the task.",
  },
];

const KEYS: { key: string; sub?: string; does: string }[] = [
  { key: "opening", does: "Focus goes to initialFocus, else the first field (input, textarea or select), else where Radix puts it: the first focusable thing in the panel." },
  { key: "Tab, Shift+Tab", does: "Move through the dialog's controls only: Radix's focus scope loops at the ends." },
  { key: "the page behind", does: "Hidden from screen readers (aria-hidden on everything outside the portal), its pointer events off and its scroll locked by Radix while the dialog is open." },
  { key: "Escape", does: "Calls onOpenChange(false). Always: dismissible only concerns a press outside." },
  { key: "a press outside", does: "Calls onOpenChange(false), unless dismissible is false, when the pointer-down and the interaction are both prevented." },
  { key: "Enter", sub: "in a field", does: "Submits the form, when the body is a <form> and the primary is its submit button (form={id})." },
  { key: "closing", does: "Focus goes back to what opened it (Radix's close autofocus), after the exit has played." },
];

type PropRow = { name: string; values: string; fallback: string; note: ReactNode };
const PROPS: PropRow[] = [
  { name: "open", values: "boolean", fallback: "required", note: "Always controlled: the page opens it." },
  { name: "onOpenChange", values: "(open) => void", fallback: "required", note: "Called with false on Escape, the ✕ and a press outside." },
  { name: "title", values: "string", fallback: "required", note: "A question or a task in a few words: Delete “Launch ideas”?, Rename board." },
  { name: "description", values: "ReactNode", fallback: "–", note: "One or two sentences under the title. Say what happens, not “Are you sure?”." },
  { name: "size", values: '"sm" | "md" | "lg"', fallback: '"md"', note: "360, 480 or 800px wide at most (the library's 400, 540, 880 narrowed for the compact site)." },
  { name: "radius", values: '"default" | "large"', fallback: "–", note: "Accepted for older call sites and ignored: every dialog has the container corners, 24px, from the site's shape." },
  { name: "titleVariant", values: '"default" | "quiet"', fallback: '"default"', note: "Quiet: the title in the muted colour, a label over a field that carries the subject. Still the accessible name." },
  { name: "role", values: '"dialog" | "alertdialog"', fallback: '"dialog"', note: "alertdialog for a decision with consequences: announced as urgent." },
  { name: "children", values: "ReactNode", fallback: "–", note: "The body. A form goes here, its submit button in the footer with form={id}." },
  { name: "footer", values: "ReactNode", fallback: "–", note: "Buttons, the primary last. One primary." },
  { name: "closeButton", values: "boolean", fallback: "true", note: "The ✕ (the library's ghost icon button). Leave it on unless the footer's Cancel is right beside the eye." },
  { name: "dismissible", values: "boolean", fallback: "true", note: "Whether a press outside closes it. Off while there's typing to lose; Escape still closes." },
  { name: "initialFocus", values: "RefObject<HTMLElement>", fallback: "–", note: "What takes focus on open: Cancel in a destructive confirmation." },
];

export default function DialogSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Dialog">
        A task that takes the screen&rsquo;s focus until it&rsquo;s done or dismissed: a decision with consequences, or
        a short form that belongs to no page. Since 2026-10-23 it is Fluid Functionalism&rsquo;s Dialog on
        Radix&rsquo;s: a panel four steps up the surface ladder, growing in on the slow spring over a fading
        overlay, with Radix keeping focus inside, hiding the page behind, locking its scroll and giving focus back
        when it closes.
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
                three fields: its own page.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>size=&quot;md&quot;</Mono>, <Mono>role=&quot;dialog&quot;</Mono>, the ✕ on, a press outside
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
                Controlled: Escape, the ✕ and a press outside all call <Mono>onOpenChange(false)</Mono> and the page
                sets <Mono>open</Mono>. The panel plays its exit, then unmounts, so every open starts fresh. Turn{" "}
                <Mono>dismissible</Mono> off while a stray click would lose typing; Escape still closes, on purpose.
              </>
            ),
          },
          {
            term: "Surface",
            text: (
              <>
                The library&rsquo;s Elevated sets the dialog four steps up the ladder and tells what&rsquo;s inside
                where it sits, so a Menu opened from the dialog rises two more steps with the dropdown&rsquo;s shadow.
                Nothing inside needs a surface of its own.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A <Mono>&lt;div&gt;</Mono> modal with <Mono>fixed inset-0</Mono> (no hidden page, no focus loop, no
                Escape, no focus return); a dialog opened on page load or by a timer; a dialog from a dialog; a{" "}
                <Mono>className</Mono> radius, shadow or surface (the corners and the ladder step are the
                system&rsquo;s); &ldquo;Are you sure?&rdquo; as the title (say what will happen).
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`Where does it go? (walk it top to bottom)
 ├── It's word that something happened → Toast (with Undo if it can be undone)
 ├── It's about the page or a field → Notice, or the field's error, inline
 ├── It's long, has more than three fields, or deserves a link and Back
 │     → its own page
 ├── It must be decided before going on, with consequences
 │     → Dialog size="sm" role="alertdialog", initialFocus on Cancel
 └── A short form that belongs to no page → Dialog size="md"`}
      />

      <SheetSection
        id="live"
        title="Live"
        description="Real dialogs. Open one, then Tab, Escape, or press on the overlay. They render in a portal, so both panels' dialogs wear the site's theme."
      >
        <Sheet>
          {() => (
            <div className="grid gap-4 md:grid-cols-3">
              <DemoCard name='role="alertdialog" · sm' demo={<ConfirmDialogDemo />}>
                A destructive decision. Focus starts on Cancel, so Enter can&rsquo;t delete by accident.
              </DemoCard>
              <DemoCard name="a form · md" demo={<FormDialogDemo />}>
                Focus starts in the field; Enter saves. Once the name changes, a press outside no longer closes it.
              </DemoCard>
              <DemoCard name="a longer read · lg" demo={<LongDialogDemo />}>
                The body scrolls; the title and the footer stay.
              </DemoCard>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="anatomy" title="Anatomy" description="What the library draws under Dialog.tsx. Take the component whole.">
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

      <SheetSection id="keyboard" title="Keyboard and focus" description="Radix's: a focus scope that loops, the page behind hidden and locked, Escape, and focus returned on close.">
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

      <SheetSection id="code" title="In code" description="The component, against the library's parts wired by hand.">
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
            why: "the library's Dialog by hand: focus lands on the first button (Delete), a radius and surface off the ladder, no MotionConfig, and a vague title",
            code: `import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={onClose}>
  <DialogContent size="sm" className="rounded-[28px] bg-surface-8 p-8">
    <DialogTitle>Are you sure?</DialogTitle>
    <button onClick={remove}>Yes</button>
    <button onClick={onClose}>No</button>
  </DialogContent>
</Dialog>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
