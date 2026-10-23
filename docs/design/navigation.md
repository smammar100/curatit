# Navigation

Sources: `src/components/fundations/molecules/Tabs.tsx` (wraps `ui/tabs-subtle` since
2026-10-23), `src/components/system/SystemNav.tsx`. Live: `/system/tabs` (specimens, the keyboard
table and a keyboard demo in both themes).

Three things look alike and do different jobs. Pick by what changes:

```
What does choosing it change?
 ├── The page (the address changes)             → links: TextLink, or a nav row with aria-current
 ├── A value of a setting (2–5 short values)    → Segmented          /system/controls
 ├── A value with more or longer options        → a select
 ├── Which view of the same thing is shown      → Tabs               /system/tabs
 └── The step of a sequence                     → never tabs: one step on screen, Back and Next
```

## Tabs

Use for two to eight views of one thing that a person looks at one at a time and switches
between: Breakdown / Visual DNA in the post panel, the review queue's lists. A setting is
Segmented (it changes a value, the view stays); another page is a link; more than eight views,
or names longer than two words, is a select.

Parts: `Tabs` (the root, holds the selection), `TabList` (the row: Fluid Functionalism's subtle
tabs on Radix's), `Tab`, `TabPanel`. Every `Tab` has a `TabPanel` with the same `value`.

| Prop | Closed set | Default | Rule |
| --- | --- | --- | --- |
| `Tabs` `value` / `defaultValue` / `onValueChange` | a tab's `value` | one of the two is required | Controlled or uncontrolled, never neither |
| `Tabs` `activation` | `automatic`, `manual` | accepted, ignored | The library's tabs activate manually: arrows move focus, Enter or Space selects |
| `TabList` `variant` | `underline`, `pill` | accepted, ignored | Every row is the library's pills (a pressed pill under the selected tab) |
| `TabList` `size` | `md`, `lg` | accepted, ignored | The row follows the site's size step |
| `TabList` `aria-label` / `aria-labelledby` | one is required (the type enforces it) | | Name the row by what it switches: "Creative breakdown", "Lists" |
| `TabList` `bleed` | boolean | `false` | Only for a row directly inside a Wrapper: it scrolls through the 16 / 32px gutter |
| `TabList` `wrap` | boolean | `false` | Breaks onto more lines instead of scrolling: a pill row whose counts make it long (the review queue). Never with `bleed` |
| `Tab` `icon` | a `fundations/icons` component | none | On every tab or none; decorative, sized 14px by the tab |
| `Tab` `count` | a number | none | How many things the panel holds (Needs review 12), never a status; drawn after the label in the normal weight, tabular |
| `Tab` `disabled` | boolean | `false` | A view that exists and will have something; say why nearby. A view that never applies is left out (a single image has no Slides tab) |

Nothing else exists. `className` is for layout (margins, width) on every part. Never a colour,
height or padding: the pill, its height and its corners are the library's.

**Behaviour you get, and must not rebuild:**

- The selected tab sits on a pressed pill (`bg-active`) that travels to the next choice on the
  moderate spring; a faint hover pill glides to the tab nearest the pointer; one focus ring
  springs between tabs from the keyboard; the selected label gets heavier without moving its
  neighbours. Under reduced motion the pills appear in place.
- One tab stop: Tab reaches the selected tab; ← / → move focus (wrapping, skipping disabled tabs),
  Home / End jump to the ends, Enter or Space selects. Alt, Ctrl, Meta and Shift combinations are
  left alone, and so are ↑ / ↓ (the page scrolls).
- Handled keys are marked `preventDefault()`. A parent listening on the document (PostView's
  slide arrows) still receives them, because React runs from the document, so **it must return
  on `event.defaultPrevented`**.
- A row that doesn't fit scrolls sideways (the scrollbar hidden). With `wrap` it breaks onto
  another line instead, and the pill follows the selected tab to its line.
- Panels are hidden unless selected and are always in the HTML (their state survives a switch).
  For a costly view, control `value` and render its children only when it's selected.

**The panel tab stop rule:** a panel is a tab stop (`tabIndex={0}`) only when it holds nothing
focusable, so Tab from the row goes to the panel's first link or button, or to the panel itself
when it's only text. `TabPanel` works this out, and again when its content changes; pass
`tabIndex` only to override it.

```tsx
// Correct (the post panel's breakdown)
import Tabs, { Tab, TabList, TabPanel } from "@/components/fundations/molecules/Tabs";

<Tabs value={view} onValueChange={setView}>
  <div className="sticky top-0 flex items-center justify-between gap-2">
    <TabList aria-label="Creative breakdown">
      <Tab value="breakdown">Breakdown</Tab>
      <Tab value="visual">Visual DNA</Tab>
    </TabList>
    <CopyBrief />{/* an action beside the row is a Button, never a Tab */}
  </div>
  <TabPanel value="breakdown" className="mt-3">{view === "breakdown" && <Breakdown />}</TabPanel>
  <TabPanel value="visual" className="mt-3">{view === "visual" && <VisualDna />}</TabPanel>
</Tabs>

// Correct (the review queue: counts, and a row that wraps on a phone)
<Tabs value={list} onValueChange={setList}>
  <TabList aria-label="Lists" wrap>
    <Tab value="Needs review" count={12}>Needs review</Tab>
    …
  </TabList>
  …
</Tabs>

// Incorrect: a hand-rolled row (no roving tab stop, no handled keys), and colour on a tab
<div role="tablist">
  <button role="tab" aria-selected={view === "breakdown"} onClick={() => setView("breakdown")}
    className="h-9 rounded-full px-3.5 aria-selected:bg-inverted-solid">Breakdown</button>
</div>
<Tab value="tokens" className="h-12 text-brand-foreground">API tokens</Tab>
```

```tsx
// Correct: a parent's own arrows skip the keys the tabs used
document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;
  if (event.key === "ArrowRight") nextSlide();
});

// Incorrect: the slide moves as well as the tab
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") nextSlide();
});
```

**Never:** tabs as a stepper (steps have an order; tabs say any order is fine); tabs that change
the address (use links); a tab that performs an action (Copy brief is a `Button` beside the row);
tabs inside a tab panel; a second hand-rolled tab row anywhere (CreativeBreakdown and ReviewQueue
moved onto this component on 2026-10-19; ClientInstall predates it and moves to it).

## Segmented, not tabs, for a setting

`Segmented` (`fundations/elements/Segmented.tsx`, `/system/controls`) is the library's segmented
control, for one value out of two to five short ones: theme, grid size, token expiry, MCP / REST.
Choosing changes a setting and the content stays where it is. If choosing swaps what's shown
below, it's Tabs. Docs: `docs/design/forms.md`.

## Links, not tabs, between pages

Anything that changes the address is a link, so it can be opened in a new tab, shared and
reached with Back.

- In a sentence: `TextLink` (`/system/text-link`, `docs/design/actions.md`).
- A set of sibling pages: a `<nav aria-label>` of `next/link`s, the current one marked
  `aria-current="page"`, never `role="tab"`. The model is the design system's own topic row
  (`SystemNav.tsx`, `layout="row"`): 44px links, `text-secondary-foreground` with
  `hover:text-primary-foreground`, the current one `text-primary-foreground` with a 2px
  `shadow-[inset_0_-2px_0_currentColor]` underline, scrolling sideways with `-mx-4 px-4` to bleed
  to the gutter. It looks like underline tabs on purpose; what differs is the job and the markup.
