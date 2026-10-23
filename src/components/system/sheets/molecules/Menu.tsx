// /system/menu: the shared Menu (fundations/molecules/Menu.tsx) and its parts, live in both
// themes. Since 2026-10-23 the menu is Fluid Functionalism's Dropdown (src/components/ui/dropdown.tsx
// and menu-item.tsx, on Radix's dropdown menu) behind the same API. The demos are client components
// in ../../demos/OverlayDemos.tsx; this sheet stays a server component. Every class is written out
// in full, never built from parts, so Tailwind sees it
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

// The menu's parts, as the library's DropdownContent and MenuItem draw them under Menu.tsx
const PARTS: { part: string; sub?: string; classes: string[]; note: ReactNode }[] = [
  {
    part: "layer",
    classes: ["Radix DropdownMenu.Portal", "modal={false}", "z-50 outline-none"],
    note: "In a portal at the end of the body, so no overflow or z-index clips it, and non-modal: the page keeps scrolling and the popup follows its trigger. On this page's side-by-side panels it takes the site's theme, not the panel's.",
  },
  {
    part: "surface",
    sub: "Elevated offset 2, shadowLevel 3",
    classes: ["bg-surface-3 shadow-surface-3", "rounded-[12px] overflow-hidden", "select-none outline-none"],
    note: "Two steps up the surface ladder from where it opens (surface 3 on the page, 7 inside a dialog), always with the dropdown's shadow. Light: white with the step-3 drop; dark: a step lighter than the page with the inset highlight and ring. The library's dropdown opts out of the pill shape: 12px corners, 8px rows.",
  },
  {
    part: "width",
    classes: ["content · w-max min-w-44 max-w-72", "fixed · w-64 min-w-0", "max-h-[min(480px,var(--radix-dropdown-menu-content-available-height))]"],
    note: "As wide as its longest item, 176 to 288px, or held at 256px for the person's own names (which truncate). Never taller than 480px or the room Radix finds below the trigger.",
  },
  {
    part: "scroll",
    classes: ["ScrollArea · min-h-0 flex-1 max-h-[inherit]", "scroll-fade · [--scroll-fade-size:32px]", "relative flex flex-col p-1"],
    note: "The rows sit inside the library's ScrollArea (a thumb that shows on hover, a 32px fade at the edge with more beyond it); the 4px-padded wrapper is the highlights' offset parent, so they scroll with the rows.",
  },
  {
    part: "placement",
    sub: "side · align",
    classes: ["sideOffset={8}", "origin-top [--popup-enter-y:-4px]", "data-[side=top]:origin-bottom data-[side=top]:[--popup-enter-y:4px]"],
    note: "8px from the trigger, lined up with its start or end edge; Radix flips it to the other side when there's no room. It grows from the edge nearest the trigger.",
  },
  {
    part: "motion",
    classes: ["initial · opacity 0, y −4px, scaleY 0.96", "in · spring.fast (80ms, no bounce)", "out · spring.fast.exit (60ms)"],
    note: "Fluid Functionalism's fast spring: it rises 4px from the trigger's side while unfolding from 96% tall, and leaves on the tier's quicker tween, kept mounted until that finishes. Under reduced motion (MotionConfig reducedMotion=\"user\") the transforms are dropped and only the fade runs.",
  },
  {
    part: "row",
    classes: ["relative z-10 flex h-7 shrink-0 items-center gap-1", "rounded-[8px] px-1.5", "cursor-pointer outline-none", "media · h-11"],
    note: "28px, the compact control height, so a row lines up with the trigger that opened it. A row with a picture is 44px. shrink-0 keeps a long list scrolling instead of squashing.",
  },
  {
    part: "words",
    classes: [
      "text-[length:var(--fs-body-compact,12px)] leading-[var(--lh-body-compact,18px)]",
      "text-muted-foreground · lit or checked: text-foreground",
      "transition-[color,font-variation-settings] duration-80",
      "checked · 'wght' 550, 'opsz' 18",
    ],
    note: "Grey at rest, the ink when the row is lit or checked. A checked label gets heavier without moving its neighbours: an invisible semibold copy of the same words sits underneath and fixes the row's width.",
  },
  {
    part: "highlight",
    sub: "hover, keyboard",
    classes: ["pointer-events-none absolute left-0 top-0 bg-hover rounded-[8px]", "travel · spring.fast (x, y as a transform)", "opacity · 80ms"],
    note: "One fill, the library's fluid hover: it glides to the row nearest the pointer (so a gap between rows still lights one, and a click in the gap lands on it), and fades in from the checked row when the pointer first enters. The arrow keys move the same fill; a row lit by a key fades in where it is. There is no separate focus ring in a menu: the lit row is the focus.",
  },
  {
    part: "selected fill",
    sub: "MenuItemRadio",
    classes: ["absolute rounded-[8px] bg-active pointer-events-none", "travel · spring.moderate (160ms, critically damped)", "opacity · 80ms"],
    note: "The chosen option sits on the pressed fill. Choosing another, the fill travels there and the check redraws on the new row.",
  },
  {
    part: "merged fills",
    sub: "MenuItemCheckbox",
    classes: ["absolute bg-active pointer-events-none", "one block per run of checked rows", "corners merge and split on spring.moderate"],
    note: "Rows that are on next to each other share one fill (the library's merge/split): the inner corners square off while they touch and round again as one turns off.",
  },
  {
    part: "check",
    classes: ["motion.svg · 14px · text-foreground shrink-0", "draws in 80ms (pathLength), retracts in 40ms", "initial={false}"],
    note: "After the words on a checked radio or checkbox row. It draws itself when a row turns on and retracts when it turns off; a row already checked when the menu opens shows it finished.",
  },
  {
    part: "icon",
    classes: ["inline-flex shrink-0 items-center justify-center [&>svg]:size-full", "16px · text-muted-foreground", "lit or checked · text-foreground"],
    note: "Optional, before the words, in the words' colour. Give every item in a group one, or none.",
  },
  {
    part: "media",
    classes: ["the same wrapper at 28px", "the picture: size-full"],
    note: "A 28px picture in place of the icon (a board's cover, a plus tile), making the row 44px tall.",
  },
  {
    part: "danger",
    classes: ['tone="danger"', "text-danger-foreground", "[&_span]:text-inherit [&_svg]:text-inherit"],
    note: "Red words and icon whatever the row's state, for an item that destroys something. Last, after a separator. The words say it too: Delete board…",
  },
  {
    part: "disabled",
    classes: ["aria-disabled", "opacity-50 pointer-events-none"],
    note: "Shown so people learn it exists; skipped by the arrow keys and by the highlight (it never lights), and can't be chosen.",
  },
  {
    part: "label",
    classes: ["MenuLabel · px-2 py-1.5 shrink-0 text-muted-foreground", "text-[length:var(--fs-caption-compact,11px)] leading-[var(--lh-caption-compact,14px)]"],
    note: "A heading over a group, in the compact caption role. heading on the Menu is the same part, placed first, and names the menu through aria-labelledby.",
  },
  {
    part: "message",
    classes: ["MenuMessage · the label part", "text-body-sm"],
    note: "A line in place of the items while there's nothing to choose yet: Loading your boards…",
  },
  {
    part: "separator",
    classes: ['role="separator"', "my-1 -mx-1 h-px shrink-0", "bg-border/60"],
    note: "A hairline between groups, edge to edge. The footer sits after one.",
  },
];

const KEYS: { key: string; sub?: string; does: string }[] = [
  { key: "Enter, Space, ↓", sub: "on the trigger", does: "Opens it. The library then puts focus on the first enabled row (two frames later, after Radix's own autofocus), which lights it." },
  { key: "↑", sub: "on the trigger", does: "Opens it on the last row (Radix)." },
  { key: "↓ ↑", sub: "in the menu", does: "The next or previous row, wrapping at the ends, disabled rows skipped. The highlight moves with focus; nothing slides in from the checked row." },
  { key: "Home, End", does: "The first row and the last." },
  { key: "a letter", does: "Radix's typeahead on the row's words: the next row starting with it; a word typed quickly, the first starting with the word." },
  { key: "Enter, Space", sub: "on a row", does: "Chooses it: runs onSelect or follows href, closes the menu, focus back on the trigger." },
  { key: "Escape", does: "Closes it, focus back on the trigger." },
  { key: "Tab, Shift+Tab", does: "Nothing: Radix keeps focus in the menu (the rows aren't tab stops). Escape is the way out." },
  { key: "a press outside", does: "Closes it and leaves focus where the press put it." },
  { key: "a click in a gap", does: "Lands on the lit row: what's lit is what a click hits (the library's gap click)." },
];

type PropRow = { name: string; values: string; fallback: string; note: ReactNode };

const MENU_PROPS: PropRow[] = [
  {
    name: "trigger",
    values: "ReactElement",
    fallback: "required",
    note: "The button that opens it, usually a Button (or a Tooltip round one). Radix composes onto it: aria-haspopup, aria-expanded, aria-controls, the toggle and a ref; its own handlers run too.",
  },
  { name: "label", values: "string", fallback: "label or heading", note: "The menu's name for screen readers (aria-label on the role=\"menu\" element): Board actions, Sort by." },
  {
    name: "heading",
    values: "string",
    fallback: "label or heading",
    note: "A visible title over the items that names the menu instead of label (aria-labelledby): Save to board.",
  },
  { name: "align", values: '"start" | "end"', fallback: '"start"', note: "Lines up with the trigger's left or right edge. end for a trigger at the right of its row." },
  { name: "side", values: '"bottom" | "top"', fallback: '"bottom"', note: "Above the trigger near the bottom of the screen (a footer, a sticky bar). Radix flips either when there's no room." },
  { name: "open", values: "boolean", fallback: "–", note: "Controlled: the page owns it. Pair with onOpenChange." },
  { name: "defaultOpen", values: "boolean", fallback: "false", note: "Uncontrolled: open on the first render." },
  { name: "onOpenChange", values: "(open) => void", fallback: "–", note: "Every time it opens or closes by itself (the trigger, an item, Escape, a press outside); not for changes the open prop made." },
  {
    name: "width",
    values: '"content" | "fixed"',
    fallback: '"content"',
    note: "content: as wide as the longest item, 176–288px. fixed: 256px, for the person's own names, which truncate.",
  },
  { name: "scrollable", values: "boolean", fallback: "–", note: "Accepted for older call sites and ignored: the rows always scroll once they pass the popup's height." },
  {
    name: "footer",
    values: "ReactNode",
    fallback: "–",
    note: "After a hairline below the items: one MenuItem that may open into an inline form (New board). The only field a menu holds.",
  },
  {
    name: "returnFocus",
    values: '"always" | "keyboard"',
    fallback: '"always"',
    note: "keyboard: after a choice, focus goes back to the trigger only if it was made from the keyboard (Radix's close autofocus is prevented for a pointer). For a trigger shown on hover or focus-within (a tile's Save).",
  },
  {
    name: "children",
    values: "items",
    fallback: "required",
    note: "MenuItem, MenuItemCheckbox, MenuRadioGroup, MenuSeparator, MenuLabel, MenuMessage. Nothing else: no fields, no paragraphs.",
  },
  { name: "className", values: "string", fallback: "–", note: "On the wrapper round the trigger (relative inline-flex), for layout only (a margin, ml-auto)." },
];

const ITEM_PROPS: PropRow[] = [
  { name: "children", values: "string", fallback: "required", note: "The words: a verb or a place, sentence case, an ellipsis when a dialog follows (Delete board…). A string: the library sets it in its own weight and uses it for typeahead." },
  { name: "onSelect", values: "(event) => void", fallback: "–", note: "Runs on choosing. event.preventDefault() keeps the menu open." },
  { name: "href", values: "string", fallback: "–", note: "Goes there when chosen (router.push, a client-side navigation). Space works on it like Enter." },
  { name: "icon", values: "ReactNode", fallback: "–", note: "A Phosphor icon, drawn at 16px, decorative." },
  { name: "media", values: "ReactNode", fallback: "–", note: "A 28px picture in place of the icon (a board's cover); give it size-full." },
  { name: "tone", values: '"neutral" | "danger"', fallback: '"neutral"', note: "danger: red, for an item that destroys something." },
  { name: "disabled", values: "boolean", fallback: "false", note: "Shown, skipped by the keyboard and the highlight, can't be chosen." },
];

const RADIO_PROPS: PropRow[] = [
  { name: "MenuRadioGroup label", values: "string", fallback: "–", note: "A visible heading (a MenuLabel) that names the group. Leave it out when the menu's label says it." },
  {
    name: "MenuRadioGroup value",
    values: "T",
    fallback: "required",
    note: "Always controlled: the menu's contents unmount when it closes, so an uncontrolled choice would be forgotten. The chosen row carries the travelling fill.",
  },
  { name: "onValueChange", values: "(value: T) => void", fallback: "required", note: "Called on choosing; the menu then closes." },
  { name: "MenuItemRadio value", values: "string", fallback: "required", note: "The option's value (role=\"menuitemradio\", aria-checked from Radix). Also children, icon and disabled, as MenuItem." },
  {
    name: "MenuItemCheckbox",
    values: "checked, onCheckedChange",
    fallback: "required",
    note: "One thing on or off (a post on a board), role=\"menuitemcheckbox\". Always controlled; onCheckedChange(checked, event), and event.preventDefault() keeps the menu open. Rows that are on next to each other share one fill. Also children, icon, media, disabled.",
  },
  { name: "MenuLabel", values: "children, id?", fallback: "–", note: "A small heading over a group. Not focusable." },
  { name: "MenuMessage", values: "children", fallback: "–", note: "A line in place of the items while there's nothing to choose yet. Not focusable." },
  { name: "useMenu()", values: "{ close }", fallback: "–", note: "close({ fromKeyboard }) from inside the menu: the footer's form, on submit." },
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
        A short list of actions or choices that opens from a button and closes once one is chosen. Since 2026-10-23
        it is Fluid Functionalism&rsquo;s Dropdown on Radix&rsquo;s dropdown menu, behind the API the dashboard
        already used: a raised surface in a portal, one hover highlight that glides between rows, a selected fill
        that travels with the choice, and Radix&rsquo;s roles, roving focus, typeahead and Escape. It works the same
        from a mouse, a finger and the keyboard, and it&rsquo;s the only menu.
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
                <Mono>align=&quot;start&quot;</Mono>, <Mono>side=&quot;bottom&quot;</Mono>, <Mono>width=&quot;content&quot;</Mono>,{" "}
                <Mono>returnFocus=&quot;always&quot;</Mono>, uncontrolled. Items are <Mono>tone=&quot;neutral&quot;</Mono>{" "}
                with no icon. The trigger is a <Mono>Button</Mono>: a <Mono>secondary</Mono> one with words and{" "}
                <Mono>MenuCaret</Mono>, or an icon-only one (More) with its <Mono>aria-label</Mono>.
              </>
            ),
          },
          {
            term: "Items",
            text: (
              <>
                Verbs or places, sentence case, one line, as a plain string (the library sets the weight and reads it
                for typeahead). An item that opens a dialog ends in &hellip; (Delete board&hellip;). The destructive one
                is <Mono>tone=&quot;danger&quot;</Mono>, last, after a <Mono>MenuSeparator</Mono>. Icons on every item
                of a group or on none. An item that can&rsquo;t be used yet is <Mono>disabled</Mono>, with the reason in
                its words (soon), rather than missing.
              </>
            ),
          },
          {
            term: "Choosing",
            text: (
              <>
                Closes the menu and puts focus back on the trigger (Radix&rsquo;s close autofocus). A choice in a{" "}
                <Mono>MenuRadioGroup</Mono> is always controlled (<Mono>value</Mono> + <Mono>onValueChange</Mono>):
                the contents unmount when it closes. The chosen option&rsquo;s fill travels to the next choice; checked
                boxes next to each other merge their fills.
              </>
            ),
          },
          {
            term: "Placement",
            text: (
              <>
                The popup renders in a portal, so a scrolling row or a clipped card can&rsquo;t cut it off, and it
                follows the trigger while the page scrolls. Near the bottom of the screen,{" "}
                <Mono>side=&quot;top&quot;</Mono>; at the right of a row, <Mono>align=&quot;end&quot;</Mono>; Radix
                flips either when there&rsquo;s no room. On this page the portal means a menu takes the site&rsquo;s
                theme, not the panel&rsquo;s it opens from.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A hand-made <Mono>role=&quot;menu&quot;</Mono> (a second copy of focus, Escape, typeahead and the
                highlight to keep in step); a field or a paragraph inside a menu (it&rsquo;s a list of choices, and
                typing fights the typeahead: that&rsquo;s a Dialog, or a disclosure like the account menu; the one
                exception is the <Mono>footer</Mono>&rsquo;s item that opens into a name field, the Save menu&rsquo;s
                New board); a menu for navigation across the site (that&rsquo;s the header&rsquo;s links); rows with a
                hover fill of their own (two fills under the mouse); a <Mono>className</Mono> on an item.
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
 ├── It turns one thing on or off (a post on
 │   a board) → MenuItemCheckbox
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
        description="Each one is a real Menu. Open them with a click, or Tab to the trigger and press Enter, Space or ↓; then the arrows, a letter, Escape. Move the pointer slowly down a menu to watch the highlight glide; click between two rows and the lit one is chosen. The popup is in a portal, so both panels' menus wear the site's theme."
      >
        <Sheet>
          {() => (
            <div className="grid gap-4 sm:grid-cols-2">
              <DemoCard name="actions" demo={<MoreMenuDemo />}>
                BoardView&rsquo;s More: icons, a disabled item (never lit), a separator and the danger item last.
              </DemoCard>
              <DemoCard name="MenuRadioGroup" demo={<SortMenuDemo />}>
                One choice out of a few. The chosen row sits on the pressed fill, which travels to the next choice;
                the check draws itself there. MenuCaret turns while it&rsquo;s open.
              </DemoCard>
              <DemoCard name="links and groups" demo={<LinkMenuDemo />}>
                Items with <Mono>href</Mono> navigate when chosen. MenuLabel heads a group; a labelled radio group
                follows.
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
        description="side and align: below or above the trigger, lined up with its start or its end. It rises 4px from the trigger's side on the fast spring, unfolding from 96% tall."
      >
        <Sheet>{() => <PlacementDemo />}</Sheet>
      </SheetSection>

      <SheetSection
        id="anatomy"
        title="Anatomy"
        description="What the library draws under Menu.tsx. Take the component whole: never rebuild a menu from these classes."
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
        description="The WAI-ARIA menu button pattern, owned by Radix: roles, the roving focus, typeahead, Escape, the return of focus to the trigger. Rows aren't tab stops; the arrows move between them, and the highlight follows."
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
                <Mono tone="primary">MenuRadioGroup, MenuItemRadio, MenuItemCheckbox, MenuLabel, MenuMessage, MenuSeparator, MenuCaret, useMenu</Mono>
                <div className="mt-3">
                  <PropsMatrix rows={RADIO_PROPS} />
                </div>
              </div>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection id="code" title="In code" description="The component, against a menu rebuilt from the library's parts by hand.">
        <Code
          correct={`import Menu, { MenuCaret, MenuItem, MenuItemRadio, MenuRadioGroup, MenuSeparator }
  from "@/components/fundations/molecules/Menu";

<Menu label="Board actions" align="end" trigger={
  <Button variant="secondary" size="lg" iconOnly aria-label="More"><Dots /></Button>
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
            why: "the library's Dropdown wired by hand: a trigger-wide popup, row indexes to keep in step, a hover fill of its own under the highlight, and no close or focus return",
            code: `import { DropdownMenu, DropdownTrigger, DropdownContent } from "@/components/ui/dropdown";
import { MenuItem } from "@/components/ui/menu-item";

<DropdownMenu>
  <DropdownTrigger render={<button>More</button>} />
  <DropdownContent>
    <MenuItem index={0} label="Rename" onClick={onRename} className="hover:bg-hover" />
    <MenuItem index={1} label="Delete board" onClick={remove} className="text-danger-foreground" />
  </DropdownContent>
</DropdownMenu>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
