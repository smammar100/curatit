// /system/icons: every icon in src/components/fundations/icons, the size scale of the shared
// Icon shell, icons in a Button and beside words, the ones with a fixed meaning and the icon
// each library category draws (dashboard/categoryIcons.ts)
import { Fragment, type ReactNode } from "react";
import Button from "@/components/fundations/elements/Button";
import type { IconProps } from "@/components/fundations/icons/Icon";
import AddressBook from "@/components/fundations/icons/AddressBook";
import AirplaneTilt from "@/components/fundations/icons/AirplaneTilt";
import ArrowUpRight from "@/components/fundations/icons/ArrowUpRight";
import Barbell from "@/components/fundations/icons/Barbell";
import Basketball from "@/components/fundations/icons/Basketball";
import BookOpen from "@/components/fundations/icons/BookOpen";
import BookmarkSimple from "@/components/fundations/icons/BookmarkSimple";
import Briefcase from "@/components/fundations/icons/Briefcase";
import Burger from "@/components/fundations/icons/Burger";
import Camera from "@/components/fundations/icons/Camera";
import CaretDown from "@/components/fundations/icons/CaretDown";
import CaretLeft from "@/components/fundations/icons/CaretLeft";
import CaretRight from "@/components/fundations/icons/CaretRight";
import ChatCircle from "@/components/fundations/icons/ChatCircle";
import ChatDots from "@/components/fundations/icons/ChatDots";
import ChatsCircle from "@/components/fundations/icons/ChatsCircle";
import Check from "@/components/fundations/icons/Check";
import Checkout from "@/components/fundations/icons/Checkout";
import CircleHalf from "@/components/fundations/icons/CircleHalf";
import CircleNotch from "@/components/fundations/icons/CircleNotch";
import Close from "@/components/fundations/icons/Close";
import CoatHanger from "@/components/fundations/icons/CoatHanger";
import CodeIcon from "@/components/fundations/icons/Code";
import Command from "@/components/fundations/icons/Command";
import Copy from "@/components/fundations/icons/Copy";
import Cpu from "@/components/fundations/icons/Cpu";
import CreditCard from "@/components/fundations/icons/CreditCard";
import CurrencyBtc from "@/components/fundations/icons/CurrencyBtc";
import Eye from "@/components/fundations/icons/Eye";
import FilmStrip from "@/components/fundations/icons/FilmStrip";
import FirstAid from "@/components/fundations/icons/FirstAid";
import ForkKnife from "@/components/fundations/icons/ForkKnife";
import GraduationCap from "@/components/fundations/icons/GraduationCap";
import Handshake from "@/components/fundations/icons/Handshake";
import Heart from "@/components/fundations/icons/Heart";
import House from "@/components/fundations/icons/House";
import Key from "@/components/fundations/icons/Key";
import Lightning from "@/components/fundations/icons/Lightning";
import LinkedinLogo from "@/components/fundations/icons/LinkedinLogo";
import ListChecks from "@/components/fundations/icons/ListChecks";
import MapTrifold from "@/components/fundations/icons/MapTrifold";
import Moon from "@/components/fundations/icons/Moon";
import MusicNotes from "@/components/fundations/icons/MusicNotes";
import Newspaper from "@/components/fundations/icons/Newspaper";
import PaintBrush from "@/components/fundations/icons/PaintBrush";
import Pause from "@/components/fundations/icons/Pause";
import Picture from "@/components/fundations/icons/Picture";
import Play from "@/components/fundations/icons/Play";
import Plugs from "@/components/fundations/icons/Plugs";
import Plus from "@/components/fundations/icons/Plus";
import Popcorn from "@/components/fundations/icons/Popcorn";
import Question from "@/components/fundations/icons/Question";
import SealCheck from "@/components/fundations/icons/SealCheck";
import Search from "@/components/fundations/icons/Search";
import SearchSparkle from "@/components/fundations/icons/SearchSparkle";
import ShareNetwork from "@/components/fundations/icons/ShareNetwork";
import ShoppingBag from "@/components/fundations/icons/ShoppingBag";
import SignOut from "@/components/fundations/icons/SignOut";
import Sparkle from "@/components/fundations/icons/Sparkle";
import SquaresFour from "@/components/fundations/icons/SquaresFour";
import Sun from "@/components/fundations/icons/Sun";
import TerminalWindow from "@/components/fundations/icons/TerminalWindow";
import UsersThree from "@/components/fundations/icons/UsersThree";
import WarningCircle from "@/components/fundations/icons/WarningCircle";
import Wrench from "@/components/fundations/icons/Wrench";
import { CATEGORY_ICONS } from "@/components/dashboard/categoryIcons";
import CopyBlock from "@/components/mcp/CopyBlock";
import { CATEGORIES } from "@/lib/categories";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";

type Glyph = (props: IconProps) => ReactNode;

// SearchSparkle is drawn by hand and isn't on the shell: no size prop, and not hidden on its own
const SearchSparkleSpecimen: Glyph = () => <SearchSparkle aria-hidden className="size-6" />;

// Every file in fundations/icons but the shell, A to Z as the folder lists them. Names are
// written out (not read from the function), since a minified build renames functions
const SET: [string, Glyph][] = [
  ["AddressBook", AddressBook],
  ["AirplaneTilt", AirplaneTilt],
  ["ArrowUpRight", ArrowUpRight],
  ["Barbell", Barbell],
  ["Basketball", Basketball],
  ["BookOpen", BookOpen],
  ["BookmarkSimple", BookmarkSimple],
  ["Briefcase", Briefcase],
  ["Burger", Burger],
  ["Camera", Camera],
  ["CaretDown", CaretDown],
  ["CaretLeft", CaretLeft],
  ["CaretRight", CaretRight],
  ["ChatCircle", ChatCircle],
  ["ChatDots", ChatDots],
  ["ChatsCircle", ChatsCircle],
  ["Check", Check],
  ["Checkout", Checkout],
  ["CircleHalf", CircleHalf],
  ["CircleNotch", CircleNotch],
  ["Close", Close],
  ["CoatHanger", CoatHanger],
  ["Code", CodeIcon],
  ["Command", Command],
  ["Copy", Copy],
  ["Cpu", Cpu],
  ["CreditCard", CreditCard],
  ["CurrencyBtc", CurrencyBtc],
  ["Eye", Eye],
  ["FilmStrip", FilmStrip],
  ["FirstAid", FirstAid],
  ["ForkKnife", ForkKnife],
  ["GraduationCap", GraduationCap],
  ["Handshake", Handshake],
  ["Heart", Heart],
  ["House", House],
  ["Key", Key],
  ["Lightning", Lightning],
  ["LinkedinLogo", LinkedinLogo],
  ["ListChecks", ListChecks],
  ["MapTrifold", MapTrifold],
  ["Moon", Moon],
  ["MusicNotes", MusicNotes],
  ["Newspaper", Newspaper],
  ["PaintBrush", PaintBrush],
  ["Pause", Pause],
  ["Picture", Picture],
  ["Play", Play],
  ["Plugs", Plugs],
  ["Plus", Plus],
  ["Popcorn", Popcorn],
  ["Question", Question],
  ["SealCheck", SealCheck],
  ["Search", Search],
  ["SearchSparkle", SearchSparkleSpecimen],
  ["ShareNetwork", ShareNetwork],
  ["ShoppingBag", ShoppingBag],
  ["SignOut", SignOut],
  ["Sparkle", Sparkle],
  ["SquaresFour", SquaresFour],
  ["Sun", Sun],
  ["TerminalWindow", TerminalWindow],
  ["UsersThree", UsersThree],
  ["WarningCircle", WarningCircle],
  ["Wrench", Wrench],
];
const NAME_OF = new Map<unknown, string>(SET.map(([name, glyph]) => [glyph, name]));

// The shell's size prop (Icon.tsx), with the class each step sets
const SIZES: { key: NonNullable<IconProps["size"]>; cls: string; px: number }[] = [
  { key: "xs", cls: "size-3", px: 12 },
  { key: "sm", cls: "size-4", px: 16 },
  { key: "base", cls: "size-5", px: 20 },
  { key: "md", cls: "size-6", px: 24 },
  { key: "lg", cls: "size-7", px: 28 },
  { key: "xl", cls: "size-8", px: 32 },
];

// Icons with one job each, and where that job is done today
const MEANINGS: { icons: [string, Glyph][]; means: ReactNode; where: string }[] = [
  { icons: [["BookmarkSimple", BookmarkSimple]], means: "Saving a post, and the Saved view. Never Heart.", where: "Header, AccountMenu" },
  { icons: [["Heart", Heart]], means: "A post’s likes on Instagram, as scraped. Never for saving.", where: "ObservedEngagement" },
  { icons: [["ArrowUpRight", ArrowUpRight]], means: "A link that leaves Curatit: the post on Instagram, a client’s docs. When it opens a new tab, add “(opens in a new tab)” in an sr-only span, as ClientInstall’s links do.", where: "ClientInstall" },
  { icons: [["Copy", Copy]], means: "Copy to the clipboard. It turns into Check once copied.", where: "CopyBlock, CreativeBreakdown" },
  { icons: [["CaretDown", CaretDown]], means: "Opens a menu or a fold, and turns 180° while it’s open.", where: "Header, ThoughtLine" },
  { icons: [["CaretLeft", CaretLeft], ["CaretRight", CaretRight]], means: "Steps back and forward: slides, posts, a row of tabs.", where: "PostView, Categories" },
  { icons: [["Close", Close]], means: "Closes a dialog, a panel or the search.", where: "NewBoardDialog, PostView, SearchBox" },
  { icons: [["Plus", Plus]], means: "Makes something new (Create in the dashboard header). In the FAQ it turns 45° into a close.", where: "Header, Faq" },
  { icons: [["WarningCircle", WarningCircle]], means: "An error or a concern, always beside the words that explain it.", where: "AuthParts, CreativeBreakdown" },
];

// The 28 categories in their `position` order, each with the icon its slug maps to
const CATEGORY_MAP: { name: string; glyph: Glyph | undefined }[] = CATEGORIES.map((category) => ({
  name: category.name,
  glyph: CATEGORY_ICONS[category.slug],
}));

// A component name may break between its words on a narrow tile (Bookmark|Simple)
function breakable(name: string) {
  return name.split(/(?=[A-Z])/).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <wbr />}
      {part}
    </Fragment>
  ));
}

function How({ children }: { children: ReactNode }) {
  return <span className="text-body-sm text-secondary-foreground">{children}</span>;
}

const USE_CORRECT = `import Plus from "@/components/fundations/icons/Plus";
import Close from "@/components/fundations/icons/Close";

<Button size="sm" leftIcon={<Plus size="sm" />}>
  New board
</Button>

<Button size="xs" variant="muted" iconOnly aria-label="Close">
  <Close size="sm" />
</Button>`;

const USE_INCORRECT = `import { Plus, X } from "lucide-react";

<button onClick={onClose}>
  <X className="h-4 w-4 text-gray-500" />
</button>`;

const SIZE_CORRECT = `<Check size="sm" />
<Check size="sm" className="shrink-0 text-secondary-foreground" />
<SearchSparkle className="size-6 lg:size-7" aria-hidden />`;

const SIZE_INCORRECT = `<Check size="sm" className="size-5" />
<Check />
<Check size="sm" aria-hidden="true" />`;

const PACK = `# In a scratch folder, never in the repo
npm pack @phosphor-icons/core
tar -xzf phosphor-icons-core-*.tgz
# The path to copy is in package/assets/bold/<name>-bold.svg`;

const ADD_CORRECT = `// src/components/fundations/icons/Bell.tsx,
// the d of assets/bold/bell-bold.svg
import Icon, { type IconProps } from "./Icon";

export default function Bell(props: IconProps) {
  return <Icon d="M…" {...props} />;
}`;

const ADD_INCORRECT = `// npm install @phosphor-icons/react
import { Bell } from "@phosphor-icons/react";

<Bell size={16} weight="bold" />`;

export default function Icons() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Icons">
        Phosphor’s bold icons, one component per file in <Mono>fundations/icons</Mono>. Each but SearchSparkle
        draws a single path on the shared Icon shell’s 256-unit grid and fills with <Mono>currentColor</Mono>, so
        it takes the colour of the words around it.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                Import the file and give it a size: <Mono>import Plus from &quot;@/components/fundations/icons/Plus&quot;</Mono>, then{" "}
                <Mono>{`<Plus size="sm" />`}</Mono>. Each file default-exports one icon that takes <Mono>size</Mono> and any SVG prop.
              </>
            ),
          },
          {
            term: "One set",
            text: (
              <>
                Phosphor, bold weight, and nothing else. Never Lucide, Untitled UI, Heroicons or an icon package: two sets
                differ in stroke, corners and grid, and the mix shows on a single row. That’s why only Fluid
                Functionalism’s typography came in, not the rest of its setup, and why the vendored lifeline and
                ThoughtLine had their icons swapped for these.
              </>
            ),
          },
          {
            term: "Sizes",
            text: (
              <>
                <Mono>size</Mono> is <Mono>xs</Mono> 12, <Mono>sm</Mono> 16, <Mono>base</Mono> 20, <Mono>md</Mono> 24,{" "}
                <Mono>lg</Mono> 28 or <Mono>xl</Mono> 32 (<Mono>size-3</Mono> to <Mono>size-8</Mono>). In a Button or beside
                13px text it’s 16; beside a 12px caption, 12. There’s no default: an icon with neither a size nor a{" "}
                <Mono>size-*</Mono> class renders far too large. Existing code also has <Mono>size-3.5</Mono> (14px) and{" "}
                <Mono>size-4.5</Mono> (18px), in the dashboard, the auth pages, the homepage demos and the MCP page (one
                inside a Button). They’re off the scale: leave them, don’t add more. ThoughtLine’s{" "}
                <Mono>size-[1em]</Mono> comes from its upstream and stays.
              </>
            ),
          },
          {
            term: "Prop or class",
            text: (
              <>
                The prop, in all new code: it can only land on the scale. A class only where the prop can’t do the job:
                a size that changes by breakpoint (<Mono>size-6 lg:size-7</Mono>), and SearchSparkle, which has no prop.
                Most existing icons are sized with a class; the ones on the scale (<Mono>size-3</Mono> to{" "}
                <Mono>size-8</Mono>) are fine as they are, so don’t rewrite them. Never both on one icon: <Mono>cx</Mono>{" "}
                has no tailwind-merge, so <Mono>{`size="sm" className="size-5"`}</Mono> puts two widths on one element
                and the stylesheet’s order picks the winner.
              </>
            ),
          },
          {
            term: "Colour",
            text: (
              <>
                The path fills with <Mono>currentColor</Mono>, so an icon takes its line’s colour. Colour the icon itself
                only to set it a step below its words (<Mono>text-secondary-foreground</Mono>), or red for an error, which
                always has words beside it. Never <Mono>fill</Mono>, <Mono>stroke</Mono>, hex or a Tailwind grey.
              </>
            ),
          },
          {
            term: "Screen readers",
            text: (
              <>
                The shell hides every icon (<Mono>aria-hidden</Mono>) until it gets <Mono>aria-label</Mono> or{" "}
                <Mono>aria-labelledby</Mono>; then it’s read as an image with that name (<Mono>role=&quot;img&quot;</Mono>).
                Named or not, it’s never a tab stop (<Mono>focusable=&quot;false&quot;</Mono>, always). So don’t add{" "}
                <Mono>aria-hidden</Mono> by hand, and name an icon only when it says something no words beside it do, like
                the verified seal after a brand’s name.
              </>
            ),
          },
          {
            term: "Icon-only",
            text: (
              <>
                Name the control, not the icon: <Mono>{`<Button iconOnly aria-label="Close">`}</Mono>. Button’s types refuse{" "}
                <Mono>iconOnly</Mono> without <Mono>aria-label</Mono> or <Mono>aria-labelledby</Mono>. A plain{" "}
                <Mono>{`<button>`}</Mono> or link has no such check, so give it <Mono>aria-label</Mono> yourself (the dashboard
                header’s Saved does). The name says what happens (“Close”), never what it shows (“X icon”).
              </>
            ),
          },
          {
            term: "SearchSparkle",
            text: (
              <>
                The one icon off the shell, drawn by hand to match, for searches an assistant runs (the MCP page’s search
                reel). It has no <Mono>size</Mono> prop and isn’t hidden on its own: give it a <Mono>size-*</Mono> class and{" "}
                <Mono>aria-hidden</Mono>.
              </>
            ),
          },
          {
            term: "Not icons",
            text: (
              <>
                A company’s mark: MCP clients’ marks are <Mono>assets/ClientMarks</Mono> and brand logos are images from
                Storage. <Mono>LinkedinLogo</Mono> is the set’s one brand glyph, for the Vision page’s sign-off. The emails
                draw PNGs (<Mono>public/email/icon-*.png</Mono>, Lucide, from the email set), because an email can’t run
                components; they stay in the emails.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A second library or <Mono>@phosphor-icons/react</Mono> in <Mono>package.json</Mono>; an icon drawn as an
                inline <Mono>{`<svg>`}</Mono> in a component (CreativeBreakdown’s fold chevron and the homepage divider’s
                handle are two, and should come from this set); an icon with no size. Illustrations, rings and scenes
                drawn in SVG aren’t icons and stay inline.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which size?
 ├── Beside a 12px caption or meta line → xs (size-3)
 ├── In a Button, or beside 13 or 15px text → sm (size-4)
 ├── On its own in a menu row, a tile or a feature list → base (size-5)
 └── Beside a heading → md (size-6) and up, close to its font size
      (the MCP search reel: size-6 by a 24px query)`}
        />
        <Flow
          tree={`Does the icon need a name?
 ├── Words beside it say the same → no: the shell hides it
 ├── It's all a button or link shows → aria-label on the control
 └── It says what no words do (a verified seal) → aria-label on the icon`}
        />
      </div>

      <SheetSection
        title="Every icon"
        description={
          <>
            All {SET.length}, A to Z, at <Mono>md</Mono> (24px). Look at the shapes before adding one: some files carry
            their own names rather than Phosphor’s (Close, Search, Burger, Checkout, Picture).
          </>
        }
      >
        <Sheet>
          {() => (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]">
              {SET.map(([name, Glyph]) => (
                <li
                  key={name}
                  className="flex min-w-0 flex-col items-center gap-3 rounded-lg bg-card px-1 pt-5 pb-3 text-center"
                >
                  <Glyph size="md" className="text-primary-foreground" />
                  <span className="flex flex-col gap-0.5">
                    <Mono>{breakable(name)}</Mono>
                    {name === "SearchSparkle" && (
                      <span className="text-caption-sm text-secondary-foreground">drawn by hand</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Sizes"
        description={
          <>
            The six steps of the <Mono>size</Mono> prop. The Button’s loading spinner is <Mono>size-4</Mono>, 16px, the size
            for every icon inside a Button.
          </>
        }
      >
        <Sheet split>
          {() => (
            <Matrix
              first="minmax(8rem,max-content)"
              columns={SIZES.map((s) => s.key)}
              rows={[
                {
                  label: "BookmarkSimple",
                  sub: "size prop",
                  cells: SIZES.map((s) => <BookmarkSimple key={s.key} size={s.key} className="text-primary-foreground" />),
                },
                { label: "class", cells: SIZES.map((s) => <Mono key={s.key}>{s.cls}</Mono>) },
                { label: "pixels", cells: SIZES.map((s) => <Mono key={s.key}>{s.px}</Mono>) },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="In context"
        description="In a Button, alone in one, beside words and as the only word. The specimens are buttons that do nothing."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="minmax(17rem,max-content) minmax(16rem,1fr)"
              columns={["specimen", "how"]}
              rows={[
                {
                  label: "leftIcon",
                  sub: "and rightIcon",
                  cells: [
                    <div key="s" className="flex flex-wrap gap-2">
                      <Button size="sm" leftIcon={<Plus size="sm" />}>
                        New board
                      </Button>
                      <Button size="sm" variant="secondary" rightIcon={<ArrowUpRight size="sm" />}>
                        Open on Instagram
                      </Button>
                    </div>,
                    <How key="h">
                      <Mono>{`size="sm"`}</Mono> at every Button size, since its text is 13px at all of them. The Button
                      sets the gap: 4px at <Mono>xxs</Mono>, 6px at <Mono>xs</Mono> and <Mono>sm</Mono>, 8px from{" "}
                      <Mono>base</Mono>.
                    </How>,
                  ],
                },
                {
                  label: "iconOnly",
                  sub: "a square, named on the button",
                  cells: [
                    <div key="s" className="flex flex-wrap gap-2">
                      <Button size="xs" variant="muted" iconOnly aria-label="Close">
                        <Close size="sm" />
                      </Button>
                      <Button size="xs" variant="secondary" iconOnly aria-label="Copy link">
                        <Copy size="sm" />
                      </Button>
                      <Button size="xs" variant="transparent" iconOnly aria-label="Next post">
                        <CaretRight size="sm" />
                      </Button>
                    </div>,
                    <How key="h">
                      <Mono>aria-label</Mono> on the Button says what it does; the icon inside stays hidden. Leave the
                      label out and TypeScript refuses <Mono>iconOnly</Mono>. <Mono>{`size="xs"`}</Mono>, like the theme
                      switch and the phone menu: 28px, and on a touch screen its hit area reaches 44px tall and 36px wide.{" "}
                      <Mono>sm</Mono> (32px) gets no touch hit area yet, so it’s smaller to a finger than <Mono>xs</Mono>.
                    </How>,
                  ],
                },
                {
                  label: "beside a label",
                  sub: "a quiet icon in a line",
                  cells: [
                    <div key="s" className="flex flex-col gap-2">
                      <span className="flex items-center gap-1.5 text-body-sm text-primary-foreground">
                        <Check size="sm" className="shrink-0 text-secondary-foreground" />
                        Saved to Launch ideas
                      </span>
                      <span className="flex items-center gap-1.5 text-caption-lg text-secondary-foreground">
                        <Heart size="xs" className="shrink-0" />
                        Likes
                      </span>
                    </div>,
                    <How key="h">
                      16px by 13px text, 12px by a 12px caption, <Mono>gap-1.5</Mono> between. The caption’s icon takes{" "}
                      <Mono>text-secondary-foreground</Mono> from its line; the first is set a step below its words.
                    </How>,
                  ],
                },
                {
                  label: "aria-label",
                  sub: "the icon is a word",
                  cells: [
                    <span key="s" className="flex items-center gap-1 text-body-sm font-medium text-primary-foreground">
                      Wise
                      <SealCheck size="sm" className="shrink-0" aria-label="Verified" />
                    </span>,
                    <How key="h">
                      Named, the shell drops <Mono>aria-hidden</Mono> and adds <Mono>role=&quot;img&quot;</Mono>, so it’s
                      read as “Wise, Verified”. The post panel’s seal does this.
                    </How>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="One icon, one job"
        description={
          <>
            The icons with a fixed meaning. Give one a second job and people learn neither: never use these{" "}
            {MEANINGS.flatMap((m) => m.icons).length} for anything else, a category included. Category icons aren’t
            exempt either: each stands for its category and nothing else. Three icons have two jobs today, left for the
            owner to settle: Sun (Lifestyle and the light theme), Sparkle (AI and Personalise your feed) and SealCheck
            (Verified and Analysis review). Don’t add a fourth.
          </>
        }
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(12rem,max-content)"
              template="4.5rem minmax(18rem,1fr) minmax(12rem,max-content)"
              columns={["icon", "means", "where"]}
              rows={MEANINGS.map((m) => ({
                label: m.icons.map(([name]) => name).join(" · "),
                cells: [
                  <span key="i" className="flex gap-2 text-primary-foreground">
                    {m.icons.map(([name, Glyph]) => (
                      <Glyph key={name} size="base" />
                    ))}
                  </span>,
                  <How key="m">{m.means}</How>,
                  <Mono key="w">{m.where}</Mono>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Categories"
        description={
          <>
            <Mono>CATEGORY_ICONS</Mono> in <Mono>dashboard/categoryIcons.ts</Mono>, by slug. Every category tab, chip,
            card and folder draws from it; Discover’s All is SquaresFour. A slug left out shows no icon, so a new category
            gets its icon in the same change.
          </>
        }
      >
        <Sheet>
          {() => (
            <ul className="grid grid-cols-2 gap-x-6 lg:grid-cols-4">
              {CATEGORY_MAP.map(({ name, glyph: Glyph }) => (
                <li key={name} className="flex min-w-0 items-center gap-3 border-b border-border-subtle py-3">
                  {Glyph ? (
                    <Glyph size="base" className="shrink-0 text-primary-foreground" />
                  ) : (
                    <span aria-hidden className="size-5 shrink-0" />
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body-sm text-primary-foreground">{name}</span>
                    <Mono>{Glyph ? breakable(NAME_OF.get(Glyph) ?? "?") : "none"}</Mono>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Using one" description="An icon in a Button, and an icon that is the whole Button.">
        <Code correct={USE_CORRECT} incorrect={{ code: USE_INCORRECT, why: "another library, a Tailwind grey, a button with no name" }} />
      </SheetSection>

      <SheetSection
        title="Sizing one"
        description="The prop, with any other classes beside it. A size class only for a size that changes by breakpoint, or for SearchSparkle."
      >
        <Code
          correct={SIZE_CORRECT}
          incorrect={{ code: SIZE_INCORRECT, why: "two widths, no size, and an aria-hidden the shell already sets" }}
        />
      </SheetSection>

      <SheetSection
        title="Adding one"
        description={
          <>
            Unpack Phosphor’s core package outside the repo, copy the path’s <Mono>d</Mono> from the bold file into a new
            file named after the icon in PascalCase (<Mono>bell-bold.svg</Mono> → <Mono>Bell.tsx</Mono>), on the shell like{" "}
            <Mono>Check.tsx</Mono>. The shell draws one path.
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <CopyBlock tone="light" label="the commands" code={PACK} />
          <Code correct={ADD_CORRECT} incorrect={{ code: ADD_INCORRECT, why: "a package for one icon, with its own sizes and weights" }} />
        </div>
      </SheetSection>
    </div>
  );
}
