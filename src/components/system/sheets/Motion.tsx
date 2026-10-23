// /system/motion: the easing tokens, the durations, the shared keyframes in src/styles/global.css,
// the hooks in src/lib/motion.ts and the dialog's motion, each live. The demos are client
// components in ../demos/MotionDemos.tsx; the sheet itself stays a server component.
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";
import {
  DialogDemo,
  GlideList,
  KeyframeToggle,
  PresenceMenu,
  ReducedMotionValue,
  ReplayGroup,
  Track,
  type Ease,
  type Ms,
} from "../demos/MotionDemos";
import Button from "@/components/fundations/elements/Button";
import Segmented from "@/components/fundations/elements/Segmented";
import { Block } from "@/components/dashboard/Skeleton";
import { Fragment, type ReactNode } from "react";
import { cx } from "@/lib/cx";

// The three curves, as @theme declares them (--ease-*) and as their utilities read
const CURVES: { cls: string; token: string; points: [number, number, number, number]; ease: Ease; sub: string; use: string }[] = [
  {
    cls: "ease-out-quint",
    token: "--ease-out-quint",
    points: [0.23, 1, 0.32, 1],
    ease: "out-quint",
    sub: "The default",
    use: "Anything entering or answering a person: menus, toasts, hovers, presses, a sliding thumb. It starts fast, so the response feels instant.",
  },
  {
    cls: "ease-in-out-quart",
    token: "--ease-in-out-quart",
    points: [0.77, 0, 0.175, 1],
    ease: "in-out-quart",
    sub: "Across a surface",
    use: "Something travelling across its stage, like the homepage divider gliding to one side, even when a click starts it. It speeds up, then brakes.",
  },
  {
    cls: "ease-in-quart",
    token: "--ease-in-quart",
    points: [0.5, 0, 0.75, 0],
    ease: "in-quart",
    sub: "Exits only",
    use: "Something leaving, and always shorter than the way in. On an entrance its slow start reads as lag.",
  },
];

/** The curve drawn on a 48px square, with linear as a dashed diagonal to compare against */
function Curve({ points: [x1, y1, x2, y2] }: { points: [number, number, number, number] }) {
  const s = 48;
  const d = `M0 ${s} C${x1 * s} ${s - y1 * s} ${x2 * s} ${s - y2 * s} ${s} 0`;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} aria-hidden="true" className="size-12 overflow-visible">
      <rect x="0" y="0" width={s} height={s} rx="2" className="fill-none stroke-border-default" />
      <path d={`M0 ${s} L${s} 0`} strokeDasharray="2 3" className="fill-none stroke-border-strong" />
      <path d={d} strokeWidth="1.5" strokeLinecap="round" className="fill-none stroke-primary-foreground" />
    </svg>
  );
}

// Durations: the representative time each kind runs in code, drawn to one scale (400ms across)
const DURATIONS: {
  kind: string;
  sub: string;
  time: string;
  easing: ReactNode;
  track?: { ease: Ease; ms: Ms; width: string };
  use: ReactNode;
}[] = [
  {
    kind: "hover",
    sub: "colour, background, shadow",
    time: "150ms",
    easing: "ease-out-quint",
    track: { ease: "out-quint", ms: 150, width: "w-[37.5%]" },
    use: (
      <span className="flex flex-wrap items-center gap-3">
        <span className="text-body-sm text-secondary-foreground">Links, buttons, rows and chips.</span>
        <Button variant="muted" size="xs">
          Hover me
        </Button>
      </span>
    ),
  },
  {
    kind: "press",
    sub: "scale to 0.97, motion-safe",
    time: "150ms",
    easing: "ease-out-quint",
    track: { ease: "out-quint", ms: 150, width: "w-[37.5%]" },
    use: (
      <span className="flex flex-wrap items-center gap-3">
        <span className="text-body-sm text-secondary-foreground">
          Button does it by itself, only while it can act.
        </span>
        <Button size="xs">Press and hold</Button>
      </span>
    ),
  },
  {
    kind: "enter",
    sub: "opacity with a scale or a rise",
    time: "150–200ms",
    easing: "ease-out-quint",
    track: { ease: "out-quint", ms: 200, width: "w-1/2" },
    use: <Use>Menus 150ms, the toast 180ms, a dialog and an FAQ answer 200ms.</Use>,
  },
  {
    kind: "exit",
    sub: "the same, quieter",
    time: "120–140ms",
    easing: "ease-in-quart",
    track: { ease: "in-quart", ms: 140, width: "w-[35%]" },
    use: <Use>Menus and the toast 120ms, a dialog 140ms. Always shorter than the entrance.</Use>,
  },
  {
    kind: "move",
    sub: "across a surface",
    time: "400ms",
    easing: "ease-in-out-quart",
    track: { ease: "in-out-quart", ms: 400, width: "w-full" },
    use: (
      <Use>
        A divider or a panel travelling across its stage, even when a click starts it: the homepage
        divider glides on this. A thumb between options is a short hop inside one control, so it&rsquo;s
        a response: 200ms on ease-out-quint.
      </Use>
    ),
  },
  {
    kind: "loop",
    sub: "runs on its own",
    time: "1.6–180s",
    easing: (
      <span className="flex flex-col gap-0.5">
        <Mono>linear</Mono>
        <Mono>shimmer: ease-in-out</Mono>
      </span>
    ),
    use: (
      <Use>
        The skeleton shimmer 1.6s, the footer strip 60s, the sign-in wall 70 to 94s a column and the
        footer mark&rsquo;s turn 180s. A loop in script runs only while it&rsquo;s on screen and the tab is
        visible.
      </Use>
    ),
  },
];

function Use({ children }: { children: ReactNode }) {
  return <span className="text-body-sm text-secondary-foreground">{children}</span>;
}

/** Mono in the primary ink, for the value a row is about. Its own element, because Mono already
 *  carries text-secondary-foreground and cx doesn't merge a second colour over it */
function MonoStrong({ children }: { children: ReactNode }) {
  return <code className="font-mono text-caption-lg text-primary-foreground">{children}</code>;
}

// The shared keyframes in @theme, with the timings the code plays them at
const KEYFRAMES: {
  label: ReactNode;
  moves: string;
  timing: string[];
  use: ReactNode;
  demo: ReactNode;
}[] = [
  {
    label: (
      <>
        menu-in
        <br />
        menu-out
      </>
    ),
    moves: "opacity 0, scale(0.97)",
    timing: ["150ms ease-out-quint", "120ms ease-in-quart"],
    use: (
      <>
        Menus, popovers and the search panel. <Mono>usePopover</Mono> sets both.
      </>
    ),
    demo: <KeyframeToggle kind="menu" />,
  },
  {
    label: (
      <>
        toast-in
        <br />
        toast-out
      </>
    ),
    moves: "opacity 0, translateY(6px) in, 4px out",
    timing: ["180ms ease-out-quint", "120ms ease-in-quart"],
    use: "The dashboard's toast, which rises from the bottom of the window.",
    demo: <KeyframeToggle kind="toast" />,
  },
  {
    label: (
      <>
        fade-in
        <br />
        fade-out
      </>
    ),
    moves: "opacity 0",
    timing: ["150ms ease-out-quint", "120ms ease-in-quart"],
    use: "The dim behind the dashboard's search panel. It keeps the panel's timing, so the two move as one.",
    demo: <KeyframeToggle kind="fade" />,
  },
  {
    label: "rise-in",
    moves: "opacity 0, translateY(-4px)",
    timing: ["200ms ease-out-quint", "no exit"],
    use: (
      <>
        Content opening in place: an FAQ answer. It closes at once, as <Mono>&lt;details&gt;</Mono> does.
      </>
    ),
    demo: <KeyframeToggle kind="rise" />,
  },
  {
    label: "shimmer",
    moves: "background-position 150% to -50%",
    timing: ["1.6s ease-in-out", "infinite"],
    use: (
      <>
        Loading skeletons: <Mono>animate-shimmer</Mono> in <Mono>dashboard/Skeleton</Mono>. The one product UI loop on a
        curve, so the band slows at each end. It loops here as in the app, and holds still under reduced
        motion.
      </>
    ),
    demo: <Block className="h-8 w-40 rounded-lg" />,
  },
  {
    label: (
      <>
        wall-down
        <br />
        wall-up
      </>
    ),
    moves: "wall-down translateY 0 → -50%, wall-up -50% → 0 (one copy of the column)",
    timing: ["80s linear", "infinite"],
    use: (
      <>
        The sign-in wall: <Mono>animate-wall-down</Mono> and <Mono>animate-wall-up</Mono>, which PostWall sets to 70
        to 94s a column. Holds still under reduced motion.
      </>
    ),
    demo: <Use>Behind the sign-in card</Use>,
  },
];

const TILE_SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

/** One hook: its name, what it's for, the live specimen and the numbers it keeps */
function HookCard({
  name,
  children,
  demo,
  spec,
  popover = false,
}: {
  name: string;
  children: ReactNode;
  demo: ReactNode;
  spec: string[];
  /** Room below the demo for a popover to open into, on every width */
  popover?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl bg-card p-5">
      <h4 className="font-mono text-caption-lg text-primary-foreground">{name}</h4>
      <p className="mt-1.5 text-body-sm text-secondary-foreground">{children}</p>
      {/* The same height in every card once they sit side by side, so the specs line up */}
      <div className={cx("mt-5 flex items-start", popover ? "min-h-44" : "sm:min-h-44")}>{demo}</div>
      <ul className="mt-auto flex flex-col gap-1.5 border-t border-border-default pt-4 text-caption-lg">

        {spec.map((line) => (
          <li key={line}>
            <Mono>{line}</Mono>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Motion() {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-6">
        <SheetHeader title="Motion">
          Motion here is feedback: it says a press landed, where a menu came from and where a selection
          went. Product UI moves through CSS transitions and keyframes on three curves, and nothing a
          person starts there lasts longer than 400ms. A handful of showpieces keep their own timings.
        </SheetHeader>
        {/* Shown by CSS alone, so it's in place before any script runs and nothing below it shifts */}
        <p className="hidden max-w-3xl rounded-xl bg-card px-4 py-3 text-body-sm text-secondary-foreground motion-reduce:block">
          Reduced motion is on, so these demos do what the site does for you: nothing moves, the dots jump
          to the end of their tracks, and menus and the dialog appear and go at once. Turn it off in your
          system settings to watch them run.
        </p>
      </div>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                CSS first. A transition for a state a person can reverse (hover, press, a sliding thumb, the
                dialog), since it turns around mid-way; a keyframe from <Mono>global.css</Mono> for a one-off
                entrance or exit. The hooks in <Mono>src/lib/motion.ts</Mono> when React has to drive it.
              </>
            ),
          },
          {
            term: "Scope",
            text: (
              <>
                The closed sets on this sheet (curves, durations, properties) are for product UI: menus,
                popovers, toasts, dialogs, buttons, rows, thumbs and hovers. Showpieces and vendored code are
                the exceptions, below.
              </>
            ),
          },
          {
            term: "Easing",
            text: (
              <>
                <Mono>ease-out-quint</Mono> is the default, <Mono>ease-in-out-quart</Mono> is for something
                travelling across a surface, <Mono>ease-in-quart</Mono> is for exits, and <Mono>linear</Mono>{" "}
                only for a constant drift. One exception: the skeleton shimmer loops on Tailwind&rsquo;s{" "}
                <Mono>ease-in-out</Mono> (<Mono>--animate-shimmer</Mono>). Nothing else: Tailwind&rsquo;s{" "}
                <Mono>ease-out</Mono>, <Mono>ease-in</Mono> and <Mono>ease-in-out</Mono> are too weak to read as
                a curve. Always write the <Mono>ease-*</Mono> class: a transition without one gets
                Tailwind&rsquo;s default, <Mono>cubic-bezier(0.4, 0, 0.2, 1)</Mono>, which is that same weak{" "}
                <Mono>ease-in-out</Mono>.
              </>
            ),
          },
          {
            term: "Properties",
            text: (
              <>
                Movement and size change through transform (<Mono>translate</Mono>, <Mono>scale</Mono>,{" "}
                <Mono>rotate</Mono>) and <Mono>opacity</Mono>, because they skip layout. Colour, background and
                shadow may tween on a hover (the hover row below). Nothing else animates (no width, height,
                top, left, margin or padding) except these four, each for a reason: a <Mono>useThumb</Mono>{" "}
                thumb&rsquo;s width and
                height (it&rsquo;s absolutely positioned, so nothing lays out around it, and scaling would
                stretch its corners and shadow); the <Mono>Switch</Mono> thumb&rsquo;s 4px stretch while
                pressed (inside a fixed-size track, so nothing outside it moves); the homepage divider&rsquo;s{" "}
                <Mono>clip-path</Mono> reveal (a reveal can&rsquo;t be a transform); and <Mono>filter</Mono>{" "}
                for the theme icon&rsquo;s 2px blur and a cover&rsquo;s <Mono>brightness-95</Mono> hover in
                the search panel.
              </>
            ),
          },
          {
            term: "Transitions",
            text: (
              <>
                Name what changes: <Mono>transition-colors</Mono>, <Mono>transition-[translate,opacity]</Mono>.
                Never <Mono>transition-all</Mono>, and not a bare <Mono>transition</Mono> either (it covers
                colours, shadows, transforms and filters at once), or a padding or shadow change starts
                tweening by accident.
              </>
            ),
          },
          {
            term: "Durations",
            text: (
              <>
                Hover and colour 150ms. Press 150ms, to <Mono>scale-[0.97]</Mono> behind{" "}
                <Mono>motion-safe:</Mono> (Button has it). Enter 150 to 200ms. Exit 120 to 140ms. Travel across
                a surface 400ms. Nothing in product UI that a person starts runs longer. Two patterns in the
                code today are older and not to copy: <Mono>active:scale-[0.96]</Mono> with no{" "}
                <Mono>motion-safe:</Mono> (most hand-made presses in the dashboard, which scale under reduced
                motion), and the theme toggle&rsquo;s 250ms icon cross-fade.
              </>
            ),
          },
          {
            term: "Exits",
            text: (
              <>
                Shorter than their entrance (a menu 150ms in, 120ms out; the dialog 200ms in, 140ms out) and on{" "}
                <Mono>ease-in-quart</Mono>. The person has already moved on.
              </>
            ),
          },
          {
            term: "Keyboard",
            text: (
              <>
                Nothing animates on a key that repeats. Arrow keys snap a thumb (<Mono>useThumb</Mono> does
                it), focus styles are instant, and a held key never queues slides.
              </>
            ),
          },
          {
            term: "Reduced motion",
            text: (
              <>
                Nothing moves or scales. A fade may stay where a jump would flash (the glide highlight keeps
                its fade); menus, toasts and the dialog appear and go at once. Add the{" "}
                <Mono>motion-reduce:</Mono> path in the same change. When the animation sits under another
                variant (<Mono>group-open:</Mono>), put it behind <Mono>motion-safe:</Mono> instead, because{" "}
                <Mono>motion-reduce:animate-none</Mono> loses to the more specific selector.
              </>
            ),
          },
          {
            term: "Loops",
            text: (
              <>
                A loop in script (a timer, <Mono>requestAnimationFrame</Mono>) runs only while it&rsquo;s on
                screen and the tab is visible, through <Mono>IntersectionObserver</Mono> and{" "}
                <Mono>visibilitychange</Mono>, and stops when the visitor points at it or takes over.
              </>
            ),
          },
          {
            term: "On load",
            text: (
              <>
                Nothing in product UI animates because the page opened: what&rsquo;s already in place stays
                put. The showpieces that play once on arrival (the 404 collage, the empty Saved view and board,
                Scattered) are the exceptions. Every demo on this sheet with a button waits for it; the
                skeleton under Keyframes loops as it does in the app.
              </>
            ),
          },
          {
            term: "Theme switch",
            text: (
              <>
                <Mono>setThemeMode</Mono> (<Mono>global/theme.ts</Mono>) sets{" "}
                <Mono>data-theme-switching</Mono> on <Mono>&lt;html&gt;</Mono> for two frames, and{" "}
                <Mono>global.css</Mono> turns every transition off under it, or each colour would tween on its
                own clock. Only <Mono>data-theme-icon</Mono> is let through: the toggle&rsquo;s sun and moon
                cross-fade (250ms: opacity, scale and a 2px blur), and Segmented&rsquo;s thumb still slides.
              </>
            ),
          },
          {
            term: "Libraries",
            text: (
              <>
                framer-motion reaches a page only through <Mono>components/home/islands.tsx</Mono>{" "}
                (below-the-fold homepage sections, <Mono>LazyMotion</Mono> with <Mono>strict</Mono>), never the
                hero or the navigation, where its code would sit in front of the first paint. The one other
                library is border-beam&rsquo;s <Mono>BorderBeam</Mono> on the dashboard&rsquo;s search pill and
                panel (pinned at 1.4.1): off under reduced motion through <Mono>useReducedMotion</Mono>, and
                off on the pill while the panel is open. Don&rsquo;t add another.
              </>
            ),
          },
          {
            term: "Showpieces",
            text: (
              <>
                A few page-specific moments keep their own curves (some overshoot) and timings of up to about a
                second, in <Mono>global.css</Mono> or their own component: the phone menu&rsquo;s fold (
                <Mono>.makisu-*</Mono>), the 404 collage (<Mono>.nf-*</Mono>), the empty Saved view (
                <Mono>.saved-art-*</Mono>), the empty board (<Mono>.board-art-card</Mono>), Scattered&rsquo;s
                pop-in (<Mono>.scattered-in</Mono>), the onboarding folders (<Mono>.folder-*</Mono>), the Vision
                signature (<Mono>.signature</Mono>) and graph, the MCP page&rsquo;s flow illustration (
                <Mono>.mcp-flow-*</Mono>) and search reel (<Mono>.search-reel-*</Mono>), and the homepage
                demos. Each holds still under reduced motion. They&rsquo;re rare on purpose: never copy their
                timings onto a control, and don&rsquo;t add one unless the owner asks. Vendored code (
                <Mono>components/lifeline</Mono>, <Mono>components/ui</Mono>) keeps upstream&rsquo;s timings.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which easing? (walk it top to bottom)
 ├── Does it travel across a surface (a divider or a
 │   panel crossing its stage), even on a click?
 │    └── Yes → ease-in-out-quart, 400ms
 ├── A short hop inside one control (a thumb between
 │   its options) → ease-out-quint, 200ms
 ├── Entering, or answering a hover or a press
 │    → ease-out-quint (the default)
 ├── Leaving → ease-in-quart, shorter than the way in
 └── A constant drift (the sign-in wall, the footer
     strip) → linear`}
        />
        <Flow
          tree={`Should it move at all? (walk it top to bottom)
 ├── Arrow keys, or another key that repeats → no: snap
 ├── Reduced motion is on → no: jump, or keep only a fade
 ├── Already in place when the page loads → no
 ├── It travels across a surface (a divider or a
 │   panel crossing its stage) → yes, 400ms
 ├── A thumb hopping inside one control, or a hover,
 │   press, open or close → yes, 120–200ms
 └── It runs on its own (a loop) → only while on screen`}
        />
      </div>

      <SheetSection
        id="easing"
        title="Easing"
        description="Three tokens in @theme, each with its utility. Play them side by side: the default leaves fast and settles, the move brakes at both ends, the exit sets off slowly and leaves at speed."
      >
        <Sheet>
          {() => (
            <ReplayGroup label="Play the curves" note="Slowed to 600ms so the curve reads; in use they run 120 to 400ms.">
              <Matrix
                first="minmax(10rem,max-content)"
                template="3.5rem minmax(12rem,1fr) max-content minmax(16rem,1fr)"
                columns={["curve", "600ms", "value", "use"]}
                rows={CURVES.map((curve) => ({
                  label: curve.cls,
                  sub: curve.sub,
                  cells: [
                    <Curve key="c" points={curve.points} />,
                    <Track key="t" ease={curve.ease} ms={600} className="w-full" />,
                    <span key="v" className="flex flex-col gap-0.5">
                      <MonoStrong>{curve.token}</MonoStrong>
                      <Mono>cubic-bezier({curve.points.join(", ")})</Mono>
                    </span>,
                    <Use key="u">{curve.use}</Use>,
                  ],
                }))}
              />
            </ReplayGroup>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="durations"
        title="Durations"
        description="What each kind of motion takes, in real time. The bars are drawn to one scale, 400ms across, so an exit visibly finishes before the entrance it answers."
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <ReplayGroup label="Play the durations" note="Real time. Hover and press the buttons to feel the first two.">
                <Matrix
                  first="minmax(9rem,max-content)"
                  template="max-content minmax(10rem,1fr) max-content minmax(18rem,1.4fr)"
                  columns={["duration", "to scale", "easing", "for"]}
                  rows={DURATIONS.map((row) => ({
                    label: row.kind,
                    sub: row.sub,
                    cells: [
                      <MonoStrong key="d">{row.time}</MonoStrong>,
                      row.track ? (
                        <Track key="t" ease={row.track.ease} ms={row.track.ms} className={row.track.width} />
                      ) : (
                        <Mono key="t">while on screen</Mono>
                      ),
                      typeof row.easing === "string" ? (
                        <Mono key="e">{row.easing}</Mono>
                      ) : (
                        <Fragment key="e">{row.easing}</Fragment>
                      ),
                      <Fragment key="u">{row.use}</Fragment>,
                    ],
                  }))}
                />
              </ReplayGroup>
            )}
          </Sheet>
          <Code
            correct={`// A hover: name the colours, 150ms, the default curve
<Link className="text-secondary-foreground transition-colors duration-150 ease-out-quint hover:text-primary-foreground">

// A press: Button already presses in (0.97, 150ms, only with motion allowed)
<Button variant="secondary">Copy example link</Button>

// A control that can't be a Button: the same press, behind motion-safe
<button className="transition-[background-color,scale] duration-150 ease-out-quint hover:bg-transparent-hover motion-safe:active:scale-[0.97]">`}
            incorrect={{
              why: "no ease class, so Tailwind's default curve; 0.96, and it scales under reduced motion",
              code: `// The pattern in most hand-made dashboard presses today
<button className="transition-[background-color,scale] duration-150 hover:bg-base-100 active:scale-[0.96]">`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="keyframes"
        title="Keyframes"
        description="The shared keyframes in @theme. The entrances declare only a from and the exits only a to, so they run from or to wherever the element rests. Play them with an arbitrary animate class, which sets the time and the curve."
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <Matrix
                first="minmax(8rem,max-content)"
                template="minmax(10rem,max-content) max-content minmax(14rem,1fr) 15rem"
                columns={["moves", "timing", "for", "try it"]}
                rows={KEYFRAMES.map((row) => ({
                  label: row.label,
                  cells: [
                    <Mono key="m">{row.moves}</Mono>,
                    <span key="t" className="flex flex-col gap-0.5">
                      {row.timing.map((line) => (
                        <Mono key={line}>{line}</Mono>
                      ))}
                    </span>,
                    <Use key="u">{row.use}</Use>,
                    <span key="d">{row.demo}</span>,
                  ],
                }))}
              />
            )}
          </Sheet>
          <Code
            correct={`// Anything that leaves on its own (a toast): usePresence, given the exit's length
const toast = usePresence(open, 120);

{toast.mounted && (
  <p
    className={cx(
      "motion-reduce:animate-none",
      toast.closing
        ? "pointer-events-none animate-[toast-out_120ms_var(--ease-in-quart)_forwards]"
        : "animate-[toast-in_180ms_var(--ease-out-quint)]",
    )}
  >`}
            incorrect={{
              why: "no exit, ease-in on the way in, moves under reduced motion",
              code: `{open && <div className="animate-[menu-in_300ms_ease-in]">…</div>}`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="hooks"
        title="Hooks"
        description={
          <>
            In <Mono>src/lib/motion.ts</Mono>: CSS transitions driven from React, so no animation library comes
            along. Menus and popovers take <Mono>usePopover</Mono> (<Mono>dashboard/usePopover.ts</Mono>), which
            holds them with usePresence and lights their rows with useGlide; segmented controls take{" "}
            <Mono>Segmented</Mono>, which slides its thumb with useThumb. Reach for a hook directly only for
            something neither covers.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <HookCard
                  name="useThumb(value)"
                  demo={<Segmented aria-label="Tile size" options={TILE_SIZES} defaultValue="medium" />}
                  spec={[
                    "200ms ease-out-quint",
                    "translate, width, height",
                    "snaps: first measure, resize, keys",
                    "until measured: the option's own fill",
                  ]}
                >
                  A selection that slides between options. Click to watch it slide; use the arrow keys and it
                  snaps.
                </HookCard>
                <HookCard
                  name="useGlide()"
                  demo={<GlideList />}
                  spec={[
                    "150ms ease-out-quint",
                    "translate, height, opacity",
                    "mouse only: touch keeps the press",
                    "reduced motion: the fade alone",
                  ]}
                >
                  One hover highlight that glides between rows. Point with a mouse; tab through and the focus
                  fill is instant.
                </HookCard>
                <HookCard
                  name="usePresence(open, exitMs)"
                  popover
                  demo={<PresenceMenu />}
                  spec={[
                    "menu-in 150ms, menu-out 120ms",
                    "inert while leaving: usePopover adds it",
                    "alone: add pointer-events-none (and inert if focusable)",
                    "reduced motion: unmounts at once",
                  ]}
                >
                  Keeps a menu mounted while its exit plays, so it leaves rather than vanishing. Open it, then
                  pick, press Escape or click away.
                </HookCard>
                <HookCard
                  name="useReducedMotion()"
                  demo={<ReducedMotionValue />}
                  spec={["false while rendering on the server", "follows the setting live"]}
                >
                  For motion CSS can&rsquo;t reach: a timer, a requestAnimationFrame loop, a library&rsquo;s
                  prop (the search beam&rsquo;s active).
                </HookCard>
              </div>
            )}
          </Sheet>
          <Code
            correct={`// A few short, exclusive values: Segmented, which slides its thumb with useThumb
<Segmented aria-label="Tile size" options={SIZES} value={size} onValueChange={setSize} />

// A menu: usePopover holds it with usePresence and sets both keyframes in popover.motion
const popover = usePopover("menu");

<div {...popover.rootProps} className="relative">
  <Button aria-haspopup="menu" {...popover.triggerProps}>Sort</Button>
  {popover.mounted && (
    <div
      {...popover.contentProps}
      role="menu"
      className={cx("absolute left-0 mt-2 origin-top-left rounded-xl bg-modal p-1 shadow-lg", popover.motion)}
    >`}
            incorrect={{
              why: "left through transition-all, and a slide per key",
              code: `// A hand-made thumb: left and width relayout every frame, and held arrows queue slides
<span className="absolute transition-all duration-300" style={{ left: x, width: w }} />`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="dialog"
        title="Dialog"
        description={
          <>
            A native <Mono>&lt;dialog&gt;</Mono> on the shared <Mono>.dialog-motion</Mono> class (
            <Mono>global.css</Mono>). Open it with <Mono>showModal()</Mono>, so focus stays inside, Escape closes
            it and focus returns to the opener. It stays mounted, so <Mono>close()</Mono> plays the exit.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="grid items-start gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10">
                <DialogDemo />
                <Matrix
                  first="6rem"
                  template="max-content max-content minmax(16rem,1fr)"
                  columns={["time", "easing", "how"]}
                  rows={[
                    {
                      label: "open",
                      cells: [
                        <Mono key="t">200ms</Mono>,
                        <Mono key="e">ease-out-quint</Mono>,
                        <Use key="h">
                          Opacity, and scale from 0.97, through <Mono>@starting-style</Mono>. The backdrop fades with it.
                        </Use>,
                      ],
                    },
                    {
                      label: "close",
                      cells: [
                        <Mono key="t">140ms</Mono>,
                        <Mono key="e">ease-in-quart</Mono>,
                        <Use key="h">
                          Kept in the top layer while it plays (<Mono>overlay</Mono> and <Mono>display</Mono>,{" "}
                          <Mono>allow-discrete</Mono>). Firefox closes it at once, which is fine.
                        </Use>,
                      ],
                    },
                    {
                      label: "reduced",
                      cells: [
                        <Mono key="t">0ms</Mono>,
                        <Mono key="e">none</Mono>,
                        <Use key="h">Appears and goes at once.</Use>,
                      ],
                    },
                  ]}
                />
              </div>
            )}
          </Sheet>
          <Code
            correct={`const ref = useRef<HTMLDialogElement>(null);

<Button onClick={() => ref.current?.showModal()}>New board</Button>
<dialog
  ref={ref}
  className="dialog-motion m-auto max-w-md rounded-2xl border-0 bg-modal p-0 text-primary-foreground shadow-xl backdrop:bg-black/40"
>
  …
  <Button onClick={() => ref.current?.close()}>Close</Button>
</dialog>`}
            incorrect={{
              why: "unmounted on close, so it can't leave, and not modal",
              code: `{open && <dialog open className="dialog-motion">…</dialog>}`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
