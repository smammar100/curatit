// /system/notice: fundations/molecules/Notice.tsx, every tone with real copy, live in both
// themes. The live demo (a notice that appears after an action) is a client component in
// ../../demos/FeedbackDemos.tsx; the sheet itself stays a server component
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

// What each tone is made of (tones in Notice.tsx)
const SPEC: { tone: NoticeTone; fill: string; icon: string; words: string; live: string }[] = [
  { tone: "neutral", fill: "bg-card", icon: "Info · secondary-foreground", words: "primary-foreground", live: "role=\"status\"" },
  { tone: "positive", fill: "bg-positive-subtle", icon: "Check · positive-foreground", words: "primary-foreground", live: "role=\"status\"" },
  { tone: "warning", fill: "bg-warning-subtle", icon: "WarningCircle · warning-foreground", words: "primary-foreground · “Warning:”", live: "role=\"status\"" },
  { tone: "danger", fill: "bg-danger-subtle", icon: "WarningCircle · danger-foreground", words: "danger-foreground · “Error:”", live: "role=\"alert\"" },
];

export default function NoticeSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Notice">
        An inline message that stays on screen while it&rsquo;s true: a form&rsquo;s error from the server, the state
        of a page, a warning before an action. A subtle fill of its tone, the tone&rsquo;s icon, and words that say
        what happened and what to do next.
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
                <Mono>warning</Mono>, <Mono>danger</Mono>. There&rsquo;s no <Mono>info</Mono>, <Mono>success</Mono> or{" "}
                <Mono>error</Mono>: the type refuses them. Danger is for something that went wrong; a risk that
                hasn&rsquo;t happened yet is warning.
              </>
            ),
          },
          {
            term: "Never colour alone",
            text: (
              <>
                Every tone has its icon, and words that name it: warning and danger start with &ldquo;Warning:&rdquo; and
                &ldquo;Error:&rdquo; for screen readers. The words stay primary on positive and warning, because those
                tones&rsquo; foreground shades fall under 4.5:1 on their own tint; only the icon wears the tone. Danger
                keeps red words (4.6:1), as errors always have.
              </>
            ),
          },
          {
            term: "live",
            text: (
              <>
                Off by default, for static page content, which is read in order with the page. On for a notice that
                appears because of something the person did: danger becomes <Mono>role=&quot;alert&quot;</Mono> (read
                at once), the others <Mono>role=&quot;status&quot;</Mono>. A status notice whose words change should stay
                mounted, so the change is announced.
              </>
            ),
          },
          {
            term: "action",
            text: (
              <>
                One small control after the message: a <Mono>Button size=&quot;xs&quot; variant=&quot;secondary&quot;</Mono>{" "}
                or a text link. It sits beside a one-line message and wraps under a longer one. Never a default
                Button: the view&rsquo;s primary action is elsewhere.
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
                Margins and width only. The fill, radius, padding and type are the tone&rsquo;s; a notice that needs
                another look needs another tone, on this sheet first.
              </>
            ),
          },
        ]}
      />

      <Flow tree={FEEDBACK_FLOW} />

      <SheetSection
        title="Tones"
        description="Each tone on its own, with a message long enough to wrap, and with a title and an action. At 375px the action drops under the words."
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
        description="Every notice is rounded-lg, px-3 py-2.5, text-body-sm, with a 16px icon. The tone sets the rest."
      >
        <Sheet>
          {() => (
            <Matrix
              first="7rem"
              template="minmax(9rem,max-content) minmax(15rem,max-content) minmax(13rem,max-content) minmax(8rem,1fr)"
              columns={["fill", "icon", "words", "live"]}
              rows={SPEC.map((s) => ({
                label: s.tone,
                cells: [
                  <Mono key="f">{s.fill}</Mono>,
                  <Mono key="i">{s.icon}</Mono>,
                  <Mono key="w">{s.words}</Mono>,
                  <Mono key="l">{s.live}</Mono>,
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
            why: "a hand-made panel, Tailwind's red, colour alone, nothing to do next",
            code: `<p className="bg-red-50 p-2 text-red-600">
  Something went wrong.
</p>`,
          }}
        />
      </SheetSection>
    </div>
  );
}
