// /system/notice: fundations/molecules/Notice.tsx, every tone with real copy, live in both
// themes. Since 2026-10-23 it is Fluid Functionalism's Banner (src/components/ui/banner.tsx, at
// contrast "high") behind the same API. The live demo (a notice that appears after an action) is a
// client component in ../../demos/FeedbackDemos.tsx; the sheet itself stays a server component.
// Every class is written out in full, never built from parts, so Tailwind sees it
import Button from "@/components/fundations/elements/Button";
import Notice, { type NoticeTone } from "@/components/fundations/molecules/Notice";
import { LiveNoticeDemo } from "../../demos/FeedbackDemos";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

/** Which feedback component, shared by the Notice, Toast and Empty state sheets */
export const FEEDBACK_FLOW = `Something to tell the person?
 ├── It's about one field (missing, the wrong format) → the Field's error, under that field
 ├── It needs an answer before anything else can happen → Dialog
 ├── A place has nothing in it yet, or a search found nothing → EmptyState
 ├── It answers what they just did, and it's fine to miss
 │    (Saved to Moodboard, Link copied, Undo, a background save that failed) → Toast
 └── It stays true while they're here, or belongs beside something on the page
      (a form's server error, Sharing is off, a warning before an action) → Notice`;

// Every tone with two specimens: a message on its own (long enough to wrap), and a title, a
// message and an action
const TONES: {
  tone: NoticeTone;
  sub: string;
  plain: string;
  titled: { title: string; message: string; action?: string };
}[] = [
  {
    tone: "neutral",
    sub: "information, the default",
    plain: "Boards are private until you share one. A shared board’s notes are visible to anyone with the link, so keep anything private out of them.",
    titled: {
      title: "Sharing is off",
      message: "Only you can see this board. Turn sharing on to get a link you can send.",
      action: "Share board",
    },
  },
  {
    tone: "positive",
    sub: "it worked",
    plain: "Your email is confirmed. You can sign in with it on any device now.",
    titled: {
      title: "Password changed",
      message: "You’re still signed in here. Every other device has been signed out.",
    },
  },
  {
    tone: "warning",
    sub: "act, or it goes wrong",
    plain: "This token expires in 3 days. Make a new one before then, or your MCP client will stop connecting.",
    titled: {
      title: "Copy your token now",
      message: "It’s shown once. After you leave this page you’ll only see its first characters.",
      action: "Copy token",
    },
  },
  {
    tone: "danger",
    sub: "it went wrong",
    plain: "We couldn’t load your boards. Check your connection, then reload the page to try again.",
    titled: {
      title: "Couldn’t stop sharing",
      message: "The link still works for anyone who has it. Check your connection and try again.",
      action: "Try again",
    },
  },
];

// What each tone is made of: the Banner status it maps to (tones in Notice.tsx), the colour the
// Banner carries as --banner-tone, the wash it mixes from it, the glyph, and the role when live
const SPEC: { tone: NoticeTone; status: string; colour: string; wash: string; glyph: string; live: string }[] = [
  { tone: "neutral", status: "default", colour: "var(--foreground)", wash: "8% of the ink", glyph: "Phosphor Info, outline, in the ink", live: 'role="status"' },
  { tone: "positive", status: "success", colour: "var(--success)", wash: "12%", glyph: "a filled circle, the check cut out", live: 'role="status"' },
  { tone: "warning", status: "warning", colour: "var(--warning)", wash: "12%", glyph: "a filled triangle, the mark cut out", live: 'role="alert"' },
  { tone: "danger", status: "error", colour: "var(--destructive)", wash: "12%", glyph: "a filled circle, the mark cut out", live: 'role="alert"' },
];

// The parts, as the Banner draws them under Notice.tsx (contrast "high", the compact size)
const PARTS: { part: string; sub?: string; classes: string[]; note: string }[] = [
  {
    part: "surface",
    classes: [
      "group/banner @container/banner relative grid w-full",
      "grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center",
      "has-data-[slot=banner-description]:items-start",
      "rounded-[24px] p-3 text-foreground",
    ],
    note: "One grid, 12px inside on every side, the container corners. With a description the glyph and the actions hold to the title line instead of centring on the block. The banner is a container, so its narrow layout is its own width's, not the screen's.",
  },
  {
    part: "wash",
    classes: ["--banner-tone · the tone's colour", "--banner-fill · color-mix(in oklab, var(--banner-tone) 12%, transparent)", "neutral · 8%", "background-image: linear-gradient(var(--banner-fill), var(--banner-fill))"],
    note: "A see-through wash of the tone's colour over whatever surface the notice sits on, so it reads the same on the page, a card or a dialog. Grey reads darker than a hue at the same mix, so the neutral wash steps down to 8% of the ink. Never a solid fill: the colour never sits behind the words at full strength.",
  },
  {
    part: "glyph",
    classes: ["col-start-1 row-start-1 flex items-center justify-center", "mr-2.5 h-[18px] · 16px", "text-[color:var(--banner-tone)]", "stroke-background (the mark)", 'aria-hidden="true"'],
    note: "A filled shape in the tone's colour with the mark cut out in the page colour, drawn by the Banner so it stays filled whatever the icon set: a solid shape carries a colour at 16px far better than a thin outline. The neutral tone has no status, so it takes the site's Info icon in the ink instead. Its box is one title line tall, so it lines up with the first line whichever way the grid aligns.",
  },
  {
    part: "title",
    classes: [
      "BannerTitle · col-start-2 row-start-1 min-w-0 text-foreground",
      "text-[length:var(--fs-subtitle-compact,13px)] leading-[var(--lh-subtitle-compact,18px)]",
      "'wght' 550, 'opsz' 18 · text-pretty",
    ],
    note: "The compact subtitle role, semibold, always the ink. Without a title the message takes this row in the normal weight ('wght' 400, 'opsz' 14), so the glyph still lines up with its first line.",
  },
  {
    part: "message",
    classes: ["BannerDescription · col-start-2 row-start-2 mt-0.5 min-w-0 text-foreground", "the same subtitle role, normal weight", "text-pretty"],
    note: "Under the title, in the ink like it: muted grey would fall under 4.5:1 on the washes, and the title already stands apart by weight.",
  },
  {
    part: "actions",
    classes: [
      "BannerActions · col-start-3 row-start-1 flex flex-wrap items-center gap-2 -my-[5px] ml-2.5",
      "with a description · group-has-data-[slot=banner-description]/banner:col-start-2 group-has-data-[slot=banner-description]/banner:row-start-3 group-has-data-[slot=banner-description]/banner:mt-1.5",
      "under 24rem · @max-sm/banner:col-start-2 @max-sm/banner:row-start-3 @max-sm/banner:mt-1.5",
    ],
    note: "Trailing a one-line message, pulled into the padding so a 28px button doesn't grow the row; under the words, aligned with the title and 6px below, when there's a description or the notice is narrower than 24rem. Pure CSS: nothing measures.",
  },
  {
    part: "role",
    classes: ['live · role="status" (neutral, positive)', 'live · role="alert" (warning, danger)', 'otherwise · role="none"'],
    note: "The Banner's own rule: errors and warnings interrupt a screen reader, the rest wait their turn. Notice adds live: without it the words are read in order with the page.",
  },
  {
    part: "motion",
    classes: ["the Banner's, when its open flips true", "row · spring, twice the moderate tier (320ms), no bounce", "banner · spring.slow from scale 0.4, after a fast tier (80ms)"],
    note: "A Banner that opens grows its row from nothing, the message fading in and growing just behind it; one that's dismissed folds its row away with the message riding it. Notice never passes open, so as wired a notice the page adds mounts in place and arrives at once; this is the library's motion, not yet the molecule's.",
  },
];

export default function NoticeSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Notice">
        An inline message that stays on screen while it&rsquo;s true: a form&rsquo;s error from the server, the state
        of a page, a warning before an action. Since 2026-10-23 it is Fluid Functionalism&rsquo;s Banner at high
        contrast: a see-through wash of its tone behind the words, the tone&rsquo;s filled glyph with the mark cut
        out in the page colour, and words always in the ink that say what happened and what to do next.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                Beside what it&rsquo;s about, for something that stays true while the person is here: &ldquo;Wrong
                email or password&rdquo; above a form&rsquo;s button, &ldquo;Sharing is off&rdquo; on a board,
                &ldquo;This token expires in 3 days&rdquo; on the tokens page. It replaces <Mono>AuthNotice</Mono>.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A problem with one field is the Field&rsquo;s error under it, never a notice above the form: the
                person would have to hunt for the field. The result of something just done is a <Mono>Toast</Mono>. A
                place with nothing in it is an <Mono>EmptyState</Mono>. A question is a <Mono>Dialog</Mono>.
              </>
            ),
          },
          {
            term: "Tones",
            text: (
              <>
                Four, and nothing else: <Mono>neutral</Mono> (the default), <Mono>positive</Mono>,{" "}
                <Mono>warning</Mono>, <Mono>danger</Mono>, which Notice maps to the Banner&rsquo;s{" "}
                <Mono>default</Mono>, <Mono>success</Mono>, <Mono>warning</Mono> and <Mono>error</Mono>.
                There&rsquo;s no <Mono>info</Mono>, <Mono>success</Mono> or <Mono>error</Mono> on Notice: the type
                refuses them. Danger is for something that went wrong; a risk that hasn&rsquo;t happened yet is
                warning.
              </>
            ),
          },
          {
            term: "Never colour alone",
            text: (
              <>
                Every tone has its glyph, and the words are always the ink, so a notice reads the same whatever its
                tone and the wash only sets the mood. The glyph is decorative for a screen reader, so the words
                themselves must say what happened (&ldquo;Couldn&rsquo;t stop sharing&rdquo;, not &ldquo;There was a
                problem&rdquo;); a live warning or danger notice is also announced as an alert.
              </>
            ),
          },
          {
            term: "live",
            text: (
              <>
                Off by default, for static page content, which is read in order with the page (<Mono>role=&quot;none&quot;</Mono>).
                On for a notice that appears because of something the person did: warning and danger become{" "}
                <Mono>role=&quot;alert&quot;</Mono> (read at once), neutral and positive{" "}
                <Mono>role=&quot;status&quot;</Mono>. A status notice whose words change should stay mounted, so the
                change is announced.
              </>
            ),
          },
          {
            term: "action",
            text: (
              <>
                One small control after the message: a <Mono>Button size=&quot;xs&quot; variant=&quot;secondary&quot;</Mono>{" "}
                or a text link. It trails a one-line message and drops under a longer one, or under any message when the
                notice is narrower than 24rem. Never a default Button: the view&rsquo;s primary action is elsewhere.
              </>
            ),
          },
          {
            term: "Copy",
            text: (
              <>
                What happened, then what to do: &ldquo;Couldn&rsquo;t stop sharing. The link still works: check your
                connection and try again.&rdquo; Never &ldquo;Something went wrong&rdquo;, &ldquo;Oops&rdquo; or
                &ldquo;Please&rdquo;. A title only when the message is longer than a line.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Margins and width only. The wash, corners, padding and type are the Banner&rsquo;s; a notice that
                needs another look needs another tone, on this sheet first.
              </>
            ),
          },
        ]}
      />

      <Flow tree={FEEDBACK_FLOW} />

      <SheetSection
        title="Tones"
        description="Each tone on its own, with a message long enough to wrap, and with a title and an action. Narrow the window: under 24rem the action drops under the words."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-8">
              {TONES.map((t) => (
                <div key={t.tone} className="flex flex-col gap-3">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <Mono tone="primary">{t.tone}</Mono>
                    <span className="text-caption-lg text-secondary-foreground">{t.sub}</span>
                  </p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <Notice tone={t.tone}>{t.plain}</Notice>
                    <Notice
                      tone={t.tone}
                      title={t.titled.title}
                      action={
                        t.titled.action && (
                          <Button variant="secondary" size="xs">
                            {t.titled.action}
                          </Button>
                        )
                      }
                    >
                      {t.titled.message}
                    </Notice>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="What each tone is made of"
        description="Every notice is the same grid: rounded-[24px], p-3, the compact subtitle role, a 16px glyph. The tone sets the colour the wash and the glyph are mixed from, and the role when live."
      >
        <Sheet>
          {() => (
            <Matrix
              first="7rem"
              template="minmax(6rem,max-content) minmax(9rem,max-content) minmax(7rem,max-content) minmax(14rem,max-content) minmax(7rem,1fr)"
              columns={["Banner status", "colour", "wash", "glyph", "live"]}
              rows={SPEC.map((s) => ({
                label: s.tone,
                cells: [
                  <Mono key="s">{s.status}</Mono>,
                  <Mono key="c">{s.colour}</Mono>,
                  <Mono key="w">{s.wash}</Mono>,
                  <Mono key="g">{s.glyph}</Mono>,
                  <Mono key="l">{s.live}</Mono>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Anatomy"
        description="What the Banner draws under Notice.tsx. Take the component whole: never rebuild a notice from these classes."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(6rem,max-content)"
              template="minmax(19rem,max-content) minmax(16rem,1fr)"
              align="start"
              columns={["classes", "notes"]}
              rows={PARTS.map((p) => ({
                label: p.part,
                sub: p.sub,
                cells: [
                  <span key="c" className="flex flex-col gap-0.5">
                    {p.classes.map((c) => (
                      <Mono key={c}>{c}</Mono>
                    ))}
                  </span>,
                  <span key="n" className="text-body-sm text-secondary-foreground">
                    {p.note}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="After an action"
        description="Press Stop sharing: it fails, and a live danger notice lands under the button, read out at once. Try again keeps it mounted and changes its title, which is read out too."
      >
        <Sheet split>{() => <LiveNoticeDemo />}</Sheet>
      </SheetSection>

      <SheetSection title="Code">
        <Code
          correct={`<Notice
  tone="danger"
  live
  title="Couldn’t stop sharing"
  action={<Button variant="secondary" size="xs" onClick={retry}>Try again</Button>}
>
  The link still works for anyone who has it. Check your connection and try again.
</Notice>`}
          incorrect={{
            why: "the Banner by hand at its low contrast, a status Notice refuses, a className fill over the wash, nothing to do next",
            code: `import { Banner, BannerTitle } from "@/components/ui/banner";

<Banner status="info" className="bg-danger-subtle">
  <BannerTitle>Something went wrong.</BannerTitle>
</Banner>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
