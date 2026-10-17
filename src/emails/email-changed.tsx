import * as React from 'react';
import { appUrl } from './_components/tokens';
import { Block, Body2, Caption, Details, Footer, H1, Layout, Para, SecondaryButton } from './_components/layout';

// Supabase Auth security notification: Email address changed. Goes to the old address.
export type EmailChangedProps = {
  oldEmail: string;
  newEmail: string;
  /** Leave out in the Supabase template; Supabase has no time variable. */
  changedAt?: string;
  resetUrl?: string;
};

export const subject = 'Your Curatit email was changed';

export default function EmailChanged({ oldEmail, newEmail, changedAt, resetUrl = `${appUrl}/forgot-password` }: EmailChangedProps) {
  const rows = [
    { label: 'Old email', value: oldEmail },
    { label: 'New email', value: newEmail, strong: true },
    ...(changedAt ? [{ label: 'Changed', value: changedAt }] : []),
  ];
  return (
    <Layout
      preview="The email on your Curatit account was just changed."
      footer={<Footer reason={<>You're getting this because the email on a Curatit account changed from {oldEmail}.</>} />}
    >
      <H1>Your email was changed</H1>
      <Body2 style={{ marginTop: '12px' }}>
        The email on your Curatit account is now {newEmail}. We're telling you at your old address in case it wasn't you.
      </Body2>

      <Block pt={24}>
        <Details rows={rows} />
      </Block>

      <Para style={{ marginTop: '28px' }}>
        <b>Didn't make this change?</b> Reset your password now, then reply to this email so we can secure the account.
      </Para>
      <Block pt={16}>
        <SecondaryButton href={resetUrl}>Reset your password</SecondaryButton>
      </Block>

      <Caption style={{ marginTop: '28px' }}>If it was you, there's nothing else to do.</Caption>
    </Layout>
  );
}

EmailChanged.PreviewProps = {
  oldEmail: 'sara@studio.co',
  newEmail: 'sara@rhombus.studio',
  changedAt: '14 Oct 2026, 9:42 PM PKT',
} satisfies EmailChangedProps;
