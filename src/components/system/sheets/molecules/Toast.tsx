// /system/toast: fundations/molecules/Toast.tsx, live in both themes. The specimens are the
// presentational Toast, held still (inert: the live ones are below); the trigger demo and the
// reading-time cells are client components in ../../demos/FeedbackDemos.tsx; the sheet itself
// stays a server component
import { Toast, type ToastTone } from "@/components/fundations/molecules/Toast";
import { ToastDemo, ToastDuration } from "../../demos/FeedbackDemos";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";
import { FEEDBACK_FLOW } from "./Notice";

const SPECIMENS: { label: string; sub: string; tone: ToastTone; message: string; action?: string }[] = [
  { label: "neutral", sub: "it's done", tone: "neutral", message: "Saved to Moodboard" },
  { label: "neutral + action", sub: "a shortcut", tone: "neutral", message: "Removed from Moodboard", action: "Undo" },
  {
    label: "danger",
    sub: "it failed: wraps at 24rem",
    tone: "danger",
    message: "Couldn’t save to Moodboard. Check your connection, then save it again.",
  },
];

// Reading times, worked out by toastDuration() in Toast.tsx
const DURATIONS: { message: string; action?: string; tone?: ToastTone; words: number; note: string }[] = [
  { message: "Link copied", words: 2, note: "the 2.5s floor" },
  { message: "Saved to Moodboard", words: 3, note: "the 2.5s floor" },
  { message: "Removed from Moodboard", action: "Undo", words: 4, note: "the 5s floor for an action" },
  { message: "Couldn’t save to Moodboard. Try again.", tone: "danger", words: 6, note: "the 4s floor for danger" },
  { message: "Couldn’t load your boards. Reload the page to try again.", tone: "danger", words: 10, note: "the 4s floor for danger" },
  {
    message: "Couldn’t save to Moodboard. Check your connection, then save it again.",
    tone: "danger",
    words: 11,
    note: "240ms a word, plus 1.5s",
  },
];

// The parts, as Toast.tsx writes them
const ANATOMY: { part: string; classes: string }[] = [
  { part: "surface", classes: "bg-inverted-solid · rounded-lg · shadow-lg · px-4 py-2.5 · max-w-sm" },
  { part: "words", classes: "text-body-sm · text-on-inverted-foreground · text-pretty" },
  { part: "icon", classes: "Check size-3.5 (neutral) · WarningCircle size-4 (danger)" },
  { part: "action", classes: "font-medium · hover:underline · brand focus ring · 44px tall on touch" },
  { part: "motion", classes: "animate-toast-in 180ms · animate-toast-out 120ms · none under reduced motion" },
  { part: "region", classes: "fixed · bottom centre · 24px above the safe area · z-50 · polite + assertive" },
];

export default function ToastSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Toast">
        A short message after something the person just did, that leaves on its own: &ldquo;Saved to Moodboard&rdquo;,
        &ldquo;Link copied&rdquo;, &ldquo;Removed from Moodboard&rdquo; with Undo. One at a time, at the bottom centre,
        in the inverted fill.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                For the result of an action that&rsquo;s fine to miss, and for a background write that failed with
                nothing else on screen to show it. Wrap the app in one <Mono>&lt;ToastProvider&gt;</Mono> and call{" "}
                <Mono>toast()</Mono> from <Mono>useToast()</Mono>; never render a <Mono>&lt;Toast&gt;</Mono> yourself
                (it&rsquo;s exported for this sheet).
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Anything that must stay until it&rsquo;s dealt with, or that belongs beside something on the page (a
                form&rsquo;s server error, &ldquo;Sharing is off&rdquo;) is a <Mono>Notice</Mono>. A field&rsquo;s
                problem goes under the field. Inside an open <Mono>Dialog</Mono> use a Notice there: the dialog sits in
                the top layer, over the toast.
              </>
            ),
          },
          {
            term: "Tones",
            text: (
              <>
                Two, and nothing else: <Mono>neutral</Mono> (the default: it&rsquo;s done, a check) and{" "}
                <Mono>danger</Mono> (it failed: a warning icon, &ldquo;Error:&rdquo; for screen readers, read out
                assertively). A warning or a success that must stay is a Notice.
              </>
            ),
          },
          {
            term: "Timing",
            text: (
              <>
                Its reading time, from the words: 250 a minute plus 1.5s, clamped to 2.5–8s, 4s at least for danger
                and 5s at least with an action. Pass <Mono>duration</Mono> (ms) only for a reason the words don&rsquo;t show. The clock stops
                while it&rsquo;s pointed at, while focus is in it and while the tab is hidden, and runs on with the time
                it had left.
              </>
            ),
          },
          {
            term: "One at a time",
            text: (
              <>
                A new toast waits in a queue of three and replaces the one on screen once that one has been seen for
                1.5s (never while it&rsquo;s pointed at or focused): its 120ms exit, then the new one. The newest gets
                its full time. Stacks of toasts are a log nobody reads: if three things happened, say it once
                (&ldquo;3 posts saved to Moodboard&rdquo;).
              </>
            ),
          },
          {
            term: "action",
            text: (
              <>
                At most one, a shortcut: Undo, View board. Never the only way to do something: a toast can leave
                before a keyboard or screen reader user gets to it. Pressing it runs it and dismisses the toast; focus
                goes back where it was. Escape dismisses it too.
              </>
            ),
          },
          {
            term: "Copy",
            text: (
              <>
                Past tense, the thing named: &ldquo;Saved to Moodboard&rdquo;, not &ldquo;Success!&rdquo;. A failure says
                what to do: &ldquo;Couldn&rsquo;t save to Moodboard. Check your connection, then save it again.&rdquo;
                Two sentences at most; no emoji, no exclamation marks.
              </>
            ),
          },
        ]}
      />

      <Flow tree={FEEDBACK_FLOW} />

      <SheetSection
        title="Tones"
        description="Held still here; the live ones are below. The danger one is long enough to wrap: a toast is 24rem wide at most, the window's width less 32px on a phone."
      >
        <Sheet>
          {() => (
            <div inert className="flex flex-col gap-5">
              {SPECIMENS.map((s) => (
                <div key={s.label} className="flex flex-col gap-2">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <Mono tone="primary">{s.label}</Mono>
                    <span className="text-caption-lg text-secondary-foreground">{s.sub}</span>
                  </p>
                  <Toast tone={s.tone} message={s.message} action={s.action ? { label: s.action } : undefined} />
                </div>
              ))}
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Live"
        description="Real toasts, through each panel's own provider, so a toast fired from the dark panel wears the dark theme. Both appear at the bottom centre of the window. Point at one to hold it; Three at once shows the queue."
      >
        <Sheet split>{() => <ToastDemo />}</Sheet>
      </SheetSection>

      <SheetSection title="Reading time" description="toastDuration(), from the message and the action's label.">
        <Sheet>
          {() => (
            <Matrix
              first="minmax(14rem,1fr)"
              template="4rem 4.5rem 4rem minmax(12rem,max-content)"
              align="start"
              columns={["words", "action", "stays", "why"]}
              rows={DURATIONS.map((d) => ({
                label: d.message,
                cells: [
                  <Mono key="w">{d.words}</Mono>,
                  <Mono key="a">{d.action ?? "none"}</Mono>,
                  <ToastDuration key="s" message={d.message} action={d.action} tone={d.tone} />,
                  <span key="n" className="text-body-sm text-secondary-foreground">
                    {d.note}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Anatomy" description="The look of the dashboard's toast, on the tokens. Nothing here is a prop.">
        <Sheet>
          {() => (
            <Matrix
              first="6rem"
              template="minmax(18rem,1fr)"
              columns={["classes"]}
              rows={ANATOMY.map((a) => ({ label: a.part, cells: [<Mono key="c">{a.classes}</Mono>] }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Code">
        <Code
          correct={`const { toast } = useToast();

await removeFromBoard(post);
toast({
  message: "Removed from Moodboard",
  action: { label: "Undo", onClick: () => saveToBoard(post) },
});`}
          incorrect={{
            why: "a field's problem in a toast, generic words, a second to read them",
            code: `toast({
  message: "Error! Invalid input.",
  tone: "danger",
  duration: 1000,
});`,
          }}
        />
      </SheetSection>
    </div>
  );
}
