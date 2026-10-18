// /system/brand: the mark, the wordmark and the lockup (src/components/assets), drawn as each call
// site draws them, in both themes, plus the favicon
import type { ReactNode } from "react";
import Lockup from "@/components/assets/Lockup";
import Logo from "@/components/assets/Logo";
import Symbol from "@/components/assets/Symbol";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../SheetParts";
import { cx } from "@/lib/cx";

// The lockup at 2×, on a grid whose columns are its parts: 16px clear, the 20px mark, the 10px
// gap, the 16 × 72px wordmark, 16px clear (doubled). The labels underneath share the columns
const ANATOMY_COLS = "grid-cols-[2rem_2.5rem_1.25rem_9rem_2rem]";

function Anatomy() {
  return (
    <div className="w-fit">
      <div
        className={cx(
          "grid grid-rows-[2rem_2.5rem_2rem] rounded-sm text-base-900 outline-1 -outline-offset-1 outline-dashed outline-border-strong",
          ANATOMY_COLS,
        )}
      >
        {/* The lockup's own bounds; the dashed line round it is the clear space */}
        <span aria-hidden className="col-start-2 col-end-5 row-start-2 shadow-xs" />
        <Symbol className="col-start-2 row-start-2 size-10" aria-hidden="true" />
        <Logo className="col-start-4 row-start-2 h-8 w-auto self-center" aria-hidden="true" />
      </div>
      <div className={cx("mt-2 grid text-center", ANATOMY_COLS)}>
        <Mono>16</Mono>
        <Mono>20</Mono>
        <Mono>10</Mono>
        <Mono>16 × 72</Mono>
        <Mono>16</Mono>
      </div>
    </div>
  );
}

// A bare mark as its call site sets it: the size class on the SVG, the ink on the element round it
function Mark({ size }: { size: "size-5" | "size-7" | "size-8" }) {
  return (
    <span className="flex text-base-900">
      <Symbol className={size} aria-hidden="true" />
    </span>
  );
}

// Every place the logo appears. `label` is the form in code, `sub` the place, `size` in px at 1×
const USES: { label: string; sub: string; specimen: ReactNode; size: string; where: ReactNode; name: string }[] = [
  {
    label: "<Lockup />",
    sub: "The top of a page",
    specimen: <Lockup />,
    size: "102 × 20",
    where: (
      <>
        <Mono>Navigation</Mono> and <Mono>MobileNav</Mono> (20px and 16px clear above and below), the auth card
        (<Mono>(auth)/layout</Mono>, 24px or more round it), the share page&rsquo;s 80px header (
        <Mono>s/[token]</Mono>)
      </>
    ),
    name: "“Go to homepage”; “Curatit home” on the share page",
  },
  {
    label: "Symbol + Logo",
    sub: "The footer",
    // Drawn on base-950 / base-100, the values of .footer-panel's --f-bg / --f-ink on the light
    // site. The panel's own variables key off the site's theme, not this sheet's theme panels
    specimen: (
      <span className="inline-flex items-center gap-2.5 rounded-2xl bg-base-950 px-4 py-3 text-base-100">
        <Symbol className="footer-mark size-6 shrink-0" aria-hidden="true" />
        <Logo className="h-4 w-auto" aria-hidden="true" />
      </span>
    ),
    size: "24 + 16 × 72",
    where: (
      <>
        <Mono>global/Footer</Mono>, in the inverted panel&rsquo;s own ink (<Mono>--f-ink</Mono>). The mark turns
        once every 3 minutes (<Mono>.footer-mark</Mono>) and holds still under reduced motion
      </>
    ),
    name: "“Curatit home”",
  },
  {
    label: "Symbol size-8",
    sub: "Dashboard header",
    specimen: <Mark size="size-8" />,
    size: "32",
    where: (
      <>
        <Mono>dashboard/Header</Mono> and its loading <Mono>Skeleton</Mono>, where the name would crowd the tabs
        and search
      </>
    ),
    name: "“Your feed”",
  },
  {
    label: "Symbol size-7",
    sub: "Welcome flow",
    specimen: <Mark size="size-7" />,
    size: "28",
    where: (
      <>
        <Mono>onboarding/Welcome</Mono>, centred over the questions between Back and Skip
      </>
    ),
    name: "Not a link",
  },
  {
    label: "Symbol size-6",
    sub: "Beside another app",
    // Each tile copied from its call site: OAuthConsent's round one, then ClientInstall's card
    specimen: (
      <span className="flex gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-base-100 ring-1 ring-edge">
          <Symbol className="size-6 text-base-900" aria-hidden="true" />
        </span>
        <span className="grid size-12 place-items-center rounded-xl bg-white text-base-900 ring-1 ring-edge shadow-[0_10px_24px_-12px_rgb(0_0_0/0.3)]">
          <Symbol className="size-6" aria-hidden="true" />
        </span>
      </span>
    ),
    size: "24 in a 48 tile",
    where: (
      <>
        Paired with the other app&rsquo;s mark: a round <Mono>bg-base-100</Mono> tile in{" "}
        <Mono>auth/OAuthConsent</Mono>, a <Mono>rounded-xl</Mono> white card with a drop shadow in the MCP install
        card (<Mono>mcp/ClientInstall</Mono>)
      </>
    ),
    name: "Not a link",
  },
  {
    label: "Symbol size-5",
    sub: "Homepage demo",
    specimen: <Mark size="size-5" />,
    size: "20",
    where: (
      <>
        <Mono>home/LibraryWindow</Mono>, the dashboard&rsquo;s header drawn small
      </>
    ),
    name: "Not a link",
  },
  {
    label: "glyph={<Symbol />}",
    sub: "Thinking line",
    // ThoughtLine sizes its glyph at 1.1em with a 0.2em gap; McpDemo sets it at 14px in base-600
    specimen: (
      <span className="inline-flex items-center text-[14px] text-base-600">
        <span className="mr-[0.2em] inline-flex size-[1.1em] text-base-900">
          <Symbol className="size-full" aria-hidden="true" />
        </span>
        Searching…
      </span>
    ),
    size: "15 (1.1em)",
    where: (
      <>
        <Mono>home/McpDemo</Mono>, as <Mono>ThoughtLine</Mono>&rsquo;s glyph: decoration beside text, the one use
        under 20px
      </>
    ),
    name: "Not a link",
  },
];

const FAVICON_SIZES = [16, 32, 48];

export default function Brand() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Brand">
        The mark, the &ldquo;Curatit&rdquo; wordmark and the lockup that sets them side by side. All three are SVG
        components in <Mono>src/components/assets</Mono> that draw in the text colour, so each theme gets its own
        ink with no extra classes.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Lockup",
            text: (
              <>
                <Mono>&lt;Lockup /&gt;</Mono>, once, at the top of a page that isn&rsquo;t the dashboard: both
                navigations, the auth card, the share page. It has one size: a 20px mark, a 10px gap and a 16px-tall
                wordmark, 102 &times; 20px. It takes no size or colour.
              </>
            ),
          },
          {
            term: "Mark alone",
            text: (
              <>
                <Mono>&lt;Symbol /&gt;</Mono> where the name won&rsquo;t fit or is already on screen: 32px in the
                dashboard header, 28px in the welcome flow, 24px in a tile beside another app&rsquo;s mark, 20px in the
                homepage&rsquo;s small dashboard. Size it with <Mono>size-5</Mono> to <Mono>size-8</Mono>, nothing
                else.
              </>
            ),
          },
          {
            term: "Wordmark",
            text: (
              <>
                <Mono>&lt;Logo /&gt;</Mono> never stands alone: it&rsquo;s set in Hedvig, the face of every heading,
                so without the mark it reads as one more heading. It appears in the lockup and the footer, always{" "}
                <Mono>h-4</Mono> (16 &times; 72px).
              </>
            ),
          },
          {
            term: "Smallest",
            text: (
              <>
                20px for the mark. Its strokes are 6/125 of its width, about 1px at 20px and thinner below. The thinking
                line&rsquo;s 15px glyph is the one smaller use, and it&rsquo;s decoration beside text, not the logo.
              </>
            ),
          },
          {
            term: "Clear space",
            text: (
              <>
                At least the wordmark&rsquo;s height, 16px, on every side: the phone bar and the share page&rsquo;s
                edge on phones, the tightest real uses. The desktop bar gives 20px, the auth card 24px, the share page
                30px above and below.
              </>
            ),
          },
          {
            term: "Colour",
            text: (
              <>
                Both draw in <Mono>currentColor</Mono>. <Mono>Lockup</Mono> sets <Mono>text-base-900</Mono> itself; a
                bare <Mono>Symbol</Mono> takes <Mono>text-base-900</Mono> on itself or on its link; the footer uses its
                panel&rsquo;s <Mono>--f-ink</Mono>. Never the accent on the site: terracotta marks links and hovers,
                so a terracotta logo reads as one. Emails are the one exception (see Email).
              </>
            ),
          },
          {
            term: "Name",
            text: (
              <>
                Pass <Mono>aria-hidden=&quot;true&quot;</Mono> to the SVGs (<Mono>Lockup</Mono> does) and name the
                link round them by where it goes: &ldquo;Go to homepage&rdquo; in the navigations and the auth card,
                &ldquo;Curatit home&rdquo; in the footer and on the share page, &ldquo;Your feed&rdquo; on the
                dashboard. A mark that isn&rsquo;t a link is decoration.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                Type &ldquo;Curatit&rdquo; in <Mono>font-display</Mono> as the logo (live text waits for the web font
                and takes the heading&rsquo;s tracking; the outlined wordmark is the same everywhere). Pass a class to{" "}
                <Mono>Lockup</Mono>: <Mono>cx</Mono> has no tailwind-merge, so <Mono>text-white</Mono> beside its{" "}
                <Mono>text-base-900</Mono> is settled by stylesheet order. Give the mark a width that isn&rsquo;t its
                height (the SVG keeps its ratio and pads the rest, which throws off alignment). Add a shadow, ring or
                tint to the mark itself (a 48px tile carries its own). Turn the mark anywhere but the footer.
              </>
            ),
          },
          {
            term: "Email",
            text: (
              <>
                Mail clients don&rsquo;t draw inline SVG, so emails have their own <Mono>Lockup</Mono> in{" "}
                <Mono>src/emails/_components/layout.tsx</Mono>: <Mono>curatit-symbol.png</Mono> at 18px (and{" "}
                <Mono>curatit-symbol-dark.png</Mono>) and the name typed in the serif at 22px. It&rsquo;s the only
                place the name is text, and the only terracotta mark: an image can&rsquo;t take{" "}
                <Mono>currentColor</Mono>, and terracotta still reads in light, dark and force-inverted inboxes.
              </>
            ),
          },
          {
            term: "Favicon",
            text: (
              <>
                <Mono>src/app/icon.svg</Mono>, which Next serves at <Mono>/icon.svg</Mono> and links from every page.
                It&rsquo;s a copy of the mark&rsquo;s paths, not an import: change it with <Mono>Symbol.tsx</Mono>.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which form of the logo?
 ├── The top of a marketing, auth or share page → <Lockup /> in a Link to /
 ├── The footer → Symbol size-6 footer-mark + Logo h-4 (Footer has it)
 ├── An app header, no room for the name → <Symbol className="size-8" />
 ├── Beside another app's mark → <Symbol className="size-6" /> in a 48px tile
 ├── An email → Lockup from src/emails/_components/layout.tsx
 └── The browser tab → src/app/icon.svg (nothing to add)`}
        />
        <Flow
          tree={`Which colour?
 ├── <Lockup /> → none to add: it sets text-base-900
 ├── A bare <Symbol /> on the page or a card → text-base-900
 ├── On the footer's panel → var(--f-ink), as Footer sets it
 ├── An email → terracotta, already in the PNGs (nothing to set)
 └── Anything else → still text-base-900; never brand, accent or a hex`}
        />
      </div>

      <SheetSection
        title="Lockup"
        description="One size. The mark is 4px taller than the wordmark so the two read at the same weight; the hairline is the lockup's bounds, the dashed line its clear space."
      >
        <Sheet split>
          {() => (
            <div className="flex flex-wrap items-end gap-x-12 gap-y-8">
              <figure>
                <Anatomy />
                <figcaption className="mt-3 text-caption-lg text-secondary-foreground">
                  At 2&times;, measured in px at 1&times;
                </figcaption>
              </figure>
              <figure>
                <div className="flex h-10 items-center">
                  <Lockup />
                </div>
                <figcaption className="mt-3 text-caption-lg text-secondary-foreground">Actual size</figcaption>
              </figure>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Every use"
        description="Each call site at actual size, with the name its link carries. The lockup has one size; the mark alone runs from 20 to 32px."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(10rem,max-content)"
              template="minmax(8.5rem,max-content) minmax(7rem,max-content) minmax(18rem,1fr) minmax(10rem,max-content)"
              columns={["specimen", "size", "where", "link name"]}
              rows={USES.map((use) => ({
                label: use.label,
                sub: use.sub,
                cells: [
                  <span key="s" className="flex min-h-12 items-center">
                    {use.specimen}
                  </span>,
                  <Mono key="z">{use.size}</Mono>,
                  <span key="w" className="text-body-sm text-secondary-foreground">
                    {use.where}
                  </span>,
                  <span key="n" className="text-body-sm text-secondary-foreground">
                    {use.name}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Favicon"
        description={
          <>
            The file the browser draws in the tab, at 16px (32px on dense screens). A file can&rsquo;t take{" "}
            <Mono>currentColor</Mono>, so its fill is a fixed near-black: on a dark tab bar, as in the dark panel,
            it&rsquo;s dark on dark.
          </>
        }
      >
        <Sheet split>
          {() => (
            <div className="flex items-end gap-8">
              {FAVICON_SIZES.map((px) => (
                <figure key={px} className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon.svg" width={px} height={px} alt="" />
                  <figcaption>
                    <Mono>{px}</Mono>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="In code"
        description="The first is Navigation's link as it is; the second is the dashboard header's, with the aria-hidden and focus ring it doesn't have yet. The link carries the name and the focus ring; the SVGs stay hidden."
      >
        <div className="flex flex-col gap-8">
          <Code
            correct={`import Lockup from "@/components/assets/Lockup";

<Link
  href="/"
  aria-label="Go to homepage"
  className="w-fit shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-border-focus"
>
  <Lockup />
</Link>`}
            incorrect={{
              why: "the name typed in the serif, in the accent",
              code: `<Link href="/" className="font-display text-h5 text-brand-foreground">
  Curatit
</Link>`,
            }}
          />
          <Code
            correct={`import Symbol from "@/components/assets/Symbol";

<Link
  href="/dashboard"
  aria-label="Your feed"
  className="rounded-sm text-base-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-border-focus"
>
  <Symbol className="size-8" aria-hidden="true" />
</Link>`}
            incorrect={{
              why: "a second colour on Lockup, a mark under 20px in the accent",
              code: `<Lockup className="text-white" />

<Symbol className="size-4 text-brand-foreground" />`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
