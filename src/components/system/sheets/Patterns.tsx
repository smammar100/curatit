// /system/patterns: the shared behaviours the components make together (the menu, the toast, the
// theme switch, the FAQ, loading skeletons, the agent's thinking line and the dialog), each live
// in both themes. The demos that need state are client components in ../demos/PatternDemos.tsx;
// the rest are the real components, and the sheet itself stays a server component.
import type { ReactNode } from "react";
import { Block, GridSkeleton, HeaderSkeleton, PostSkeleton } from "@/components/dashboard/Skeleton";
import Button from "@/components/fundations/elements/Button";
import Check from "@/components/fundations/icons/Check";
import Moon from "@/components/fundations/icons/Moon";
import Sun from "@/components/fundations/icons/Sun";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import Faq from "@/components/global/Faq";
import ThemeToggle from "@/components/global/ThemeToggle";
import { faqs } from "@/components/home/faqs";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, type Theme } from "../SheetParts";
import { MenuDemo, NewBoardDemo, ShimmerPlay, ThoughtDemo, ToastDemo } from "../demos/PatternDemos";

function Use({ children }: { children: ReactNode }) {
  return <span className="text-body-sm text-secondary-foreground">{children}</span>;
}

// What usePopover("menu") does with each key and press (dashboard/usePopover.ts)
const MENU_KEYS: { key: string; does: string }[] = [
  { key: "a click", does: "Opens it. Focus stays on the trigger until ↓ moves it in" },
  { key: "Enter, Space", does: "Opens it on the first item, or the checked one in a choice" },
  { key: "↓ ↑ on the trigger", does: "Opens it on the first or the last item" },
  { key: "↓ ↑ Home End", does: "Move between the items, wrapping at the ends" },
  { key: "Escape", does: "Closes it and puts focus back on the trigger" },
  { key: "Shift+Tab", does: "Closes it and puts focus back on the trigger" },
  { key: "Tab", does: "Closes it; focus goes on to whatever follows" },
  { key: "a press outside", does: "Closes it; focus stays where the press put it" },
  { key: "the mouse", does: "One highlight glides under the pointer (useGlide). Touch keeps the rows’ press fill" },
];

// What <Dialog> does at each step (fundations/molecules/Dialog, on the native <dialog>)
const DIALOG_STEPS: { step: string; does: ReactNode }[] = [
  {
    step: "open",
    does: (
      <>
        <Mono>showModal()</Mono>: the page behind goes inert and stops scrolling, its scrollbar&rsquo;s width padded
        back so nothing reflows. Focus moves to the first field, or to <Mono>initialFocus</Mono>.
      </>
    ),
  },
  {
    step: "Escape",
    does: (
      <>
        <Mono>onOpenChange(false)</Mono>: the page decides, so its <Mono>open</Mono> state never falls out of step.
      </>
    ),
  },
  {
    step: "outside",
    does: (
      <>
        A press that starts and ends on the dimmed page closes it (a drag out of a field doesn&rsquo;t), unless{" "}
        <Mono>dismissible={"{false}"}</Mono>, for a form where closing would lose typing.
      </>
    ),
  },
  {
    step: "close",
    does: (
      <>
        <Mono>close()</Mono> plays the 140ms exit, then the contents unmount, so every open starts fresh; focus goes
        back to whatever opened it.
      </>
    ),
  },
  { step: "reduced", does: "It appears and goes at once." },
];

// ThoughtLine's props that matter (ui/thought-line.tsx), with the values McpDemo passes
const THOUGHT_PROPS: { prop: string; value: string; does: string }[] = [
  { prop: "color", value: "var(--color-secondary-foreground)", does: "The ink of the line and the trace. Always a real colour" },
  { prop: "glyphColor", value: "var(--color-primary-foreground)", does: "The mark alone" },
  { prop: "glyph", value: "<Symbol />", does: "The mark that breathes while it works (the default is a sparkle)" },
  { prop: "label", value: "\"Searching…\"", does: "The working line, and what it announces" },
  { prop: "doneLabel", value: "\"Found 12 posts in\"", does: "The settled line, which the frozen time finishes" },
  { prop: "steps", value: "string[]", does: "The trace: the last step is current, the earlier ones tick" },
  { prop: "working", value: "boolean", does: "true runs the clock and the breath; false settles them" },
  {
    prop: "elapsed",
    value: "step === 4 ? 2.3 : undefined",
    does: "A fixed time in seconds while it's set; unset, the clock runs. McpDemo sets it on the settled step alone",
  },
  { prop: "live", value: "false in a loop", does: "Announces the line (role=\"status\"). Off when a loop drives it" },
  {
    prop: "collapsible",
    value: "false",
    does: "The default, true, lets the settled line open to show the trace; false keeps it shut. The demo keeps the default",
  },
  { prop: "fontSize", value: "14", does: "Type size in px; everything inside scales in em" },
];

/** A picture of ThemeToggle in one theme: the real Button, inert, since the live one switches the
 *  site and sits above the panels. (The toggle picks its icon with dark:, which matches any dark
 *  ancestor: in a light panel on a dark site, <html>'s data-theme still turns it dark, so the live
 *  one can't be shown per panel) */
function ToggleSpecimen({ theme }: { theme: Theme }) {
  const name = theme === "light" ? "Switch to dark theme" : "Switch to light theme";
  return (
    <span inert aria-hidden="true">
      <Button iconOnly size="xs" variant="muted" tabIndex={-1} aria-label={name}>
        {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </Button>
    </span>
  );
}

/** One skeleton export: its name and where it's used, over the specimen */
function Specimen({ name, where, children }: { name: string; where: ReactNode; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <figcaption className="flex flex-col gap-0.5">
        <Mono tone="primary">{name}</Mono>
        <Use>{where}</Use>
      </figcaption>
      {children}
    </figure>
  );
}

export default function Patterns() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Patterns">
        What the components make together: the menu, the toast, the theme switch, the FAQ, loading
        skeletons, the agent&rsquo;s thinking line and the dialog. Each is its real recipe, live in both
        themes. Their timings are on the Motion sheet.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                One of these before anything new. Each already handles focus, keys, reduced motion and the
                dark theme. Until 2026-10-18 the dashboard&rsquo;s four popovers (AccountMenu, Header, boards,
                BoardView) each kept their own copy of the click-outside and Escape logic; <Mono>usePopover</Mono>{" "}
                replaced all four.
              </>
            ),
          },
          {
            term: "Where",
            text: (
              <>
                Menus and popovers: <Mono>dashboard/usePopover.ts</Mono>, which the shared{" "}
                <Mono>fundations/molecules/Menu</Mono> is built on. Toasts: <Mono>fundations/molecules/Toast</Mono>, which the dashboard&rsquo;s{" "}
                <Mono>notify()</Mono> (from <Mono>useBoards()</Mono>) now calls. The theme: <Mono>global/ThemeToggle</Mono> and{" "}
                <Mono>global/theme.ts</Mono>. The FAQ: <Mono>global/Faq</Mono>. Skeletons: <Mono>dashboard/Skeleton</Mono>.
                The thinking line: <Mono>ui/thought-line</Mono>. The dialog: <Mono>fundations/molecules/Dialog</Mono>, which{" "}
                <Mono>dashboard/NewBoardDialog</Mono> is now built on, moved by <Mono>.dialog-motion</Mono>. Menu, Toast, Dialog and Skeleton each have a sheet of their own as well.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A second way to do one of these: a dropdown with its own open state, a toast with its own timer, a
                switch that writes <Mono>data-theme</Mono> itself. A copy has to solve focus, keys and motion
                again, and is one more place to fix when the pattern changes.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Something to show over the page?
 ├── Word that a change worked or failed
 │     → a toast: notify() in the dashboard,
 │       useToast() under a ToastProvider elsewhere
 ├── A few actions, or one choice from a list
 │     → a menu: <Menu>, on usePopover("menu")
 ├── A small form on a button (the share link)
 │     → usePopover("dialog")
 ├── Links and settings that follow their trigger
 │   in the tab order (the account menu)
 │     → usePopover("disclosure")
 ├── A task that needs the page out of the way
 │   (a new board) → <Dialog>
 └── Asking before a delete a menu offered → inside
       that menu, focus on Cancel (BoardView's More)`}
        />
        <Flow
          tree={`Waiting on something?
 ├── A page, a grid or a post whose shape you know
 │     → a skeleton from dashboard/Skeleton
 ├── An agent or a search, working for seconds,
 │   with steps worth showing → ThoughtLine
 └── A button's own action (a form's submit)
       → <Button loading>`}
        />
      </div>

      <SheetSection
        id="menu"
        title="Menu"
        description={
          <>
            <Mono>usePopover(&quot;menu&quot;)</Mono> on a <Mono>bg-modal</Mono> surface, wired by hand in the
            dashboard&rsquo;s Feed menu (Header.tsx), a board&rsquo;s More menu (BoardView.tsx) and the Save menu
            (boards.tsx). It enters with menu-in, leaves with menu-out (held by usePresence) and lights its rows with
            useGlide. Point at it with a mouse, then try it from the keyboard.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="grid items-start gap-8 xl:grid-cols-[16rem_minmax(0,1fr)]">
                <MenuDemo />
                <Matrix
                  first="minmax(8rem,max-content)"
                  template="minmax(16rem,1fr)"
                  columns={["does"]}
                  rows={MENU_KEYS.map((k) => ({ label: k.key, cells: [<Use key="d">{k.does}</Use>] }))}
                />
              </div>
            )}
          </Sheet>
          <Rules
            items={[
              {
                term: "Use",
                text: (
                  <>
                    A short list of actions on one thing (Rename, Delete), or one choice from a list: the Feed menu&rsquo;s
                    views are <Mono>menuitemradio</Mono> rows with <Mono>aria-checked</Mono>.
                  </>
                ),
              },
              {
                term: "Two ways",
                text: (
                  <>
                    A new menu is the shared <Mono>{"<Menu>"}</Mono> (<Mono>fundations/molecules/Menu</Mono>), which does all
                    of this inside; its props are on the Menu sheet. Wire <Mono>usePopover</Mono> by hand, as below and as
                    the dashboard&rsquo;s three still do, only for content <Mono>{"<Menu>"}</Mono> can&rsquo;t hold.
                  </>
                ),
              },
              {
                term: "Instead",
                text: (
                  <>
                    A few short values always on show: <Mono>Segmented</Mono>. A form or a link to copy:{" "}
                    <Mono>usePopover(&quot;dialog&quot;)</Mono>, as the Share panel. Going to another page: a link.
                  </>
                ),
              },
              {
                term: "Kinds",
                text: (
                  <>
                    <Mono>&quot;menu&quot;</Mono> (role=&quot;menu&quot;, items <Mono>tabIndex={"{-1}"}</Mono>, arrow
                    keys), <Mono>&quot;dialog&quot;</Mono> (focus moves to its first control as it opens) and{" "}
                    <Mono>&quot;disclosure&quot;</Mono> (a panel that follows its trigger in the tab order; focus stays
                    put). There is no other kind.
                  </>
                ),
              },
              {
                term: "Wiring",
                text: (
                  <>
                    <Mono>rootProps</Mono> on a <Mono>relative</Mono> wrapper round both, <Mono>triggerProps</Mono> on the
                    trigger with <Mono>aria-haspopup=&quot;menu&quot;</Mono>, <Mono>contentProps</Mono> on the menu,
                    rendered while <Mono>mounted</Mono>, and <Mono>popover.motion</Mono> in its classes. It grows from its
                    trigger: <Mono>origin-top-left</Mono> under <Mono>left-0</Mono>, <Mono>origin-top-right</Mono> under{" "}
                    <Mono>right-0</Mono>.
                  </>
                ),
              },
              {
                term: "Surface",
                text: (
                  <>
                    <Mono>rounded-2xl bg-modal p-1.5 shadow-lg outline-hidden</Mono>. Rows are{" "}
                    <Mono>rounded-md px-3 py-2 text-body</Mono> plus <Mono>GLIDE_ROW</Mono>; the highlight is{" "}
                    <Mono>GLIDE_HIGHLIGHT</Mono> plus <Mono>rounded-md</Mono>: the menu&rsquo;s radius less its padding (12
                    &minus; 6). A separator is <Mono>mx-3 my-1 h-px bg-border-default</Mono> with role=&quot;separator&quot;.
                  </>
                ),
              },
              {
                term: "Choosing",
                text: (
                  <>
                    An item calls <Mono>popover.close()</Mono>, which puts focus back on the trigger. An item that opens
                    something else (Rename&rsquo;s field) closes the menu first, then opens it.{" "}
                    <Mono>close(false)</Mono> leaves focus where it is.
                  </>
                ),
              },
              {
                term: "Never",
                text: (
                  <>
                    A <Mono>hover:bg-*</Mono> on a row: the highlight is the hover, so the row would light twice. A row as
                    round as the menu: <Mono>rounded-xl</Mono> in a <Mono>p-1.5</Mono> menu opens its corners wider than its
                    sides. A menu that grows from its centre.
                  </>
                ),
              },
            ]}
          />
          <Code
            correct={`const popover = usePopover("menu");
const { glide } = popover;

<div {...popover.rootProps} className="relative">
  <Button aria-haspopup="menu" {...popover.triggerProps} variant="secondary" size="lg" shape="pill" iconOnly aria-label="More">…</Button>
  {popover.mounted && (
    <div
      {...popover.contentProps}
      role="menu"
      aria-label="More"
      className={cx("absolute top-full right-0 z-30 mt-2 w-60 origin-top-right rounded-2xl bg-modal p-1.5 shadow-lg outline-hidden", popover.motion)}
    >
      <div ref={glide.ref} {...glide.handlers} className="relative">
        <span aria-hidden="true" className={cx(GLIDE_HIGHLIGHT, "rounded-md")} style={glide.highlight.style} data-fresh={glide.highlight.fresh || undefined} />
        <button type="button" role="menuitem" tabIndex={-1} data-glide-item onClick={() => { popover.close(); onRename(); }}
          className={cx("flex w-full rounded-md px-3 py-2 text-left text-body text-primary-foreground", GLIDE_ROW)}>
          Rename
        </button>
      </div>
    </div>
  )}
</div>`}
            incorrect={{
              why: "its own open state: no Escape, no arrow keys, no exit, rows a step too round",
              code: `const [open, setOpen] = useState(false);
useEffect(() => {
  const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
  document.addEventListener("mousedown", onDown);
  return () => document.removeEventListener("mousedown", onDown);
}, []);

{open && (
  <div className="absolute rounded-2xl bg-modal p-1.5 shadow-lg">
    <button className="rounded-xl px-3 py-2 hover:bg-base-100">Rename</button>
  </div>
)}`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="toast"
        title="Toast"
        description={
          <>
            The dashboard&rsquo;s toast is the shared one: <Mono>notify(text, tone)</Mono> from{" "}
            <Mono>useBoards()</Mono> calls <Mono>useToast()</Mono> under the <Mono>ToastProvider</Mono> in the dashboard layout. The demo copies its classes, its clock and its live region; the real one is fixed 24px
            above the bottom of the window, centred. Outside the dashboard, the shared toast is{" "}
            <Mono>fundations/molecules/Toast</Mono> (<Mono>ToastProvider</Mono>, <Mono>useToast</Mono>), on the Toast
            sheet.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="flex flex-col gap-8">
                <ToastDemo />
                <Matrix
                  first="minmax(5rem,max-content)"
                  template="3rem max-content max-content minmax(16rem,1fr)"
                  columns={["icon", "stays", "role", "copy"]}
                  rows={[
                    {
                      label: "done",
                      sub: "the default",
                      cells: [
                        <Check key="i" className="size-3.5 text-primary-foreground" />,
                        <Mono key="s">2.4s</Mono>,
                        <Mono key="r">polite</Mono>,
                        <Use key="c">
                          What happened, naming the thing, with no full stop: &ldquo;Saved to Launch ideas&rdquo;,
                          &ldquo;Removed from Launch ideas&rdquo;, &ldquo;Created Launch ideas&rdquo;.
                        </Use>,
                      ],
                    },
                    {
                      label: "error",
                      cells: [
                        <WarningCircle key="i" className="size-4 text-primary-foreground" />,
                        <Mono key="s">4s</Mono>,
                        <Mono key="r">alert</Mono>,
                        <Use key="c">
                          What failed, then what to do: &ldquo;Couldn&rsquo;t save to Launch ideas. Try again.&rdquo; An
                          optimistic change on screen has already been undone.
                        </Use>,
                      ],
                    },
                  ]}
                />
              </div>
            )}
          </Sheet>
          <Rules
            items={[
              {
                term: "Use",
                text: "To confirm a change that's already on screen (an optimistic save, a removal, a new board), or that nothing needed to change (“Already in Launch ideas”, a done toast), and to say a background load or write failed, undoing any optimistic change it made (“Couldn’t load your boards. Reload the page to try again.”).",
              },
              {
                term: "Instead",
                text: (
                  <>
                    A problem with one field: the error under it (<Mono>fundations/molecules/Field</Mono>&rsquo;s{" "}
                    <Mono>error</Mono>). A problem with a form, or a state that must stay: a{" "}
                    <Mono>fundations/molecules/Notice</Mono> beside what it&rsquo;s about. (The auth pages have their own
                    pair, <Mono>AuthField</Mono> and <Mono>AuthNotice</Mono>.) Anything that needs an answer: a menu or a
                    dialog.
                  </>
                ),
              },
              {
                term: "Tones",
                text: (
                  <>
                    <Mono>&quot;done&quot;</Mono>, the default, and <Mono>&quot;error&quot;</Mono>. Nothing else exists.
                    The icon and the words carry the tone; both are the inverted surface, never red.
                  </>
                ),
              },
              {
                term: "One at a time",
                text: "A new toast replaces the one showing. Never two on screen, never stacked.",
              },
              {
                term: "Clock",
                text: "It stops while the pointer is on the toast and while the tab is in the background, then runs on with the time it had left.",
              },
              {
                term: "Motion",
                text: (
                  <>
                    <Mono>animate-toast-in</Mono> (180ms) on the way in, <Mono>animate-toast-out</Mono> (120ms) on the
                    way out, held by <Mono>usePresence(open, 120)</Mono>. Under reduced motion it appears and goes at
                    once.
                  </>
                ),
              },
              {
                term: "Never",
                text: "A toast with its own timer, position or colours. A toast as the only way to do something: it leaves by itself and focus never moves to it. notify() takes words alone; the shared toast's single action (Undo, View board) is always a shortcut.",
              },
            ]}
          />
          <Code
            correct={`const { notify } = useBoards();

notify(\`Saved to \${board.name}\`);
notify(\`Couldn’t save to \${board.name}. Try again.\`, "error");`}
            incorrect={{
              why: "a toast of its own: no live region, a clock that runs while nobody's looking, black in both themes, an error in one word",
              code: `const [message, setMessage] = useState("");
useEffect(() => {
  const timer = setTimeout(() => setMessage(""), 3000);
  return () => clearTimeout(timer);
}, [message]);

{message && <div className="fixed right-4 bottom-4 rounded-xl bg-black px-4 py-3 text-white">Error!</div>}`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="theme"
        title="Theme switch"
        description={
          <>
            <Mono>global/ThemeToggle</Mono>: one button that flips between light and dark, in the site&rsquo;s navigation
            (Navigation, MobileNav). A click switches the whole site, not a panel, and remembers the choice.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4 rounded-2xl bg-card p-5">
            <ThemeToggle className="shrink-0" />
            <p className="text-body-sm text-secondary-foreground">
              The real one, in the site&rsquo;s own theme. It switches everything, this page and its navigation
              included. The Light, Dark and Both switch at the top of this page only picks which panels show.
            </p>
          </div>
          <Sheet>
            {(theme) => (
              <Matrix
                first="minmax(7rem,max-content)"
                template="4rem minmax(11rem,max-content) minmax(16rem,1fr)"
                columns={["shows", "its name", "a click"]}
                rows={[
                  {
                    label: `a ${theme} page`,
                    cells: [
                      <ToggleSpecimen key="s" theme={theme} />,
                      <Mono key="n">{theme === "light" ? "Switch to dark theme" : "Switch to light theme"}</Mono>,
                      <Use key="c">
                        {theme === "light" ? (
                          <>
                            Sets <Mono>data-theme=&quot;dark&quot;</Mono> on <Mono>{"<html>"}</Mono> and saves{" "}
                            <Mono>theme: dark</Mono> in localStorage.
                          </>
                        ) : (
                          <>
                            Takes <Mono>data-theme</Mono> off <Mono>{"<html>"}</Mono> and saves <Mono>theme: light</Mono>{" "}
                            in localStorage.
                          </>
                        )}
                      </Use>,
                    ],
                  },
                ]}
              />
            )}
          </Sheet>
          <Rules
            items={[
              {
                term: "Use",
                text: (
                  <>
                    <Mono>ThemeToggle</Mono> in the site&rsquo;s navigation: one press, light to dark and back. In the
                    dashboard the choice is three-way (Light, Dark, System), a <Mono>Segmented</Mono> in AccountMenu.
                  </>
                ),
              },
              {
                term: "Both call",
                text: (
                  <>
                    <Mono>setThemeMode(mode)</Mono> from <Mono>global/theme.ts</Mono>. It sets <Mono>data-theme</Mono> on{" "}
                    <Mono>{"<html>"}</Mono>, saves the choice (or forgets it for System, which then follows the device)
                    and sets <Mono>data-theme-switching</Mono> for two frames, so no colour tweens on its own clock.{" "}
                    <Mono>global/ThemeScript</Mono> applies the saved choice before paint, so nothing flashes on load.
                  </>
                ),
              },
              {
                term: "Its icons",
                text: (
                  <>
                    The moon and the sun share one cell and CSS picks one, so the server&rsquo;s HTML is right in either
                    theme. A switch cross-fades them over 250ms (<Mono>data-theme-icon</Mono> lets them through the
                    freeze); under reduced motion they swap at once.
                  </>
                ),
              },
              {
                term: "A theme prop",
                text: (
                  <>
                    Something that takes a theme instead of reading the tokens (the search pill&rsquo;s BorderBeam) reads{" "}
                    <Mono>useDarkTheme()</Mono>, which follows <Mono>data-theme</Mono>, not the device.
                  </>
                ),
              },
              {
                term: "Never",
                text: (
                  <>
                    Write <Mono>data-theme</Mono> or localStorage yourself: it skips the freeze and the saved choice. A
                    third theme control: there&rsquo;s one per surface.
                  </>
                ),
              },
            ]}
          />
          <Code
            correct={`// The site's navigation: one press between light and dark
<ThemeToggle className="shrink-0" />

// Anything else that sets the theme
import { setThemeMode } from "@/components/global/theme";
setThemeMode("system");`}
            incorrect={{
              why: "writes the page itself: the wrong attribute, nothing saved, every colour tweens, no name",
              code: `<button onClick={() => document.documentElement.classList.toggle("dark")}>
  <Moon />
</button>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="faq"
        title="FAQ"
        description={
          <>
            <Mono>global/Faq</Mono>, near the end of the homepage and the pricing page. Native{" "}
            <Mono>{"<details>"}</Mono>, one per question, so it works before any script and each opens on its own. These
            are the homepage&rsquo;s first three.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <p className="text-body-sm text-secondary-foreground">
            The specimen below breaks its own rule: Faq brings its own section, gutter, rhythm and heading, so it sits
            inside this section only to be shown here.
          </p>
          <Sheet>{() => <Faq faqs={faqs.slice(0, 3)} />}</Sheet>
          <Rules
            items={[
              {
                term: "Use",
                text: "The questions a visitor still has once a marketing page has made its case, after its sections: before the homepage's closing call, last on pricing. The homepage has six, pricing five.",
              },
              {
                term: "Props",
                text: (
                  <>
                    One: <Mono>faqs: {"{ question, answer }"}[]</Mono>, plain strings. An answer is rendered as one
                    paragraph of text, so it holds no links or markup.
                  </>
                ),
              },
              {
                term: "Copy",
                text: "A question in the visitor's words, ending in a question mark. An answer of one to three sentences that starts with the answer: “Only you, until you share a board with a link.”",
              },
              {
                term: "Its own section",
                text: (
                  <>
                    It renders its own <Mono>{"<section>"}</Mono>, Wrapper, <Mono>section-y</Mono> rhythm and h2
                    (&ldquo;Frequently asked questions&rdquo;, at h1 size). Put it straight in the page, never inside
                    another section or Wrapper.
                  </>
                ),
              },
              {
                term: "Motion",
                text: (
                  <>
                    The plus turns into a cross (200ms) and the answer drops in with <Mono>rise-in</Mono>. Closing is
                    instant: <Mono>{"<details>"}</Mono> has no exit. Neither moves under reduced motion.
                  </>
                ),
              },
              {
                term: "Instead",
                text: (
                  <>
                    One fold inside the app (the post panel&rsquo;s Show the reasoning): a button with{" "}
                    <Mono>aria-expanded</Mono> and <Mono>aria-controls</Mono>, as CreativeBreakdown does. Anything a visitor
                    needs to decide, like what the plan includes: on the page, not behind a question.
                  </>
                ),
              },
            ]}
          />
          <Code
            correct={`import Faq from "@/components/global/Faq";
import { faqs } from "@/components/home/faqs";

// A section of the page by itself
<Faq faqs={faqs} />`}
            incorrect={{
              why: "wrapped again: a second gutter and twice the rhythm",
              code: `<section>
  <Wrapper className="section-y">
    <Faq faqs={faqs} />
  </Wrapper>
</section>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="skeletons"
        title="Loading skeletons"
        description={
          <>
            <Mono>dashboard/Skeleton</Mono>: the shape of what&rsquo;s coming, in its own proportions, so nothing jumps
            when it lands. Server-safe, so the route <Mono>loading.tsx</Mono> files and the grid&rsquo;s first render can
            both use them.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <ShimmerPlay>
                <div className="flex flex-col gap-10">
                  <Specimen name="Block({ className, style })" where="One shimmering piece, at the size and radius of what it stands for.">
                    <div className="flex items-end gap-4">
                      <Block className="size-11 rounded-full" />
                      <div className="flex flex-col gap-2">
                        <Block className="h-4 w-24 rounded-full" />
                        <Block className="h-3 w-32 rounded-full" />
                      </div>
                      <Block className="w-16 rounded" style={{ aspectRatio: 0.8 }} />
                    </div>
                  </Specimen>
                  <Specimen name="HeaderSkeleton()" where="The dashboard header: app/dashboard/loading.tsx, above the grid's.">
                    <div className="-mx-4 sm:-mx-6">
                      <HeaderSkeleton />
                    </div>
                  </Specimen>
                  <Specimen
                    name="GridSkeleton({ label })"
                    where="The masonry before its width is known: Feed, BoardView, Grid's first render and the dashboard's loading.tsx. Cut short here."
                  >
                    <div className="h-[28rem] overflow-hidden">
                      <GridSkeleton />
                    </div>
                  </Specimen>
                  <Specimen
                    name="PostSkeleton()"
                    where="A post on its way, in PostView's shape: both @modal loading.tsx files. Fixed over the window in the app; held in a box here."
                  >
                    {/* Paint containment makes the box the fixed overlay's containing block. Below lg
                        the stage is 62% of the window's height with the panel under it, so the box
                        grows to show both */}
                    <div className="relative h-[calc(62dvh+20rem)] overflow-hidden rounded-2xl [contain:paint] lg:h-[32rem]">
                      <PostSkeleton />
                    </div>
                  </Specimen>
                </div>
              </ShimmerPlay>
            )}
          </Sheet>
          <Rules
            items={[
              {
                term: "Use",
                text: (
                  <>
                    Whenever the shape of what&rsquo;s coming is known: the feed, a board, a post. The three dashboard
                    shapes have an export each, and other dashboard pieces are built from <Mono>Block</Mono>. Outside the
                    dashboard, the shared <Mono>Skeleton</Mono> (<Mono>fundations/elements/Skeleton</Mono>: a line, a
                    circle, a rect) on the Skeleton sheet, which uses the same band.
                  </>
                ),
              },
              {
                term: "Instead",
                text: (
                  <>
                    An agent working for seconds: ThoughtLine. A button&rsquo;s own wait: <Mono>{"<Button loading>"}</Mono>.
                    Never a spinner for a page or a grid: it collapses the page to one icon, then everything jumps.
                  </>
                ),
              },
              {
                term: "Name it",
                text: (
                  <>
                    <Mono>GridSkeleton</Mono> and <Mono>PostSkeleton</Mono> are <Mono>role=&quot;status&quot;</Mono> with a
                    label; pass GridSkeleton&rsquo;s <Mono>label</Mono> to say what&rsquo;s loading (Feed passes &ldquo;Loading
                    your feed&rdquo;, BoardView &ldquo;Loading the board&rsquo;s posts&rdquo;). <Mono>Block</Mono> is
                    aria-hidden: wrap a group in one <Mono>role=&quot;status&quot;</Mono> with an{" "}
                    <Mono>aria-label</Mono>.
                  </>
                ),
              },
              {
                term: "Shape",
                text: (
                  <>
                    Text lines are <Mono>rounded-full</Mono> at roughly the line&rsquo;s height (<Mono>h-3</Mono> to{" "}
                    <Mono>h-6</Mono>), covers <Mono>rounded</Mono> at their aspect ratio (<Mono>style</Mono>), avatars and
                    buttons at their real size. Match the loaded layout, or it jumps anyway.
                  </>
                ),
              },
              {
                term: "Motion",
                text: (
                  <>
                    <Mono>animate-shimmer</Mono>: a band of <Mono>--color-shimmer</Mono> crosses <Mono>bg-component</Mono>{" "}
                    every 1.6s, ease-in-out, for as long as it&rsquo;s on screen. It holds still under reduced motion.
                  </>
                ),
              },
              {
                term: "Never",
                text: (
                  <>
                    A second fill on a Block (<Mono>bg-card</Mono>, <Mono>bg-base-100</Mono>): cx doesn&rsquo;t merge, so
                    it fights Block&rsquo;s own <Mono>bg-component</Mono>. Words in a skeleton.
                  </>
                ),
              },
            ]}
          />
          <Code
            correct={`import { Block, GridSkeleton } from "@/components/dashboard/Skeleton";

<GridSkeleton label="Loading your saved posts" />

<div role="status" aria-label="Loading the board">
  <Block className="h-6 w-48 rounded-full" />
  <Block className="mt-2 h-3.5 w-32 rounded-full" />
</div>`}
            incorrect={{
              why: "a spinner: the page shrinks to one icon, then jumps when the grid lands",
              code: `{loading && (
  <div className="flex justify-center py-20">
    <CircleNotch className="size-6 animate-spin" />
  </div>
)}`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="thinking"
        title="Thinking line"
        description={
          <>
            <Mono>ui/thought-line</Mono>, React Bits&rsquo; ThoughtLine ported to the site: an agent&rsquo;s working line
            with a trace of its steps, which settles into a sentence with the time it took. The homepage&rsquo;s MCP demo
            (<Mono>home/McpDemo</Mono>) is its one use. Run it, then open the settled line for the trace: the demo keeps
            the default <Mono>collapsible</Mono>, where McpDemo passes <Mono>false</Mono>.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="flex flex-col gap-8">
                <ThoughtDemo />
                <Matrix
                  first="minmax(6rem,max-content)"
                  template="minmax(12rem,max-content) minmax(14rem,1fr)"
                  columns={["McpDemo passes", "does"]}
                  rows={THOUGHT_PROPS.map((p) => ({
                    label: p.prop,
                    cells: [<Mono key="v">{p.value}</Mono>, <Use key="d">{p.does}</Use>],
                  }))}
                />
              </div>
            )}
          </Sheet>
          <Rules
            items={[
              {
                term: "Use",
                text: "An agent or a search working for seconds, where the steps are worth showing and the time it took is worth knowing.",
              },
              {
                term: "Instead",
                text: (
                  <>
                    A page or a grid loading: a skeleton. A button&rsquo;s own wait: <Mono>{"<Button loading>"}</Mono>.
                  </>
                ),
              },
              {
                term: "Colours",
                text: (
                  <>
                    Always pass <Mono>color</Mono> and <Mono>glyphColor</Mono> as the token variables. The shimmer mixes the
                    ink with transparent through <Mono>color-mix()</Mono>, which can&rsquo;t take the default{" "}
                    <Mono>currentColor</Mono>, and the label renders invisible. A hex wouldn&rsquo;t flip with the theme.
                  </>
                ),
              },
              {
                term: "In a loop",
                text: (
                  <>
                    <Mono>live={"{false}"}</Mono>, or every pass is announced again. Pass <Mono>elapsed</Mono> only while
                    the line is settled (<Mono>elapsed={"{settled ? SECONDS : undefined}"}</Mono>), so the clock runs
                    during the search and the settled sentence always reads the scripted time (McpDemo&rsquo;s 2.3s).
                    McpDemo also passes <Mono>collapsible={"{false}"}</Mono>, so its settled line doesn&rsquo;t open.
                  </>
                ),
              },
              {
                term: "Reduced motion",
                text: "The sheen and the blur at the crossfade go, and the breath is shallower and slower. The steps still tick.",
              },
              {
                term: "Never",
                text: (
                  <>
                    Restyle its insides: it&rsquo;s kept close to upstream and styled from the outside (its stylesheet,{" "}
                    <Mono>ui/thought-line.css</Mono>, is imported from <Mono>global.css</Mono>, so the server&rsquo;s HTML
                    is styled before its script arrives).
                  </>
                ),
              },
            ]}
          />
          <Code
            correct={`<ThoughtLine
  working={searching}
  label="Searching…"
  doneLabel={\`Found \${posts.length} posts in\`}
  steps={trace}
  glyph={<Symbol />}
  color="var(--color-secondary-foreground)"
  glyphColor="var(--color-primary-foreground)"
  fontSize={14}
  live={false}
  collapsible={false}
  elapsed={settled ? SEARCH_SECONDS : undefined}
/>`}
            incorrect={{
              why: "no colours: the ink is currentColor, which the shimmer can't mix, so the label disappears",
              code: `<ThoughtLine working label="Searching…" steps={trace} />`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="dialog"
        title="Dialog"
        description={
          <>
            <Mono>fundations/molecules/Dialog</Mono>: a native <Mono>{"<dialog>"}</Mono> opened with{" "}
            <Mono>showModal()</Mono> and moved by the shared <Mono>.dialog-motion</Mono> class. <Mono>dashboard/NewBoardDialog</Mono> (Create in the dashboard&rsquo;s header) is built on it, with{" "}
            <Mono>radius="large"</Mono> and <Mono>titleVariant="quiet"</Mono>.
            Its props are on the Dialog sheet, its timings on the Motion sheet.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="grid items-start gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10">
                <NewBoardDemo />
                <Matrix
                  first="6rem"
                  template="minmax(16rem,1fr)"
                  columns={["what happens"]}
                  rows={DIALOG_STEPS.map((s) => ({ label: s.step, cells: [<Use key="d">{s.does}</Use>] }))}
                />
              </div>
            )}
          </Sheet>
          <Rules
            items={[
              {
                term: "Use",
                text: "A task that needs the page out of the way and ends in one decision: making a board (a name, a description, the share switch, Create board).",
              },
              {
                term: "Instead",
                text: (
                  <>
                    A few actions: a menu. A small form that can sit beside its button (the share link):{" "}
                    <Mono>usePopover(&quot;dialog&quot;)</Mono>. Asking before a delete that a menu offered: inside that
                    menu, with focus on Cancel (BoardView&rsquo;s More menu).
                  </>
                ),
              },
              {
                term: "Two ways",
                text: (
                  <>
                    A new dialog is <Mono>{"<Dialog>"}</Mono>, which does everything in the table inside. Don&rsquo;t wire a native{" "}
                    <Mono>{"<dialog>"}</Mono> by hand: extend <Mono>{"<Dialog>"}</Mono> instead, as its{" "}
                    <Mono>radius</Mono> and <Mono>titleVariant</Mono> props were added for the new-board dialog.
                  </>
                ),
              },
              {
                term: "Props",
                text: (
                  <>
                    Always controlled: <Mono>open</Mono> and <Mono>onOpenChange</Mono>. A <Mono>title</Mono> (a question or
                    a task, in a few words) and an optional <Mono>description</Mono>; <Mono>size</Mono> sm 384px, md 448px
                    (the default), lg 672px; <Mono>footer</Mono> for the actions, primary last;{" "}
                    <Mono>role=&quot;alertdialog&quot;</Mono> for a decision with consequences.
                  </>
                ),
              },
              {
                term: "Inside",
                text: (
                  <>
                    <Mono>dialog-motion m-auto w-[calc(100%-2rem)] rounded-3xl border-0 bg-modal p-0 shadow-xl
                    backdrop:bg-black/40</Mono>, the content padded inside it (<Mono>px-6</Mono>). The width keeps it 16px
                    from a phone&rsquo;s edges, the page gutter. A by-hand dialog takes the same classes.
                  </>
                ),
              },
              {
                term: "Never",
                text: (
                  <>
                    Unmount the <Mono>{"<dialog>"}</Mono> to close it (it can&rsquo;t leave), open it with the{" "}
                    <Mono>open</Mono> attribute (not modal: the page stays reachable and Escape does nothing), or let
                    Escape close it behind React&rsquo;s back. Don&rsquo;t pass a radius class: the 28px corners are{" "}
                    <Mono>radius="large"</Mono>, for the new-board dialog only.
                  </>
                ),
              },
            ]}
          />
          <Code
            correct={`import Dialog from "@/components/fundations/molecules/Dialog";

<Dialog
  open={open}
  onOpenChange={setOpen}
  title="New board"
  footer={
    <>
      <Button variant="muted" onClick={() => setOpen(false)}>Cancel</Button>
      <Button type="submit" form={formId} disabled={!name.trim()}>Create board</Button>
    </>
  }
>
  <form id={formId} onSubmit={create}>
    <Field label="Board name">
      <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
    </Field>
  </form>
</Dialog>`}
            incorrect={{
              why: "a dialog of its own: Escape closes it but open stays true, so the next press of New board does nothing; the page scrolls behind it",
              code: `useEffect(() => {
  if (open) ref.current?.showModal();
}, [open]);

<dialog ref={ref} className="dialog-motion …">…</dialog>`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
