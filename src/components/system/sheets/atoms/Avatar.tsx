// /system/avatar: Avatar (src/components/fundations/elements/Avatar.tsx), every size and every
// way a picture can be missing, live in both themes. Every class is written out in full, so
// Tailwind sees it
import type { ReactNode } from "react";
import Avatar from "@/components/fundations/elements/Avatar";
import Button from "@/components/fundations/elements/Button";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection } from "../../SheetParts";

// The template's portrait, through the image optimizer at 96px (the 2400px original is half a
// megabyte), and an address that 404s, so the fallback is live
const PICTURE = "/_next/image?url=%2Fimages%2Favatar.jpeg&w=96&q=75";
const BROKEN = "/images/avatars/missing.jpg";

const SIZES = ["xs", "sm", "md", "lg"] as const;
const PX = { xs: "20", sm: "24", md: "32", lg: "44" };

// The ways a person arrives: with a picture, without one, with one that fails, and the names
// that make initials tricky
const CASES: { label: string; sub: string; src?: string | null; name: string }[] = [
  { label: "picture", sub: "src loads", src: PICTURE, name: "Daniel Okafor" },
  { label: "no picture", sub: "src null: initials", src: null, name: "Syed Mohammad Ammar" },
  { label: "broken src", sub: "a 404: initials, no broken icon", src: BROKEN, name: "Priya Raman" },
  { label: "one word", sub: "one letter", name: "Lex" },
  { label: "an email", sub: "its parts are words", name: "jo.martinez@studio.co" },
  { label: "accents, hyphens", sub: "first letter of the first two", name: "Émile Zola-Durand" },
];

// Where each size goes, beside the text it sits with
const BESIDE: { size: (typeof SIZES)[number]; type: string; specimen: ReactNode; use: string }[] = [
  {
    size: "xs",
    type: "text-caption-lg",
    specimen: (
      <span className="flex items-center gap-1.5 text-caption-lg text-secondary-foreground">
        <Avatar size="xs" src={PICTURE} name="Daniel Okafor" decorative />
        Daniel Okafor · 2 days ago
      </span>
    ),
    use: "A byline in a dense row: who saved or noted something, beside 12px text",
  },
  {
    size: "sm",
    type: "text-body-sm",
    specimen: (
      <span className="flex items-center gap-2 text-body-sm text-primary-foreground">
        <Avatar size="sm" name="Priya Raman" decorative />
        Priya Raman
      </span>
    ),
    use: "A list row or a table cell beside 13px text: a board's people, a review's editor",
  },
  {
    size: "md",
    type: "text-body-sm",
    specimen: (
      <span className="flex items-center gap-3">
        <Avatar src={PICTURE} name="Daniel Okafor" decorative />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm font-medium text-primary-foreground">Daniel Okafor</span>
          <span className="truncate text-caption-lg text-secondary-foreground">daniel@okafor.studio</span>
        </span>
      </span>
    ),
    use: "The default: the dashboard header's account button, the head of the account menu",
  },
  {
    size: "lg",
    type: "text-body-base",
    specimen: (
      <span className="flex items-center gap-3">
        <Avatar size="lg" name="Syed Mohammad Ammar" decorative />
        <span className="text-body-base font-medium text-primary-foreground">Syed Mohammad Ammar</span>
      </span>
    ),
    use: "Where the person is the subject: a profile or settings heading, the welcome flow's name step",
  },
];

export default function AvatarSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Avatar">
        A person: their picture in a circle, or their initials on the brand&rsquo;s tint when there&rsquo;s no
        picture or it won&rsquo;t load. Four sizes, 20 to 44px. It names itself unless the name is written beside it.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                A person: the signed-in account in the dashboard header and its menu, whoever saved, noted or edited
                something. One picture or one set of initials per person, never both.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                A brand&rsquo;s or an app&rsquo;s mark is not a person: a plain image with the edge line (BrandName.tsx,
                the consent screen&rsquo;s tiles), square-cornered, never initials. While the session is still being
                read, a <Mono>{'<Skeleton shape="circle">'}</Mono> of the same size, not an empty Avatar.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                <Mono>{"<Avatar src={user.avatar} name={user.name} />"}</Mono>: <Mono>md</Mono>, 32px, named.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                Sizes <Mono>xs</Mono> 20, <Mono>sm</Mono> 24, <Mono>md</Mono> 32, <Mono>lg</Mono> 44, and{" "}
                <Mono>decorative</Mono>. Always a circle. There&rsquo;s no square avatar, status dot, ring or size above
                44: an unlisted value is a bug.
              </>
            ),
          },
          {
            term: "Fallback",
            text: (
              <>
                A missing, <Mono>null</Mono> or broken <Mono>src</Mono> shows the initials, including an image that
                failed before the page hydrated. Never a broken-image icon, a grey silhouette or an empty circle: the
                initials still say who it is. Google&rsquo;s avatar links expire, so the fallback is a normal state.
              </>
            ),
          },
          {
            term: "Initials",
            text: (
              <>
                Up to two letters, the first of the first two words; an email&rsquo;s dots and @ split words. Inter
                medium on <Mono>bg-brand-subtle</Mono> with <Mono>text-on-brand-subtle-foreground</Mono>, as the
                dashboard has shown them since 2026-10-10: the one brand fill that isn&rsquo;t an interaction, kept
                because it marks a person apart from the grey chrome.
              </>
            ),
          },
          {
            term: "Naming",
            text: (
              <>
                <Mono>name</Mono> is required: the picture&rsquo;s alt, the initials&rsquo; label. Add{" "}
                <Mono>decorative</Mono> only when the name is written right beside it (the menu&rsquo;s head), or a
                screen reader reads it twice. Inside a button, the button carries the name (&ldquo;Account
                menu&rdquo;) and the Avatar is decorative.
              </>
            ),
          },
          {
            term: "No click",
            text: (
              <>
                Avatar is a <Mono>span</Mono>. Something that opens on it is a Button around it (
                <Mono>{'variant="none" iconOnly shape="pill"'}</Mono>), which brings the focus ring, the press and the
                44px target.
              </>
            ),
          },
          {
            term: "Image",
            text: (
              <>
                A plain <Mono>img</Mono>, never <Mono>next/image</Mono>: avatar hosts aren&rsquo;t in next.config&rsquo;s
                image list, so the optimizer answers 400. It carries its width and height (no shift while it loads) and
                the edge line, so a white photo still has an edge on the white page.
              </>
            ),
          },
          {
            term: "className",
            text: (
              <>
                Margins and placement only. Never <Mono>size-*</Mono>, <Mono>rounded-*</Mono> or a colour: pick a{" "}
                <Mono>size</Mono>; <Mono>cx</Mono> doesn&rsquo;t merge, so both classes land.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which size?
 ├── A byline beside 12px text → xs (20)
 ├── A list row or table cell beside 13px → sm (24)
 ├── The header, a menu's head → md (32, the default)
 └── The person is the subject: a profile
     heading, the welcome flow → lg (44)`}
        />
        <Flow
          tree={`Named or decorative?
 ├── Alone: a stack of people, a byline
 │   with no name → named (the default)
 ├── The name is written beside it → decorative
 └── Inside a button or a link → decorative;
       the control carries the name
       (aria-label="Account menu")`}
        />
      </div>

      <SheetSection
        title="Sizes and fallbacks"
        description="Every size, with a picture and every way it can be missing. The broken row points at a file that doesn't exist: it shows the initials, never the browser's broken-image box."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(11rem,max-content)"
              template="repeat(4, minmax(4rem,max-content)) minmax(12rem,1fr)"
              columns={[...SIZES.map((s) => `${s} · ${PX[s]}`), "name"]}
              rows={CASES.map((c) => ({
                label: c.label,
                sub: c.sub,
                cells: [
                  ...SIZES.map((size) => <Avatar key={size} size={size} src={c.src} name={c.name} />),
                  <Mono key="n">{c.name}</Mono>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Beside a name"
        description="Each size with the text it sits beside. These are decorative: the name is right there, so the Avatar is hidden from screen readers."
      >
        <Sheet>
          {() => (
            <Matrix
              first="minmax(5rem,max-content)"
              template="minmax(8rem,max-content) minmax(16rem,max-content) minmax(16rem,1fr)"
              columns={["beside", "specimen", "used on"]}
              rows={BESIDE.map((b) => ({
                label: b.size,
                sub: `${PX[b.size]}px`,
                cells: [
                  <Mono key="t">{b.type}</Mono>,
                  <span key="s" className="min-w-0">
                    {b.specimen}
                  </span>,
                  <span key="u" className="text-body-sm text-secondary-foreground">
                    {b.use}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Inside a control"
        description="The account button: Button gives the target, the focus ring and the press; the Avatar is the picture inside it. Tab to it to see the ring."
      >
        <Sheet split>
          {() => (
            <div className="flex flex-wrap items-center gap-6">
              <Button variant="none" iconOnly shape="pill" size="lg" aria-label="Account menu">
                <Avatar src={PICTURE} name="Daniel Okafor" decorative />
              </Button>
              <Button variant="none" iconOnly shape="pill" size="lg" aria-label="Account menu">
                <Avatar src={BROKEN} name="Priya Raman" decorative />
              </Button>
              <span className="text-body-sm text-secondary-foreground">44px buttons, 32px avatars</span>
            </div>
          )}
        </Sheet>
        <div className="mt-6 flex flex-col gap-6">
          <Code
            correct={`{/* The menu's head: the name is beside it */}
<span className="flex items-center gap-3">
  <Avatar src={user.avatar} name={user.name} decorative />
  <span className="text-body-sm font-medium text-primary-foreground">{user.name}</span>
</span>

{/* The trigger: the button is named, the picture is decoration */}
<Button variant="none" iconOnly shape="pill" size="lg" aria-label="Account menu">
  <Avatar src={user.avatar} name={user.name} decorative />
</Button>`}
            incorrect={{
              why: "no alt and no fallback; next/image on a host it refuses",
              code: `<img src={user.avatar} className="size-8 rounded-full" />

<Image src={user.avatar} alt={user.name} width={32} height={32} className="rounded-full" />`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
