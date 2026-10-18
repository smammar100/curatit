// /system/menu: the shared Menu (fundations/molecules/Menu.tsx) and its parts, live in both
// themes. The demos are client components in ../../demos/OverlayDemos.tsx; this sheet stays a
// server component. Every class is written out in full, never built from parts, so Tailwind sees it
import type { ReactNode } from "react";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";
import {
  ControlledMenuDemo,
  LinkMenuDemo,
  MoreMenuDemo,
  PlacementDemo,
  SortMenuDemo,
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

/** A live demo in a card: its name, what it shows, the specimen */
function DemoCard({ name, children, demo }: { name: string; children: ReactNode; demo: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl bg-card p-5">
      <h4 className="font-mono text-caption-lg text-primary-foreground">{name}</h4>
      <p className="mt-1.5 text-body-sm text-secondary-foreground">{children}</p>
      <div className="mt-5">{demo}</div>
    </div>
  );
}

// The menu's parts, as Menu.tsx builds them
const PARTS: { part: string; sub?: string; classes: string[]; note: ReactNode }[] = [
  {
    part: "surface",
    classes: ["bg-modal shadow-lg", "rounded-2xl p-1.5", "min-w-44 w-max max-w-72", "absolute z-40"],
    note: "Floats over the page: the modal surface and the large shadow, 176 to 288px wide, as wide as its longest item.",
  },
  {
    part: "placement",
    sub: "side · align",
    classes: ["top-full mt-2 · bottom-full mb-2", "left-0 · right-0", "origin-top-left … origin-bottom-right"],
    note: "8px from the trigger, lined up with its start or end edge, and growing from the trigger's corner.",
  },
  {
    part: "row",
    classes: ["rounded-md px-2.5 py-2", "pointer-coarse:py-3", "text-body-sm text-primary-foreground", "gap-2.5"],
    note: "36px tall, 44 on touch screens. Its radius is the menu's less its padding: 12 − 6 = 6.",
  },
  {
    part: "highlight",
    sub: "mouse",
    classes: ["GLIDE_HIGHLIGHT rounded-md", "bg-transparent-hover", "transition-[translate,height,opacity]", "duration-150 ease-out-quint"],
    note: "One fill that glides between rows under a mouse (useGlide). Rows have no hover fill of their own, so there's never two.",
  },
  {
    part: "focus",
    sub: "keyboard",
    classes: ["focus-visible:bg-transparent-hover", "focus-visible:outline-2", "focus-visible:-outline-offset-2", "outline-brand-border-focus"],
    note: "The row's own fill and the brand ring, inset so the padding can't clip it. At once: nothing slides for a key.",
  },
  {
    part: "pressed",
    sub: "touch",
    classes: ["active:bg-transparent-hover"],
    note: "Touch has no glide, so a press fills the row itself.",
  },
  {
    part: "icon",
    classes: ["size-4 shrink-0", "[&>svg]:size-4"],
    note: "Optional, 16px, in the row's colour. Give every item in a group one, or none.",
  },
  {
    part: "danger",
    classes: ['tone="danger"', "text-danger-foreground"],
    note: "Red words for an item that destroys something. Last, after a separator. The words say it too: Delete board…",
  },
  {
    part: "disabled",
    classes: ["disabled", "text-disabled-foreground", "cursor-not-allowed"],
    note: "Shown so people learn it exists; skipped by the arrows and the glide, and can't be chosen.",
  },
  {
    part: "check",
    sub: "MenuItemRadio",
    classes: ["Check size-3.5", "invisible when unchecked"],
    note: "On the right of the chosen option. Always in place, so the width doesn't change with the choice.",
  },
  {
    part: "separator",
    classes: ['role="separator"', "mx-2.5 my-1 h-px", "bg-border-default"],
    note: "A hairline between groups, aligned with the words.",
  },
  {
    part: "label",
    classes: ["MenuLabel", "px-2.5 pt-2 pb-1", "text-caption-lg text-secondary-foreground"],
    note: "A heading over a group. With MenuRadioGroup's label it names the group for screen readers.",
  },
  {
    part: "motion",
    classes: ["animate-menu-in · 150ms ease-out-quint", "animate-menu-out · 120ms ease-in-quart", "motion-reduce:animate-none"],
    note: "Scales from 0.97 and fades in, out faster and inert while it goes (usePresence). Under reduced motion it comes and goes at once.",
  },
];

const KEYS: { key: string; sub?: string; does: string }[] = [
  { key: "Enter, Space", sub: "on the trigger", does: "Opens it with focus on the first item, or the chosen one in a radio group." },
  { key: "↓", sub: "on the trigger", does: "Opens it on the first item (or moves there if it's open)." },
  { key: "↑", sub: "on the trigger", does: "Opens it on the last item." },
  { key: "↓ ↑", sub: "in the menu", does: "The next or previous item, wrapping at the ends. Disabled items are skipped." },
  { key: "Home, End", does: "The first item and the last." },
  { key: "a letter", does: "The next item starting with it; a word typed quickly, the first starting with the word." },
  { key: "Enter, Space", sub: "on an item", does: "Chooses it: runs onSelect or follows href, closes the menu, focus back on the trigger." },
  { key: "Escape", does: "Closes it, focus back on the trigger." },
  { key: "Shift+Tab", does: "Closes it, focus back on the trigger." },
  { key: "Tab", does: "Closes it and goes on to whatever follows the trigger." },
  { key: "a click outside", does: "Closes it and leaves focus where the click put it." },
];

type PropRow = { name: string; values: string; fallback: string; note: ReactNode };

const MENU_PROPS: PropRow[] = [
  {
    name: "trigger",
    values: "ReactElement",
    fallback: "required",
    note: "The button that opens it, usually a Button (or a Tooltip round one). Cloned with aria-haspopup, aria-expanded, aria-controls, the toggle and a ref; its own onClick and onKeyDown run first.",
  },
  { name: "label", values: "string", fallback: "required", note: "The menu's name for screen readers: Board actions, Sort by." },
  { name: "align", values: '"start" | "end"', fallback: '"start"', note: "Lines up with the trigger's left or right edge. end for a trigger at the right of its row." },
  { name: "side", values: '"bottom" | "top"', fallback: '"bottom"', note: "Above the trigger near the bottom of the screen (a footer, a sticky bar)." },
  { name: "open", values: "boolean", fallback: "–", note: "Controlled: the page owns it. Pair with onOpenChange." },
  { name: "defaultOpen", values: "boolean", fallback: "false", note: "Uncontrolled: open on the first render." },
  { name: "onOpenChange", values: "(open) => void", fallback: "–", note: "Every time it opens or closes by itself; not for changes the open prop made." },
  { name: "children", values: "items", fallback: "required", note: "MenuItem, MenuRadioGroup, MenuSeparator, MenuLabel. Nothing else: no fields, no paragraphs." },
  { name: "className", values: "string", fallback: "–", note: "On the wrapper round trigger and menu, for layout only (a margin, ml-auto)." },
];

const ITEM_PROPS: PropRow[] = [
  { name: "children", values: "ReactNode", fallback: "required", note: "The words: a verb or a place, sentence case, an ellipsis when a dialog follows (Delete board…)." },
  { name: "onSelect", values: "(event) => void", fallback: "–", note: "Runs on choosing. event.preventDefault() keeps the menu open." },
  { name: "href", values: "string", fallback: "–", note: "Makes it a next/link. Space works on it like Enter." },
  { name: "icon", values: "ReactNode", fallback: "–", note: "A Phosphor icon, drawn at 16px, decorative." },
  { name: "tone", values: '"neutral" | "danger"', fallback: '"neutral"', note: "danger: red, for an item that destroys something." },
  { name: "disabled", values: "boolean", fallback: "false", note: "Shown, skipped by the keyboard, can't be chosen." },
];

const RADIO_PROPS: PropRow[] = [
  { name: "MenuRadioGroup label", values: "string", fallback: "–", note: "A visible heading that names the group. Leave it out when the menu's label says it." },
  {
    name: "MenuRadioGroup value",
    values: "T",
    fallback: "required",
    note: "Always controlled: the menu's contents unmount when it closes, so an uncontrolled choice would be forgotten.",
  },
  { name: "onValueChange", values: "(value: T) => void", fallback: "required", note: "Called on choosing; the menu then closes." },
  { name: "MenuItemRadio value", values: "string", fallback: "required", note: "The option's value. Also children, icon and disabled, as MenuItem." },
  { name: "MenuLabel", values: "children, id?", fallback: "–", note: "A small heading over a group. Not focusable." },
  { name: "MenuSeparator", values: "none", fallback: "–", note: "A hairline between groups." },
  { name: "MenuCaret", values: "none", fallback: "–", note: "The trigger's caret for rightIcon; turns while open, read off aria-expanded." },
];

function PropsMatrix({ rows }: { rows: PropRow[] }) {
  return (
    <Matrix
      first="minmax(9rem,max-content)"
      template="minmax(10rem,max-content) minmax(7rem,max-content) minmax(18rem,1fr)"
      align="start"
      columns={["values", "default", "notes"]}
      rows={rows.map((p) => ({
        label: p.name,
        cells: [<Mono key="v">{p.values}</Mono>, <Mono key="d">{p.fallback}</Mono>, <Note key="n">{p.note}</Note>],
      }))}
    />
  );
}

export default function MenuSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Menu">
        A short list of actions or choices that opens from a button and closes once one is chosen. It works the
        same from a mouse, a finger and the keyboard, and it&rsquo;s the only menu: the dashboard&rsquo;s hand-made ones
        move onto it.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                Actions on one thing that don&rsquo;t need to be on screen all the time (a board&rsquo;s Rename, Share,
                Delete), or one choice that&rsquo;s out of sight until asked for (Sort by, the feed menu below{" "}
                <Mono>lg</Mono>). Two to eight items; more than that wants a search.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Two to five options always in view: <Mono>Segmented</Mono>. A value inside a form: a native{" "}
                <Mono>&lt;select&gt;</Mono>. Views of one thing: <Mono>Tabs</Mono>. One action: a <Mono>Button</Mono>.
                A field, a sentence of explanation or a confirmation: a <Mono>Dialog</Mono> (or a Dialog opened from the
                item, which then ends in &hellip;).
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>align=&quot;start&quot;</Mono>, <Mono>side=&quot;bottom&quot;</Mono>, uncontrolled. Items are{" "}
                <Mono>tone=&quot;neutral&quot;</Mono> with no icon. The trigger is a <Mono>Button</Mono>: a{" "}
                <Mono>secondary</Mono> one with words and <Mono>MenuCaret</Mono>, or an icon-only one (More) with its{" "}
                <Mono>aria-label</Mono>.
              </>
            ),
          },
          {
            term: "Items",
            text: (
              <>
                Verbs or places, sentence case, one line. An item that opens a dialog ends in &hellip; (Delete
                board&hellip;). The destructive one is <Mono>tone=&quot;danger&quot;</Mono>, last, after a{" "}
                <Mono>MenuSeparator</Mono>. Icons on every item of a group or on none. An item that can&rsquo;t be used
                yet is <Mono>disabled</Mono>, with the reason in its words (soon), rather than missing.
              </>
            ),
          },
          {
            term: "Choosing",
            text: (
              <>
                Closes the menu and puts focus back on the trigger. A choice in a <Mono>MenuRadioGroup</Mono> is always
                controlled (<Mono>value</Mono> + <Mono>onValueChange</Mono>): the contents unmount when it closes.
              </>
            ),
          },
          {
            term: "Placement",
            text: (
              <>
                Inside its own wrapper (<Mono>relative inline-flex</Mono>), so an ancestor with{" "}
                <Mono>overflow</Mono> clips it: don&rsquo;t put a menu in a scrolling row or a clipped card. Near the
                bottom of the screen, <Mono>side=&quot;top&quot;</Mono>; at the right of a row,{" "}
                <Mono>align=&quot;end&quot;</Mono>.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A hand-made <Mono>role=&quot;menu&quot;</Mono> (a second copy of focus, Escape and the glide to keep in
                step); a field or a paragraph inside a menu (it&rsquo;s a list of choices, and typing fights the
                typeahead: that&rsquo;s a Dialog, or a disclosure like the account menu); a menu for navigation across the
                site (that&rsquo;s the header&rsquo;s links); rows with a hover fill of their own (two fills under the
                mouse).
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which control? (walk it top to bottom)
 ├── It does one thing → Button
 ├── It moves between views of the same thing
 │   (Breakdown, Visual DNA) → Tabs
 ├── One value inside a form, read on submit
 │   → <select> (or Segmented for 2–5)
 ├── One value out of 2–5 short ones, worth
 │   keeping in view (theme, grid size) → Segmented
 ├── Several actions on one thing, or one choice
 │   that can hide until asked for → Menu
 └── It needs a field or a sentence to decide
     → Dialog (opened from a Menu item or a Button)`}
        />
        <Flow
          tree={`Which item?
 ├── It goes to another page → MenuItem href
 ├── It's one of a set of exclusive choices
 │   → MenuItemRadio in a MenuRadioGroup
 ├── It destroys something → MenuItem tone="danger",
 │   last, after a MenuSeparator, ending in …
 │   when a confirmation dialog follows
 ├── It exists but can't be used now → disabled,
 │   with the reason in its words
 └── Anything else → MenuItem onSelect`}
        />
      </div>

      <SheetSection
        id="live"
        title="Live"
        description="Each one is a real Menu, one per theme. Open them with a click, or Tab to the trigger and press Enter, Space or ↓; then the arrows, a letter, Escape."
      >
        <Sheet>
          {() => (
            <div className="grid gap-4 sm:grid-cols-2">
              <DemoCard name="actions" demo={<MoreMenuDemo />}>
                BoardView&rsquo;s More: icons, a disabled item, a separator and the danger item last.
              </DemoCard>
              <DemoCard name="MenuRadioGroup" demo={<SortMenuDemo />}>
                One choice out of a few. The check marks the chosen one; MenuCaret turns while it&rsquo;s open.
              </DemoCard>
              <DemoCard name="links and groups" demo={<LinkMenuDemo />}>
                Items with <Mono>href</Mono> are links. MenuLabel heads a group; a labelled radio group follows.
              </DemoCard>
              <DemoCard name="open + onOpenChange" demo={<ControlledMenuDemo />}>
                Controlled: the page owns open, so the button beside it can open the menu too.
              </DemoCard>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="placement"
        title="Placement"
        description="side and align: below or above the trigger, lined up with its start or its end. It grows from the trigger's corner."
      >
        <Sheet>{() => <PlacementDemo />}</Sheet>
      </SheetSection>

      <SheetSection
        id="anatomy"
        title="Anatomy"
        description="What Menu.tsx builds it from. Take the component whole: never rebuild a menu from these classes."
      >
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

      <SheetSection
        id="keyboard"
        title="Keyboard"
        description="The WAI-ARIA menu button pattern, through usePopover. Items aren't tab stops: the arrows move between them."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="minmax(18rem,1fr)"
              columns={["does"]}
              rows={KEYS.map((k) => ({ label: k.key, sub: k.sub, cells: [<Note key="d">{k.does}</Note>] }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="props" title="Props" description="Everything each part takes.">
        <Sheet>
          {() => (
            <div className="flex flex-col gap-8">
              <div>
                <Mono tone="primary">Menu</Mono>
                <div className="mt-3">
                  <PropsMatrix rows={MENU_PROPS} />
                </div>
              </div>
              <div>
                <Mono tone="primary">MenuItem</Mono>
                <div className="mt-3">
                  <PropsMatrix rows={ITEM_PROPS} />
                </div>
              </div>
              <div>
                <Mono tone="primary">MenuRadioGroup, MenuItemRadio, MenuLabel, MenuSeparator, MenuCaret</Mono>
                <div className="mt-3">
                  <PropsMatrix rows={RADIO_PROPS} />
                </div>
              </div>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="code" title="In code" description="The component, against the hand-made menus it replaces.">
        <Code
          correct={`import Menu, { MenuCaret, MenuItem, MenuItemRadio, MenuRadioGroup, MenuSeparator }
  from "@/components/fundations/molecules/Menu";

<Menu label="Board actions" align="end" trigger={
  <Button variant="secondary" size="lg" shape="pill" iconOnly aria-label="More"><Dots /></Button>
}>
  <MenuItem onSelect={onRename}>Rename</MenuItem>
  <MenuItem onSelect={onDescribe}>Add a description</MenuItem>
  <MenuSeparator />
  <MenuItem tone="danger" onSelect={askToDelete}>Delete board…</MenuItem>
</Menu>

<Menu label="Sort by" trigger={<Button variant="secondary" size="sm" rightIcon={<MenuCaret />}>Sort</Button>}>
  <MenuRadioGroup value={sort} onValueChange={setSort}>
    <MenuItemRadio value="newest">Newest</MenuItemRadio>
    <MenuItemRadio value="liked">Most liked</MenuItemRadio>
  </MenuRadioGroup>
</Menu>`}
          incorrect={{
            why: "a menu made by hand: its own popover wiring, rows a step too round (rounded-xl in a rounded-2xl p-1.5 menu), and a hover fill under the glide",
            code: `const popover = usePopover("menu");
<div {...popover.rootProps} className="relative">
  <button aria-haspopup="menu" {...popover.triggerProps}>More</button>
  {popover.mounted && (
    <div {...popover.contentProps} role="menu" aria-label="More"
      className={cx("absolute right-0 mt-2 w-60 rounded-2xl bg-modal p-1.5 shadow-lg", popover.motion)}>
      <button role="menuitem" tabIndex={-1} onClick={() => { popover.close(); onRename(); }}
        className="w-full rounded-xl px-3 py-2 text-left hover:bg-base-100">
        Rename
      </button>
    </div>
  )}
</div>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
