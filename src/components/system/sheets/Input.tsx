// /system/auth-fields: the auth forms' own field (AuthField and its recipe, inputClass) with its
// label, aside and error note, the notice for a failed attempt (AuthNotice), PasswordField's meter
// and checklist, and when the auth forms check what's typed. The parts that need state are client
// components in ../demos/InputDemos.tsx; the sheet itself stays a server component. Every message
// shown is the real one, from lib/auth.
import Link from "next/link";
import TextLink from "@/components/fundations/elements/TextLink";
import { AuthField, AuthNotice } from "@/components/auth/AuthParts";
import PasswordField from "@/components/auth/PasswordField";
import { authMessage, emailProblem, PASSWORD_RULES, passwordProblem } from "@/lib/auth";
import { Code, Flow, Matrix, Mono, Rules, Sheet, SheetHeader, SheetSection, type Theme } from "../SheetParts";
import { StrengthSample, ValidationDemo } from "../demos/InputDemos";

// Focus forced on, with the value AuthField gives focus: (focus:shadow-[…] in AuthParts.tsx). A
// descendant selector outranks inputClass's shadow-sm, so the specimen draws exactly what a
// focused field does, and a real focus on it looks the same. The error one names
// [aria-invalid] too, to outrank the aria-invalid: variant that draws the 1px ring at rest
const FOCUSED = "w-full [&_input]:shadow-[0_0_0_2px_var(--color-brand-border-focus)]";
const FOCUSED_ERROR = "w-full [&_input[aria-invalid]]:shadow-[0_0_0_2px_var(--color-danger-border-default)]";

// Specimens on a docs page keep the browser and password managers out, so nobody's saved login
// is offered or filled into them (as ValidationDemo does). The real values are in the prose and
// the code examples
const NO_FILL = { autoComplete: "off", "data-1p-ignore": true, "data-lpignore": "true" } as const;

// The email field as every auth form writes it, less its autoComplete="email" (NO_FILL)
const EMAIL = {
  label: "Email address",
  type: "email",
  inputMode: "email",
  placeholder: "you@example.com",
  ...NO_FILL,
} as const;

const MALFORMED = "name@example";

function states(theme: Theme) {
  return [
    {
      label: "empty",
      sub: "at rest",
      specimen: <AuthField id={`${theme}-empty`} {...EMAIL} />,
      drawn: (
        <>
          <Mono>shadow-sm</Mono> as its edge; the placeholder in <Mono>text-tertiary-foreground</Mono>
        </>
      ),
      when: "Nothing typed yet. The placeholder is an example answer, not the label",
    },
    {
      label: "filled",
      specimen: <AuthField id={`${theme}-filled`} {...EMAIL} defaultValue="name@example.com" />,
      drawn: (
        <>
          <Mono>text-primary-foreground</Mono> at <Mono>text-body-sm</Mono>, 16px on touch screens (
          <Mono>pointer-coarse:text-[16px]</Mono>)
        </>
      ),
      when: "Typed, pasted or filled in by the browser",
    },
    {
      label: "focus",
      sub: "forced on here",
      specimen: (
        <div className={FOCUSED}>
          <AuthField id={`${theme}-focus`} {...EMAIL} defaultValue="name@example.com" />
        </div>
      ),
      drawn: (
        <>
          <Mono className="wrap-anywhere">focus:shadow-[0_0_0_2px_var(--color-brand-border-focus)]</Mono>: the
          drop shadow gives way to a 2px brand ring
        </>
      ),
      when: "While typing goes there, from a click, a tap or Tab",
    },
    {
      label: "error",
      specimen: (
        <AuthField id={`${theme}-error`} {...EMAIL} defaultValue={MALFORMED} error={emailProblem(MALFORMED)} />
      ),
      drawn: (
        <>
          <Mono>aria-invalid</Mono>, the note under it linked by <Mono>aria-describedby</Mono>, and a 1px{" "}
          <Mono>danger-border-default</Mono> ring, an <Mono>aria-invalid:</Mono> variant so it outranks{" "}
          <Mono>shadow-sm</Mono>
        </>
      ),
      when: "A check found a problem: on submit, on leaving the email field, or from the server",
    },
    {
      label: "error, focus",
      sub: "forced on here",
      specimen: (
        <div className={FOCUSED_ERROR}>
          <AuthField id={`${theme}-error-focus`} {...EMAIL} defaultValue={MALFORMED} error={emailProblem(MALFORMED)} />
        </div>
      ),
      drawn: (
        <>
          <Mono className="wrap-anywhere">focus:shadow-[0_0_0_2px_var(--color-danger-border-default)]</Mono>:
          the ring stays red while the field is being fixed
        </>
      ),
      when: "Editing a field with a note. The note updates as you type and goes once the field passes",
    },
    {
      label: "disabled",
      specimen: <AuthField id={`${theme}-disabled`} {...EMAIL} defaultValue="name@example.com" disabled />,
      drawn: (
        <>
          <Mono>disabled</Mono>: it takes no focus and no typing, and looks like any other field, which is the gap (see Gaps today)
        </>
      ),
      when: "Not used. A value that can't change is shown as text: Check your email names the address in its heading",
    },
  ];
}

// Typed into the meter: one per level, and the step down for a guessable password
const SAMPLES = [
  { password: "curat", why: "Two rules met or fewer" },
  { password: "Curatit1", why: "Three or four met: here every rule but the symbol" },
  { password: "Moodb0ard!", why: "Every rule, under 12 characters" },
  { password: "Password123!", why: "Every rule and 12 characters, but a common word in it, so a step down" },
  { password: "Moodb0ard!Tide", why: "Every rule, 12 characters or more, nothing easy to guess" },
];

// The aside the sign-in form puts beside its password label (auth/AuthForms.tsx)
const focusRing =
  "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-border-focus";

function ForgotLink() {
  return (
    <Link
      href="/forgot-password"
      className={`-my-1 py-1 text-caption-lg font-medium text-secondary-foreground transition-colors duration-150 ease-out-quint hover:text-brand-foreground ${focusRing}`}
    >
      Forgot password?
    </Link>
  );
}

export default function Input() {
  return (
    <div className="flex flex-col gap-16">
      <SheetHeader title="Auth fields">
        The sign-in and sign-up forms&rsquo; own field: Interfere&rsquo;s 40px input with a label above it and a red
        note under it when something&rsquo;s wrong, the password meter, and the notice for a failed attempt.
        Outside the auth forms, text entry is Field and Input.
      </SheetHeader>

      <Rules
        items={[
          {
            term: "Use",
            text: (
              <>
                Inside the auth forms (src/components/auth/): <Mono>AuthField</Mono> (AuthParts.tsx) for every field,
                its label, input and note in one; <Mono>PasswordField</Mono> when someone chooses a new password;{" "}
                <Mono>AuthNotice</Mono> when the attempt fails.
              </>
            ),
          },
          {
            term: "Instead",
            text: (
              <>
                Everywhere else, <TextLink href="/system/field">Field</TextLink> and{" "}
                <TextLink href="/system/input">Input</TextLink>, and <TextLink href="/system/notice">Notice</TextLink>. Don&rsquo;t
                import AuthField into the dashboard or a marketing page, and don&rsquo;t build a field from{" "}
                <Mono>inputClass</Mono>: that recipe is AuthField&rsquo;s, and it carries no focus ring of its own.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                One size: 40px tall (<Mono>h-10</Mono>), full width, 13px text, <Mono>rounded-lg</Mono>, the white
                control surface (<Mono>bg-component-on-container-subtle</Mono>) with <Mono>shadow-sm</Mono> as its edge.
                AuthField has no size or variant props, and nothing else exists. The dashboard&rsquo;s 32px and 44px
                fields are the same parts at another height (below).
              </>
            ),
          },
          {
            term: "Label",
            text: (
              <>
                Above every field, <Mono>text-body-sm font-medium text-primary-foreground</Mono>, tied to it by{" "}
                <Mono>htmlFor</Mono> and <Mono>id</Mono>, so a tap on the words focuses the field. The placeholder is an
                example answer (<Mono>you@example.com</Mono>), never the label: it&rsquo;s gone once typing starts, and{" "}
                <Mono>text-tertiary-foreground</Mono> is under 4.5:1.
              </>
            ),
          },
          {
            term: "Touch",
            text: (
              <>
                <Mono>pointer-coarse:text-[16px]</Mono>, already in inputClass. iOS Safari zooms the page into a focused
                field under 16px; this sets 16px on touch screens only. Keep it whenever the recipe&rsquo;s parts are
                copied.
              </>
            ),
          },
          {
            term: "Errors",
            text: (
              <>
                Red, the <Mono>WarningCircle</Mono> icon and words that say how to fix it, under the field. The{" "}
                <Mono>error</Mono> prop does all three and sets <Mono>aria-invalid</Mono> and{" "}
                <Mono>aria-describedby</Mono> (added to any id passed in, like PasswordField&rsquo;s checklist), so the
                note is read with the field.
              </>
            ),
          },
          {
            term: "Attributes",
            text: (
              <>
                Say what the field holds, so phones show the right keyboard and browsers fill the right thing. An email
                is <Mono>type=&quot;email&quot; inputMode=&quot;email&quot; autoComplete=&quot;email&quot;</Mono>; a
                password to sign in, <Mono>autoComplete=&quot;current-password&quot;</Mono>; a new one,{" "}
                <Mono>&quot;new-password&quot;</Mono> (PasswordField sets it). A field that isn&rsquo;t about the
                person (a token&rsquo;s name, a board&rsquo;s, a search) is <Mono>autoComplete=&quot;off&quot;</Mono>,
                with <Mono>spellCheck={"{false}"}</Mono> where autocorrect would change what&rsquo;s typed (the token
                name in ApiTokens.tsx).
              </>
            ),
          },
          {
            term: "Never",
            text: (
              <>
                A border or ring on the field (the shadow is its edge: <Mono>border-0</Mono> clears
                @tailwindcss/forms&rsquo; grey border and <Mono>focus:ring-0</Mono> its blue focus ring); the
                browser&rsquo;s own bubbles (the forms are <Mono>noValidate</Mono> and check their own fields); red with
                no icon or words; a disabled submit as the only sign something&rsquo;s missing (the submit stays
                pressable, and the press says what&rsquo;s wrong).
              </>
            ),
          },
          {
            term: "Gaps today",
            text: (
              <>
                inputClass has no disabled styles, so a disabled field looks like an enabled one (the matrix
                below shows it); only its cursor changes. Input&rsquo;s <Mono>fieldClass</Mono>{" "}
                (fundations/elements/Input.tsx) has the fix to copy (<Mono>disabled:bg-disabled</Mono>,{" "}
                <Mono>disabled:text-disabled-foreground</Mono>, <Mono>disabled:shadow-none</Mono>); until AuthParts.tsx
                takes it, don&rsquo;t disable a field.
              </>
            ),
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Flow
          tree={`Which field?
 ├── In an auth form (src/components/auth/)
 │    ├── Someone chooses a new password
 │    │   (sign-up, reset) → PasswordField
 │    └── Anything else → AuthField
 ├── Text entry anywhere else → Field + Input
 │   (Textarea for more than a line)
 ├── Searching → SearchField
 ├── One choice from a few → Segmented
 └── On or off → Switch`}
        />
        <Flow
          tree={`Where does the message go?
 ├── It's about one field (empty, malformed,
 │   already in use) → that field's error prop:
 │   the note under it
 ├── It's about the attempt (a wrong password,
 │   a rate limit, an expired link)
 │     → AuthNotice, above the submit button
 └── It's good news ("Sent again") → a line of
     text-secondary-foreground with role="status"`}
        />
      </div>

      <SheetSection
        title="States"
        description="AuthField itself in each state, in both themes. Focus is forced on with the same shadow a focused field gets, so it shows without a click; click any field to compare."
      >
        <Sheet>
          {(theme) => (
            <Matrix
              first="minmax(7rem,max-content)"
              template="minmax(16rem,20rem) minmax(16rem,1fr) minmax(14rem,1fr)"
              columns={["specimen", "drawn by", "when"]}
              rows={states(theme).map((s) => ({
                label: s.label,
                sub: s.sub,
                cells: [
                  s.specimen,
                  <span key="d" className="text-body-sm text-secondary-foreground">
                    {s.drawn}
                  </span>,
                  <span key="w" className="text-body-sm text-secondary-foreground">
                    {s.when}
                  </span>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection
        title="Anatomy"
        description="A field from the sign-in form: the label with its aside, the input, and the note it gets when the password is left empty."
      >
        <Sheet split>
          {(theme) => (
            <div className="max-w-sm">
              <AuthField
                id={`${theme}-anatomy`}
                label="Password"
                type="password"
                placeholder="••••••••"
                {...NO_FILL}
                aside={<ForgotLink />}
                error="Enter your password."
              />
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Rules
            items={[
              {
                term: "Label",
                text: (
                  <>
                    <Mono>mb-1.5</Mono> above the input, in a row with the aside (
                    <Mono>flex items-baseline justify-between gap-3</Mono>). AuthField uses its <Mono>id</Mono> as the
                    field&rsquo;s <Mono>name</Mono> too.
                  </>
                ),
              },
              {
                term: "Aside",
                text: (
                  <>
                    One quiet link at the label&rsquo;s right, like Forgot password?:{" "}
                    <Mono>text-caption-lg font-medium text-secondary-foreground</Mono>, brand on hover, given 24px to
                    tap without moving the row (<Mono>-my-1 py-1</Mono>). Never a second label or a hint.
                  </>
                ),
              },
              {
                term: "Input",
                text: (
                  <>
                    <Mono>inputClass</Mono>, plus the focus ring, and the danger ring when there&rsquo;s a note.
                  </>
                ),
              },
              {
                term: "Note",
                text: (
                  <>
                    <Mono>mt-1.5</Mono> under the input, <Mono>text-caption-lg text-danger-foreground</Mono>, a{" "}
                    <Mono>size-3.5</Mono> WarningCircle, id <Mono>{"{id}-error"}</Mono>. It wraps; it never truncates.
                  </>
                ),
              },
              {
                term: "In a form",
                text: (
                  <>
                    Fields stacked <Mono>space-y-4</Mono> (16px), the notice and the submit in the same stack; the
                    submit is a <Mono>w-full</Mono> Button at size <Mono>base</Mono>, as tall as the fields.
                  </>
                ),
              },
            ]}
          />
        </div>
        <div className="mt-6">
          <Code
            correct={`<AuthField
  id="email"
  label="Email address"
  type="email"
  inputMode="email"
  autoComplete="email"
  placeholder="you@example.com"
  required
  error={check.errors.email}
/>`}
            incorrect={{
              why: "the placeholder is the only label, 12px text on every screen so iPhones zoom into it, and a ring as its edge",
              code: `<input
  type="email"
  placeholder="Email address"
  className="block h-10 w-full rounded-lg bg-white px-3 text-xs shadow-sm ring-1 ring-base-200 focus:ring-2 focus:ring-accent-500 focus:outline-none"
/>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Errors and the notice"
        description="A field's note says what's wrong with that field; AuthNotice says what went wrong with the attempt. The notice steps aside while any field has a note, so the two never show at once."
      >
        <Sheet>
          {(theme) => (
            <div className="grid max-w-3xl gap-8 sm:grid-cols-2">
              <figure className="flex flex-col gap-3">
                <AuthField
                  id={`${theme}-note`}
                  {...EMAIL}
                  defaultValue={MALFORMED}
                  error={emailProblem(MALFORMED)}
                />
                <figcaption>
                  <Mono>{"error={…}"}</Mono>
                </figcaption>
              </figure>
              <figure className="flex flex-col gap-3">
                <AuthNotice>{authMessage("invalid_credentials")}</AuthNotice>
                <figcaption>
                  <Mono>{"<AuthNotice>"}</Mono>
                </figcaption>
              </figure>
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Rules
            items={[
              {
                term: "Words",
                text: (
                  <>
                    What happened, then what to do, as a sentence with a full stop. Never &ldquo;Invalid input&rdquo;,
                    never an error code. Field notes come from <Mono>emailProblem</Mono> and{" "}
                    <Mono>passwordProblem</Mono>, notices from <Mono>authMessage</Mono> (all in lib/auth.ts), so the
                    server&rsquo;s checks say the same thing.
                  </>
                ),
              },
              {
                term: "Field notes",
                text: (
                  <>
                    &ldquo;{emailProblem("")}&rdquo; &middot; &ldquo;{emailProblem(MALFORMED)}&rdquo; &middot; &ldquo;
                    {passwordProblem("Moodboard")}&rdquo;
                  </>
                ),
              },
              {
                term: "Notices",
                text: (
                  <>
                    &ldquo;{authMessage("invalid_credentials")}&rdquo; &middot; &ldquo;
                    {authMessage("over_request_rate_limit")}&rdquo; &middot; &ldquo;{authMessage("otp_expired")}&rdquo;
                  </>
                ),
              },
              {
                term: "AuthNotice",
                text: (
                  <>
                    <Mono>rounded-lg bg-danger-subtle px-3 py-2.5 text-body-sm text-danger-foreground</Mono> with a{" "}
                    <Mono>size-4</Mono> WarningCircle, and <Mono>role=&quot;alert&quot;</Mono>, so it&rsquo;s read out
                    the moment it appears. It may end with one link that fixes it (Get a new link, on reset password).
                  </>
                ),
              },
            ]}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Password"
        description="PasswordField: the field, a four-step strength meter and the project's rules as a checklist that ticks off as you type. Type in it."
      >
        <Sheet split>
          {(theme) => (
            <div className="max-w-sm">
              <PasswordField id={`${theme}-new-password`} />
            </div>
          )}
        </Sheet>
        <div className="mt-6">
          <Sheet>
            {() => (
              <Matrix
                first="minmax(9rem,max-content)"
                template="minmax(18rem,22rem) minmax(14rem,1fr)"
                align="start"
                columns={["meter and checklist", "why"]}
                rows={SAMPLES.map((s) => ({
                  label: s.password,
                  cells: [
                    <StrengthSample key="m" password={s.password} />,
                    <span key="w" className="text-body-sm text-secondary-foreground">
                      {s.why}
                    </span>,
                  ],
                }))}
              />
            )}
          </Sheet>
        </div>
        <div className="mt-6">
          <Rules
            items={[
              {
                term: "Rules",
                text: (
                  <>
                    {PASSWORD_RULES.map((rule) => rule.label).join(", ")}: <Mono>PASSWORD_RULES</Mono> in lib/auth.ts,
                    the same rules Supabase enforces. Change the two together.
                  </>
                ),
              },
              {
                term: "Levels",
                text: (
                  <>
                    <Mono>strength()</Mono>: a password that misses a rule can&rsquo;t be saved, so it stays Weak or
                    Fair; one that meets them all is Good, Strong from 12 characters, and a step lower when it&rsquo;s
                    easy to guess anyway (a common password, three of one character, four along the alphabet, the digits
                    or the keyboard).
                  </>
                ),
              },
              {
                term: "Colour",
                text: (
                  <>
                    Red, amber, light green, green: <Mono>danger-500</Mono>, <Mono>warning-500</Mono>,{" "}
                    <Mono>success-400</Mono>, <Mono>success-600</Mono>. The word beside the bars says the same in a darker
                    shade, so the level never rests on colour. These raw steps are the meter&rsquo;s alone; status colour
                    anywhere else goes through the semantic <Mono>positive-*</Mono>, <Mono>warning-*</Mono> and{" "}
                    <Mono>danger-*</Mono> tokens, as Notice does.
                  </>
                ),
              },
              {
                term: "Reads",
                text: (
                  <>
                    The word is a polite live region (&ldquo;Password strength: Good&rdquo;); the checklist is the
                    field&rsquo;s description (<Mono>aria-describedby</Mono>), each rule prefixed &ldquo;Done&rdquo; or
                    &ldquo;Needs&rdquo; for screen readers.
                  </>
                ),
              },
              {
                term: "Motion",
                text: (
                  <>
                    The bars fill left to right (<Mono>scale</Mono>, 200ms <Mono>ease-out-quint</Mono>, 40ms apart) and
                    a met rule darkens over 150ms, only as you type; none of it runs under reduced motion.
                  </>
                ),
              },
            ]}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Validation"
        description="When the auth forms check a field (useValidation in auth/AuthForms.tsx). Late the first time, then live: no note while someone is still typing their first try, and a note goes the moment it's fixed."
      >
        <Flow
          tree={`When does a field's note show?
 ├── On submit → every field is checked; if one fails, the
 │   submit is held back and focus moves to the first problem
 ├── On leaving a field → the email only, once something's
 │   typed (a new password's checklist already says what's
 │   missing, so it waits for submit)
 ├── While typing → only in a field that already has a note,
 │   so it clears the moment the field passes
 └── From the server → AuthState.fields (an email already in
     use, a password Supabase turned down), shown under the
     field the same way`}
        />
        <div className="mt-6">
          <Sheet split>
            {() => (
              <div>
                <p className="mb-5 max-w-sm text-body-sm text-secondary-foreground">
                  The sign-in form&rsquo;s checks. Press Sign in with both fields empty, then type{" "}
                  <Mono tone="primary">name@example</Mono> and leave the field.
                </p>
                <ValidationDemo />
              </div>
            )}
          </Sheet>
        </div>
        <div className="mt-6">
          <Code
            correct={`// Inside auth/AuthForms.tsx (useValidation isn't exported): the email is
// checked on leaving it, and the server's findings land under their fields
const check = useValidation({ email: emailProblem, password: enterPassword }, ["email"], state.fields);
const error = check.any ? null : state.error;

<form action={action} {...check.form} className="mt-6 space-y-4">
  <AuthField id="email" label="Email address" type="email" error={check.errors.email} … />
  {error && <AuthNotice>{error}</AuthNotice>}
  <Submit pending={pending} idle="Sign in" busy="Signing in…" />
</form>`}
            incorrect={{
              why: "a note from the first keystroke, and on load before anything's typed",
              code: `const [email, setEmail] = useState("");

<AuthField
  id="email"
  label="Email address"
  value={email}
  onChange={(event) => setEmail(event.target.value)}
  error={emailProblem(email)}
/>`,
            }}
          />
        </div>
      </SheetSection>

      <SheetSection
        title="Fields outside the auth forms"
        description="The dashboard's fields were built by hand from this recipe, at its own sizes and type role, before Field and Input existed; a few differ on purpose. What differs and why, for whoever moves them onto Field and Input. Don't copy them into new code."
      >
        <Rules
          items={[
            {
              term: "Review pages",
              text: (
                <>
                  review/parts.tsx exports <Mono>fieldClass</Mono> (inputClass plus the focus ring),{" "}
                  <Mono>areaClass</Mono> (a textarea) and <Mono>selectClass</Mono> (a select), built from{" "}
                  <Mono>fieldParts</Mono> in the dashboard&rsquo;s <Mono>text-body</Mono>.
                </>
              ),
            },
            {
              term: "Save menu",
              text: (
                <>
                  The new board&rsquo;s name in boards.tsx: the parts at 32px (<Mono>h-8</Mono>) beside a 32px Create,
                  so the form fills the 44px row it replaces. Its label is <Mono>sr-only</Mono>, since the row it opened
                  from said New board.
                </>
              ),
            },
            {
              term: "New board",
              text: (
                <>
                  NewBoardDialog.tsx sets the name large and centred (<Mono>font-display text-display font-light</Mono>,
                  28px, so it needs no touch size) over a two-line description. Both stay transparent until focus fills
                  them with <Mono>bg-card</Mono>, with no ring, and their labels are <Mono>sr-only</Mono> because the
                  dialog&rsquo;s title names them: the dialog has one subject, and the name is it.
                </>
              ),
            },
            {
              term: "Search pill",
              text: (
                <>
                  SearchBox.tsx: a 52px pill (<Mono>h-13 rounded-full</Mono>) whose label wraps the icon and a{" "}
                  <Mono>type=&quot;search&quot;</Mono> input, with an <Mono>sr-only</Mono> &ldquo;Search the
                  library&rdquo; and <Mono>autoComplete=&quot;off&quot;</Mono>. Its 2px ring is an inset shadow on{" "}
                  <Mono>focus-within</Mono>, because the BorderBeam&rsquo;s wrapper clips everything outside the pill,
                  and Clear puts focus back in the field. The one field with the beam.
                </>
              ),
            },
            {
              term: "Settings",
              text: (
                <>
                  The token name in ApiTokens.tsx is 44px (<Mono>h-11</Mono>) in <Mono>text-body</Mono>, the
                  dashboard&rsquo;s settings size, with its label above in <Mono>text-caption</Mono>.
                </>
              ),
            },
            {
              term: "Template",
              text: (
                <>
                  sites/SearchDialog.tsx (the template&rsquo;s search) uses the recipe&rsquo;s parts at 36px (
                  <Mono>h-9</Mono>) in <Mono>text-caption-lg</Mono>, 12px on desktop and 16px on touch screens. Still
                  wrong: its placeholder (&ldquo;Search posts...&rdquo;) is its only label, with no{" "}
                  <Mono>&lt;label&gt;</Mono> or <Mono>aria-label</Mono>. Moving it onto SearchField fixes both.
                </>
              ),
            },
            {
              term: "When copied",
              text: (
                <>
                  Every hand-built copy needs <Mono>border-0</Mono> and <Mono>focus:ring-0</Mono> (without them
                  @tailwindcss/forms draws its grey border, and on focus a 1px blue ring over the brand one that turned it
                  purple) and <Mono>pointer-coarse:text-[16px]</Mono>. Each copy is one more place for these to go
                  missing, which is why new code uses the components.
                </>
              ),
            },
          ]}
        />
      </SheetSection>
    </div>
  );
}
