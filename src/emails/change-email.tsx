import * as React from 'react';
import { Block, Body2, Button, Caption, Details, FallbackLink, Footer, H1, Layout } from './_components/layout';

// Supabase Auth: Change email address. With Secure email change on, Supabase sends this
// to both addresses, so the copy works for either reader.
export type ChangeEmailProps = {
  email: string;
  newEmail: string;
  confirmUrl: string;
  /** Match Supabase Auth > Email OTP expiration. */
  expiresIn?: string;
};

export const subject = 'Confirm your new email for Curatit';

export default function ChangeEmail({ email, newEmail, confirmUrl, expiresIn = '1 hour' }: ChangeEmailProps) {
  return (
    <Layout
      preview="Confirm the new address to finish changing your Curatit email."
      footer={<Footer reason={<>You're getting this because an email change was requested for a Curatit account.</>} />}
    >
      <H1>Confirm your new email</H1>
      <Body2 style={{ marginTop: '12px' }}>
        Someone asked to move a Curatit account to a new email address. If it was you, confirm the change.
      </Body2>

      <Block pt={24}>
        <Details
          rows={[
            { label: 'Current', value: email },
            { label: 'New', value: newEmail, strong: true },
          ]}
        />
      </Block>

      <Block pt={28}>
        <Button href={confirmUrl}>Confirm new email</Button>
      </Block>

      <Caption style={{ marginTop: '28px' }}>
        The link works for {expiresIn}. Didn't ask for this? Ignore this email and the account keeps {email}.
      </Caption>

      <FallbackLink href={confirmUrl} />
    </Layout>
  );
}

ChangeEmail.PreviewProps = {
  email: 'sara@studio.co',
  newEmail: 'sara@rhombus.studio',
  confirmUrl: 'https://curatit.vercel.app/auth/callback?token_hash=pkce_51ad&type=email_change',
} satisfies ChangeEmailProps;
