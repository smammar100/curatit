# Overlays: Menu, Dialog, Tooltip

Things that float over the page. All three live in `src/components/fundations/molecules/`, are
client components, wrap Fluid Functionalism's Radix-based components since 2026-10-23 (`ui/dropdown`
+ `ui/menu-item`, `ui/dialog`, `ui/tooltip`), and are rendered live in both themes at
`/system/menu`, `/system/dialog` and `/system/tooltip`. All three render in a portal, so on
`/system`'s side-by-side panels they take the site's theme, not the panel's. Never hand-roll one:
each carries focus handling, Escape, motion and touch rules that a copy loses.

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
out of sight until asked for (Sort by). Two to eight items. What the library gives it: the popup
is a surface two steps up the ladder with a dropdown's shadow (`shadow-surface-3`), in a portal
(nothing clips it), entering on the fast spring from the trigger's side, 8px away; one hover
highlight glides to the row nearest the pointer, and a click in a gap lands on the lit row; the
keyboard moves the same highlight; a chosen radio option carries a selected fill that travels to
the next choice, checked boxes that sit together merge their fills, and a checked label gets
heavier without moving. The popup keeps the library's rounded shape on purpose (a 12px container
with 8px rows: a pill at that scale distorts the padding), the one place the site's pill setting
isn't followed. Radix owns the roles, the roving focus, typeahead, Escape and the return of focus
to the trigger.

- `Menu`: `trigger` (a Button element, required), `label` (accessible name) or `heading` (a
  visible title over the items that names the menu; one of the two, required),
  `align` `"start"` (default) | `"end"`, `side` `"bottom"` (default) | `"top"`,
  `open` / `defaultOpen` / `onOpenChange`, `width` `"content"` (default, 176–288px) | `"fixed"`
  (256px, for the person's own names, which truncate), `scrollable` (accepted for older call
  sites, ignored: the items always scroll once they pass 480px), `footer` (after a hairline below
  the items), `returnFocus` `"always"` (default) | `"keyboard"`, `className` (the trigger's
  wrapper, layout only).
- `MenuItem`: `onSelect` (preventDefault keeps it open), `href` (a client-side navigation),
  `icon` (16px) or `media` (a 28px picture on a 44px row: a board's cover), `tone` `"neutral"`
  (default) | `"danger"`, `disabled`. Give it a string: the library sets the words in its own
  weight, and other children lose that.
- `MenuItemCheckbox`: `checked` + `onCheckedChange(checked, event)` (always controlled;
  preventDefault keeps the menu open), `icon` or `media`, `disabled`. One thing on or off (a post
  on a board); the words truncate.
- `MenuRadioGroup` (`label?`, `value`, `onValueChange`: always controlled, because the contents
  unmount on close) with `MenuItemRadio` (`value`, `icon`, `disabled`); `MenuSeparator`;
  `MenuLabel`; `MenuMessage` (a line in place of the items while there's nothing to choose yet:
  Loading your boards…); `MenuCaret` (the trigger's `rightIcon`, turns while open);
  `useMenu().close({ fromKeyboard })` (closes it from inside: the footer's form, on submit).

Rules: choosing an item closes the menu and returns focus to the trigger. A confirmation for a
menu's item (Delete board…) is not menu content (a role="menu" holds only items): it's a small
`role="alertdialog"` opened where the menu was, focus on Cancel, as BoardView's More does. The
danger item is last, after a separator, and ends in … when a dialog follows. Icons on all items
of a group or none. No fields or paragraphs inside (they fight the arrow keys and typeahead),
with one exception: the `footer` may hold one MenuItem that turns into an inline form when
chosen (the Save menu's New board: an `Input` and a `Button`, Enter submits, Escape still closes
the menu). A list that grows with the person's data gets `heading` and `width="fixed"`. With
`returnFocus="keyboard"`, choosing puts focus back on the trigger only from the keyboard: for a
trigger revealed on hover or focus-within (a tile's Save), which focus would keep on screen.

Keyboard: Enter / Space / ↓ open; ↑ ↓ move the highlight, Home / End jump, a letter jumps;
Escape closes to the trigger. Keys typed into the footer's field are the field's.

```tsx
// Correct
<Menu label="Board actions" align="end" trigger={<Button variant="secondary" iconOnly aria-label="More"><Dots /></Button>}>
  <MenuItem onSelect={onRename}>Rename</MenuItem>
  <MenuSeparator />
  <MenuItem tone="danger" onSelect={askToDelete}>Delete board…</MenuItem>
</Menu>

// Correct: the person's boards, each on or off, New board fixed at the foot (boards.tsx SaveMenu)
<Menu heading="Save to board" align="end" width="fixed" returnFocus="keyboard"
  trigger={<Button size="sm" variant="muted" leftIcon={<Plus className="size-3.5" />}>Save</Button>}
  footer={<NewBoardItem label="New board" onCreate={createWithPost} />}>
  {boards.map((b) => (
    <MenuItemCheckbox key={b.id} checked={has(b)} onCheckedChange={(on) => (on ? save(b) : remove(b))}
      media={<BoardThumb board={b} className="size-full" />}>{b.name}</MenuItemCheckbox>
  ))}
</Menu>

// Incorrect: a hand-made role="menu" with its own hover fill (a second highlight) and a popup
// radius off the system
<div {...popover.contentProps} role="menu" className="absolute rounded-2xl bg-modal p-1.5 shadow-lg">
  <button role="menuitem" className="rounded-xl px-3 py-2 hover:bg-base-100">Rename</button>
</div>
```

## Dialog

Use for a decision that must be made before going on, or a short form that belongs to no page.
Not for messages (Notice, Toast), choices from a list (Menu) or anything long (a page). What the
library gives it: a panel four steps up the surface ladder with its shadow and the container
corners, entering on the slow spring (a grow from 0.97 and a fade, the overlay fading with it)
and leaving on its quicker exit tween; under reduced motion it fades without growing. Radix keeps
focus inside, makes the page behind inert, stops it scrolling, closes on Escape and returns focus
to what opened it.

- `open` + `onOpenChange` (required: always controlled), `title` (string, required, the
  accessible name), `description` (read with it), `size` `"sm"` | `"md"` (default) | `"lg"`,
  which map to the library's `sm` / `lg` / `xl`: under the site's compact step those are 360,
  480 and 800px wide (the library's default step would give 400, 540 and 880; `ui/dialog.tsx`
  narrows one notch in a compact region). `radius` is accepted for older call sites and ignored:
  every dialog has the container corners. `titleVariant` `"default"` | `"quiet"` (the title in
  the muted ink, a label over a field that is the subject; still the accessible name), `role`
  `"dialog"` (default) | `"alertdialog"`, `children` (body, scrolls; the title and footer stay
  put), `footer` (buttons, primary last; stacked with the primary on top on phones), `closeButton`
  (default true), `dismissible` (a press outside closes; default true; Escape always closes),
  `initialFocus` (a ref).
- A destructive confirmation: `size="sm" role="alertdialog"`, `initialFocus` on Cancel, a
  `danger` primary named with the verb (Delete board), never OK / Yes.
- A form: put the `<form id>` in `children` and the submit Button in the footer with `form={id}`.
  Turn `dismissible` off once there's typing to lose.
- Focus goes to `initialFocus`, else the first field, else the first control; it returns to the
  opener on close. Contents unmount after the exit, so each open starts fresh.

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
sentence (Notice), never holding a link or button (the label is a string). What the library
gives it: the ink with the page's text in the caption role, a pill, at most 16rem wide, rising
4px from the trigger's side on the fast spring, 6px away, and leaving on its exit tween.

- `label` (string, required), `side` `"top"` (default) | `"right"` | `"bottom"` | `"left"`
  (flips when there's no room), `children` (one element taking a ref and handlers). Other props
  pass on to the trigger, so `<Menu trigger={<Tooltip label="More"><Button …/></Tooltip>}>` works.
- Shows 200ms after the pointer rests, at once on keyboard focus; hides on leave, Escape, blur
  and a press. Never on touch. Radix wires `aria-describedby`. (The library's skip-delay between
  neighbouring tooltips needs an app-level `TooltipProvider`, which the site doesn't mount; each
  tooltip carries its own.)
- It renders in a portal, not beside its trigger, so a parent's `space-x-*` or `*:` selectors
  don't count it. Don't put one on a disabled control: it gets no pointer or focus events.

```tsx
// Correct
<Tooltip label="Copy link">
  <Button variant="transparent" iconOnly aria-label="Copy link"><Copy className="size-4" /></Button>
</Tooltip>

// Incorrect: the title attribute (the account menu's options before Segmented): slow, unstyled,
// never seen on touch or from the keyboard
<button aria-label="Light" title="Light">…</button>
```
