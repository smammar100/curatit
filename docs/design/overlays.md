# Overlays: Menu, Dialog, Tooltip

Things that float over the page. All three live in `src/components/fundations/molecules/`, are
client components, and are rendered live in both themes at `/system/menu`, `/system/dialog` and
`/system/tooltip`. Never hand-roll one: each carries focus handling, Escape, motion and touch
rules that a copy loses.

## Which one?

```
Does the overlay hold controls (actions, fields, links)?
 ├── No: it's a few words about one control
 │    ├── Needed to use the control, or read on a phone → visible text, not an overlay
 │    └── Otherwise → Tooltip
 └── Yes
      ├── A list of actions on one thing, or one hidden choice → Menu
      ├── A decision with consequences, or a 1–3 field form with no page → Dialog
      └── Long, linkable, more than three fields → its own page
```

Other alternatives: two to five options always in view are a `Segmented`; a value in a form is
a native `<select>`; views of one thing are `Tabs`; word that something happened is a `Toast`.

## Menu

Use for actions on one thing that needn't be on screen (Rename, Share, Delete) or one choice
out of sight until asked for (Sort by). Two to eight items.

- `Menu`: `trigger` (a Button element, required), `label` (accessible name, required),
  `align` `"start"` (default) | `"end"`, `side` `"bottom"` (default) | `"top"`,
  `open` / `defaultOpen` / `onOpenChange`, `className` (wrapper, layout only).
- `MenuItem`: `onSelect` (preventDefault keeps it open), `href` (a next/link), `icon`,
  `tone` `"neutral"` (default) | `"danger"`, `disabled`.
- `MenuRadioGroup` (`label?`, `value`, `onValueChange`: always controlled, because the contents
  unmount on close) with `MenuItemRadio` (`value`); `MenuSeparator`; `MenuLabel`; `MenuCaret`
  (the trigger's `rightIcon`, turns while open).

Rules: choosing an item closes the menu and returns focus to the trigger. The danger item is
last, after a separator, and ends in … when a dialog follows. Icons on all items of a group or
none. No fields or paragraphs inside (they fight the arrow keys and typeahead). The menu is
positioned inside its wrapper, so an ancestor with `overflow` clips it.

Keyboard: Enter / Space / ↓ open on the first item (the checked one in a radio group), ↑ on the
last; ↑ ↓ wrap, Home / End, a letter jumps; Escape and Shift+Tab close to the trigger; Tab closes
and moves on.

```tsx
// Correct
<Menu label="Board actions" align="end" trigger={<Button variant="secondary" iconOnly aria-label="More"><Dots /></Button>}>
  <MenuItem onSelect={onRename}>Rename</MenuItem>
  <MenuSeparator />
  <MenuItem tone="danger" onSelect={askToDelete}>Delete board…</MenuItem>
</Menu>

// Incorrect: a hand-made role="menu" (BoardView's MoreMenu before the migration), rows
// rounded-xl in a rounded-2xl p-1.5 menu (one step too round) and a hover fill under the glide
<div {...popover.contentProps} role="menu" className="absolute rounded-2xl bg-modal p-1.5 shadow-lg">
  <button role="menuitem" className="rounded-xl px-3 py-2 hover:bg-base-100">Rename</button>
</div>
```

## Dialog

Use for a decision that must be made before going on, or a short form that belongs to no page.
Not for messages (Notice, Toast), choices from a list (Menu) or anything long (a page).

- `open` + `onOpenChange` (required: always controlled), `title` (string, required, the
  accessible name), `description` (read with it), `size` `"sm"` 384 | `"md"` 448 (default) |
  `"lg"` 672, `role` `"dialog"` (default) | `"alertdialog"`, `children` (body, scrolls),
  `footer` (buttons, primary last), `closeButton` (default true), `dismissible` (backdrop
  closes; default true), `initialFocus` (a ref).
- A destructive confirmation: `size="sm" role="alertdialog"`, `initialFocus` on Cancel, a
  `danger` primary named with the verb (Delete board), never OK / Yes.
- A form: put the `<form id>` in `children` and the submit Button in the footer with `form={id}`.
  Turn `dismissible` off once there's typing to lose (Escape still closes, on purpose).
- Focus goes to `initialFocus`, else the first field, else the first control; it returns to the
  opener on close. The page behind is inert and stops scrolling. Contents unmount after the
  140ms exit, so each open starts fresh.

```tsx
// Correct
<Dialog open={confirming} onOpenChange={setConfirming} role="alertdialog" size="sm"
  title={`Delete “${board.name}”?`} description="The board and its notes go for good."
  initialFocus={cancel}
  footer={<><Button ref={cancel} variant="muted" onClick={() => setConfirming(false)}>Cancel</Button>
           <Button variant="danger" onClick={remove}>Delete board</Button></>} />

// Incorrect: a hand-wired <dialog> with a radius and shadow off the scale and a vague title
<dialog ref={ref} className="rounded-[28px] bg-white shadow-[0_24px_60px_-20px_rgb(0_0_0/0.35)]">
  <h2>Are you sure?</h2><button>No</button><button>Yes</button>
</dialog>
```

## Tooltip

Use for the name of an icon-only control (same words as its `aria-label`) or one short phrase a
visible label leaves out. Not for anything needed to act (it never shows on touch), not for a
sentence (Notice), never holding a link or button (the label is a string).

- `label` (string, required), `side` `"top"` (default) | `"right"` | `"bottom"` | `"left"`
  (flips when there's no room), `children` (one element taking a ref and handlers). Other props
  pass on to the trigger, so `<Menu trigger={<Tooltip label="More"><Button …/></Tooltip>}>` works.
- Shows after 400ms of mouse rest, at once within 300ms of another tooltip or on keyboard
  focus (no animation then); hides on leave (100ms grace to reach it), Escape, blur, press,
  scroll. Never on touch, never over the menu its trigger opened.
- It renders a `<span>` right after its trigger (hidden until shown, in the top layer when
  shown): a parent's `space-x-*` or `*:` child selectors count it.

```tsx
// Correct
<Tooltip label="Copy link">
  <Button variant="transparent" iconOnly aria-label="Copy link"><Copy className="size-4" /></Button>
</Tooltip>

// Incorrect: the title attribute (the account menu's options before Segmented): slow, unstyled,
// never seen on touch or from the keyboard
<button aria-label="Light" title="Light">…</button>
```
