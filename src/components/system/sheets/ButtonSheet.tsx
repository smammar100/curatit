// /system/button: every variant, size, state and slot of fundations/elements/Button.tsx, live in
// both themes. Since 2026-10-23 Button is a wrapper over Fluid Functionalism's button
// (src/components/ui/button.tsx, installed with the shadcn CLI): the site's eight variant names
// land on the library's four looks, its seven size names all on the library's compact step. The demos
// that need state (loading, the switch, the menu) are client components in ../demos/ButtonDemos.tsx;
// the sheet itself stays a server component. Every class is written out in full, never built from
// parts, so Tailwind sees it
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

// The closed set, in Button.tsx's order: the library look each name lands on, the label each
// specimen wears, what the wrapper adds (Button.tsx's `variants`), what the library draws (the
// root's text colour from `buttonVariants`, then the surface layer from `bgVariants`: at rest,
// on hover, pressed) and its job, with the real call sites that do it
const VARIANTS: {
  name: Variant;
  sub: string;
  label: string;
  /** The classes Button.tsx adds for this name, if any */
  wrapper: string[];
  /** The root's own colour, from buttonVariants */
  root: string[];
  /** The surface layer at rest */
  rest: string[];
  /** The surface layer on hover and while pressed */
  moves: string[];
  job: string;
}[] = [
  {
    name: "default",
    sub: "primary · the ink",
    label: "Save",
    wrapper: [],
    root: ["text-background"],
    rest: ["[--btn-bg:var(--foreground)]", "bg-[var(--btn-bg)]", "shadow-[0_0_0_1px_var(--btn-bg)]"],
    moves: [
      "group-hover:[--btn-bg:color-mix(in_oklab,var(--foreground)_90%,var(--background))]",
      "group-active:[--btn-bg:color-mix(in_oklab,var(--foreground)_80%,var(--background))]",
      "group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
    ],
    job: "The one next step in a view: Create account, Sign in, Create board, Browse the feed.",
  },
  {
    name: "secondary",
    sub: "tertiary · a hairline ring",
    label: "Share",
    wrapper: [],
    root: ["text-foreground"],
    rest: ["bg-transparent", "shadow-[0_0_0_1px_var(--border),inset_0_0_0_0px_var(--border)]"],
    moves: [
      "group-hover:bg-hover",
      "group-active:bg-active",
      "group-active:shadow-[0_0_0_0px_var(--border),inset_0_0_0_1px_var(--border)]",
    ],
    job: "A dashboard control that stands on its own: the header's Create and Saved, a board's Share and More, Copy token.",
  },
  {
    name: "muted",
    sub: "secondary · a see-through tint",
    label: "Cancel",
    wrapper: [],
    root: ["text-foreground"],
    rest: ["[--btn-bg:var(--tint)]", "bg-[var(--btn-bg)]", "shadow-[0_0_0_1px_var(--btn-bg)]"],
    moves: [
      "group-hover:[--btn-bg:var(--tint-hover)]",
      "group-active:[--btn-bg:var(--tint)]",
      "group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
    ],
    job: "The other choice beside a default: See how it works, Get a token, Cancel in the board's Delete question.",
  },
  {
    name: "accent",
    sub: "primary, the ink swapped for terracotta",
    label: "Continue",
    wrapper: ["[--foreground:var(--color-brand-solid)]", "[--background:var(--color-paper)]"],
    root: ["text-background"],
    rest: ["[--btn-bg:var(--foreground)]", "bg-[var(--btn-bg)]", "shadow-[0_0_0_1px_var(--btn-bg)]"],
    moves: [
      "group-hover:[--btn-bg:color-mix(in_oklab,var(--foreground)_90%,var(--background))]",
      "group-active:[--btn-bg:color-mix(in_oklab,var(--foreground)_80%,var(--background))]",
      "group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
    ],
    job: "The next step in the brand's colour, where nothing else on the page is solid. Rare: only the template's Submit page uses it.",
  },
  {
    name: "danger",
    sub: "primary, the ink swapped for red",
    label: "Delete",
    wrapper: ["[--foreground:var(--color-danger-solid)]", "[--background:var(--color-paper)]"],
    root: ["text-background"],
    rest: ["[--btn-bg:var(--foreground)]", "bg-[var(--btn-bg)]", "shadow-[0_0_0_1px_var(--btn-bg)]"],
    moves: [
      "group-hover:[--btn-bg:color-mix(in_oklab,var(--foreground)_90%,var(--background))]",
      "group-active:[--btn-bg:color-mix(in_oklab,var(--foreground)_80%,var(--background))]",
      "group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
    ],
    job: "The confirming click of something that can't be undone, after a question: Delete in the board's Delete question, beside a muted Cancel, and a Dialog's confirm (see Dialog).",
  },
  {
    name: "dangerSubtle",
    sub: "secondary, the tint swapped for red",
    label: "Delete…",
    wrapper: [
      "[--tint:var(--color-danger-subtle)]",
      "[--tint-hover:var(--color-danger-subtle-hover)]",
      "text-danger-foreground",
    ],
    root: ["text-foreground"],
    rest: ["[--btn-bg:var(--tint)]", "bg-[var(--btn-bg)]", "shadow-[0_0_0_1px_var(--btn-bg)]"],
    moves: [
      "group-hover:[--btn-bg:var(--tint-hover)]",
      "group-active:[--btn-bg:var(--tint)]",
      "group-active:shadow-[0_0_0_0px_var(--btn-bg)]",
    ],
    job: "Starts something destructive that asks first; the ellipsis says a question follows. With danger it's one pattern: it opens the Dialog whose confirm is danger (see Dialog). No product call site yet.",
  },
  {
    name: "transparent",
    sub: "ghost · words until hovered",
    label: "Sign in",
    wrapper: [],
    root: ["text-muted-foreground", "hover:text-foreground"],
    rest: ["bg-transparent", "shadow-[0_0_0_1px_transparent]"],
    moves: [
      "group-hover:bg-hover",
      "group-hover:shadow-[0_0_0_1px_var(--hover)]",
      "group-active:bg-active",
      "group-active:shadow-[0_0_0_0px_var(--active)]",
    ],
    job: "Quiet, inside something else: Sign in in the header, Close in a dialog, clearing the search, Back in the welcome flow.",
  },
  {
    name: "none",
    sub: "ghost, the same",
    label: "Skip",
    wrapper: [],
    root: ["text-muted-foreground", "hover:text-foreground"],
    rest: ["bg-transparent", "shadow-[0_0_0_1px_transparent]"],
    moves: [
      "group-hover:bg-hover",
      "group-hover:shadow-[0_0_0_1px_var(--hover)]",
      "group-active:bg-active",
      "group-active:shadow-[0_0_0_0px_var(--active)]",
    ],
    job: "Kept for the call sites that bring their own colours through className (the post panel's Close on the dimmed feed, PostView.tsx; onboarding's chips). It renders as transparent: a colour in className replaces the ghost's rest ink, and the hover wash stays. Check a variant fits first.",
  },
];

// The six names, every one on the library's compact step (Button.tsx's `sizes`)
const SIZES: { name: Size; head: string }[] = [
  { name: "xxs", head: "xxs · 28" },
  { name: "xs", head: "xs · 28" },
  { name: "sm", head: "sm · 28" },
  { name: "base", head: "base · 28" },
  { name: "lg", head: "lg · 28" },
  { name: "xl", head: "xl · 28" },
];

// The numbers behind each size: the step it resolves to and what the library's `buttonVariants`
// sets for that step, the wrapper's icon inset and label gap, and the touch target
const SIZE_SPEC: {
  name: Size;
  sub: string;
  step: string;
  height: string;
  padding: string;
  icons: string;
  label: string;
  touch: string;
}[] = [
  { name: "xxs", sub: "compact", step: "compact", height: "h-7 · 28", padding: "px-3 · 12", icons: "pl-2 / pr-2 · gap-1.5", label: "12 / 18", touch: "44 tall, through ::after" },
  { name: "xs", sub: "compact", step: "compact", height: "h-7 · 28", padding: "px-3 · 12", icons: "pl-2 / pr-2 · gap-1.5", label: "12 / 18", touch: "44 tall, through ::after" },
  { name: "sm", sub: "compact", step: "compact", height: "h-7 · 28", padding: "px-3 · 12", icons: "pl-2 / pr-2 · gap-1.5", label: "12 / 18", touch: "44 tall, through ::after" },
  { name: "base", sub: "compact; the default, and md", step: "compact", height: "h-7 · 28", padding: "px-3 · 12", icons: "pl-2 / pr-2 · gap-1.5", label: "12 / 18", touch: "44 tall, through ::after" },
  { name: "lg", sub: "compact; same as base, kept for call sites (the hero, the dashboard)", step: "compact", height: "h-7 · 28", padding: "px-3 · 12", icons: "pl-2 / pr-2 · gap-1.5", label: "12 / 18", touch: "44 tall, through ::after" },
  { name: "xl", sub: "compact; same as base, kept for call sites (the dashboard)", step: "compact", height: "h-7 · 28", padding: "px-3 · 12", icons: "pl-2 / pr-2 · gap-1.5", label: "12 / 18", touch: "44 tall, through ::after" },
];

// The props, from CommonProps, Naming, ButtonAsLink and ButtonAsButton
const PROPS: { name: string; values: ReactNode; fallback: string; note: ReactNode }[] = [
  {
    name: "variant",
    values: "default, secondary, muted, accent, danger, dangerSubtle, transparent, none",
    fallback: "default",
    note: "The closed set, on the library's primary, tertiary, secondary and ghost. Anything else is a type error.",
  },
  {
    name: "size",
    values: "xxs, xs, sm, base, md, lg, xl",
    fallback: "base",
    note: "One step: every name is the compact step (28px, 12px text). md, lg and xl render exactly as base and are kept for call sites.",
  },
  {
    name: "shape",
    values: "rounded, pill",
    fallback: "ignored",
    note: (
      <>
        Accepted for older call sites and ignored: every button is a pill (<Mono>rounded-[20px]</Mono>, the site&rsquo;s
        shape setting). Leave it out of new code.
      </>
    ),
  },
  {
    name: "iconOnly",
    values: "boolean",
    fallback: "false",
    note: (
      <>
        A 28px square (<Mono>h-7 w-7</Mono>); children are the icon, drawn at 14px whatever size it was given. Needs{" "}
        <Mono>aria-label</Mono> or <Mono>aria-labelledby</Mono>, or it doesn&rsquo;t compile.
      </>
    ),
  },
  {
    name: "leftIcon, rightIcon",
    values: "ReactNode",
    fallback: "none",
    note: (
      <>
        An icon either side of the label, 6px from it on the compact step and 8px on the default, and 4px closer to its
        edge than the label is (<Mono>pl-2</Mono> / <Mono>pr-2</Mono>, <Mono>pl-3</Mono> / <Mono>pr-3</Mono>: the
        library&rsquo;s inset). Decorative: the label names it.
      </>
    ),
  },
  {
    name: "loading",
    values: "boolean",
    fallback: "false",
    note: "The figure-eight spinner over the label, which stays mounted at opacity 0 so the width holds. The button is disabled meanwhile (the library's way). Client components: being busy is client state.",
  },
  {
    name: "isLink, href",
    values: "true, string",
    fallback: "a <button>",
    note: (
      <>
        Renders <Mono>next/link</Mono> as the root (the library&rsquo;s <Mono>asChild</Mono>) with the same classes and
        internals. A link has no <Mono>disabled</Mono>, so <Mono>loading</Mono> draws its spinner but doesn&rsquo;t stop
        the click.
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
    fallback: "none",
    note: "Kept from the template. It lands on the root, outside the label row that holds the icons, so it changes nothing. No call site uses it: leave it out.",
  },
  {
    name: "className",
    values: "string",
    fallback: "none",
    note: "Width, margins and layout. Merged with tailwind-merge (cn), so a class for something Button sets replaces it silently: never a colour, a radius, a padding or a ring (see Width and placement).",
  },
  {
    name: "ref",
    values: "Ref",
    fallback: "none",
    note: "To the <button> or the <a>: a Menu's trigger takes it, merged with its own.",
  },
];

/** A variant's classes, one per line and never broken at a hyphen: what the wrapper adds, the
 *  root's ink, the surface at rest, then hover and press */
function Classes({ wrapper, root, rest, moves }: { wrapper: string[]; root: string[]; rest: string[]; moves: string[] }) {
  return (
    <span className="flex flex-col gap-2">
      {[wrapper, root, rest, moves].map((group, i) =>
        group.length ? (
          <span key={i} className="flex flex-col gap-0.5">
            {group.map((item) => (
              <Mono key={item} className="whitespace-nowrap">
                {item}
              </Mono>
            ))}
          </span>
        ) : null,
      )}
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
        Fluid Functionalism&rsquo;s button (installed 2026-10-23) behind the site&rsquo;s names: a pill, 28px tall with a
        12px label at every size name (the library&rsquo;s compact step; its 36px default step goes unused), no borders,
        and a press that sinks the surface 1px a side instead of scaling. One component for every action, and with{" "}
        <Mono>isLink</Mono> for a link that&rsquo;s a page&rsquo;s next step.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                For an action: Save, Copy token, Create board. With <Mono>isLink</Mono> and <Mono>href</Mono>, for a link
                that is the page&rsquo;s next step (Create account, Connect your assistant). Never a hand-made{" "}
                <Mono>&lt;button&gt;</Mono> styled to look like one: it misses the focus ring, the press, the spinner and
                the touch area, and it&rsquo;s a second recipe to keep in step.
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
                Eight names, and nothing else, on the library&rsquo;s four looks: <Mono>default</Mono> is its primary (the
                ink), <Mono>secondary</Mono> its tertiary (a hairline ring), <Mono>muted</Mono> its secondary (a
                see-through tint), <Mono>accent</Mono> and <Mono>danger</Mono> the primary with the ink swapped for
                terracotta or red, <Mono>dangerSubtle</Mono> the tint in red, <Mono>transparent</Mono> and{" "}
                <Mono>none</Mono> its ghost. There&rsquo;s no <Mono>primary</Mono>, <Mono>ghost</Mono>,{" "}
                <Mono>outline</Mono> or <Mono>destructive</Mono> on Button itself: the type refuses them.
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
                Seven names on one step. <Mono>xxs</Mono>, <Mono>xs</Mono>, <Mono>sm</Mono>, <Mono>base</Mono> (the
                default), <Mono>md</Mono>, <Mono>lg</Mono> and <Mono>xl</Mono> all render the compact step: 28px tall, a
                12px label. <Mono>md</Mono>, <Mono>lg</Mono> and <Mono>xl</Mono> are kept for call sites and change
                nothing. The label is regular weight and never wraps or shrinks (<Mono>whitespace-nowrap</Mono>): if it
                doesn&rsquo;t fit, shorten the words.
              </>
            ),
          },
          {
            term: "Dashboard",
            text: (
              <>
                <Mono>lg</Mono> and <Mono>xl</Mono> are the names the dashboard and the hero use: the header&rsquo;s
                pills, a board&rsquo;s toolbar, the token page, onboarding&rsquo;s Back, the submit of a dashboard form or
                dialog, the homepage calls to action. They render the same 28px button as <Mono>base</Mono>; the
                marketing site&rsquo;s other buttons say <Mono>xxs</Mono> to <Mono>base</Mono>.{" "}
                <Mono>shape=&quot;pill&quot;</Mono> is accepted and ignored: every button is a pill now, so leave it out
                of new code.
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
                No <Mono>border</Mono>, <Mono>ring-*</Mono> or <Mono>outline-*</Mono> in its className. The surface is a
                layer 1px inside the button whose shadow spread fills it out; the secondary&rsquo;s edge is that
                layer&rsquo;s 1px shadow in <Mono>--border</Mono>, the one stroke colour. A border would sit outside the
                surface, and a ring class replaces the focus ring (both are <Mono>ring-1</Mono>).
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Width, margins and layout only. Button merges classes with <Mono>cn</Mono> (tailwind-merge), so a class
                for something it already sets wins over it silently: a padding undoes the icon inset, a colour undoes the
                variant, and a radius undoes the pill. A colour only for a state the variants don&rsquo;t have: the
                header&rsquo;s Saved fills while you&rsquo;re on it (Header.tsx), and <Mono>none</Mono> is the variant
                for it. One known exception to the padding: the header&rsquo;s Create sets its own
                (<Mono>max-md:px-3 md:px-5</Mono>) on purpose, because its label only joins the icon from md; don&rsquo;t
                copy it elsewhere.
              </>
            ),
          },
          {
            term: "States",
            text: (
              <>
                Hover mixes a tenth of the page into the primary&rsquo;s ink, lightens the tint, and washes the ring and
                ghost looks with <Mono>bg-hover</Mono>, over 80ms, only where a pointer can hover (<Mono>hover:</Mono>{" "}
                sits behind <Mono>@media (hover: hover)</Mono>, so a tap never leaves it stuck). Press collapses the
                surface&rsquo;s 1px shadow spread, so the surface shrinks exactly 1px a side at any width (a scale would
                warp a wide button), 80ms in and 180ms back on <Mono>cubic-bezier(0.23,1,0.32,1)</Mono>; the primary
                darkens a step more and the ring moves inward with the surface. Never add your own{" "}
                <Mono>active:scale</Mono>. Focus is a 1px terracotta ring (<Mono>--focus-ring</Mono>) at the edge, on
                keyboard focus only.
              </>
            ),
          },
          {
            term: "Disabled",
            text: (
              <>
                <Mono>disabled</Mono> while it can&rsquo;t act yet: no name typed (Create board), no reset link. Every
                variant keeps its colours at half opacity (<Mono>disabled:opacity-50</Mono>), ignores the pointer and
                leaves the tab order. A request in flight is <Mono>loading</Mono>, which disables the button too but keeps
                its label and draws the spinner.
              </>
            ),
          },
          {
            term: "Loading",
            text: (
              <>
                Being busy is client state, so it lives in client components. The label stays mounted at opacity 0 under
                the figure-eight spinner, so the width holds; the button is disabled meanwhile (the library&rsquo;s way),
                so focus leaves it and clicks are ignored. Put what&rsquo;s happening in the label, &ldquo;Signing
                in…&rdquo;, and for a form in a status line too: the spinner alone says nothing to a screen reader.
                Under reduced motion the spinner holds still.
              </>
            ),
          },
          {
            term: "Icon only",
            text: (
              <>
                <Mono>iconOnly</Mono> with <Mono>aria-label</Mono> (or <Mono>aria-labelledby</Mono>) saying what it does:
                &ldquo;Close&rdquo;, &ldquo;Copy token&rdquo;, never &ldquo;icon&rdquo;. Without one it doesn&rsquo;t
                compile. The button is a square of its step&rsquo;s height and the library draws the icon at 14px on the
                compact step and 16px on the default (<Mono>[&amp;_svg]:h-3.5</Mono>, <Mono>[&amp;_svg]:h-4</Mono>),
                whatever size it was given. The icon is decorative: the shell hides it.
              </>
            ),
          },
          {
            term: "Touch",
            text: (
              <>
                Every button reaches 44px tall on touch screens through an invisible <Mono>::after</Mono> (
                <Mono>pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2</Mono>
                ), so nothing moves; an icon-only one stays 28px wide. To reach further, use <Mono>before:</Mono> (the
                post panel&rsquo;s remove buttons: <Mono>before:absolute before:-inset-1</Mono>), never{" "}
                <Mono>after:</Mono>, which the touch target uses.
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
      └── Brings its own colours through className
          → none (the ghost; check a variant fits first)`}
        />
        <Flow
          tree={`Which size?
 └── One step for every name (28px, 12px label)
      ├── Inline in a dense editor (+ Add) → xxs
      ├── The site header, beside the nav → xs
      ├── An action in a card, a menu or a small
      │   empty state → sm
      ├── A page's call to action, a form's submit
      │   → base (the default; md is the same)
      └── lg and xl: the same as base, kept for
          call sites (the hero's calls, the
          dashboard's header, a board's toolbar,
          the token page, onboarding's Back → lg;
          Create board in NewBoardDialog, Save at
          the foot of the post panel → xl)`}
        />
      </div>

      <SheetSection
        id="variants"
        title="Variants"
        description="The closed set, at the default size. Point at a specimen and press it. The classes are what the wrapper adds (Button.tsx's variants), then what the library writes: the root's ink (buttonVariants) and the surface layer (bgVariants) at rest, on hover and while pressed."
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
                  <Classes key="c" wrapper={v.wrapper} root={v.root} rest={v.rest} moves={v.moves} />,
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
              why: "primary and ghost are the library's names, not Button's",
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
        description="Every variant at every size. All seven names are one step, the compact 28px button with its 12px label; md, lg and xl render exactly as base and are kept for call sites."
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
            What each size resolves to: every name is the compact step. The library sets its height, padding and type (
            <Mono>h-7 px-3 text-[length:var(--fs-body-compact,12px)] leading-[var(--lh-body-compact,18px)] gap-1</Mono>
            ); the wrapper adds the icon inset and the gap of the label row. The radius is the pill&rsquo;s{" "}
            <Mono>rounded-[20px]</Mono> at every size. An icon-only button is a 28px square. The last column is the
            target on a touch screen.
          </>
        }
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              template="max-content max-content max-content max-content max-content max-content minmax(10rem,1fr)"
              columns={["specimen", "step", "height", "padding", "icon inset, gap", "label", "on touch"]}
              rows={SIZE_SPEC.map((s) => ({
                label: s.name,
                sub: s.sub,
                cells: [
                  <Button key="s" size={s.name}>
                    Save
                  </Button>,
                  <Mono key="st" className="whitespace-nowrap">
                    {s.step}
                  </Mono>,
                  <Mono key="h" tone="primary" className="whitespace-nowrap">
                    {s.height}
                  </Mono>,
                  <Mono key="p" className="whitespace-nowrap">
                    {s.padding}
                  </Mono>,
                  <Mono key="i" className="whitespace-nowrap">
                    {s.icons}
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
<Button type="submit" variant="default" size="xl" disabled={!name.trim()} className="mt-6 w-full">
  Create board
</Button>`}
            incorrect={{
              why: "copied by hand: no focus ring, a scale for a press, no spinner",
              code: `<button
  type="submit"
  disabled={!name.trim()}
  className="mt-6 h-9 w-full rounded-full bg-foreground text-body text-background transition-[background-color,scale] duration-150 hover:bg-inverted-solid-hover active:scale-[0.96] disabled:opacity-50"
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
        description="Rest is live: point at it and press it. Focus is drawn on with the ring's own classes here; Tab onto any specimen for the real one. Disabled keeps every variant's colours at half opacity. Loading runs for two seconds when you click it, and the button is disabled while it does."
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
                  <Button key="f" variant={v.name} tabIndex={-1} className="ring-1 ring-focus-ring">
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
        description="A form's submit, as the sign-in forms do it. The label says what's happening and keeps the width under the spinner; the button is disabled until it's done, so the status line below says so too. Under reduced motion the spinner holds still."
      >
        <Sheet split>{() => <LoadingForm />}</Sheet>
        <div className="mt-6">
          <Code
            correct={`{/* loading while the request runs, disabled while it can't act yet (AuthForms.tsx) */}
<Button type="submit" loading={pending} disabled={waiting} className="w-full">
  {pending ? busy : idle}
</Button>`}
            incorrect={{
              why: "disabled alone while the request runs (the auth forms until 2026-10-18)",
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
            Disabled alone draws no spinner and dims the words that should say what&rsquo;s happening, and the opacity
            class sits on top of the library&rsquo;s own <Mono>disabled:opacity-50</Mono>. <Mono>loading</Mono> disables
            the button as well, and keeps the label legible under the spinner.
          </p>
        </div>
      </SheetSection>

      <SheetSection
        id="icons-and-shape"
        title="Icons and shape"
        description={
          <>
            The slots and the icon-only square across the sizes. An icon beside the label keeps the size it was given
            (here <Mono>size=&quot;sm&quot;</Mono>, 16px; the dashboard header&rsquo;s lg pills draw theirs at 18px,{" "}
            <Mono>size-4.5</Mono>, and a small glyph such as the search&rsquo;s clear at 14px, <Mono>size-3.5</Mono>),
            6px from the label on the compact step and 8px on the default, inset 4px closer to the edge. An icon-only
            button is a circle of its step&rsquo;s height, and the library sizes its icon to 14 or 16px.{" "}
            <Mono>shape=&quot;pill&quot;</Mono> changes nothing: every button is a pill.
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
                  sub: "a circle, named",
                  cells: SIZES.map((s) => (
                    <Button key={s.name} variant="secondary" size={s.name} iconOnly aria-label="Copy">
                      <Copy size="sm" />
                    </Button>
                  )),
                },
                {
                  label: "iconOnly pill",
                  sub: "the same: shape is ignored",
                  cells: SIZES.map((s) => (
                    <Button key={s.name} variant="secondary" size={s.name} shape="pill" iconOnly aria-label="Saved">
                      <BookmarkSimple size="sm" />
                    </Button>
                  )),
                },
                {
                  label: "pill",
                  sub: "the same: shape is ignored",
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
<Button variant="transparent" size="base" iconOnly onClick={onClose} aria-label="Close" className="-mr-2">
  <Close className="size-4" />
</Button>`}
            incorrect={{
              why: "no name: a type error, and only “button” to a screen reader",
              code: `<Button variant="transparent" size="base" iconOnly onClick={onClose} className="-mr-2">
  <Close className="size-4" />
</Button>`,
            }}
          />
          <Code
            correct={`{/* The new token's copy button (ApiTokens.tsx) */}
<Button
  variant="secondary"
  size="lg"
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
        description="isLink renders next/link as the button's root (the library's asChild) with the same classes and internals, so a link and a button look alike: the words have to say where it goes. These are real links. A link opening a new tab says so to screen readers."
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
            correct={`{/* Placed by a plain span: the Button's own box places its surface, spinner and touch area (SearchBox.tsx) */}
<span className="absolute right-3 flex">
  <Button
    variant="transparent"
    size="sm"
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
              why: "a position on the Button itself: cn lets it replace the root's relative, which the surface layer, the spinner and the touch box are placed against",
              code: `<Button
  variant="transparent"
  size="sm"
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
                <Mono>MenuItem</Mono>s with arrow keys, a letter jump and one fluid highlight. Its rules:
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
