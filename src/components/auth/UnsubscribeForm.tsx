"use client";

import { useActionState } from "react";
import TextLink from "@/components/fundations/elements/TextLink";
import { unsubscribe } from "@/app/(auth)/unsubscribe/actions";
import { AuthNotice } from "@/components/auth/AuthParts";
import { Footer, Heading, Submit } from "@/components/auth/AuthForms";
import { Field, FieldLabel } from "@/components/glaze/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/glaze/ui/select";
import { Textarea } from "@/components/glaze/ui/textarea";
import { NOTE_MAX, UNSUBSCRIBE_REASONS } from "@/lib/unsubscribe-reasons";
import { SUPPORT_MAILTO } from "@/lib/site";

const REASONS = Object.entries(UNSUBSCRIBE_REASONS).map(([value, label]) => ({ value, label }));

// The unsubscribe card: who's leaving, why (optional: a reason and a note), one button. Glaze's:
// the reason a Select (its hidden input posts `reason`, nothing when none is picked), the note a
// Textarea, both in labelled Fields marked optional, and the card's one primary Submit.
export function UnsubscribeForm({ email, token, source }: { email: string | null; token: string; source: string }) {
  const [state, action, pending] = useActionState(unsubscribe, {});

  if (!email) {
    return (
      <>
        <Heading title="This link isn't complete">
          Open Unsubscribe from the email again, or write to us and we&apos;ll take you off the list.
        </Heading>
        <Footer>
          <TextLink href={SUPPORT_MAILTO}>Contact us</TextLink>
        </Footer>
      </>
    );
  }

  if (state.done) {
    return (
      <>
        <Heading title="You're unsubscribed">
          We won&apos;t send {email} any more tips or news. Account emails, like password resets, still come.
        </Heading>
        <Footer>
          <TextLink href="/">Go to Curatit</TextLink>
        </Footer>
      </>
    );
  }

  return (
    <>
      <Heading title="Unsubscribe from Curatit emails">
        We&apos;ll stop sending {email} tips and news. Account emails, like password resets, still come.
      </Heading>
      <form action={action} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="t" value={token} />
        <input type="hidden" name="s" value={source} />
        <Field>
          <FieldLabel optional>Why are you leaving?</FieldLabel>
          <Select name="reason" items={REASONS}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a reason" />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel optional>Anything else?</FieldLabel>
          <Textarea name="note" rows={3} maxLength={NOTE_MAX} />
        </Field>
        {state.error && <AuthNotice>{state.error}</AuthNotice>}
        <Submit pending={pending} idle="Unsubscribe" busy="Unsubscribing…" />
      </form>
      <Footer>Changed your mind? Just close this page.</Footer>
    </>
  );
}
