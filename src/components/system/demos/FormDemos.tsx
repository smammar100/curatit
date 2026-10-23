"use client";

// The live parts of the form sheets (/system/input, /system/checkbox, /system/field,
// /system/search-field): the ones that hold state, which a server sheet can't. Nothing moves on
// load and nothing is sent anywhere. Each renders once per theme panel, so ids come from useId.
import { useId, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Checkbox, { type CheckboxProps } from "@/components/fundations/elements/Checkbox";
import Input from "@/components/fundations/elements/Input";
import Switch from "@/components/fundations/elements/Switch";
import Textarea from "@/components/fundations/elements/Textarea";
import Field from "@/components/fundations/molecules/Field";
import SearchField from "@/components/fundations/molecules/SearchField";
import { emailProblem } from "@/lib/auth";

// ---------------------------------------------------------------------------------------------
// SearchField filtering a list, as the dashboard's brand list narrows while you type. The count
// is a polite status, so a screen reader hears how many are left without losing its place

const BRANDS = [
  "Airbnb",
  "Burger King",
  "Canva",
  "Coca-Cola",
  "Deliveroo",
  "Duolingo",
  "H&M",
  "Headspace",
  "Nike",
  "Revolut",
  "Uber Eats",
  "Wise",
];

export function SearchDemo({ size = "md" }: { size?: "md" | "lg" }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const words = query.trim().toLowerCase();
  const found = BRANDS.filter((brand) => brand.toLowerCase().includes(words));
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Field label="Brands" description="Press / to jump here. Escape clears.">
        <SearchField id={`${id}brands`} size={size} shortcut="/" placeholder="Nike, Wise, Canva…" value={query} onValueChange={setQuery} />
      </Field>
      <p role="status" className="text-caption-lg text-secondary-foreground">
        {found.length === BRANDS.length
          ? `${BRANDS.length} brands`
          : found.length === 0
            ? `No brand matches “${query.trim()}”`
            : `${found.length} of ${BRANDS.length} brands`}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {found.map((brand) => (
          <li key={brand} className="rounded-sm bg-component px-2 py-0.5 text-caption-lg text-secondary-foreground">
            {brand}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// A frozen indeterminate box for the sheet's matrix: indeterminate is set through a ref, which
// only a client component can hold

export function MixedCheckbox(props: Omit<CheckboxProps, "indeterminate" | "checked">) {
  return <Checkbox {...props} checked={false} indeterminate readOnly />;
}

// ---------------------------------------------------------------------------------------------
// "Select all" over a group: indeterminate while some are picked. The parent box is a client
// component's job (indeterminate needs a ref), so it lives here

const CATEGORIES = ["Finance", "Food & Drink", "Travel & Transportation", "Shopping"];

export function SelectAllDemo() {
  const id = useId();
  const [picked, setPicked] = useState<string[]>(["Finance", "Shopping"]);
  const all = picked.length === CATEGORIES.length;
  const some = picked.length > 0 && !all;
  return (
    <fieldset className="max-w-sm">
      <legend className="sr-only">Categories to include</legend>
      <Field label="All categories" layout="inline" description={`${picked.length} of ${CATEGORIES.length} included`}>
        <Checkbox
          id={`${id}all`}
          checked={all}
          indeterminate={some}
          onCheckedChange={() => setPicked(all ? [] : CATEGORIES)}
        />
      </Field>
      <div className="mt-3 ml-2.5 flex flex-col gap-3 border-l border-border-default pl-5">
        {CATEGORIES.map((category) => (
          <Field key={category} label={category} layout="inline">
            <Checkbox
              id={`${id}${category}`}
              checked={picked.includes(category)}
              onCheckedChange={(on) =>
                setPicked((current) => (on ? [...current, category] : current.filter((c) => c !== category)))
              }
            />
          </Field>
        ))}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------------------------------------
// A setting row: Field's inline-end layout holding a Switch, which needs a handler, so a client
// component holds its state

export function SettingDemo({
  label,
  description,
  defaultChecked = false,
  disabled = false,
}: {
  label: string;
  description?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const [on, setOn] = useState(defaultChecked);
  return (
    <Field label={label} layout="inline-end" description={description} className="w-full">
      <Switch id={`${id}switch`} checked={on} onCheckedChange={setOn} disabled={disabled} />
    </Field>
  );
}

// ---------------------------------------------------------------------------------------------
// A whole form on Field, checked the way the auth forms check theirs: on submit (focus goes to
// the first problem), on leaving the email once something's typed, and live in a field that
// already shows a note, so it clears the moment it's fixed. Never on the first keystrokes

const MAX_NOTE = 160;

function noteProblem(value: string) {
  return value.length > MAX_NOTE ? `Keep it to ${MAX_NOTE} characters. Cut ${value.length - MAX_NOTE}.` : null;
}

export function FormDemo() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(false);
  const [errors, setErrors] = useState<{ email?: string | null; note?: string | null }>({});
  const [sent, setSent] = useState(false);

  return (
    <form
      noValidate
      className="flex max-w-sm flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const found = { email: emailProblem(email), note: noteProblem(note) };
        setErrors(found);
        const first = found.email ? `${id}email` : found.note ? `${id}note` : null;
        if (first) document.getElementById(first)?.focus();
        setSent(!first);
      }}
    >
      <Field label="Send the board to" error={errors.email} required>
        <Input
          id={`${id}email`}
          type="email"
          inputMode="email"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          placeholder="client@studio.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSent(false);
            if (errors.email) setErrors((e) => ({ ...e, email: emailProblem(event.target.value) }));
          }}
          onBlur={() => email && setErrors((e) => ({ ...e, email: emailProblem(email) }))}
        />
      </Field>
      <Field
        label="Note"
        description="What should they look at first?"
        aside={
          <span className="text-caption-lg text-secondary-foreground tabular-nums">
            {note.length} / {MAX_NOTE}
          </span>
        }
        error={errors.note}
      >
        <Textarea
          id={`${id}note`}
          rows={2}
          autoResize
          maxRows={6}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setSent(false);
            if (errors.note) setErrors((e) => ({ ...e, note: noteProblem(event.target.value) }));
          }}
        />
      </Field>
      <Field label="Share with a link" layout="inline-end" description="Anyone with the link sees the board and its notes.">
        <Switch id={`${id}share`} checked={shared} onCheckedChange={setShared} />
      </Field>
      <Button type="submit" variant="default" className="w-full">
        Send board
      </Button>
      <p role="status" className="min-h-5 text-center text-body-sm text-secondary-foreground">
        {sent ? "Every field passes. The real form would send it now." : ""}
      </p>
    </form>
  );
}
