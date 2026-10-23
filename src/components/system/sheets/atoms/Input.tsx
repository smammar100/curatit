// /system/input: Input (src/components/fundations/elements/Input.tsx), its two sizes in every
// state, its two slots, and how it sits in a Field. A server component: focus is forced on with
// the very surface and outline the field draws when it's focused. Every class is written out in
// full
import Button from "@/components/fundations/elements/Button";
import Input from "@/components/fundations/elements/Input";
import Kbd from "@/components/fundations/elements/Kbd";
import Close from "@/components/fundations/icons/Close";
import Search from "@/components/fundations/icons/Search";
import Field from "@/components/fundations/molecules/Field";
import { emailProblem } from "@/lib/auth";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, type Theme } from "../../SheetParts";

// Focus forced on: what a focused field draws is the card surface (focus:bg-surface-3) and the
// page's 1px focus outline (focus-visible), so the specimen sets both from outside. A descendant
// selector outranks the field's own rest fill, and [&_input:hover] its hover tint, so the
// specimen stays as it would with a caret in it. The red ring is a box-shadow on a separate
// property, so the invalid specimen keeps it under the same classes
const FOCUS =
  "[&_input]:bg-surface-3 [&_input:hover]:bg-surface-3 [&_input]:outline-1 [&_input]:outline-offset-2 [&_input]:outline-[color:var(--focus-ring)]";

const SIZES = [
  { size: "md", sub: "28px · compact, the default" },
  { size: "lg", sub: "28px · the same as md, kept for call sites" },
] as const;

const EMAIL = { type: "email", inputMode: "email", autoComplete: "off", placeholder: "you@example.com" } as const;
const MALFORMED = "maya@northwind";

function states(theme: Theme, size: "md" | "lg") {
  const id = (state: string) => `${theme}-${size}-${state}`;
  return [
    <Input key="rest" id={id("rest")} aria-label="Email address, at rest" size={size} className="w-full" {...EMAIL} />,
    <Input
      key="filled"
      id={id("filled")}
      aria-label="Email address, filled"
      size={size}
      className="w-full"
      {...EMAIL}
      defaultValue="maya@northwind.studio"
    />,
    <div key="focus" className={`w-full ${FOCUS}`}>
      <Input id={id("focus")} aria-label="Email address, focused" size={size} {...EMAIL} defaultValue="maya@northwind.studio" />
    </div>,
    <Input
      key="invalid"
      id={id("invalid")}
      aria-label="Email address, invalid"
      size={size}
      className="w-full"
      invalid
      {...EMAIL}
      defaultValue={MALFORMED}
    />,
    <div key="invalid-focus" className={`w-full ${FOCUS}`}>
      <Input
        id={id("invalid-focus")}
        aria-label="Email address, invalid and focused"
        size={size}
        invalid
        {...EMAIL}
        defaultValue={MALFORMED}
      />
    </div>,
    <Input
      key="disabled"
      id={id("disabled")}
      aria-label="Email address, disabled"
      size={size}
      className="w-full"
      disabled
      {...EMAIL}
      defaultValue="maya@northwind.studio"
    />,
  ];
}

export default function InputSheet() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Input">
        The single-line text field, since 2026-10-23 on Fluid Functionalism&rsquo;s field recipe: the one stroke as a
        1px ring on no fill, a faint tint under the pointer, the card surface while focused with the page&rsquo;s 1px
        terracotta outline, a red ring when its value has a problem, 16px text on touch screens so iOS doesn&rsquo;t
        zoom. Its height and corners come from the size and shape providers: a 28px pill by default. Its label, hint
        and error come from Field.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: <>One line of text: a name, an email address, a URL, a token&rsquo;s name. Always inside a Field, which gives it a label the browser ties to it.</>,
          },
          {
            term: "Instead",
            text: (
              <>
                Text that may run past a line is <Mono>Textarea</Mono>; finding or filtering is <Mono>SearchField</Mono>{" "}
                (icon, clear button, Escape); one of two to five fixed values is <Mono>Segmented</Mono>; on or off is{" "}
                <Mono>Switch</Mono>. The sign-in forms keep their own <Mono>AuthField</Mono> (/system/auth-fields).
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>size</Mono>: <Mono>md</Mono> (the default) or <Mono>lg</Mono>, both the library&rsquo;s compact
                step (28px, 12/18 text, <Mono>px-2.5</Mono>); <Mono>lg</Mono> is kept for call sites and renders the
                same. Nothing else exists. Both are pills, <Mono>rounded-[20px]</Mono>, from the shape provider at the
                root; it is the one step every control uses, so a field beside a Button of any size shares its line.
              </>
            ),
          },
          {
            term: "Drawn",
            text: (
              <>
                <Mono>ring-1 ring-border</Mono> on <Mono>bg-transparent</Mono>: the stroke is the field, there is no
                fill. <Mono>hover:bg-hover</Mono> tints it 4% of the ink under the pointer;{" "}
                <Mono>focus:bg-surface-3</Mono> lifts it to the card surface (white in light, where only the outline
                shows the change; a step lighter than the page in dark); the page&rsquo;s{" "}
                <Mono>focus-visible</Mono> outline, 1px of <Mono>--focus-ring</Mono> 2px out, is the focus mark. Text is{" "}
                <Mono>text-foreground</Mono>, the placeholder <Mono>text-muted-foreground</Mono>. Colour moves in 80ms (
                <Mono>duration-80</Mono>), the library&rsquo;s one transition.
              </>
            ),
          },
          {
            term: "States",
            text: (
              <>
                <Mono>invalid</Mono> sets <Mono>aria-invalid</Mono> and the ring turns <Mono>ring-destructive/50</Mono>{" "}
                from the attribute (it stays red while focused), so Field&rsquo;s <Mono>error</Mono> does it without
                the prop. <Mono>disabled</Mono> is the whole field at half opacity (<Mono>disabled:opacity-50</Mono>)
                with no hover tint and a not-allowed cursor; a value that can&rsquo;t change reads better as plain
                text, so disable only what can come back.
              </>
            ),
          },
          {
            term: "Slots",
            text: (
              <>
                <Mono>leadingIcon</Mono>: a decorative Phosphor icon, drawn at 14px in the muted ink (the ink while the
                field is focused) and never read: the label names the field. <Mono>trailing</Mono>: one Kbd or one{" "}
                <Mono>xxs</Mono> icon Button; the padding steps out to <Mono>pr-8</Mono> (md) or <Mono>pr-9</Mono> (lg)
                to make room, so anything wider runs over the text. Clicks on a Kbd fall through to the field.
              </>
            ),
          },
          {
            term: "Attributes",
            text: (
              <>
                The real <Mono>type</Mono> and <Mono>inputMode</Mono> (the phone keyboard follows them).{" "}
                <Mono>autoComplete</Mono> on identity fields (<Mono>email</Mono>, <Mono>name</Mono>); on names of things,
                codes and slugs <Mono>autoComplete=&quot;off&quot;</Mono> and <Mono>spellCheck=&#123;false&#125;</Mono>,
                because suggestions there are noise.
              </>
            ),
          },
          {
            term: "Width",
            text: (
              <>
                It fills its container. Size it with layout classes on <Mono>className</Mono>, which lands on the wrapper
                (<Mono>max-w-sm</Mono>, <Mono>flex-1</Mono>); every other prop and <Mono>ref</Mono> go to the{" "}
                <Mono>&lt;input&gt;</Mono>.
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A placeholder as the label: it goes as soon as typing starts and the muted ink is for hints. A colour,
                height, radius, padding or ring in <Mono>className</Mono>: it lands on the wrapper, not the field, so it
                does nothing or fights the layout. The recipe copied onto a raw <Mono>&lt;input&gt;</Mono>: it misses the
                provider&rsquo;s height and corners, the invalid and disabled states and the touch-screen size.
              </>
            ),
          },
        ]}
      />

      <Flow
        tree={`What does the person enter?
 ├── Words to find or filter something → SearchField
 ├── Text that may run past one line → Textarea
 ├── One line: a name, an email, a URL → Input
 ├── One of 2–5 fixed values → Segmented
 ├── On or off, applied at once → Switch
 └── Yes or no, read when the form is sent → Checkbox
Then put it in a Field for its label, hint and error.`}
      />

      <SheetSection
        title="Sizes and states"
        description="Both sizes in every state. Focus is forced on here with what a focused field draws: the card surface and the page's 1px outline; tab into any field to compare. The red ring is the one stroke in the danger colour at half strength, at rest and focused alike. Disabled is the whole field at half opacity."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="repeat(6, minmax(12rem,1fr))"
              columns={["rest", "filled", "focus", "invalid", "invalid · focus", "disabled"]}
              rows={SIZES.map(({ size, sub }) => ({ label: size, sub, cells: states(theme, size) }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Slots"
        description="A decorative icon on the left, one small thing on the right. The padding steps out to make room, so the text never runs under them."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(9rem,max-content)"
              template="repeat(2, minmax(14rem,1fr)) minmax(14rem,1fr)"
              columns={["md", "lg", "for"]}
              rows={[
                {
                  label: "leadingIcon",
                  sub: "<Search />",
                  cells: [
                    ...(["md", "lg"] as const).map((size) => (
                      <Input
                        key={size}
                        id={`${theme}-icon-${size}`}
                        aria-label="Filter boards"
                        size={size}
                        className="w-full"
                        leadingIcon={<Search />}
                        placeholder="Filter boards"
                        autoComplete="off"
                      />
                    )),
                    <span key="u" className="text-body-sm text-secondary-foreground">
                      What kind of field it is, at a glance. 14px in the muted ink, the ink while focused, never a name
                    </span>,
                  ],
                },
                {
                  label: "trailing · Kbd",
                  sub: "a key to press",
                  cells: [
                    ...(["md", "lg"] as const).map((size) => (
                      <Input
                        key={size}
                        id={`${theme}-kbd-${size}`}
                        aria-label="Board name"
                        size={size}
                        className="w-full"
                        defaultValue="Spring launch references"
                        autoComplete="off"
                        trailing={<Kbd size="sm" keys={["enter"]} hideOnTouch />}
                      />
                    )),
                    <span key="u" className="text-body-sm text-secondary-foreground">
                      The key that acts on it: Kbd <Mono>sm</Mono> (16px) in both, since both fields are 28px, drawn as
                      a cap on the hover tint. Hidden on touch screens
                    </span>,
                  ],
                },
                {
                  label: "trailing · Button",
                  sub: "xxs, icon only",
                  cells: [
                    ...(["md", "lg"] as const).map((size) => (
                      <Input
                        key={size}
                        id={`${theme}-btn-${size}`}
                        aria-label="Token name"
                        size={size}
                        className="w-full"
                        defaultValue="Claude Code on the studio Mac"
                        autoComplete="off"
                        trailing={
                          <Button size="xxs" variant="transparent" iconOnly aria-label="Clear the name">
                            <Close className="size-3.5" />
                          </Button>
                        }
                      />
                    )),
                    <span key="u" className="text-body-sm text-secondary-foreground">
                      One action on the value. A clear button with Escape is SearchField&rsquo;s: use that rather than
                      building one
                    </span>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="In a Field"
        description="How it's always used: the label above in the muted ink, brightening while the field is focused and set a notch in from its edge; the error under it, red with an icon and the fix in words, read with the field. The column is narrow on purpose, so the error wraps as it does on a phone."
      >
        <Sheet split>
          {(theme) => (
            <div className="flex max-w-xs flex-col gap-6">
              <Field label="Email address" description="Where the board's link goes.">
                <Input id={`${theme}-field-ok`} {...EMAIL} defaultValue="maya@northwind.studio" />
              </Field>
              <Field label="Email address" error={emailProblem(MALFORMED)} required>
                <Input id={`${theme}-field-bad`} {...EMAIL} defaultValue={MALFORMED} />
              </Field>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Code
            correct={`<Field label="Email address" error={problem}>
  <Input type="email" name="email" inputMode="email" autoComplete="email" placeholder="you@example.com" />
</Field>

{/* lg: the same 28px field as md, the name kept for call sites (beside lg buttons, also 28px) */}
<Field label="Name">
  <Input size="lg" name="name" autoComplete="off" spellCheck={false} placeholder="The app or machine it's for" />
</Field>`}
            incorrect={{
              why: "the recipe by hand, a placeholder for a label, className fighting the size",
              code: `<input
  className="mt-1 block h-7 w-full rounded-[20px] border-0 bg-transparent px-2.5 ring-1 ring-border hover:bg-hover focus:bg-surface-3 …"
/>

<Input placeholder="Email address" className="h-12 rounded-none bg-surface-3" />`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
