# Feedback: Notice, Toast, EmptyState

Sources: `src/components/fundations/molecules/Notice.tsx` (wraps `ui/banner`), `Toast.tsx`,
`EmptyState.tsx`. Live: `/system/notice`, `/system/toast`, `/system/empty-state`.

## Which one?

```
Something to tell the person?
 ├── It's about one field (missing, the wrong format) → the Field's error, under that field
 ├── It needs an answer before anything else can happen → Dialog
 ├── A place has nothing in it yet, or a search found nothing → EmptyState
 ├── It answers what they just did, and it's fine to miss
 │    (Saved to Moodboard, Link copied, Undo, a background save that failed) → Toast
 └── It stays true while they're here, or belongs beside something on the page
      (a form's server error, Sharing is off, a warning before an action) → Notice
```

Still loading is a Skeleton, never an EmptyState (it tells the person they have nothing).
Failed to load is a danger Notice with a way to try again, not an EmptyState.

## Notice (client, wraps `ui/banner`)

An inline message beside what it's about: since 2026-10-23 Fluid Functionalism's Banner at high
contrast. A light wash of the tone's colour behind the words (a neutral grey for information),
the tone's filled glyph before them with the mark cut out in the page colour, the words always
the ink, the container corners, and actions that trail a one-line message and drop under a
longer one. A notice that appears opens its row on the moderate spring and grows in on the slow
one; one that's dismissed folds its row away. Replaces `AuthNotice`.

Tones: `neutral` (default; the library's `default`), `positive` (`success`), `warning`,
`danger` (`error`). Nothing else exists: no `info`, `success`, `error` on the site's API. Danger
means it went wrong; a risk that hasn't happened yet is `warning`.

- The words are the ink on every tone; only the glyph and the wash wear the colour, so contrast
  never depends on the tone. Warning and danger are announced as alerts. Never colour alone.
- `live`: off (default) for static page content (`role="none"`, read in order with the page). On
  when it appears after an action: danger and warning are `role="alert"`, the rest `role="status"`.
  Keep a status notice mounted when its words change.
- `title`: only when the message runs past a line (the semibold line over the description).
  Without one the message takes the first row in the normal weight. `action`: one
  `Button size="xs" variant="secondary"` or a text link; never a default Button.
- `className`: margins and width only.

```tsx
// Correct
<Notice tone="danger" live title="Couldn’t stop sharing"
  action={<Button variant="secondary" size="xs" onClick={retry}>Try again</Button>}>
  The link still works for anyone who has it. Check your connection and try again.
</Notice>

// Incorrect: hand-made panel, Tailwind's red, colour alone, nothing to do next
<p className="bg-red-50 p-2 text-red-600">Something went wrong.</p>
```

## Toast (client)

A short message after an action, that leaves on its own. One `<ToastProvider>` around the app
(or area); `const { toast, dismiss } = useToast()`. Never render `<Toast>` yourself: it's
exported for the sheet. The dashboard's provider is in `src/app/dashboard/layout.tsx`, round
`BoardsProvider`, whose `notify(text, "done" | "error")` is a thin call to `toast()` (neutral or
danger) for the board writes and their undo-on-failure messages.

`toast({ message, tone?, action?, duration? })` returns an id; `dismiss(id)` removes it.

Tones: `neutral` (default: it's done, a check) and `danger` (it failed; read assertively).
Nothing else: a warning or a success that must stay is a Notice.

- **The surface** is the ink, as the library's tooltip: a pill (`bg-foreground text-background
  rounded-[20px] shadow-surface-4`), rising 8px and growing from 0.97 on the moderate spring,
  leaving on its exit tween (120ms); under reduced motion it fades without moving.
- **One at a time.** A new toast waits (queue of 3, oldest dropped) and replaces the one on
  screen once that one has been seen for 1.5s. The newest gets its full time.
- **Duration** from the words: 240ms a word (250 wpm) + 1.5s, clamped 2.5–8s; 4s at least for
  `danger` (a failure is unexpected and says what to do), 5s at least with an action. Pass
  `duration` only for a reason the words don't show.
- **Pauses** while pointed at, while focus is inside and while the tab is hidden; resumes with
  the time left. Escape dismisses it; pressing the action runs it and dismisses; focus goes back
  where it came from.
- **Action:** at most one, a shortcut (Undo, View board). Never the only way to do something.
- **Inside an open Dialog** use a Notice: the dialog covers the toast.
- Region: bottom centre, 24px above the safe area, always mounted (polite + assertive).

```tsx
// Correct
toast({ message: "Removed from Moodboard", action: { label: "Undo", onClick: () => saveToBoard(post) } });

// Incorrect: a field's problem in a toast, generic words, a second to read them
toast({ message: "Error! Invalid input.", tone: "danger", duration: 1000 });
```

## EmptyState (server)

Where a list, grid or panel would be, once you know it's empty. Centred: picture, title, line,
action. The title is semibold by `fontVariationSettings`, the line in the muted ink.

- `size`: `md` (default) for a page or section; `sm` inside a panel, card or menu. Nothing else.
- `context`: `dashboard` (default) uses the app's roles (md title `text-title`, sm `text-body`;
  line `text-body` / `text-caption`); `site` uses `<Text>` (md title `h6` in the serif, line
  `body`; sm `bodySM`). Match the page around it (DESIGN.md rule 5).
- Picture: `icon` (Phosphor, drawn on a `bg-muted` tile, 48px with 20px corners at md, 40px with
  16px at sm) or `illustration` (a drawing in tokens), never both (the type refuses it). Hidden
  from screen readers. sm gets an icon at most.
- `action`: the one next step, a `Button size="sm"`. `secondaryAction`: a `transparent`
  Button or a text link. Never two solid buttons.
- `titleTag`: `p` (default); `h2`–`h4` only when it stands in for a whole page.

```tsx
// Correct
<EmptyState
  illustration={<EmptyBoardArt className="w-64" />}
  title="Nothing on this board yet"
  description="Save posts to it from the feed: Save is on every post, and this board is in its list."
  action={<Button isLink href="/dashboard" size="sm">Browse the feed</Button>}
/>

// Incorrect: no why, no next step, two solid buttons
<EmptyState title="No data" description="There are no items."
  action={<Button>Create</Button>} secondaryAction={<Button>Import</Button>} />
```

## Copy rules

- **Specific:** name the thing. "Saved to Moodboard", "Nothing on this board yet". Never
  "Success!", "No data", "No results", "Something went wrong", "Oops", "Please".
- **Errors say what happened, then what to do:** "Couldn't save to Moodboard. Check your
  connection, then save it again."
- **Empty states say what's empty, why, and the next step**, with one action named as its
  outcome ("Browse the feed", "Clear search").
- **Toasts:** past tense, two sentences at most. Notices: one or two sentences, a title only
  when longer than a line.
- No emoji, no exclamation marks, sentence case, curly quotes and `…` (see `voice.md`).
