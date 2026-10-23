# Forms

Source: `src/components/fundations/elements/` (Input, Textarea, Checkbox, Segmented, Switch) and
`molecules/` (Field, SearchField). Live: `/system/input`, `/system/textarea`, `/system/checkbox`,
`/system/field`, `/system/search-field`, `/system/controls` (Segmented and Switch).

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
and `required`. It works in server components. A control with no visible label (a header search
pill) takes `aria-label` instead. A set of controls under one heading is a `FieldGroup` (a named
export of `Field.tsx`): a `<fieldset>` whose `<legend>` is set as a Field's label, with optional
`description` under it and `error` under the set, around Fields or controls named with
`aria-label` (the review editor's lists: "Takeaway 1", "Takeaway 2"). Its legend never greys, since
one disabled control doesn't disable the question. `className` is layout only.

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

One line of text. `size`: `md` (default, 40px, `text-body-sm`, `rounded-lg`: the site and auth
forms) or `lg` (44px, the dashboard's body role, `rounded-xl`: only in the dashboard, beside its
44px buttons). Nothing else exists. `invalid` sets `aria-invalid` (Field does it from `error`).
`leadingIcon` is decorative; `trailing` holds one Kbd or one `xxs` icon Button (24px reserved).
`className` lands on a wrapper and is layout only (`max-w-sm`, `flex-1`); every other prop and
`ref` go to the `<input>`. Use the real `type`/`inputMode`; `autoComplete` on identity fields,
`autoComplete="off" spellCheck={false}` on names of things, codes and slugs.

```tsx
// Correct
<Field label="Name"><Input size="lg" name="name" autoComplete="off" spellCheck={false} /></Field>

// Incorrect: the recipe copied onto a raw input (ApiTokens.tsx did), and className fighting the size
<input className="h-11 rounded-lg border-0 bg-component-on-container-subtle shadow-sm …" />
<Input placeholder="Email address" className="h-12 rounded-2xl" />
```

## Textarea

Text that may run past a line (a board description, a note). One line is Input. `size` `md`
(default) / `lg`, the Input's; one row is 40 / 44px, each further row 20px. `rows` sets the height
(3 by default), never an `h-*` class. `resize`: `vertical` (default) or `none`. `autoResize` grows
it with CSS `field-sizing: content` (no script, no jump), from `rows` to `maxRows`; browsers
without field-sizing keep `rows` and scroll. Always give `autoResize` a `maxRows`. A limit people
will hit is a count in Field's `aside` plus an error saying how much to cut; `maxLength` alone cuts
a paste silently.

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
once is a Switch; exactly one of a few is Segmented. `size`: `md` (default, 20px) or `sm` (16px:
dense lists, table rows). Nothing else; there is no radio. Uncontrolled with `defaultChecked`, or
`checked` + `onCheckedChange`. `indeterminate` (a partly-on "select all") is set through a ref:
client components only, and controlled. Name it with `<Field layout="inline">`, or `aria-label`
that names its row ("Select Spring launch"). Its hit area is 44px on touch screens; inline Field
rows grow to 44px there, so a hand-built list must space boxes 44px apart.

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
`dashboard/SearchBox` and is not reused. `size` `md` (default) / `lg`; `value` / `defaultValue` /
`onValueChange` (a string). Escape clears and keeps focus (with nothing to clear it's left for the
panel around it). `shortcut` is one key (`"/"`) that focuses it from anywhere except another field;
one per page. Name it with Field or `aria-label` ("Search brands"); the fallback name is "Search".
Announce the count in a `role="status"` line under it.

```tsx
// Correct
<SearchField aria-label="Search boards" shortcut="/" value={q} onValueChange={setQ} />

// Incorrect: no clear button, no Escape, the browser's own clear hidden by Input
<Input type="search" leadingIcon={<Search />} placeholder="Search" />
```

## Segmented and Switch

Both on `/system/controls`. **Segmented**: exactly one of two to five short values, all visible
(theme, grid size, token expiry). `size` `sm` (default) / `md` / `lg`, `shape` `rounded` (default)
/ `pill`, `tone` `raised` (default) / `inverted`, `iconOnly` (labels become names and tooltips).
Name it with `aria-label` or a Field (which passes `aria-labelledby`). Five or more values, or long
labels, need a select (not built yet). **Switch**: on or off, applied at once ("Share with a
link"). Controlled only (`checked` + `onCheckedChange`). Put it in `<Field layout="inline-end">`.

```tsx
// Correct
<Field label="Share with a link" layout="inline-end"><Switch checked={on} onCheckedChange={setOn} /></Field>

// Incorrect: a Switch that does nothing until Save is a Checkbox; three Buttons faking a choice are a Segmented
<Switch checked={draft.weekly} onCheckedChange={…} /> <Button>Save settings</Button>
```

## Never

- A placeholder as the label: it vanishes on the first keystroke and is under 4.5:1.
- Colour, height, radius, padding or shadow in a control's `className` (`cx` doesn't merge).
- Text under 16px in a field on touch screens (built in: don't override the text size).
- Red before the person has tried: errors appear on submit or on leaving a field.
