# Forms

Source: `src/components/fundations/elements/` (Input, Textarea, Checkbox, Segmented, Switch) and
`molecules/` (Field, SearchField). Live: `/system/input`, `/system/textarea`, `/system/checkbox`,
`/system/field`, `/system/search-field`, `/system/controls` (Segmented and Switch). Since
2026-10-23 the fields are drawn on Fluid Functionalism's field recipe, Segmented is its segmented
control and Switch its switch; the APIs below are the site's.

## Which control?

```
What does the person enter?
 ├── Words to find or filter something on the page → SearchField
 ├── Text that may run past one line → Textarea
 ├── One line: a name, an email, a URL → Input
 ├── Exactly one of 2–5 short, fixed values → Segmented
 ├── On or off, applied the moment it's flipped → Switch
 └── Yes/no choices, any number on, read when the form is sent → Checkbox
Then put it in a Field (unless it has no visible label: then aria-label, no Field).
```

## Field

Every control with a visible label is the only child of a `Field`. Field clones it to set `id`,
`aria-labelledby`, `aria-describedby` (error, then hint), `aria-invalid` while there's an error,
and `required`. It works in server components. The label is the muted ink and brightens to the
ink while its control has focus, red while it has an error, dimmed while the control is
disabled; in the stacked layout the words sit a notch (`px-2.5`) in from the control's edge, as
the library sets them. A control with no visible label (a header search pill) takes `aria-label`
instead. A set of controls under one heading is a `FieldGroup` (a named export of `Field.tsx`): a
`<fieldset>` whose `<legend>` is set as a Field's label, with optional `description` under it and
`error` under the set, around Fields or controls named with `aria-label` (the review editor's
lists: "Takeaway 1", "Takeaway 2"). Its legend never greys, since one disabled control doesn't
disable the question. `className` is layout only.

`layout`: `stacked` (default: text entry, SearchField, Segmented), `inline` (Checkbox),
`inline-end` (Switch). `descriptionAt`: `label` (default, read before typing) or `control` (a rule
about the value). Nothing else exists.

- Errors say what's wrong and how to fix it ("Enter a valid email address, like
  name@example.com."), never "Invalid". Check on submit (focus the first problem), on leaving a
  field once something's typed, and live once an error shows. Never on the first keystrokes.
  A whole-form failure from the server is a Notice, not a field error.
- `required` draws an asterisk. Mark required fields only in a mostly optional form; where every
  field is needed, mark none.
- `aside` holds a quiet `TextLink` ("Forgot password?") or a count ("96 / 160").

```tsx
// Correct
<Field label="Email address" error={errors.email}>
  <Input type="email" name="email" autoComplete="email" />
</Field>

<FieldGroup legend="Takeaways (3 to 5)" error={problemsAt("takeaways")}>
  {takeaways.map((text, i) => <Textarea key={i} aria-label={`Takeaway ${i + 1}`} rows={2} value={text} … />)}
</FieldGroup>

// Incorrect: the child is a wrapper, so the id and aria land on the div and the label points at nothing
<Field label="Email address"><div className="relative"><Input type="email" /></div></Field>
```

## Input

One line of text, on the field recipe: the one stroke (`ring-1 ring-border`) on no fill, a faint
tint under the pointer (`hover:bg-hover`), the card surface while focused (`focus:bg-surface-3`),
a red ring while `aria-invalid` (`ring-destructive/50`), the pill corners and the control height
from the providers. `size`: `md` (default) or `lg`, both the compact step (28px, 12/18 text, the
site and auth forms); `lg` is kept for call sites and renders the same. Nothing else exists. Text is
16px on touch screens, so iOS doesn't zoom. `invalid` sets `aria-invalid` (Field does it from
`error`). `leadingIcon` is decorative, drawn at 14px in the muted ink and the ink on focus;
`trailing` holds one Kbd or one `xxs` icon Button. `className` lands on a wrapper and is layout
only (`max-w-sm`, `flex-1`); every other prop and `ref` go to the `<input>`. Use the real
`type`/`inputMode`; `autoComplete` on identity fields, `autoComplete="off" spellCheck={false}` on
names of things, codes and slugs.

```tsx
// Correct
<Field label="Name"><Input size="lg" name="name" autoComplete="off" spellCheck={false} /></Field>

// Incorrect: the recipe copied onto a raw input, and className fighting the size and shape
<input className="h-7 rounded-[20px] border-0 ring-1 ring-border …" />
<Input placeholder="Email address" className="h-12 rounded-2xl" />
```

## Textarea

Text that may run past a line (a board description, a note). One line is Input. The same recipe
on the container corners (24px: a block of text wants a card's radius); `size` `md` (default) /
`lg`, the Input's (both compact): one row is the control height (28px), each further row the
step's line (18px). `rows` sets the height (3 by default), never an `h-*` class. `resize`: `vertical`
(default) or `none`. `autoResize` grows it with CSS `field-sizing: content` (no script, no jump),
from `rows` to `maxRows`; browsers without field-sizing keep `rows` and scroll. Always give
`autoResize` a `maxRows`. A limit people will hit is a count in Field's `aside` plus an error
saying how much to cut; `maxLength` alone cuts a paste silently.

```tsx
// Correct
<Field label="Description" aside={<span>{text.length} / 160</span>}>
  <Textarea rows={2} autoResize maxRows={6} value={text} onChange={…} />
</Field>

// Incorrect: a fixed height that fights rows, sideways resize, a placeholder as the label
<textarea placeholder="Description" className="h-32 resize rounded-lg …" />
```

## Checkbox

Independent yes/no choices, or one "I agree" a form reads on submit. Something that applies at
once is a Switch; exactly one of a few is Segmented. A real `<input type="checkbox">`, drawn as
the library's square: a 1.5px stroke of the one border on no fill, darker under the pointer;
checked, the stroke goes and the check draws itself in 80ms (retracts in 40ms; at once under
reduced motion); `indeterminate` is a bar; `invalid` a red stroke. `size`: `md` (default, 16px,
5px corners) or `sm` (14px, 4px: dense lists, table rows). Nothing else; there is no radio.
Uncontrolled with `defaultChecked`, or `checked` + `onCheckedChange`. `indeterminate` (a partly-on
"select all") is set through a ref: controlled. Name it with `<Field layout="inline">`, or
`aria-label` that names its row ("Select Spring launch"). Its hit area is 44px on touch screens
through an invisible `::after`; inline Field rows grow to 44px there, so a hand-built list must
space boxes 44px apart.

```tsx
// Correct
<Field label="Briefs" layout="inline" description="Create grounded creative briefs">
  <Checkbox name="scope" value="curatit:brief" />
</Field>

// Incorrect: the forms plugin's box recoloured by hand, brand fill, no disabled or touch states
<input type="checkbox" className="size-4 rounded text-brand-solid checked:bg-current focus:ring-0" />
```

## SearchField

Finding or filtering on the page. Any other line is Input; the dashboard header search is
`dashboard/SearchBox` and is not reused. `size` `md` (default) / `lg`, the Input's (both 28px);
`value` / `defaultValue` / `onValueChange` (a string). Escape clears and keeps focus (with
nothing to clear it's left for the panel around it). `shortcut` is one key (`"/"`) that focuses
it from anywhere except another field, shown as a Kbd while the field is empty and unfocused;
one per page. Name it with Field or `aria-label` ("Search brands"); the fallback name is
"Search". Announce the count in a `role="status"` line under it.

```tsx
// Correct
<SearchField aria-label="Search boards" shortcut="/" value={q} onValueChange={setQ} />

// Incorrect: no clear button, no Escape, the browser's own clear hidden by Input
<Input type="search" leadingIcon={<Search />} placeholder="Search" />
```

## Segmented and Switch

Both on `/system/controls`. **Segmented**: exactly one of two to five short values, all visible
(theme, grid size, token expiry, MCP / REST). The library's segmented control: a muted track
holding one raised pill (a surface with its shadow) for the choice, which travels on the moderate
spring; a faint hover pill that glides to the option nearest the pointer; one focus ring that
springs between options; the chosen label heavier without moving its neighbours; arrows move the
choice, Home and End jump. `options` (`{ value, label, icon? }`), `value` / `defaultValue` /
`onValueChange`, `size` `sm` (default) / `md` / `lg` (all the compact step: a 28px track, 24px
options; `lg` is kept for call sites), `iconOnly` (the options become squares; labels are their names and
tooltips). `tone` and `shape` are accepted for older call sites and ignored: every control is a
pill with the raised thumb. Name it with `aria-label` or a Field (which passes `aria-labelledby`).
Five or more values, or long labels, need a select (not built yet).

**Switch**: on or off, applied at once ("Share with a link"). The library's switch: a whole
labelled row that toggles on a click anywhere on it, a thumb that can be dragged across the
track (past the middle flips it), stretches under the pointer and squashes while pressed, on the
moderate spring; on, the track is the ink. `label` is required (the row's words and the switch's
name); `labelHidden` keeps the name for screen readers and draws nothing, for a switch whose
words a Field beside it already shows. Controlled only (`checked` + `onCheckedChange`), plus
`disabled`. On its own the row is the label; in a settings list put it in
`<Field layout="inline-end">` with `labelHidden`.

```tsx
// Correct
<Segmented aria-label="Theme" value={theme} onValueChange={setTheme}
  options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} />
<Switch label="Share with a link" checked={on} onCheckedChange={setOn} />
<Field label="Share with a link" layout="inline-end" description="Anyone with the link can view">
  <Switch label="Share with a link" labelHidden checked={on} onCheckedChange={setOn} />
</Field>

// Incorrect: a Switch that does nothing until Save is a Checkbox; three Buttons faking a choice are a Segmented
<Switch label="Weekly email" checked={draft.weekly} onCheckedChange={…} /> <Button>Save settings</Button>
```

## Never

- A placeholder as the label: it vanishes on the first keystroke and is under 4.5:1.
- Colour, height, radius, padding or shadow in a control's `className`: the height and corners
  come from the size and shape providers, and a second look isn't on the sheet.
- Text under 16px in a field on touch screens (built in: don't override the text size).
- Red before the person has tried: errors appear on submit or on leaving a field.
