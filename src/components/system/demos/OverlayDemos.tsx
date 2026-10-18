"use client";

// The live demos on the Menu, Dialog and Tooltip sheets (/system/menu, /system/dialog,
// /system/tooltip). Each is rendered once per theme panel, so every instance has its own state
// and its ids come from useId. Nothing opens on load; a line under each says what the last choice
// was, politely, for screen readers too.
import { useId, useRef, useState, type ReactNode } from "react";
import Button from "@/components/fundations/elements/Button";
import Input from "@/components/fundations/elements/Input";
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import Copy from "@/components/fundations/icons/Copy";
import Eye from "@/components/fundations/icons/Eye";
import PaintBrush from "@/components/fundations/icons/PaintBrush";
import Search from "@/components/fundations/icons/Search";
import ShareNetwork from "@/components/fundations/icons/ShareNetwork";
import Dialog from "@/components/fundations/molecules/Dialog";
import Field from "@/components/fundations/molecules/Field";
import Menu, {
  MenuCaret,
  MenuItem,
  MenuItemRadio,
  MenuLabel,
  MenuRadioGroup,
  MenuSeparator,
} from "@/components/fundations/molecules/Menu";
import Tooltip from "@/components/fundations/molecules/Tooltip";

/** What the last choice was, read out politely */
function Status({ children }: { children: ReactNode }) {
  return (
    <p aria-live="polite" className="min-h-5 text-body-sm text-secondary-foreground">
      {children}
    </p>
  );
}

// Three dots, as BoardView's More button draws them
function Dots() {
  return (
    <span aria-hidden="true" className="flex gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-[3px] rounded-full bg-current" />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------------------------
// Menu

/** BoardView's More menu: actions on one board, the destructive one last and red */
export function MoreMenuDemo() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-3">
      <Menu
        label="Board actions"
        align="start"
        trigger={
          <Button variant="secondary" size="lg" shape="pill" iconOnly aria-label="More">
            <Dots />
          </Button>
        }
      >
        <MenuItem icon={<PaintBrush />} onSelect={() => setLast("Rename")}>
          Rename
        </MenuItem>
        <MenuItem icon={<ShareNetwork />} onSelect={() => setLast("Share")}>
          Share
        </MenuItem>
        <MenuItem icon={<Copy />} onSelect={() => setLast("Duplicate")}>
          Duplicate
        </MenuItem>
        <MenuItem icon={<Eye />} disabled>
          Make public (soon)
        </MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" onSelect={() => setLast("Delete board…")}>
          Delete board…
        </MenuItem>
      </Menu>
      <Status>{last ? `Chose ${last}.` : "Open it with a click, or Tab to it and press Enter or ↓."}</Status>
    </div>
  );
}

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "liked", label: "Most liked" },
  { value: "brand", label: "Brand A–Z" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

/** One choice out of a few, out of sight until asked for: a radio group with a check */
export function SortMenuDemo() {
  const [sort, setSort] = useState<Sort>("newest");
  const name = SORTS.find((s) => s.value === sort)?.label;
  return (
    <div className="flex flex-col items-start gap-3">
      <Menu
        label="Sort by"
        trigger={
          <Button variant="secondary" size="sm" rightIcon={<MenuCaret />}>
            {`Sort: ${name}`}
          </Button>
        }
      >
        <MenuRadioGroup value={sort} onValueChange={setSort}>
          {SORTS.map((s) => (
            <MenuItemRadio key={s.value} value={s.value}>
              {s.label}
            </MenuItemRadio>
          ))}
        </MenuRadioGroup>
      </Menu>
      <Status>Opened from the keyboard, focus starts on the chosen one ({name}).</Status>
    </div>
  );
}

/** Links and labelled groups: an item with href is a next/link */
export function LinkMenuDemo() {
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  return (
    <Menu
      label="This page"
      trigger={
        <Button variant="secondary" size="sm" rightIcon={<MenuCaret />}>
          Go to
        </Button>
      }
    >
      <MenuLabel>Sheets</MenuLabel>
      <MenuItem href="/system/dialog">Dialog</MenuItem>
      <MenuItem href="/system/tooltip">Tooltip</MenuItem>
      <MenuItem href="/system/button">Button</MenuItem>
      <MenuSeparator />
      <MenuRadioGroup label="Density" value={density} onValueChange={setDensity}>
        <MenuItemRadio value="comfortable">Comfortable</MenuItemRadio>
        <MenuItemRadio value="compact">Compact</MenuItemRadio>
      </MenuRadioGroup>
    </Menu>
  );
}

/** The four placements: align start or end, below or above */
export function PlacementDemo() {
  const spots = [
    { side: "bottom", align: "start" },
    { side: "bottom", align: "end" },
    { side: "top", align: "start" },
    { side: "top", align: "end" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-3 pt-36">
      {spots.map((spot) => (
        <Menu
          key={`${spot.side}-${spot.align}`}
          label={`Placement ${spot.side} ${spot.align}`}
          side={spot.side}
          align={spot.align}
          trigger={
            <Button variant="secondary" size="sm" rightIcon={<MenuCaret />}>
              {`${spot.side} · ${spot.align}`}
            </Button>
          }
        >
          <MenuItem>First</MenuItem>
          <MenuItem>Second</MenuItem>
          <MenuItem>Third</MenuItem>
        </Menu>
      ))}
    </div>
  );
}

/** Controlled: the page owns open, so something else can open it */
export function ControlledMenuDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Menu
          label="Saved to"
          open={open}
          onOpenChange={setOpen}
          trigger={
            <Button variant="secondary" size="sm" leftIcon={<BookmarkSimple className="size-3.5" />} rightIcon={<MenuCaret />}>
              Save
            </Button>
          }
        >
          <MenuItem>Launch ideas</MenuItem>
          <MenuItem>Carousel hooks</MenuItem>
          <MenuItem>Type that sells</MenuItem>
        </Menu>
        <Button variant="muted" size="sm" onClick={() => setOpen(true)}>
          Open it from here
        </Button>
      </div>
      <Status>
        <code className="font-mono text-caption-lg text-primary-foreground">open</code> is {String(open)}.
      </Status>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Dialog

/** A decision with consequences: alertdialog, sm, focus on Cancel so Enter can't delete */
export function ConfirmDialogDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const close = (result: string) => {
    setLast(result);
    setOpen(false);
  };
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="dangerSubtle" size="sm" onClick={() => setOpen(true)}>
        Delete board…
      </Button>
      <Status>{last ?? "Nothing deleted: this is a demo."}</Status>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close("Kept the board."))}
        role="alertdialog"
        size="sm"
        title="Delete “Launch ideas”?"
        description="The board and its notes go for good. The posts stay in the library."
        initialFocus={cancel}
        footer={
          <>
            <Button ref={cancel} variant="muted" onClick={() => close("Kept the board.")}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => close("Deleted it (not really).")}>
              Delete board
            </Button>
          </>
        }
      />
    </div>
  );
}

/** A short form: focus starts in the field, and the backdrop won't throw away a changed name */
export function FormDialogDemo() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Launch ideas");
  const [draft, setDraft] = useState(name);
  const formId = useId();
  const changed = draft.trim() !== name;
  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setDraft(name);
          setOpen(true);
        }}
      >
        Rename board
      </Button>
      <Status>The board is called “{name}”.</Status>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Rename board"
        dismissible={!changed}
        footer={
          <>
            <Button variant="muted" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId} disabled={!draft.trim()}>
              Save
            </Button>
          </>
        }
      >
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            setName(draft.trim());
            setOpen(false);
          }}
        >
          <Field label="Name" description="Up to 120 characters. Only you see it unless you share the board.">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={120} autoComplete="off" required />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}

const SECTIONS = [
  ["What a board is", "A board is a set of posts you saved for one job: a launch, a client, a brief. Each post can carry a note."],
  ["Who can see it", "Only you, until you turn on Share with a link. Then anyone with the link can view it, read-only, notes included."],
  ["Turning sharing off", "Stop sharing kills the link at once. Turning it on again makes a new one, so the old link stays dead."],
  ["Deleting", "Deleting a board removes it and its notes for good. The posts stay in the library and on your other boards."],
  ["Moving posts", "A post can be on any number of boards. Taking it off one leaves the others alone."],
  ["Names", "A board's name is 1 to 120 characters. Its description is a line, up to 160."],
];

/** A longer read: lg, the body scrolls while the title and footer stay */
export function LongDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        How boards work
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="How boards work"
        description="Six things worth knowing before you share one."
        footer={<Button onClick={() => setOpen(false)}>Got it</Button>}
      >
        <div className="flex flex-col gap-5">
          {[...SECTIONS, ...SECTIONS].map(([heading, text], i) => (
            <section key={i}>
              <h3 className="text-body-sm font-medium text-primary-foreground">{heading}</h3>
              <p className="mt-1">{text}</p>
            </section>
          ))}
        </div>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Tooltip

/** A row of icon-only buttons: the first waits 400ms, the next ones show at once */
export function ToolbarTooltipDemo() {
  const tools = [
    { label: "Copy link", icon: <Copy className="size-4" /> },
    { label: "Share", icon: <ShareNetwork className="size-4" /> },
    { label: "Save", icon: <BookmarkSimple className="size-4" /> },
    { label: "Search the library", icon: <Search className="size-4" /> },
  ];
  return (
    <div role="toolbar" aria-label="Post actions" className="flex gap-1">
      {tools.map((tool) => (
        <Tooltip key={tool.label} label={tool.label}>
          <Button variant="transparent" size="base" iconOnly aria-label={tool.label}>
            {tool.icon}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

/** Each side; near an edge of the window it flips */
export function SidesTooltipDemo() {
  const sides = ["top", "right", "bottom", "left"] as const;
  return (
    <div className="flex flex-wrap gap-3">
      {sides.map((side) => (
        <Tooltip key={side} label={`On the ${side}`} side={side}>
          <Button variant="secondary" size="sm">
            {side}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}

/** Words the label leaves out: the tooltip describes, it doesn't name */
export function DescriptionTooltipDemo() {
  return (
    <Tooltip label="Anyone with the link can view it, read-only">
      <Button variant="secondary" size="sm" leftIcon={<ShareNetwork className="size-3.5" />}>
        Share
      </Button>
    </Tooltip>
  );
}

/** A tooltip on a menu's trigger: Menu clones the Tooltip, which passes everything on */
export function MenuTooltipDemo() {
  return (
    <Menu
      label="Board actions"
      trigger={
        <Tooltip label="More">
          <Button variant="secondary" size="lg" shape="pill" iconOnly aria-label="More">
            <Dots />
          </Button>
        </Tooltip>
      }
    >
      <MenuItem>Rename</MenuItem>
      <MenuItem>Share</MenuItem>
      <MenuSeparator />
      <MenuItem tone="danger">Delete board…</MenuItem>
    </Menu>
  );
}
