import * as React from 'react';
import { appUrl } from './_components/tokens';
import { Block, Body2, Caption, Details, Footer, H1, Layout, Para, SecondaryButton } from './_components/layout';

// Supabase Auth security notification: Password changed.
export type PasswordChangedProps = {
  email: string;
  /** Leave out in the Supabase template; Supabase has no time variable. */
  changedAt?: string;
  resetUrl?: string;
};

export const subject = 'Your Curatit password was changed';

export default function PasswordChanged({ email, changedAt, resetUrl = `${appUrl}/forgot-password` }: PasswordChangedProps) {
  return (
    <Layout
      preview="The password on your Curatit account was just changed."
      footer={<Footer reason={<>You're getting this because the password for {email} was changed on Curatit.</>} />}
    >
      <H1>Your password was changed</H1>
      <Body2 style={{ marginTop: '12px' }}>
        The password for {email} was just changed. If that was you, you're all set.
      </Body2>

      {changedAt ? (
        <Block pt={24}>
          <Details
            rows={[
              { label: 'Account', value: email },
              { label: 'Changed', value: changedAt },
            ]}
          />
        </Block>
      ) : null}

      <Para style={{ marginTop: '28px' }}>
        <b>Didn't change it?</b> Reset your password now, then reply to this email so we can check the account.
      </Para>
      <Block pt={16}>
        <SecondaryButton href={resetUrl}>Reset your password</SecondaryButton>
      </Block>

      <Caption style={{ marginTop: '28px' }}>We'll never ask for your password by email.</Caption>
    </Layout>
  );
}

PasswordChanged.PreviewProps = {
  email: 'sara@studio.co',
  changedAt: '14 Oct 2026, 9:42 PM PKT',
} satisfies PasswordChangedProps;
