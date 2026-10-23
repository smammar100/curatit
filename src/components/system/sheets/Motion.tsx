// /system/motion: the three spring tiers in src/lib/springs.ts, the 80ms colour transitions, the
// fluid hover highlight and the weight shift the shared components run on since 2026-10-23
// (Fluid Functionalism, on motion/react), then the site's older CSS set: the easing tokens, the
// durations and the keyframes in src/styles/global.css and the hooks in src/lib/motion.ts, which
// the dashboard, the Toast's presence and the homepage demos still use. The demos are client
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
import { spring } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";

// The three tiers, read from src/lib/springs.ts so the numbers here can't drift from the code
const TIERS: { name: keyof typeof spring; sub: string; use: ReactNode; demo?: ReactNode }[] = [
  {
    name: "fast",
    sub: "Answers the pointer",
    use: (
      <Use>
        The hover pill in Tabs, Segmented and Menu (the fluid hover highlight), a Tooltip (with a 4px slide after
        a 200ms delay), a Menu opening from its trigger&rsquo;s side, the Checkbox&rsquo;s check (its path draws in
        80ms and retracts in 40ms), the focus ring travelling between tabs.
      </Use>
    ),
  },
  {
    name: "moderate",
    sub: "Settles exactly",
    use: (
      <Use>
        Critically damped, so a panel lands with no overshoot: the selected pill in Segmented and Tabs, the Switch&rsquo;s
        thumb (dragged or tapped), the Toast rising 8px from 0.97, a Menu&rsquo;s travelling selected fill and the merge
        and split of its checked rows, a Notice opening its row.
      </Use>
    ),
    demo: <Segmented aria-label="Tile size" options={TILE_SIZES()} defaultValue="medium" />,
  },
  {
    name: "slow",
    sub: "A little bounce",
    use: (
      <Use>
        The Dialog (scale from 0.97 and a fade, its overlay fading with it) and a Notice growing into its row. The one
        tier with bounce, 0.12, so the biggest arrivals read as arrivals.
      </Use>
    ),
  },
];

function TILE_SIZES() {
  return [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];
}

// The three curves of the older CSS set, as @theme declares them (--ease-*) and as their
// utilities read
const CURVES: { cls: string; token: string; points: [number, number, number, number]; ease: Ease; sub: string; use: string }[] = [
  {
    cls: "ease-out-quint",
    token: "--ease-out-quint",
    points: [0.23, 1, 0.32, 1],
    ease: "out-quint",
    sub: "The CSS default",
    use: "Anything entering or answering a person in CSS: the dashboard's menus and toast, a Card title's hover, the homepage demos. It starts fast, so the response feels instant.",
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
    sub: "CSS exits only",
    use: "Something leaving through a keyframe, and always shorter than the way in. On an entrance its slow start reads as lag.",
  },
];

/** The curve drawn on a 48px square, with linear as a dashed diagonal to compare against */
function Curve({ points: [x1, y1, x2, y2] }: { points: [number, number, number, number] }) {
  const s = 48;
  const d = `M0 ${s} C${x1 * s} ${s - y1 * s} ${x2 * s} ${s - y2 * s} ${s} 0`;
  return (
    <svg viewBox={`0 0 ${s} ${s}`} aria-hidden="true" className="size-12 overflow-visible">
      <rect x="0" y="0" width={s} height={s} rx="2" className="fill-none stroke-border" />
      <path d={`M0 ${s} L${s} 0`} strokeDasharray="2 3" className="fill-none stroke-border" />
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
    kind: "colour",
    sub: "colour, background, box-shadow, stroke",
    time: "80ms",
    easing: "Tailwind's default",
    use: (
      <span className="flex flex-wrap items-center gap-3">
        <span className="text-body-sm text-secondary-foreground">
          Every shared component: <Mono>transition-colors duration-80</Mono>. Button, Input, TextLink, Switch, the
          tabs, menu rows and the Card.
        </span>
        <Button variant="muted" size="xs">
          Hover me
        </Button>
      </span>
    ),
  },
  {
    kind: "press",
    sub: "a 1px collapse, no scale",
    time: "80ms",
    easing: "Tailwind's default",
    use: (
      <span className="flex flex-wrap items-center gap-3">
        <span className="text-body-sm text-secondary-foreground">
          Button&rsquo;s surface sits 1px inside a same-colour shadow spread; a press takes the spread away, so the
          button shrinks 1px a side at any width (a scale would warp a wide one).
        </span>
        <Button size="xs">Press and hold</Button>
      </span>
    ),
  },
  {
    kind: "hover (older)",
    sub: "colour, background, shadow in CSS",
    time: "150ms",
    easing: "ease-out-quint",
    track: { ease: "out-quint", ms: 150, width: "w-[37.5%]" },
    use: <Use>Links, rows and chips on the dashboard and the marketing pages, a Card title&rsquo;s hover. New components use 80ms.</Use>,
  },
  {
    kind: "enter (older)",
    sub: "opacity with a scale or a rise",
    time: "150–200ms",
    easing: "ease-out-quint",
    track: { ease: "out-quint", ms: 200, width: "w-1/2" },
    use: <Use>The dashboard&rsquo;s menus and search panel 150ms, an FAQ answer 200ms, the native dialog recipe 200ms.</Use>,
  },
  {
    kind: "exit (older)",
    sub: "the same, quieter",
    time: "120–140ms",
    easing: "ease-in-quart",
    track: { ease: "in-quart", ms: 140, width: "w-[35%]" },
    use: <Use>The dashboard&rsquo;s menus 120ms, the native dialog recipe 140ms. Always shorter than the entrance.</Use>,
  },
  {
    kind: "move",
    sub: "across a surface",
    time: "400ms",
    easing: "ease-in-out-quart",
    track: { ease: "in-out-quart", ms: 400, width: "w-full" },
    use: (
      <Use>
        A divider or a panel travelling across its stage, even when a click starts it: the homepage divider glides
        on this. A pill between options is a short hop inside one control, so it&rsquo;s a response: spring.moderate.
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
        The dashboard skeleton&rsquo;s shimmer 1.6s (the shared Skeleton pulses instead, the library&rsquo;s{" "}
        <Mono>animate-pulse</Mono>), the footer strip 60s, the sign-in wall 70 to 94s a column and the footer
        mark&rsquo;s turn 180s. A loop in script runs only while it&rsquo;s on screen and the tab is visible.
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

// The shared keyframes in @theme, with the timings the code plays them at and who still does
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
        The dashboard&rsquo;s own menus and search panel: <Mono>usePopover</Mono> sets both. The shared Menu left them
        for spring.fast on 2026-10-23.
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
    use: "Nothing shared since 2026-10-23: the Toast rises on spring.moderate now. The keyframes stay in @theme for the dashboard's older toast markup.",
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
    use: "The dim behind the dashboard's search panel (it keeps the panel's timing, so the two move as one) and the phone menu's dimmer.",
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
        The dashboard&rsquo;s loading blocks: <Mono>animate-shimmer</Mono> in <Mono>dashboard/Skeleton</Mono>. The
        shared Skeleton atom pulses instead (<Mono>bg-hover animate-pulse</Mono>, the library&rsquo;s). It loops
        here as in the app, and holds still under reduced motion.
      </>
    ),
    demo: <Block className="h-8 w-40 rounded-[20px]" />,
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
    <div className="flex min-w-0 flex-col rounded-[24px] bg-card p-5">
      <h4 className="font-mono text-caption-lg text-primary-foreground">{name}</h4>
      <p className="mt-1.5 text-body-sm text-secondary-foreground">{children}</p>
      {/* The same height in every card once they sit side by side, so the specs line up */}
      <div className={cx("mt-5 flex items-start", popover ? "min-h-44" : "sm:min-h-44")}>{demo}</div>
      <ul className="mt-auto flex flex-col gap-1.5 border-t border-border pt-4 text-caption-lg">
        {spec.map((line) => (
          <li key={line}>
            <Mono>{line}</Mono>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A label that changes weight without changing width: an invisible semibold copy holds the
 *  column, and the visible copy sits on it. Held static here (the middle one selected) */
function WeightRow() {
  const tabs = ["For you", "Discover", "Saved"];
  return (
    <span className="flex items-center gap-4 text-body-sm">
      {tabs.map((label, i) => (
        <span key={label} className="inline-grid whitespace-nowrap">
          <span aria-hidden="true" className="invisible col-start-1 row-start-1" style={{ fontVariationSettings: fontWeights.semibold }}>
            {label}
          </span>
          <span
            className={cx("col-start-1 row-start-1", i === 1 ? "text-primary-foreground" : "text-secondary-foreground")}
            style={{ fontVariationSettings: i === 1 ? fontWeights.semibold : fontWeights.normal }}
          >
            {label}
          </span>
        </span>
      ))}
    </span>
  );
}

export default function Motion() {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-6">
        <SheetHeader title="Motion">
          Motion here is feedback: it says a press landed, where a menu came from and where a selection
          went. Since 2026-10-23 the shared components move on Fluid Functionalism&rsquo;s three springs
          (motion/react), with colours tweening in 80ms; the dashboard, the homepage demos and the Toast&rsquo;s
          presence still run on the site&rsquo;s older CSS set, kept at the foot of this sheet.
        </SheetHeader>
        {/* Shown by CSS alone, so it's in place before any script runs and nothing below it shifts */}
        <p className="hidden max-w-3xl rounded-[24px] bg-card px-4 py-3 text-body-sm text-secondary-foreground motion-reduce:block">
          Reduced motion is on, so these demos do what the site does for you: nothing travels, fades stay, the
          dots jump to the end of their tracks, and menus and the dialog appear and go at once. Turn it off in
          your system settings to watch them run.
        </p>
      </div>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                The component: Menu, Tabs, Segmented, Switch, Dialog, Tooltip, Toast and Notice carry their springs.
                Inside a new shared component, a tier from <Mono>src/lib/springs.ts</Mono> on a <Mono>motion</Mono>{" "}
                element (<Mono>motion/react</Mono>), and <Mono>transition-colors duration-80</Mono> for colour. In a
                page or a feature, CSS: a transition for a state a person can reverse, a keyframe from{" "}
                <Mono>global.css</Mono> for a one-off entrance or exit, the hooks in <Mono>src/lib/motion.ts</Mono> when
                React has to drive it.
              </>
            ),
          },
          {
            term: "Tiers",
            text: (
              <>
                Three springs, no custom curves: <Mono>spring.fast</Mono> (0.08s) answers the pointer,{" "}
                <Mono>spring.moderate</Mono> (0.16s, critically damped) settles a selection or a panel exactly,{" "}
                <Mono>spring.slow</Mono> (0.24s, bounce 0.12) brings in a dialog. Each has an <Mono>.exit</Mono> tween
                one tier quicker (0.06 / 0.12 / 0.16s), and <Mono>exitFallbackMs()</Mono> gives a timer that unmounts
                a portal if a throttled tab stalls the exit.
              </>
            ),
          },
          {
            term: "Colour",
            text: (
              <>
                80ms, always: <Mono>transition-colors duration-80</Mono> (or the named properties:{" "}
                <Mono>transition-[color,stroke-width] duration-80</Mono> on a tab&rsquo;s icon). Long enough that a
                hover doesn&rsquo;t flicker, short enough that a press feels like a press. The older CSS hovers run 150ms
                on <Mono>ease-out-quint</Mono>; don&rsquo;t bring that to a shared component.
              </>
            ),
          },
          {
            term: "Hover",
            text: (
              <>
                One highlight per list, not one per row: <Mono>useFluidHover(ref)</Mono> (<Mono>src/hooks</Mono>)
                measures the rows and picks the one nearest the pointer, <Mono>FluidHoverHighlight</Mono> springs a{" "}
                <Mono>bg-hover</Mono> fill between them on <Mono>spring.fast</Mono>, fading in at the row the pointer
                enters (no slide from a stale row) and out where it leaves. The keyboard sets the same index, so arrow
                keys light the row the pointer would, and a click in the gap between rows lands on the highlighted one
                (<Mono>gapClick</Mono>, on by default). Menu, Tabs and Segmented use it.
              </>
            ),
          },
          {
            term: "Weight",
            text: (
              <>
                A selected tab or a checked row gets heavier without moving its neighbours: the label is{" "}
                <Mono>fontVariationSettings</Mono> (<Mono>fontWeights.semibold</Mono>, <Mono>src/lib/font-weight.ts</Mono>)
                tweened over 80ms, and an invisible semibold copy of it in the same grid cell holds the width from the
                start. Never <Mono>font-medium</Mono> on hover or selection: it reflows the line.
              </>
            ),
          },
          {
            term: "Properties",
            text: (
              <>
                Movement and size change through transform (<Mono>x</Mono>, <Mono>y</Mono>, <Mono>scale</Mono>) and{" "}
                <Mono>opacity</Mono>, because they skip layout. Colour, background, shadow and stroke may tween. The
                exceptions, each for a reason: the hover highlight&rsquo;s width and height (it&rsquo;s absolutely
                positioned, so nothing lays out around it, and scaling would stretch its corners); the Switch
                thumb&rsquo;s stretch on hover and squash on press (inside a fixed track); animated corner radii in the
                merge and split of checked rows; the Checkbox&rsquo;s <Mono>pathLength</Mono>; the homepage
                divider&rsquo;s <Mono>clip-path</Mono> reveal; and <Mono>filter</Mono> for the theme icon&rsquo;s blur.
              </>
            ),
          },
          {
            term: "Transitions",
            text: (
              <>
                Name what changes: <Mono>transition-colors</Mono>, <Mono>transition-[background-color,box-shadow]</Mono>.
                Never <Mono>transition-all</Mono>, and not a bare <Mono>transition</Mono> either (it covers colours,
                shadows, transforms and filters at once), or a padding or shadow change starts tweening by accident.
              </>
            ),
          },
          {
            term: "Exits",
            text: (
              <>
                Shorter than their entrance and a plain tween, not a spring: <Mono>spring.fast.exit</Mono> 0.06s,{" "}
                <Mono>spring.moderate.exit</Mono> 0.12s, <Mono>spring.slow.exit</Mono> 0.16s (the CSS set: 120 to 140ms on{" "}
                <Mono>ease-in-quart</Mono>). The person has already moved on. A portal stays mounted until the exit
                finishes (<Mono>onAnimationComplete</Mono>), with <Mono>exitFallbackMs()</Mono> as the guard.
              </>
            ),
          },
          {
            term: "Keyboard",
            text: (
              <>
                Nothing animates on a key that repeats. A focused row lights the hover highlight through{" "}
                <Mono>setActiveIndex</Mono>, and the next pointer session fades in fresh rather than sliding from it;
                Tabs activate manually (arrows move focus, Enter or Space picks); focus styles are instant; the older{" "}
                <Mono>useThumb</Mono> snaps on arrows.
              </>
            ),
          },
          {
            term: "Reduced motion",
            text: (
              <>
                Transforms drop, fades stay. Every animating molecule wraps itself in{" "}
                <Mono>{`<MotionConfig reducedMotion="user">`}</Mono> (there is none at the root, which keeps{" "}
                <Mono>motion/react</Mono> out of the hero&rsquo;s path), so motion/react replaces travel with a fade
                when the system asks. The hover highlight keeps its 0.08s fade and drops the slide; the Toast fades
                without rising; the Dialog appears without scaling. CSS adds the <Mono>motion-reduce:</Mono> path in
                the same change; when the animation sits under another variant (<Mono>group-open:</Mono>), put it
                behind <Mono>motion-safe:</Mono> instead, because <Mono>motion-reduce:animate-none</Mono> loses to the
                more specific selector.
              </>
            ),
          },
          {
            term: "Loops",
            text: (
              <>
                A loop in script (a timer, <Mono>requestAnimationFrame</Mono>) runs only while it&rsquo;s on
                screen and the tab is visible, through <Mono>IntersectionObserver</Mono> and{" "}
                <Mono>visibilitychange</Mono>, and stops when the visitor points at it or takes over. The Spinner
                (the library&rsquo;s figure-eight: <Mono>spinner-move</Mono> and <Mono>spinner-dash</Mono>) and the
                Skeleton&rsquo;s pulse are the only loops in a shared component.
              </>
            ),
          },
          {
            term: "On load",
            text: (
              <>
                Nothing in product UI animates because the page opened: what&rsquo;s already in place stays
                put (the Switch thumb and the Tabs&rsquo; pill mount at their position: <Mono>initial={"{false}"}</Mono> or a
                zero transition on the first render). The
                showpieces that play once on arrival (the 404 collage, the empty Saved view and board, Scattered) are
                the exceptions. Every demo on this sheet with a button waits for it; the skeleton under Keyframes
                loops as it does in the app.
              </>
            ),
          },
          {
            term: "Theme switch",
            text: (
              <>
                <Mono>setThemeMode</Mono> (<Mono>global/theme.ts</Mono>) sets{" "}
                <Mono>data-theme-switching</Mono> on <Mono>&lt;html&gt;</Mono> for two frames, and{" "}
                <Mono>global.css</Mono> turns every CSS transition off under it, or each colour would tween on its
                own clock. Only <Mono>data-theme-icon</Mono> is let through: the toggle&rsquo;s sun and moon
                cross-fade (250ms: opacity, scale and a 2px blur).
              </>
            ),
          },
          {
            term: "Libraries",
            text: (
              <>
                <Mono>motion/react</Mono> arrives with the component that needs it, never at the root. The homepage&rsquo;s
                below-the-fold sections still load framer-motion through <Mono>components/home/islands.tsx</Mono>{" "}
                (<Mono>MotionProvider</Mono>, a <Mono>LazyMotion</Mono> that is no longer <Mono>strict</Mono> since the
                design system&rsquo;s components render inside it), never the hero or the navigation. The one other
                library is border-beam&rsquo;s <Mono>BorderBeam</Mono> on the dashboard&rsquo;s search pill and panel
                (pinned at 1.4.1): off under reduced motion and while the page scrolls. Don&rsquo;t add another.
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
          tree={`Which tier? (inside a shared component)
 ├── It follows the pointer: a hover pill, a tooltip,
 │   a menu opening, a focus ring → spring.fast
 ├── It settles somewhere exact: a selection pill, a
 │   switch thumb, a toast, a selected fill → spring.moderate
 ├── It takes the screen: a dialog, a notice growing in
 │    → spring.slow
 ├── A colour, a background, a shadow → duration-80, no spring
 └── Leaving → the tier's .exit (a tween, one tier quicker)`}
        />
        <Flow
          tree={`Should it move at all? (walk it top to bottom)
 ├── Arrow keys, or another key that repeats → no: snap
 ├── Reduced motion is on → no travel: keep only a fade
 ├── Already in place when the page loads → no
 ├── It travels across a surface (a divider or a
 │   panel crossing its stage) → yes, 400ms in CSS
 ├── A pill, a thumb, a hover, a press, an open or a
 │   close → yes, one spring tier
 └── It runs on its own (a loop) → only while on screen`}
        />
      </div>

      <SheetSection
        id="springs"
        title="Springs"
        description="Three tiers in src/lib/springs.ts, each a spring with a duration and a bounce, and an exit that is a plain tween one tier quicker. The numbers below are read from the file. Click the segmented control to watch the moderate tier: the pill settles with no overshoot, the hover pill under the pointer runs on fast."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              template="repeat(3,minmax(5rem,max-content)) minmax(18rem,1.4fr)"
              align="start"
              columns={["duration", "bounce", "exit", "used by"]}
              rows={TIERS.map((tier) => {
                const t = spring[tier.name];
                return {
                  label: `spring.${tier.name}`,
                  sub: tier.sub,
                  cells: [
                    <MonoStrong key="d">{t.duration}s</MonoStrong>,
                    <Mono key="b">{t.bounce}</Mono>,
                    <Mono key="e">{t.exit.duration}s tween</Mono>,
                    <span key="u" className="flex flex-col gap-3">
                      {tier.use}
                      {tier.demo}
                    </span>,
                  ],
                };
              })}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`import { AnimatePresence, motion } from "motion/react";
import { spring } from "@/lib/springs";

// A panel that opens from its trigger and leaves on the tier's exit tween
<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, transition: spring.fast.exit }}
      transition={spring.fast}
    />
  )}
</AnimatePresence>`}
            incorrect={{
              why: "a custom curve and time, and a spring on the way out",
              code: `<motion.div
  transition={{ duration: 0.3, ease: "easeInOut" }}
  exit={{ opacity: 0, transition: { type: "spring", duration: 0.3 } }}
/>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="hover"
        title="The fluid hover highlight"
        description="One fill per list that glides to the row nearest the pointer. The hook measures the rows (and re-measures on resize), the highlight springs between the measured rects on spring.fast, and it fades in where the pointer enters rather than sliding over from where it last was. The live ones are on the Overlays sheet (Menu) and the Navigation sheet (Tabs)."
      >
        <Code
          correct={`import { useFluidHover } from "@/hooks/use-fluid-hover";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";

const ref = useRef<HTMLDivElement>(null);
const hover = useFluidHover(ref);           // axis "y" by default; "x" for a strip, "xy" for a grid
const shape = useShape();

<div ref={ref} {...hover.handlers} className="relative">
  <FluidHoverHighlight hover={hover} className={shape.bg} />
  {items.map((item, i) => (
    <button key={item} onFocus={() => hover.setActiveIndex(i)} className="relative">
      {item}
    </button>
  ))}
</div>`}
          incorrect={{
            why: "a hover fill per row: each one fades on its own, and a gap click hits nothing",
            code: `{items.map((item) => (
  <button className="rounded-[20px] transition-colors hover:bg-hover">{item}</button>
))}`,
          }}
        />
      </SheetSection>

      <SheetSection
        id="weight"
        title="Weight without reflow"
        description="A selected tab is semibold; its neighbours don't shift because an invisible semibold copy held the width from the start. The weight is a variable-font setting tweened in 80ms, not a class. The middle label here is held selected."
      >
        <Sheet>
          {() => (
            <div className="flex flex-col gap-5">
              <WeightRow />
              <Matrix
                first="minmax(9rem,max-content)"
                template="minmax(12rem,max-content) minmax(16rem,1fr)"
                columns={["fontVariationSettings", "for"]}
                rows={(["normal", "semibold", "bold"] as const).map((w) => ({
                  label: `fontWeights.${w}`,
                  cells: [
                    <code key="v" className="font-mono text-caption-lg text-primary-foreground" style={{ fontVariationSettings: fontWeights[w] }}>
                      {fontWeights[w]}
                    </code>,
                    <Use key="u">
                      {w === "normal" && "Labels at rest, the tooltip, an unselected tab."}
                      {w === "semibold" && "A selected tab, a checked menu row, a card or an empty state's title, Avatar initials, a dialog's title."}
                      {w === "bold" && "Reserved; nothing uses it yet."}
                    </Use>,
                  ],
                }))}
              />
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`import { fontWeights } from "@/lib/font-weight";

<span className="inline-grid whitespace-nowrap">
  {/* Invisible semibold copy: reserves the width up front */}
  <span aria-hidden="true" className="invisible col-start-1 row-start-1" style={{ fontVariationSettings: fontWeights.semibold }}>
    {label}
  </span>
  <span
    className="col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80"
    style={{ fontVariationSettings: selected ? fontWeights.semibold : fontWeights.normal }}
  >
    {label}
  </span>
</span>`}
            incorrect={{
              why: "a weight class on selection: the label widens and the row reflows",
              code: `<span className={selected ? "font-medium" : "font-normal"}>{label}</span>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="easing"
        title="The older set: easing"
        description="Three tokens in @theme, each with its utility, for CSS transitions and keyframes outside the shared components: the dashboard, the marketing pages and the homepage demos. Play them side by side: the default leaves fast and settles, the move brakes at both ends, the exit sets off slowly and leaves at speed."
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
        description="What each kind of motion takes, in real time: the shared components' 80ms first, then the CSS set the dashboard and the pages still run on. The bars are drawn to one scale, 400ms across, so an exit visibly finishes before the entrance it answers."
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
                        <Mono key="t">{row.kind === "loop" ? "while on screen" : "too short to draw"}</Mono>
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
            correct={`// A colour change in a shared component: 80ms, named properties
<button className="text-muted-foreground transition-colors duration-80 hover:text-foreground">

// A press: Button already collapses 1px a side; nothing to add
<Button variant="secondary">Copy example link</Button>

// A hover on a page, in the older CSS set: 150ms on the default curve
<Link className="text-secondary-foreground transition-colors duration-150 ease-out-quint hover:text-primary-foreground">`}
            incorrect={{
              why: "no ease class on a 150ms CSS hover, and a scale press that runs under reduced motion",
              code: `// The pattern in most hand-made dashboard presses today
<button className="transition-[background-color,scale] duration-150 hover:bg-base-100 active:scale-[0.96]">`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="keyframes"
        title="Keyframes"
        description="The shared keyframes in @theme, for the dashboard and the pages. The entrances declare only a from and the exits only a to, so they run from or to wherever the element rests. Play them with an arbitrary animate class, which sets the time and the curve."
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
            correct={`// Anything in CSS that leaves on its own: usePresence, given the exit's length
const panel = usePresence(open, 120);

{panel.mounted && (
  <div
    className={cx(
      "motion-reduce:animate-none",
      panel.closing
        ? "pointer-events-none animate-[menu-out_120ms_var(--ease-in-quart)_forwards]"
        : "animate-[menu-in_150ms_var(--ease-out-quint)]",
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
        title="The older hooks"
        description={
          <>
            In <Mono>src/lib/motion.ts</Mono>: CSS transitions driven from React, written on 2026-10-18 after Fluid
            Functionalism&rsquo;s sliding selection and fluid hover, before the library itself came in. They stay for
            what still runs on them: the dashboard&rsquo;s menus and search panel (<Mono>usePopover</Mono> holds them
            with usePresence and lights their rows with useGlide), the Toast&rsquo;s presence (usePresence keeps it
            mounted for its exit tween), and <Mono>useReducedMotion</Mono> wherever CSS can&rsquo;t ask (the Checkbox,
            the MCP page&rsquo;s search reel, the search panel&rsquo;s beam). A new shared component uses the springs
            above instead.
          </>
        }
      >
        <div className="flex flex-col gap-8">
          <Sheet>
            {() => (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <HookCard
                  name="useThumb(value)"
                  demo={<Segmented aria-label="Tile size" options={TILE_SIZES()} defaultValue="medium" />}
                  spec={[
                    "200ms ease-out-quint",
                    "translate, width, height",
                    "snaps: first measure, resize, keys",
                    "no shared component uses it now",
                  ]}
                >
                  A selection that slides between options in CSS. Nothing shared uses it since 2026-10-23: the
                  Segmented shown here moves its pill on spring.moderate (the library&rsquo;s tabs). The hook stays for
                  a feature that wants a thumb without motion/react.
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
                  One hover highlight that glides between rows, the fluid hover without its gap clicks. The
                  dashboard&rsquo;s menus still run on it through usePopover; the shared Menu uses useFluidHover.
                  Point with a mouse; tab through and the focus fill is instant.
                </HookCard>
                <HookCard
                  name="usePresence(open, exitMs)"
                  popover
                  demo={<PresenceMenu />}
                  spec={[
                    "menu-in 150ms, menu-out 120ms",
                    "the Toast: spring.moderate.exit, 120ms",
                    "alone: add pointer-events-none (and inert if focusable)",
                    "reduced motion: unmounts at once",
                  ]}
                >
                  Keeps an element mounted while its exit plays, so it leaves rather than vanishing. The Toast and
                  the dashboard&rsquo;s popovers use it. Open this one, then pick, press Escape or click away.
                </HookCard>
                <HookCard
                  name="useReducedMotion()"
                  demo={<ReducedMotionValue />}
                  spec={["false while rendering on the server", "follows the setting live"]}
                >
                  For motion CSS can&rsquo;t reach: a timer, a requestAnimationFrame loop, a library&rsquo;s
                  prop (the search beam&rsquo;s active). Inside a motion/react component, the library&rsquo;s own{" "}
                  <Mono>useReducedMotion</Mono> and <Mono>MotionConfig</Mono> do this.
                </HookCard>
              </div>
            )}
          </Sheet>
          <Code
            correct={`// A dashboard menu: usePopover holds it with usePresence and sets both keyframes in popover.motion
const popover = usePopover("menu");

<div {...popover.rootProps} className="relative">
  <Button aria-haspopup="menu" {...popover.triggerProps}>Sort</Button>
  {popover.mounted && (
    <div
      {...popover.contentProps}
      role="menu"
      className={cx("absolute left-0 mt-2 origin-top-left rounded-[24px] bg-modal p-1 shadow-lg", popover.motion)}
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
        title="The native dialog recipe"
        description={
          <>
            A native <Mono>&lt;dialog&gt;</Mono> on the shared <Mono>.dialog-motion</Mono> class (<Mono>global.css</Mono>):
            open it with <Mono>showModal()</Mono>, so focus stays inside, Escape closes it and focus returns to the
            opener; it stays mounted, so <Mono>close()</Mono> plays the exit. The Dialog molecule left this for Radix
            and <Mono>spring.slow</Mono> on 2026-10-23 and no shared component uses the class now; it stays for a
            feature that needs a dialog without motion/react.
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
            correct={`// The shared Dialog: Radix, Elevated +4, spring.slow in and its exit tween out
<Dialog open={open} onOpenChange={setOpen} title="New board" size="sm">…</Dialog>

// Without motion/react: the native recipe
const ref = useRef<HTMLDialogElement>(null);
<dialog ref={ref} className="dialog-motion m-auto max-w-md rounded-[24px] border-0 bg-surface-5 p-0 text-primary-foreground shadow-surface-5 backdrop:bg-black/40">`}
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
