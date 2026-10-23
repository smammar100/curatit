// /system/button: every variant, size, state and slot of fundations/elements/Button.tsx, live in
// both themes. The demos that need state (loading, the switch, the menu) are client components in
// ../demos/ButtonDemos.tsx; the sheet itself stays a server component. Every class is written out
// in full, never built from parts, so Tailwind sees it
import type { ReactNode } from "react";
import Button, { type ButtonProps } from "@/components/fundations/elements/Button";
import Segmented from "@/components/fundations/elements/Segmented";
import TextLink from "@/components/fundations/elements/TextLink";
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import CaretDown from "@/components/fundations/icons/CaretDown";
import CaretRight from "@/components/fundations/icons/CaretRight";
import Copy from "@/components/fundations/icons/Copy";
import Plus from "@/components/fundations/icons/Plus";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";
import { LoadingButton, LoadingForm, MenuDemo, SwitchDemo } from "../demos/ButtonDemos";

// Read off Button's own props, so a renamed variant or size fails here too (md is base's other name)
type Variant = NonNullable<ButtonProps["variant"]>;
type Size = Exclude<NonNullable<ButtonProps["size"]>, "md">;

// The closed set, in Button.tsx's order: the label each specimen wears, the tokens it's built from
// (variantClasses) and its job, with the real call sites that do it
const VARIANTS: {
  name: Variant;
  sub: string;
  label: string;
  rest: string[];
  /** Its hover and press classes as Button.tsx writes them; the scale to 0.97 comes on top of every one */
  moves: string[];
  job: string;
}[] = [
  {
    name: "default",
    sub: "primary, the default",
    label: "Save",
    rest: ["bg-inverted-solid", "text-on-inverted-foreground"],
    moves: ["hover:bg-inverted-solid-hover", "active:bg-inverted-solid-active"],
    job: "The one next step in a view: Create account, Sign in, Create board, Browse the feed.",
  },
  {
    name: "secondary",
    sub: "white, lifted",
    label: "Share",
    rest: ["bg-component-on-container-subtle", "text-primary-foreground", "shadow-sm"],
    moves: ["hover:bg-component-on-container-subtle-hover"],
    job: "A dashboard control that stands on its own: the header's Create and Saved, a board's Share and More, Copy token.",
  },
  {
    name: "muted",
    sub: "tertiary, a tint",
    label: "Cancel",
    rest: ["bg-component", "text-secondary-foreground"],
    moves: ["hover:bg-component-hover", "hover:text-primary-foreground", "active:bg-component-active"],
    job: "The other choice beside a default: See how it works, Get a token, Cancel in the board's Delete question.",
  },
  {
    name: "accent",
    sub: "brand, terracotta",
    label: "Continue",
    rest: ["bg-brand-solid", "text-on-brand-solid-foreground"],
    moves: ["hover:bg-brand-solid-hover", "active:bg-brand-solid-active"],
    job: "The next step in the brand's colour, where nothing else on the page is solid. Rare: only the template's Submit page uses it.",
  },
  {
    name: "danger",
    sub: "can't be undone",
    label: "Delete",
    rest: ["bg-danger-solid", "text-on-danger-solid-foreground"],
    moves: ["hover:bg-danger-solid-hover", "active:bg-danger-solid-active"],
    job: "The confirming click of something that can't be undone, after a question: Delete in the board's Delete question, beside a muted Cancel, and a Dialog's confirm (see Dialog).",
  },
  {
    name: "dangerSubtle",
    sub: "asks first",
    label: "Delete…",
    rest: ["bg-danger-subtle", "text-danger-foreground"],
    moves: ["hover:bg-danger-subtle-hover"],
    job: "Starts something destructive that asks first; the ellipsis says a question follows. With danger it's one pattern: it opens the Dialog whose confirm is danger (see Dialog). No product call site yet.",
  },
  {
    name: "transparent",
    sub: "no fill at rest",
    label: "Sign in",
    rest: ["bg-transparent", "text-secondary-foreground"],
    moves: ["hover:bg-transparent-hover", "hover:text-primary-foreground", "active:bg-transparent-active"],
    job: "Quiet, inside something else: Sign in in the header, Close in a dialog, clearing the search, Back in the welcome flow.",
  },
  {
    name: "none",
    sub: "no colours",
    label: "Skip",
    rest: [],
    moves: [],
    job: "Shape, size, focus ring, press and disabled fill only, for a control that brings its own colours: the post panel's Saved confirmation (PostView.tsx), a quiet grey that stays legible. Check a variant fits first.",
  },
];

const SIZES: { name: Size; head: string }[] = [
  { name: "xxs", head: "xxs · 24" },
  { name: "xs", head: "xs · 28" },
  { name: "sm", head: "sm · 32" },
  { name: "base", head: "base · 40" },
  { name: "lg", head: "lg · 44" },
  { name: "xl", head: "xl · 48" },
];

// The numbers behind each size (sizes, textSizes, radius and touchSizes in Button.tsx)
const SIZE_SPEC: {
  name: Size;
  sub: string;
  height: string;
  padding: string;
  gap: string;
  radius: string;
  label: string;
  touch: string;
}[] = [
  { name: "xxs", sub: "inline, dense", height: "h-6 · 24", padding: "px-2 · 8", gap: "gap-1 · 4", radius: "rounded-md · 6", label: "text-body-sm · 13/20", touch: "44 tall; icon only 32 wide" },
  { name: "xs", sub: "the site header", height: "h-7 · 28", padding: "px-2.5 · 10", gap: "gap-1.5 · 6", radius: "rounded-md · 6", label: "text-body-sm · 13/20", touch: "44 tall; icon only 36 wide" },
  { name: "sm", sub: "cards, menus, toolbars", height: "h-8 · 32", padding: "px-3 · 12", gap: "gap-1.5 · 6", radius: "rounded-lg · 8", label: "text-body-sm · 13/20", touch: "its own 32" },
  { name: "base", sub: "the default; md is the same", height: "h-10 · 40", padding: "px-3.5 · 14", gap: "gap-2 · 8", radius: "rounded-lg · 8", label: "text-body-sm · 13/20", touch: "its own 40" },
  { name: "lg", sub: "the dashboard", height: "h-11 · 44", padding: "px-4 · 16", gap: "gap-2 · 8", radius: "rounded-xl · 10", label: "text-subtitle · 14/20", touch: "its own 44" },
  { name: "xl", sub: "the dashboard", height: "h-12 · 48", padding: "px-6 · 24", gap: "gap-2 · 8", radius: "rounded-xl · 10", label: "text-subtitle · 14/20", touch: "its own 48" },
];

// The props, from CommonProps, Naming, ButtonAsLink and ButtonAsButton
const PROPS: { name: string; values: ReactNode; fallback: string; note: ReactNode }[] = [
  {
    name: "variant",
    values: "default, secondary, muted, accent, danger, dangerSubtle, transparent, none",
    fallback: "default",
    note: "The closed set. Anything else is a type error.",
  },
  {
    name: "size",
    values: "xxs, xs, sm, base, md, lg, xl",
    fallback: "base",
    note: "md is another name for base. lg and xl are the dashboard's.",
  },
  {
    name: "shape",
    values: "rounded, pill",
    fallback: "the size's radius",
    note: (
      <>
        <Mono>pill</Mono> puts <Mono>rounded-full</Mono> in place of the size&rsquo;s radius. The dashboard&rsquo;s.
      </>
    ),
  },
  {
    name: "iconOnly",
    values: "boolean",
    fallback: "false",
    note: (
      <>
        A square of the size&rsquo;s height; children are the icon. Needs <Mono>aria-label</Mono> or{" "}
        <Mono>aria-labelledby</Mono>, or it doesn&rsquo;t compile.
      </>
    ),
  },
  {
    name: "leftIcon, rightIcon",
    values: "ReactNode",
    fallback: "none",
    note: (
      <>
        An icon either side of the label, 16px (<Mono>size=&quot;sm&quot;</Mono> or <Mono>size-4</Mono>); the dashboard header&rsquo;s lg pills use 18px (<Mono>size-4.5</Mono>). Decorative: the label names it.
      </>
    ),
  },
  {
    name: "loading",
    values: "boolean",
    fallback: "false",
    note: "Spinner over the label, still focusable, clicks ignored. Client components only.",
  },
  {
    name: "isLink, href",
    values: "true, string",
    fallback: "a <button>",
    note: (
      <>
        Renders <Mono>next/link</Mono> with the same classes. A link has no <Mono>disabled</Mono>.
      </>
    ),
  },
  {
    name: "type",
    values: "button, submit, reset",
    fallback: "button",
    note: (
      <>
        A form&rsquo;s submit says <Mono>type=&quot;submit&quot;</Mono>; nothing else submits by accident.
      </>
    ),
  },
  {
    name: "gap",
    values: "xs, sm, base, md, lg",
    fallback: "the size's gap",
    note: "8 to 48px between icon and label, kept from the template. No call site uses it: leave it out.",
  },
  {
    name: "className",
    values: "string",
    fallback: "none",
    note: "Width, margins and layout. Never a radius, a border or a position (see Width and placement).",
  },
  {
    name: "ref",
    values: "Ref",
    fallback: "none",
    note: "To the <button> or the <a>: a Menu's trigger takes it, merged with its own.",
  },
];

/** A variant's classes, one per line and never broken at a hyphen: at rest, then hover and press */
function Classes({ rest, moves }: { rest: string[]; moves: string[] }) {
  if (!rest.length) return <Note>No colours, and nothing on hover or press</Note>;
  return (
    <span className="flex flex-col gap-2">
      {[rest, moves].map((group, i) => (
        <span key={i} className="flex flex-col gap-0.5">
          {group.map((item) => (
            <Mono key={item} className="whitespace-nowrap">
              {item}
            </Mono>
          ))}
        </span>
      ))}
    </span>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <span className="text-body-sm text-secondary-foreground">{children}</span>;
}

/** A captioned live example in the Width section, marked correct or incorrect */
function WidthCase({ ok, title, children }: { ok: boolean; title: ReactNode; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col gap-3">
      <div className="rounded-2xl bg-card p-4">{children}</div>
      <figcaption className="text-body-sm text-secondary-foreground">
        {ok ? (
          <span className="font-medium text-positive-foreground">Correct.</span>
        ) : (
          <span className="font-medium text-danger-foreground">Incorrect.</span>
        )}{" "}
        {title}
      </figcaption>
    </figure>
  );
}

/** One alternative to a Button, with the job it does instead and a live specimen */
function Instead({
  name,
  children,
  demo,
  sheet,
  menu = false,
}: {
  name: string;
  children: ReactNode;
  demo: ReactNode;
  /** The control's own sheet on this page */
  sheet: { href: string; title: string };
  /** Room below the demo for its menu to open into, on every width */
  menu?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl bg-card p-5">
      <h4 className="text-body-sm font-medium text-primary-foreground">{name}</h4>
      <p className="mt-1.5 text-body-sm text-secondary-foreground">
        {children}{" "}
        <TextLink href={sheet.href}>{sheet.title}</TextLink>
      </p>
      <div className={menu ? "mt-5 flex min-h-52 items-start" : "mt-5 flex min-h-12 items-start"}>{demo}</div>
    </div>
  );
}

export default function ButtonSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Button">
        Interfere&rsquo;s button: a 13px medium label on heights from 24 to 40, no borders, and a press that
        sinks to 0.97. The dashboard adds 44 and 48, usually as pills. One component for every action, and
        with <Mono>isLink</Mono> for a link that&rsquo;s a page&rsquo;s next step.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                For an action: Save, Copy token, Create board. With <Mono>isLink</Mono> and <Mono>href</Mono>, for a link
                that is the page&rsquo;s next step (Create account, Connect your assistant). Never a hand-made{" "}
                <Mono>&lt;button&gt;</Mono> styled to look like one: it misses the focus ring, the reduced-motion press
                and the touch area, and it&rsquo;s a second recipe to keep in step.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Somewhere to go from inside a sentence is a <Mono>TextLink</Mono>. One value out of two to five is a{" "}
                <Mono>Segmented</Mono>. On or off is a <Mono>Switch</Mono>. Several actions behind one trigger are a{" "}
                <Mono>Menu</Mono> (fundations/molecules/Menu): the trigger is a Button, the rows are{" "}
                <Mono>MenuItem</Mono>s, never Buttons. Live, below.
              </>
            ),
          },
          {
            term: "Variants",
            text: (
              <>
                Eight, and nothing else: <Mono>default</Mono> (the primary, and the default), <Mono>secondary</Mono>,{" "}
                <Mono>muted</Mono> (tertiary), <Mono>accent</Mono> (brand), <Mono>danger</Mono>,{" "}
                <Mono>dangerSubtle</Mono>, <Mono>transparent</Mono>, <Mono>none</Mono>. There&rsquo;s no{" "}
                <Mono>primary</Mono>, <Mono>ghost</Mono>, <Mono>outline</Mono> or <Mono>destructive</Mono>: the type
                refuses them.
              </>
            ),
          },
          {
            term: "One default",
            text: (
              <>
                One <Mono>default</Mono> per view, for the next step; everything beside it is <Mono>muted</Mono>,{" "}
                <Mono>secondary</Mono> or <Mono>transparent</Mono>. Two solids side by side (two defaults, or a default
                and an accent) leave the view with no next step. A view is what&rsquo;s on screen together: a hero, a
                card, a dialog, a menu.
              </>
            ),
          },
          {
            term: "Sizes",
            text: (
              <>
                <Mono>xxs</Mono> 24, <Mono>xs</Mono> 28, <Mono>sm</Mono> 32, <Mono>base</Mono> 40 (the default;{" "}
                <Mono>md</Mono> is another name for it), <Mono>lg</Mono> 44, <Mono>xl</Mono> 48. The label is 13px
                medium up to base and 14px, the dashboard&rsquo;s subtitle role, at lg and xl. It never wraps or shrinks
                (<Mono>whitespace-nowrap</Mono>, <Mono>shrink-0</Mono>): if it doesn&rsquo;t fit, shorten the words.
              </>
            ),
          },
          {
            term: "Dashboard",
            text: (
              <>
                <Mono>lg</Mono>, <Mono>xl</Mono> and <Mono>shape=&quot;pill&quot;</Mono> are the dashboard&rsquo;s: the
                header&rsquo;s pills, a board&rsquo;s toolbar, the token page, onboarding&rsquo;s Back, and the submit
                of a dashboard form or dialog. The marketing site stays on <Mono>xxs</Mono> to <Mono>base</Mono> with
                the size&rsquo;s own radius, with one exception: the homepage category row&rsquo;s scroll arrows
                (Categories.tsx) are secondary, <Mono>lg</Mono>, round and icon only.
              </>
            ),
          },
          {
            term: "Width",
            text: (
              <>
                A decision at every use. A standalone call to action is <Mono>w-fit</Mono> (in a flex column or a grid
                it would stretch). A form&rsquo;s submit is <Mono>w-full</Mono>. Buttons in a row take nothing: the row
                lays them out. A pair that splits a narrow box takes <Mono>flex-1</Mono> each (the board&rsquo;s Delete
                question).
              </>
            ),
          },
          {
            term: "No borders",
            text: (
              <>
                No <Mono>border</Mono>, <Mono>ring-*</Mono> or <Mono>outline-*</Mono> in its className. The fills and the
                secondary&rsquo;s <Mono>shadow-sm</Mono> are its edges, in both themes; a line makes it read as a field,
                and a 2px one as the focus ring.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Width, margins and layout only. <Mono>cx</Mono> doesn&rsquo;t merge, so a second value for something
                Button already sets lands beside it and the stylesheet&rsquo;s order picks the winner:{" "}
                <Mono>rounded-full</Mono> loses to the size&rsquo;s radius (write <Mono>shape=&quot;pill&quot;</Mono>),
                and <Mono>absolute</Mono> loses to its own <Mono>relative</Mono> (wrap it in a positioned span). A
                colour only for a state the variants don&rsquo;t have: the header&rsquo;s Saved fills while you&rsquo;re
                on it (Header.tsx). One known exception to the padding: the header&rsquo;s Create sets its own
                (<Mono>max-md:px-3 md:px-5</Mono>) on purpose, because its label only joins the icon from md; don&rsquo;t
                copy it elsewhere.
              </>
            ),
          },
          {
            term: "States",
            text: (
              <>
                Hover is a step darker, only where a pointer can hover (Tailwind&rsquo;s <Mono>hover:</Mono> sits
                behind <Mono>@media (hover: hover)</Mono>, so a tap never leaves it stuck). Press sinks to 0.97 over
                150ms on <Mono>ease-out-quint</Mono>, only while it can act and only with motion allowed: never add
                your own <Mono>active:scale</Mono>. Focus is a 2px brand ring, 2px out, on keyboard focus only.
              </>
            ),
          },
          {
            term: "Disabled",
            text: (
              <>
                <Mono>disabled</Mono> while it can&rsquo;t act yet: no name typed (Create board), no reset link. It leaves
                the tab order and every variant takes the same grey fill. Never for a request in flight: that&rsquo;s{" "}
                <Mono>loading</Mono>, which keeps focus.
              </>
            ),
          },
          {
            term: "Loading",
            text: (
              <>
                Client components only: it swaps the click for a guard function, which a server component can&rsquo;t
                hand to a <Mono>&lt;button&gt;</Mono> (React refuses at render), and being busy is client state anyway.
                The label stays, invisible, so the width holds; the button keeps focus (<Mono>aria-disabled</Mono>,{" "}
                <Mono>aria-busy</Mono>) and ignores clicks. Put what&rsquo;s happening in the label, &ldquo;Signing
                in…&rdquo;: it&rsquo;s still the name a screen reader reads.
              </>
            ),
          },
          {
            term: "Icon only",
            text: (
              <>
                <Mono>iconOnly</Mono> with <Mono>aria-label</Mono> (or <Mono>aria-labelledby</Mono>) saying what it does:
                &ldquo;Close&rdquo;, &ldquo;Copy token&rdquo;, never &ldquo;icon&rdquo;. Without one it doesn&rsquo;t
                compile. The icon is 16px (<Mono>size=&quot;sm&quot;</Mono>) and decorative: the shell hides it.
              </>
            ),
          },
          {
            term: "Touch",
            text: (
              <>
                <Mono>xxs</Mono> and <Mono>xs</Mono> reach 44px tall on touch screens through an invisible{" "}
                <Mono>::after</Mono> (<Mono>pointer-coarse:</Mono>), so nothing moves; icon-only ones grow 4px each side
                as well. From <Mono>sm</Mono> up the button is its own target. To reach further, use{" "}
                <Mono>before:</Mono> (the post panel&rsquo;s remove buttons: <Mono>before:absolute before:-inset-1</Mono>
                ), never <Mono>after:</Mono>, which the small sizes use.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which variant?
 ├── Somewhere to go, inside a sentence → a text link
 ├── One value out of two to five → Segmented
 ├── On or off → Switch
 ├── One of several actions behind a trigger → Menu
 └── An action, or a link that's the next step
      ├── The one next step in this view → default
      ├── The same in the brand's colour (rare,
      │   never beside a default) → accent
      ├── Confirms what can't be undone → danger
      │   (a Dialog's confirm, the board's Delete)
      ├── Starts something destructive that
      │   asks first → dangerSubtle (opens the Dialog)
      ├── The other choice beside the default → muted
      ├── A dashboard control on its own: Create,
      │   Saved, Share, More, Copy token → secondary
      ├── Quiet, inside something else: Sign in,
      │   Close, clearing a field → transparent
      └── Brings its own colours → none`}
        />
        <Flow
          tree={`Which size?
 ├── Inline in a dense editor (+ Add) → xxs (24)
 ├── The site header, beside the nav → xs (28)
 ├── An action in a card, a menu or a small
 │   empty state → sm (32)
 ├── A page's call to action, a form's submit
 │   → base (40, the default)
 ├── The dashboard's header, a board's toolbar,
 │   the token page, onboarding's Back → lg (44),
 │   shape="pill"
 └── The submit of a dashboard form or dialog
     → xl (48), shape="pill": Create board in
     NewBoardDialog (w-full), Save at the foot of
     the post panel (in a row, no width)`}
        />
      </div>

      <SheetSection
        id="variants"
        title="Variants"
        description="The closed set, at the default size. Point at a specimen and press it. Its classes are as Button.tsx writes them: at rest, then hover and press. Every press also scales to 0.97."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              template="max-content max-content minmax(16rem,1fr)"
              columns={["specimen", "classes", "job"]}
              rows={VARIANTS.map((v) => ({
                label: v.name,
                sub: v.sub,
                cells: [
                  <Button key="s" variant={v.name}>
                    {v.label}
                  </Button>,
                  <Classes key="c" rest={v.rest} moves={v.moves} />,
                  <Note key="j">{v.job}</Note>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-6 flex flex-col gap-6">
          <Code
            correct={`<Button>Create account</Button>
<Button variant="muted">See how it works</Button>`}
            incorrect={{
              why: "primary and ghost don't exist",
              code: `<Button variant="primary">Create account</Button>
<Button variant="ghost">See how it works</Button>`,
            }}
          />
          <Code
            correct={`{/* One default, and the other choice muted (vision/page.tsx) */}
<div className="mt-8 flex flex-wrap justify-center gap-3">
  <Button isLink size="base" variant="default" href="/signup">
    Start your swipe file
  </Button>
  <Button isLink size="base" variant="muted" href="/#how-it-works">
    See how it works
  </Button>
</div>`}
            incorrect={{
              why: "two solids in one row (the template's Submit page)",
              code: `<div className="flex items-center gap-2">
  <Button size="sm" variant="default" className="w-fit" data-modal-open="submit-modal">
    Submit a site
  </Button>
  <Button isLink size="sm" variant="accent" href="/pricing" className="w-fit">
    Skip the waiting line for $299
  </Button>
</div>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="sizes"
        title="Sizes"
        description="Every variant at every size. Up to base the label is 13px; lg and xl are the dashboard's, with its 14px subtitle label. md renders exactly as base."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              columns={SIZES.map((s) => s.head)}
              rows={VARIANTS.map((v) => ({
                label: v.name,
                cells: SIZES.map((s) => (
                  <Button key={s.name} variant={v.name} size={s.name}>
                    {v.label}
                  </Button>
                )),
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="size-spec"
        title="Size spec"
        description={
          <>
            What each size sets. The radius steps up with the height (6, 8, then 10), and{" "}
            <Mono>shape=&quot;pill&quot;</Mono> replaces it at any size. An icon-only button is a square of the
            height. The last column is the target on a touch screen.
          </>
        }
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              template="max-content max-content max-content max-content max-content minmax(10rem,1fr)"
              columns={["specimen", "height", "padding, gap", "radius", "label", "on touch"]}
              rows={SIZE_SPEC.map((s) => ({
                label: s.name,
                sub: s.sub,
                cells: [
                  <Button key="s" size={s.name}>
                    Save
                  </Button>,
                  <Mono key="h" tone="primary" className="whitespace-nowrap">
                    {s.height}
                  </Mono>,
                  <span key="p" className="flex flex-col gap-0.5">
                    <Mono className="whitespace-nowrap">{s.padding}</Mono>
                    <Mono className="whitespace-nowrap">{s.gap}</Mono>
                  </span>,
                  <Mono key="r" className="whitespace-nowrap">
                    {s.radius}
                  </Mono>,
                  <Mono key="l" className="whitespace-nowrap">
                    {s.label}
                  </Mono>,
                  <Note key="t">{s.touch}</Note>,
                ],
              }))}
            />
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* The new-board dialog's submit (NewBoardDialog.tsx) */}
<Button type="submit" variant="default" size="xl" shape="pill" disabled={!name.trim()} className="mt-6 w-full">
  Create board
</Button>`}
            incorrect={{
              why: "copied by hand: no focus ring, a press under reduced motion",
              code: `<button
  type="submit"
  disabled={!name.trim()}
  className="mt-6 h-12 w-full rounded-full bg-base-900 text-subtitle font-medium text-white transition-[background-color,scale] duration-150 hover:bg-base-800 active:scale-[0.96] disabled:bg-component disabled:text-base-500"
>
  Create board
</button>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="states"
        title="States"
        description="Rest is live: point at it and press it. Focus is drawn on with the ring's own classes here; Tab onto any specimen for the real one. Disabled is the same grey in every variant. Loading runs for two seconds when you click it."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              columns={["rest", "focus", "disabled", "loading · click it"]}
              rows={VARIANTS.map((v) => ({
                label: v.name,
                cells: [
                  <Button key="r" variant={v.name}>
                    {v.label}
                  </Button>,
                  <Button
                    key="f"
                    variant={v.name}
                    tabIndex={-1}
                    className="outline-2 outline-offset-2 outline-brand-border-focus"
                  >
                    {v.label}
                  </Button>,
                  <Button key="d" variant={v.name} disabled>
                    {v.label}
                  </Button>,
                  <LoadingButton key="l" variant={v.name}>
                    {v.label}
                  </LoadingButton>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        id="loading"
        title="Loading"
        description="A form's submit, as the sign-in forms do it. The label says what's happening and keeps the width; the button keeps focus and ignores clicks until it's done. Under reduced motion the spinner holds still."
      >
        <Sheet split>{() => <LoadingForm />}</Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* loading while the request runs, disabled while it can't act yet (AuthForms.tsx) */}
<Button type="submit" loading={pending} disabled={waiting} className="w-full">
  {pending ? busy : idle}
</Button>`}
            incorrect={{
              why: "disabled while the request runs (the auth forms until 2026-10-18)",
              code: `<Button
  size="base"
  variant="default"
  type="submit"
  disabled={pending}
  aria-disabled={pending}
  className="w-full disabled:opacity-70"
>
  {pending ? busy : idle}
</Button>`,
            }}
          />
          <p className="mt-3 max-w-[65ch] text-body-sm text-secondary-foreground">
            Disabled drops focus out of the form mid-request and dims the words that should say what&rsquo;s happening,
            and the opacity sits on top of the disabled fill.
          </p>
        </div>
      </SheetSection>

      <SheetSection
        id="icons-and-shape"
        title="Icons and shape"
        description={
          <>
            The slots and the pill across the sizes. Icons here are <Mono>size=&quot;sm&quot;</Mono>, 16px, the size
            most call sites draw (<Mono>size-4</Mono>); the dashboard header&rsquo;s lg pills draw theirs at 18px
            (<Mono>size-4.5</Mono>), and a small glyph such as the search&rsquo;s clear or an external-link arrow at
            14px (<Mono>size-3.5</Mono>). An icon-only button is a square of the size&rsquo;s height; with{" "}
            <Mono>shape=&quot;pill&quot;</Mono> it&rsquo;s a circle.
          </>
        }
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              columns={SIZES.map((s) => s.head)}
              rows={[
                {
                  label: "iconOnly",
                  sub: "a square, named",
                  cells: SIZES.map((s) => (
                    <Button key={s.name} variant="secondary" size={s.name} iconOnly aria-label="Copy">
                      <Copy size="sm" />
                    </Button>
                  )),
                },
                {
                  label: "iconOnly pill",
                  sub: "a circle, named",
                  cells: SIZES.map((s) => (
                    <Button key={s.name} variant="secondary" size={s.name} shape="pill" iconOnly aria-label="Saved">
                      <BookmarkSimple size="sm" />
                    </Button>
                  )),
                },
                {
                  label: "pill",
                  sub: "the dashboard's",
                  cells: SIZES.map((s) => (
                    <Button key={s.name} size={s.name} shape="pill">
                      Save
                    </Button>
                  )),
                },
                {
                  label: "leftIcon",
                  sub: "an icon beside the label",
                  cells: SIZES.map((s) => (
                    <Button key={s.name} variant="secondary" size={s.name} leftIcon={<Plus size="sm" />}>
                      Create
                    </Button>
                  )),
                },
                {
                  label: "rightIcon",
                  sub: "a menu's trigger",
                  cells: SIZES.map((s) => (
                    <Button key={s.name} variant="secondary" size={s.name} rightIcon={<CaretDown size="sm" />}>
                      Sort
                    </Button>
                  )),
                },
              ]}
            />
          )}
        </Sheet>
        <div className="mt-6 flex flex-col gap-6">
          <Code
            correct={`{/* NewBoardDialog.tsx */}
<Button variant="transparent" size="base" shape="pill" iconOnly onClick={onClose} aria-label="Close" className="-mr-2">
  <Close className="size-4" />
</Button>`}
            incorrect={{
              why: "no name: a type error, and only “button” to a screen reader",
              code: `<Button variant="transparent" size="base" shape="pill" iconOnly onClick={onClose} className="-mr-2">
  <Close className="size-4" />
</Button>`,
            }}
          />
          <Code
            correct={`{/* The new token's copy button (ApiTokens.tsx) */}
<Button
  variant="secondary"
  size="lg"
  shape="pill"
  iconOnly
  onClick={copy}
  aria-label={copied ? "Copied" : "Copy token"}
>
  {copied ? (
    <Check className="size-4" />
  ) : (
    <Copy className="size-4" />
  )}
</Button>`}
            incorrect={{
              why: "hand-made, with a ring for a border (until 2026-10-18)",
              code: `<button
  type="button"
  onClick={copy}
  aria-label={copied ? "Copied" : "Copy token"}
  className="flex size-11 shrink-0 items-center justify-center rounded-full text-base-900 ring-1 ring-base-200 transition-[background-color,scale] duration-150 hover:bg-base-50 active:scale-[0.96]"
>
  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
</button>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="links"
        title="As a link"
        description="isLink renders next/link with the same classes, so a link and a button look alike: the words have to say where it goes. These are real links. A link opening a new tab says so to screen readers."
      >
        <Sheet>
          {() => (
            <div className="flex flex-wrap items-center gap-3">
              <Button isLink href="/system/text-link" size="sm" rightIcon={<CaretRight size="sm" />}>
                Text links
              </Button>
              <Button isLink href="/system/motion" variant="muted" size="sm">
                The press, on Motion
              </Button>
              <Button
                isLink
                href="/docs/mcp"
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="sm"
                rightIcon={<ArrowUpRight size="sm" />}
              >
                Connect guide
                <span className="sr-only"> (opens in a new tab)</span>
              </Button>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* ClientInstall.tsx */}
<Button
  isLink
  size="sm"
  variant="secondary"
  href={step.open.href}
  target="_blank"
  rel="noopener noreferrer"
  rightIcon={<ArrowUpRight className="size-3.5" aria-hidden="true" />}
  className="mt-3 w-fit"
>
  {step.open.label}
  <span className="sr-only"> (opens in a new tab)</span>
</Button>`}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="width"
        title="Width and placement"
        description="Button is inline-flex and as wide as its label, until a flex column or a grid stretches it. Say its width at every use."
      >
        <Sheet>
          {() => (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <WidthCase ok title={<>A standalone call to action: <Mono>w-fit</Mono>.</>}>
                <div className="flex flex-col gap-3">
                  <Note>Nothing on this board yet.</Note>
                  <Button size="sm" className="w-fit">
                    Browse the feed
                  </Button>
                </div>
              </WidthCase>
              <WidthCase ok title={<>A form&rsquo;s submit: <Mono>w-full</Mono>.</>}>
                <div className="flex flex-col gap-3">
                  <Note>Welcome back.</Note>
                  <Button className="w-full">Sign in</Button>
                </div>
              </WidthCase>
              <WidthCase ok title="In a row: nothing. The row lays them out.">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Publish</Button>
                  <Button size="sm" variant="muted">
                    Cancel
                  </Button>
                </div>
              </WidthCase>
              <WidthCase ok={false} title="No width in a flex column: it stretches to the column.">
                <div className="flex flex-col gap-3">
                  <Note>Nothing on this board yet.</Note>
                  <Button size="sm">Browse the feed</Button>
                </div>
              </WidthCase>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* Placed by a plain span: Button is relative itself (SearchBox.tsx) */}
<span className="absolute right-3 flex">
  <Button
    variant="transparent"
    size="sm"
    shape="pill"
    iconOnly
    aria-label="Clear search"
    onClick={() => {
      onQuery("");
      inputRef.current?.focus();
    }}
  >
    <Close className="size-3.5" />
  </Button>
</span>`}
            incorrect={{
              why: "absolute on the Button: its own relative wins",
              code: `<Button
  variant="transparent"
  size="sm"
  shape="pill"
  iconOnly
  aria-label="Clear search"
  onClick={clear}
  className="absolute right-3"
>
  <Close className="size-3.5" />
</Button>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="instead"
        title="Not a Button"
        description="Four jobs that look like a button's and aren't. Each has its own control, live here."
      >
        <Sheet>
          {() => (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Instead
                name="Text link"
                sheet={{ href: "/system/text-link", title: "Text link" }}
                demo={
                  <p className="text-body-sm text-primary-foreground">
                    Read the{" "}
                    <TextLink href="/docs/mcp">connect guide</TextLink>{" "}
                    first.
                  </p>
                }
              >
                Somewhere to go from inside a sentence: <Mono>TextLink</Mono>, variant <Mono>inline</Mono> (its default). Its rules:
              </Instead>
              <Instead
                name="Segmented"
                sheet={{ href: "/system/controls", title: "Segmented and switch" }}
                demo={
                  <Segmented
                    aria-label="Tile size"
                    defaultValue="medium"
                    options={[
                      { value: "small", label: "Small" },
                      { value: "medium", label: "Medium" },
                      { value: "large", label: "Large" },
                    ]}
                  />
                }
              >
                One value out of two to five, all in view: grid size, token expiry, MCP or REST. Its rules:
              </Instead>
              <Instead name="Switch" demo={<SwitchDemo />} sheet={{ href: "/system/controls", title: "Segmented and switch" }}>
                On or off, taking effect as it&rsquo;s flipped or read on submit: Share with a link. Its rules:
              </Instead>
              <Instead name="Menu" demo={<MenuDemo />} sheet={{ href: "/system/menu", title: "Menu" }} menu>
                Several actions behind one trigger: a <Mono>Menu</Mono>. The trigger is a Button; the rows are{" "}
                <Mono>MenuItem</Mono>s, 44px on touch, with arrow keys, a letter jump and one gliding highlight. Its
                rules:
              </Instead>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* ClientInstall.tsx */}
<Segmented
  aria-label="Connect over"
  size="md"
  shape="pill"
  className="w-fit"
  value={mode}
  onValueChange={setMode}
  options={[
    { value: "mcp", label: "MCP" },
    { value: "rest", label: "REST" },
  ]}
/>`}
            incorrect={{
              why: "pressed buttons for one choice (the MCP page until 2026-10-18)",
              code: `<div role="group" aria-label="Connect over" className="flex w-fit gap-1 rounded-full bg-base-50 p-1 ring-1 ring-base-200">
  <button type="button" aria-pressed={mode === "mcp"} onClick={() => setMode("mcp")} className={switchClass(mode === "mcp")}>
    MCP
  </button>
  <button type="button" aria-pressed={mode === "rest"} onClick={() => setMode("rest")} className={switchClass(mode === "rest")}>
    REST
  </button>
</div>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        id="props"
        title="Props"
        description="Everything Button takes besides a <button>'s or an <a>'s own attributes, which pass through."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="minmax(14rem,max-content) minmax(8rem,max-content) minmax(18rem,1fr)"
              align="start"
              columns={["values", "default", "notes"]}
              rows={PROPS.map((p) => ({
                label: p.name,
                cells: [
                  <Mono key="v">{p.values}</Mono>,
                  <Mono key="d">{p.fallback}</Mono>,
                  <Note key="n">{p.note}</Note>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>
    </div>
  );
}
