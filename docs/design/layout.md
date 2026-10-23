# Layout

Sources: `src/components/fundations/containers/Wrapper.tsx`, the `page-start` and `section-y`
utilities in `src/styles/global.css`. Live: `/system/layout`.

## Width: `<Wrapper>`

| Variant | Width | Use |
| --- | --- | --- |
| `standard` (default) | `max-w-7xl`, `2xl:max-w-[110rem]`, `px-4 sm:px-8` | Every page section |
| `narrow` | `max-w-xl` | A page that is one short column |
| `prose` | full width, typography plugin on the tokens | Markdown bodies (blog, legal) |

Never nest a Wrapper: a narrow column inside one is a plain `mx-auto max-w-xl sm:px-8` div.

## Rhythm

- A page's first section: `<Wrapper className="page-start">` (first line 112px from the top on
  phones, 160px from `lg`).
- Every later section: `<Wrapper className="section-y">` (neighbours 96px / 128px apart).
- Never `py-*` / `pt-*` on a section's Wrapper. The footer keeps the last gap the same.
- Inside a section: `mt-12` between major blocks, `mt-8` between a header row and its grid,
  `mt-2`–`mt-4` between a title and its text, `gap-8` in card grids. Space siblings with `gap`.

## The gutter

16px from the screen edges on phones, 32px from `sm`. A row that scrolls sideways bleeds to the
gutter with `-mx-4 px-4 sm:-mx-8 sm:px-8`, so its first item still starts on it. At 375px nothing
scrolls the page sideways.

## Cards and grids

- Grid: `grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3`.
- A card is `<Card>` (`docs/design/display.md`): the grey mat (`bg-card`, `rounded-2xl`) or the
  white card (`bg-container shadow-xs`); the image inside is rounded with the default shadow; the
  title's own link stretches over the card.
- Images use `next/image` with `width` and `height`.

```tsx
// Correct
<section><Wrapper className="section-y"><div className="mx-auto max-w-xl sm:px-8">…</div></Wrapper></section>

// Incorrect: padding on the Wrapper and a nested Wrapper (the phone gutter doubles)
<section><Wrapper className="py-24"><Wrapper variant="narrow">…</Wrapper></Wrapper></section>
```
