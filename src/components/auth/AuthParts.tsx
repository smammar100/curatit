import type { ReactNode } from "react";
import Input, { type InputProps } from "@/components/fundations/elements/Input";
import Field from "@/components/fundations/molecules/Field";
import Notice from "@/components/fundations/molecules/Notice";

// Shared pieces of the auth forms (sign in, sign up, forgot and reset password). Since
// 2026-10-23 they are the system's own: AuthField is a Field holding an Input (the one stroke as
// a 1px ring on no fill, a faint hover tint, the card surface while focused, the compact step:
// 28px, 12px text, a pill, the same as the card's Sign in button under it; 16px on touch screens
// so iOS doesn't zoom), and AuthNotice is a danger Notice. Nothing here draws a field or a note
// itself any more; the recipe that used to be copied out as `inputClass` lives in Input.

// A labelled input; `aside` sits at the label's right, like "Forgot password?". `error` is a
// problem with this field: it shows under it in red with an icon, turns its ring red and is read
// with the field (Field wires aria-describedby and aria-invalid; the error's id is `${id}-error`,
// as the forms' validation expects). The <input> keeps `name={id}` unless told otherwise, which
// is what useValidation in AuthForms reads the fields by.
export function AuthField({
  id,
  label,
  aside,
  error,
  ...input
}: {
  id: string;
  label: string;
  aside?: ReactNode;
  error?: ReactNode;
} & Omit<InputProps, "id" | "invalid" | "leadingIcon" | "trailing">) {
  return (
    <Field label={label} aside={aside} error={error} id={id} className="w-full">
      <Input id={id} name={id} {...input} />
    </Field>
  );
}

// A problem with the form (from the server: wrong password, a rate limit), read out as soon as
// it appears: the system's danger Notice (a pale red wash, the glyph, the words in the ink)
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <Notice tone="danger" live>
      {children}
    </Notice>
  );
}
