import type { ComponentProps, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/glaze/ui/alert";
import { Field, FieldError, FieldLabel } from "@/components/glaze/ui/field";
import { Input } from "@/components/glaze/ui/input";
import { Failed, Icon } from "@/components/glaze/icon";

// Shared pieces of the auth forms (sign in, sign up, forgot and reset password). Since
// 2026-10-24 they are Glaze's: AuthField is a Field with its FieldLabel, an Input (the hairline
// pill, 32px, the same as the card's submit Button under it; 16px on touch screens so iOS doesn't
// zoom) and a FieldError, and AuthNotice is a fail Alert.

// The text mode's props (any native text type, password included)
type InputProps = Omit<Extract<ComponentProps<typeof Input>, { mode?: "text" }>, "mode" | "id">;

// A labelled input; `aside` sits at the label's right, like "Forgot password?". `error` is a
// problem with this field: it shows under it in the failure colour with the Failed glyph, turns
// the field's line coral and is read with the field (the Field sets aria-invalid on the input and
// joins the error and the description to its aria-describedby; any aria-describedby passed here,
// like the password rules', is kept beside them). The forms decide when a field is wrong
// (useValidation in AuthForms), so the Field is told through `invalid`. The <input> keeps
// `name={id}`, which is what useValidation reads the fields by, and `id`, which the sign-up form
// fills from the footer's handover. `required` is said to screen readers (aria-required) rather
// than set on the input, so the browser's own check never marks a field the form hasn't.
export function AuthField({
  id,
  label,
  aside,
  error,
  required,
  ...input
}: {
  id: string;
  label: string;
  aside?: ReactNode;
  error?: ReactNode;
  required?: boolean;
} & InputProps) {
  return (
    <Field invalid={!!error} className="w-full">
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        {aside}
      </div>
      <Input id={id} name={id} aria-required={required || undefined} {...input} />
      {error && (
        <FieldError className="flex-row items-start gap-1.5">
          <Icon icon={Failed} className="mt-0.75" />
          <span className="min-w-0">{error}</span>
        </FieldError>
      )}
    </Field>
  );
}

// A problem with the form (from the server: wrong password, a rate limit), read out as soon as
// it appears: Glaze's fail Alert (the tint, the glyph, the words), role="alert"
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <Alert status="fail">
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
