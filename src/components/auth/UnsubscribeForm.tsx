"use client";

import { useActionState } from "react";
import Link from "next/link";
import { unsubscribe } from "@/app/(auth)/unsubscribe/actions";
import { AuthNotice, inputClass } from "@/components/auth/AuthParts";
import { Footer, Heading, linkClass, Submit } from "@/components/auth/AuthForms";
import { NOTE_MAX, UNSUBSCRIBE_REASONS } from "@/lib/unsubscribe-reasons";
import { SUPPORT_MAILTO } from "@/lib/site";

// The unsubscribe card: who's leaving, why (optional, a few choices and a note), one button.
export function UnsubscribeForm({ email, token, source }: { email: string | null; token: string; source: string }) {
  const [state, action, pending] = useActionState(unsubscribe, {});

  if (!email) {
    return (
      <>
        <Heading title="This link isn't complete">
          Open Unsubscribe from the email again, or write to us and we&apos;ll take you off the list.
        </Heading>
        <Footer>
          <a href={SUPPORT_MAILTO} className={linkClass}>
            Contact us
          </a>
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
          <Link href="/" className={linkClass}>
            Go to Curatit
          </Link>
        </Footer>
      </>
    );
  }

  return (
    <>
      <Heading title="Unsubscribe from Curatit emails">
        We&apos;ll stop sending {email} tips and news. Account emails, like password resets, still come.
      </Heading>
      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="t" value={token} />
        <input type="hidden" name="s" value={source} />
        <fieldset>
          <legend className="mb-1.5 block text-body-sm font-medium text-primary-foreground">
            Why are you leaving? <span className="font-normal text-secondary-foreground">Optional</span>
          </legend>
          <div className="space-y-2">
            {Object.entries(UNSUBSCRIBE_REASONS).map(([value, label]) => (
              <label
                key={value}
                className="flex h-10 cursor-pointer items-center gap-3 rounded-lg bg-component-on-container-subtle px-3 text-body-sm text-primary-foreground shadow-sm transition-[box-shadow] duration-150 has-checked:shadow-[0_0_0_1.5px_var(--color-primary-foreground)]"
              >
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  className="size-4 border-border-strong text-primary-foreground focus:ring-brand-border-focus focus:ring-offset-0"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="note" className="mb-1.5 block text-body-sm font-medium text-primary-foreground">
            Anything else? <span className="font-normal text-secondary-foreground">Optional</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={NOTE_MAX}
            className={`${inputClass} h-auto resize-none border-0 py-2 focus:ring-0 focus:shadow-[0_0_0_2px_var(--color-brand-border-focus)]`}
          />
        </div>
        {state.error && <AuthNotice>{state.error}</AuthNotice>}
        <Submit pending={pending} idle="Unsubscribe" busy="Unsubscribing…" />
      </form>
      <Footer>Changed your mind? Just close this page.</Footer>
    </>
  );
}
