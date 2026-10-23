// /system/input: Input (src/components/fundations/elements/Input.tsx), its two sizes in every
// state, its two slots, and how it sits in a Field. A server component: focus is forced on with
// the very shadow the field draws when it's focused. Every class is written out in full
import Button from "@/components/fundations/elements/Button";
import Input from "@/components/fundations/elements/Input";
import Kbd from "@/components/fundations/elements/Kbd";
import Close from "@/components/fundations/icons/Close";
import Search from "@/components/fundations/icons/Search";
import Field from "@/components/fundations/molecules/Field";
import { emailProblem } from "@/lib/auth";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, type Theme } from "../../SheetParts";

// Focus forced on: a descendant selector outranks the field's own shadow-sm (and, with the
// attribute, its red rest ring), so the specimen draws exactly what a focused field does
const FOCUS = "[&_input]:shadow-[0_0_0_2px_var(--color-brand-border-focus)]";
const FOCUS_INVALID = "[&_input[aria-invalid]]:shadow-[0_0_0_2px_var(--color-danger-border-default)]";

const SIZES = [
  { size: "md", sub: "40px · the default" },
  { size: "lg", sub: "44px · the dashboard" },
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
    <div key="invalid-focus" className={`w-full ${FOCUS_INVALID}`}>
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
        The single-line text field, Interfere&rsquo;s: a white surface lifted by the default shadow, the brand ring on
        focus, a red ring when its value has a problem, 16px text on touch screens so iOS doesn&rsquo;t zoom. Two sizes,
        40px for the site and 44px for the dashboard. Its label, hint and error come from Field.
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
                <Mono>Switch</Mono>. The sign-in forms still use <Mono>AuthField</Mono> until they move over.
              </>
            ),
          },
          {
            term: "The set",
            text: (
              <>
                <Mono>size</Mono>: <Mono>md</Mono> (the default: 40px, <Mono>text-body-sm</Mono>, <Mono>rounded-lg</Mono>) or{" "}
                <Mono>lg</Mono> (44px, the dashboard&rsquo;s body role, <Mono>rounded-xl</Mono>). Nothing else exists. Pick{" "}
                <Mono>lg</Mono> only in the dashboard, where it sits beside 44px buttons; a 44px field next to a 40px
                button breaks the row&rsquo;s line.
              </>
            ),
          },
          {
            term: "States",
            text: (
              <>
                <Mono>invalid</Mono> sets <Mono>aria-invalid</Mono> and the ring turns red from the attribute, so
                Field&rsquo;s <Mono>error</Mono> does it without the prop. <Mono>disabled</Mono> is a grey tint with no
                shadow; a value that can&rsquo;t change reads better as plain text, so disable only what can come back.
              </>
            ),
          },
          {
            term: "Slots",
            text: (
              <>
                <Mono>leadingIcon</Mono>: a decorative Phosphor icon, drawn at 16px and never read (the label names the
                field). <Mono>trailing</Mono>: one Kbd or one <Mono>xxs</Mono> icon Button; 24px of room is reserved,
                so anything wider runs over the text. Clicks on a Kbd fall through to the field.
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
                A placeholder as the label: it goes as soon as typing starts and it&rsquo;s under 4.5:1. A colour, height,
                radius, padding or shadow in <Mono>className</Mono>: <Mono>cx</Mono> doesn&rsquo;t merge, so both land and
                the stylesheet decides. The recipe copied onto a raw <Mono>&lt;input&gt;</Mono> (the token form in
                ApiTokens.tsx did): it misses the invalid and disabled states.
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
        description="Both sizes in every state. Focus is forced on here with the same shadow a focused field draws; tab into any field to compare. The red ring at rest is 1px, the focus ring 2px either way."
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
        description="A decorative icon on the left, one small thing on the right. The padding moves to make room, so the text never runs under them."
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
                      What kind of field it is, at a glance. Tertiary ink, secondary while focused, never a name
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
                        trailing={<Kbd size={size === "lg" ? "md" : "sm"} keys={["enter"]} hideOnTouch />}
                      />
                    )),
                    <span key="u" className="text-body-sm text-secondary-foreground">
                      The key that acts on it: Kbd <Mono>sm</Mono> in md, <Mono>md</Mono> in lg. Hidden on touch screens
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
        description="How it's always used: the label above, tied to it; the error under it, red with an icon and the fix in words, read with the field. The column is narrow on purpose, so the error wraps as it does on a phone."
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

{/* The dashboard: lg, beside its 44px buttons */}
<Field label="Name">
  <Input size="lg" name="name" autoComplete="off" spellCheck={false} placeholder="The app or machine it's for" />
</Field>`}
            incorrect={{
              why: "the recipe by hand, a placeholder for a label, className fighting the size",
              code: `<input
  className="mt-1 block h-11 w-full rounded-lg border-0 bg-component-on-container-subtle px-3 text-body shadow-sm focus:shadow-[0_0_0_2px_var(--color-brand-border-focus)] …"
/>

<Input placeholder="Email address" className="h-12 rounded-2xl text-red-600" />`,
            }}
          />
        </div>
      </SheetSection>
    </div>
  );
}
