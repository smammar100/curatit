"use client";

// The live parts of the Auth fields sheet (sheets/Input.tsx, at /system/auth-fields). Nothing moves on load: a strength sample is
// drawn at its level from the first paint, and the validation demo waits for a person. Each is
// rendered once per theme panel, so ids come from useId.
import { useId, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Check from "@/components/fundations/icons/Check";
import { AuthField } from "@/components/auth/AuthParts";
import { strength } from "@/components/auth/PasswordField";
import { emailProblem, PASSWORD_RULES } from "@/lib/auth";
import { cx } from "@/lib/cx";

// ---------------------------------------------------------------------------------------------
// The strength meter and the rule checklist at a given password, frozen. A copy of
// PasswordField's markup (it keeps the meter inside the field and starts it empty), with its
// level from PasswordField's own strength(), so the level is the real one. Keep the classes in
// step with LEVELS in auth/PasswordField.tsx

const LEVELS = [
  { label: "", fill: "", text: "" },
  { label: "Weak", fill: "bg-danger-500", text: "text-danger-foreground" },
  { label: "Fair", fill: "bg-warning-500", text: "text-warning-700" },
  { label: "Good", fill: "bg-success-400", text: "text-success-700" },
  { label: "Strong", fill: "bg-success-600", text: "text-success-700" },
];

export function StrengthSample({ password }: { password: string }) {
  const level = strength(password);
  const { label, fill, text } = LEVELS[level];
  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className="h-1 overflow-hidden rounded-full bg-component">
              {step <= level && <span className={cx("block h-full rounded-full", fill)} />}
            </span>
          ))}
        </div>
        <p className={cx("w-12 text-right text-caption-lg font-medium", text)}>
          <span className="sr-only">Password strength: </span>
          {label}
        </p>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.id}
              className={cx(
                "flex items-center gap-1.5 text-caption-lg",
                ok ? "text-primary-foreground" : "text-secondary-foreground",
              )}
            >
              <span className="flex size-3 shrink-0 items-center justify-center" aria-hidden="true">
                {ok ? <Check className="size-3" /> : <span className="size-1 rounded-full bg-tertiary-foreground" />}
              </span>
              <span className="sr-only">{ok ? "Done: " : "Needs: "}</span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The sign-in form's checks at the three moments useValidation (auth/AuthForms.tsx) runs them:
// on submit, on leaving the email once something's typed, and live in a field that already has a
// note. useValidation isn't exported, so this is the same logic written out; it never sends
// anything. autoComplete is off and the password managers are told to stay out, since this is a
// demo and not a sign-in

const enterPassword = (value: string) => (value ? null : "Enter your password.");

export function ValidationDemo() {
  const id = useId();
  const emailName = `${id}email`;
  const passwordName = `${id}password`;
  const checks: Record<string, (value: string) => string | null> = {
    [emailName]: emailProblem,
    [passwordName]: enterPassword,
  };
  const onLeave = [emailName];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passed, setPassed] = useState(false);

  const set = (name: string, message: string | null) =>
    setErrors((current) => {
      if ((current[name] ?? null) === message) return current;
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  const checked = (target: EventTarget) =>
    target instanceof HTMLInputElement && target.name in checks ? target : null;

  return (
    <form
      noValidate
      className="max-w-sm space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const found: Record<string, string> = {};
        for (const [name, check] of Object.entries(checks)) {
          const input = form.elements.namedItem(name);
          const message = input instanceof HTMLInputElement ? check(input.value) : null;
          if (message) found[name] = message;
        }
        setErrors(found);
        const first = Object.keys(found)[0];
        if (first) (form.elements.namedItem(first) as HTMLInputElement).focus();
        setPassed(!first);
      }}
      onChange={(event) => {
        setPassed(false);
        const input = checked(event.target);
        if (input && errors[input.name]) set(input.name, checks[input.name](input.value));
      }}
      onBlur={(event) => {
        const input = checked(event.target);
        if (input && input.value && onLeave.includes(input.name)) set(input.name, checks[input.name](input.value));
      }}
    >
      <AuthField
        id={emailName}
        label="Email address"
        type="email"
        inputMode="email"
        placeholder="you@example.com"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        required
        error={errors[emailName]}
      />
      <AuthField
        id={passwordName}
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        required
        error={errors[passwordName]}
      />
      <Button size="base" variant="default" type="submit" className="w-full">
        Sign in
      </Button>
      <p role="status" className="min-h-5 text-center text-body-sm text-secondary-foreground">
        {passed ? "Both fields pass. The real form would send them now." : ""}
      </p>
    </form>
  );
}
