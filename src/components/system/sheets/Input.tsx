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

// Focus forced on with what a focused field draws (AuthParts.tsx): the card surface
// (focus:bg-surface-3) and the page's 1px focus outline. A descendant selector outranks
// inputClass's rest fill and, with :hover, its hover tint, so the specimen draws exactly what a
// focused field does, and a real focus on it looks the same. The red ring is a box-shadow on a
// separate property, so the error specimen keeps it under the same classes
const FOCUSED =
  "w-full [&_input]:bg-surface-3 [&_input:hover]:bg-surface-3 [&_input]:outline-1 [&_input]:outline-offset-2 [&_input]:outline-[color:var(--focus-ring)]";

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
          <Mono>ring-1 ring-border</Mono> on <Mono>bg-transparent</Mono>: the one stroke is the field, there is no fill;
          the placeholder in <Mono>text-muted-foreground</Mono>
        </>
      ),
      when: "Nothing typed yet. The placeholder is an example answer, not the label",
    },
    {
      label: "filled",
      specimen: <AuthField id={`${theme}-filled`} {...EMAIL} defaultValue="name@example.com" />,
      drawn: (
        <>
          <Mono>text-foreground</Mono> (the ink) at the compact body size, 12/18; 16px on touch screens (
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
          <Mono>focus:bg-surface-3</Mono>, the card surface (white in light, where the outline alone shows the change;
          a step lighter than the page in dark), and the page&rsquo;s <Mono>focus-visible</Mono> outline: 1px of{" "}
          <Mono>--focus-ring</Mono>, 2px out. Under the pointer before that, <Mono>hover:bg-hover</Mono>
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
          <Mono>aria-invalid</Mono>, the note under it linked by <Mono>aria-describedby</Mono>, and the ring turned{" "}
          <Mono>aria-invalid:ring-destructive/50</Mono> (the danger red at half), keyed off the attribute as the shared
          Input&rsquo;s is
        </>
      ),
      when: "A check found a problem: on submit, on leaving the email field, or from the server",
    },
    {
      label: "error, focus",
      sub: "forced on here",
      specimen: (
        <div className={FOCUSED}>
          <AuthField id={`${theme}-error-focus`} {...EMAIL} defaultValue={MALFORMED} error={emailProblem(MALFORMED)} />
        </div>
      ),
      drawn: (
        <>
          <Mono>aria-invalid:focus:ring-destructive/50</Mono>: the ring stays red while the field is being fixed; the
          terracotta outline marks the focus
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
        The sign-in and sign-up forms&rsquo; own field: since 2026-10-23 the shared Input&rsquo;s Fluid Functionalism
        recipe at the compact step (a 28px pill, the one stroke as a 1px ring on no fill, the card surface and the
        page&rsquo;s terracotta outline while focused, a red ring when something&rsquo;s wrong), written out in
        AuthParts.tsx with its label above in the muted ink and a red note under it, the password meter, and the
        notice for a failed attempt. Outside the auth forms, text entry is Field and Input, which draw the same.
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
                <Mono>inputClass</Mono>: it is the shared Input&rsquo;s recipe copied out for these four forms, and a
                third copy is one more place for it to drift.
              </>
            ),
          },
          {
            term: "Default",
            text: (
              <>
                One size, the library&rsquo;s compact step: 28px tall (<Mono>h-7</Mono>), full width, the compact body
                text (<Mono>text-[length:var(--fs-body-compact,12px)] leading-[var(--lh-body-compact,18px)]</Mono>,
                12/18), <Mono>rounded-[20px]</Mono>, <Mono>px-2.5</Mono>,{" "}
                <Mono>ring-1 ring-border</Mono> on <Mono>bg-transparent</Mono>: the stroke is the edge, there is no fill
                and no shadow. <Mono>hover:bg-hover</Mono> tints it 4% of the ink under the pointer;{" "}
                <Mono>focus:bg-surface-3</Mono> lifts it to the card surface. Colour moves in 80ms (
                <Mono>duration-80</Mono>). AuthField has no size or variant props, and nothing else exists; it is the
                shared Input at <Mono>size=&quot;lg&quot;</Mono> without the provider.
              </>
            ),
          },
          {
            term: "Label",
            text: (
              <>
                Above every field, <Mono>text-body text-muted-foreground</Mono>, inset <Mono>px-2.5</Mono> like
                Field&rsquo;s labels (a notch in from the field&rsquo;s edge, so the words start where the typed text
                does), tied to it by <Mono>htmlFor</Mono> and <Mono>id</Mono>, so a tap on the words focuses the field.
                Unlike Field&rsquo;s, it doesn&rsquo;t brighten while the field is focused or turn red with an error.
                The placeholder is an example answer (<Mono>you@example.com</Mono>), never the label: it&rsquo;s gone
                once typing starts.
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
                Red (<Mono>text-destructive</Mono>, <Mono>text-caption</Mono>), the <Mono>WarningCircle</Mono> icon and
                words that say how to fix it, under the field at the label&rsquo;s inset. The <Mono>error</Mono> prop
                does all three and sets <Mono>aria-invalid</Mono> (which turns the ring red) and{" "}
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
                A fill, a shadow or a second border on the field (the ring is its edge: <Mono>border-0</Mono> clears
                @tailwindcss/forms&rsquo; grey border and <Mono>focus:ring-border</Mono> keeps the plugin&rsquo;s blue
                focus ring colour off); an outline of its own (the page&rsquo;s <Mono>focus-visible</Mono> rule draws
                the one every control wears); the browser&rsquo;s own bubbles (the forms are <Mono>noValidate</Mono> and
                check their own fields); red with no icon or words; a disabled submit as the only sign something&rsquo;s
                missing (the submit stays pressable, and the press says what&rsquo;s wrong).
              </>
            ),
          },
          {
            term: "Gaps today",
            text: (
              <>
                inputClass has no disabled styles, so a disabled field looks like an enabled one (the matrix
                below shows it); only its cursor changes. Input&rsquo;s <Mono>fieldClass</Mono>{" "}
                (fundations/elements/Input.tsx) does it the library&rsquo;s way, the whole field at half opacity (
                <Mono>disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent</Mono>); until
                AuthParts.tsx takes the same, don&rsquo;t disable a field. And the label stays muted whatever the field
                does, where Field&rsquo;s follows focus and error.
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
        description="AuthField itself in each state, in both themes. Focus is forced on with what a focused field draws, the card surface and the page's 1px outline, so it shows without a click; click any field to compare."
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
                    <Mono>mb-1</Mono> above the input, in a row with the aside (
                    <Mono>flex items-baseline justify-between gap-3 px-2.5</Mono>), the label itself{" "}
                    <Mono>text-body text-muted-foreground</Mono>. AuthField uses its <Mono>id</Mono> as the field&rsquo;s{" "}
                    <Mono>name</Mono> too.
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
                    <Mono>inputClass</Mono>, plus <Mono>aria-invalid:ring-destructive/50</Mono> when there&rsquo;s a note.
                  </>
                ),
              },
              {
                term: "Note",
                text: (
                  <>
                    <Mono>mt-1 px-2.5</Mono> under the input, <Mono>text-caption text-destructive</Mono>, a{" "}
                    <Mono>size-3.5</Mono> WarningCircle, id <Mono>{"{id}-error"}</Mono>. It wraps; it never truncates.
                  </>
                ),
              },
              {
                term: "In a form",
                text: (
                  <>
                    Fields stacked <Mono>space-y-4</Mono> (16px), the notice and the submit in the same stack; the
                    submit is a <Mono>w-full</Mono> primary Button at size <Mono>base</Mono>.
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
              why: "the placeholder is the only label, 12px text on every screen so iPhones zoom into it, and a white fill lifted by a shadow (the old recipe) in place of the one stroke",
              code: `<input
  type="email"
  placeholder="Email address"
  className="block h-10 w-full rounded-lg bg-surface-3 px-3 text-xs shadow-sm focus:outline-hidden"
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
                    <Mono>rounded-[20px] bg-danger-subtle px-3.5 py-2.5 text-body text-danger-foreground</Mono> (the
                    field&rsquo;s pill corners, so the two sit as one stack) with a <Mono>size-4</Mono> WarningCircle, and{" "}
                    <Mono>role=&quot;alert&quot;</Mono>, so it&rsquo;s read out the moment it appears. It may end with
                    one link that fixes it (Get a new link, on reset password).
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
        description="Where the rest of the site's text entry stands: most of it is on the shared Field and Input now, and what isn't is listed here with why, for whoever moves it over. Don't copy any of it into new code."
      >
        <Rules
          items={[
            {
              term: "Review pages",
              text: (
                <>
                  On Field, Input and Textarea (FieldGroup over each set) since 2026-10-19. Only the selects are
                  still hand-built: review/parts.tsx&rsquo;s <Mono>selectClass</Mono>, built from{" "}
                  <Mono>fieldParts</Mono>, which is still the old Interfere recipe (a white fill with{" "}
                  <Mono>shadow-sm</Mono> as its edge, 40px, <Mono>rounded-lg</Mono>) in the dashboard&rsquo;s{" "}
                  <Mono>text-body</Mono>. The last of that recipe in the dashboard, until there&rsquo;s a Select.
                </>
              ),
            },
            {
              term: "Save menu",
              text: (
                <>
                  The new board&rsquo;s name in boards.tsx is the shared <Mono>Input</Mono> at its default size (28px)
                  beside a 28px Create Button, so the form fills the menu row it replaces. It has no visible label, since
                  the row it opened from said New board: <Mono>aria-label=&quot;Board name&quot;</Mono> names it.
                </>
              ),
            },
            {
              term: "New board",
              text: (
                <>
                  NewBoardDialog.tsx keeps the name and the description as its own fields on purpose: they are the text
                  in the dialog, not a form, so the name is set large and centred (
                  <Mono>font-display text-display font-light</Mono>, 28px, so it needs no touch size) over a two-line
                  description, both transparent until focus fills them with <Mono>bg-card</Mono>, with no ring, and their
                  labels <Mono>sr-only</Mono> because the dialog&rsquo;s title names them. Its share switch is in a Field.
                </>
              ),
            },
            {
              term: "Search pill",
              text: (
                <>
                  SearchBox.tsx: a 52px pill (<Mono>h-13 rounded-full</Mono>) on the old white surface (
                  <Mono>bg-component-on-container-subtle shadow-sm</Mono>) whose label wraps the icon and a{" "}
                  <Mono>type=&quot;search&quot;</Mono> input, with an <Mono>sr-only</Mono> &ldquo;Search the
                  library&rdquo; and <Mono>autoComplete=&quot;off&quot;</Mono>. Its 2px ring is an inset shadow on{" "}
                  <Mono>focus-within</Mono>, because the BorderBeam&rsquo;s wrapper clips everything outside the pill,
                  and Clear puts focus back in the field. The one field with the beam, and built for that one place.
                </>
              ),
            },
            {
              term: "Settings",
              text: (
                <>
                  The token name in ApiTokens.tsx is the shared <Mono>Input</Mono> at <Mono>size=&quot;lg&quot;</Mono>{" "}
                  (28px, the same as md; the name is kept for the call site), with a hand-set label above it (
                  <Mono>text-caption font-medium text-secondary-foreground</Mono>)
                  rather than a Field; moving it into a Field would give it the muted label and the inset for free.
                </>
              ),
            },
            {
              term: "Template",
              text: (
                <>
                  sites/SearchDialog.tsx (the template&rsquo;s search) is the last copy of the old Interfere recipe on
                  the site: a white fill with <Mono>shadow-sm</Mono> at 36px (<Mono>h-9 rounded-md</Mono>) in{" "}
                  <Mono>text-caption-lg</Mono>, 12px on desktop and 16px on touch screens, with a 2px brand shadow on
                  focus. Still wrong: its placeholder (&ldquo;Search posts...&rdquo;) is its only label, with no{" "}
                  <Mono>&lt;label&gt;</Mono> or <Mono>aria-label</Mono>. Moving it onto SearchField fixes both.
                </>
              ),
            },
            {
              term: "When copied",
              text: (
                <>
                  Every hand-built copy of the recipe needs <Mono>border-0</Mono> and <Mono>focus:ring-border</Mono>{" "}
                  (without them @tailwindcss/forms draws its grey border, and on focus turns the ring blue) and{" "}
                  <Mono>pointer-coarse:text-[16px]</Mono>, and gets the page&rsquo;s focus outline only if it
                  doesn&rsquo;t hide it. Each copy is one more place for these to go missing, which is why new code uses
                  the components.
                </>
              ),
            },
          ]}
        />
      </SheetSection>
    </div>
  );
}
