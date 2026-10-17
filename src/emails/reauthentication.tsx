import * as React from 'react';
import { Block, Body2, Caption, Code, Footer, H1, Layout } from './_components/layout';

// Supabase Auth: Reauthentication. Sent when someone changes their password with
// Secure password change on, or does anything else that asks for a fresh code.
export type ReauthenticationProps = {
  email: string;
  code: string;
  expiresIn?: string;
};

export const subject = 'Your Curatit verification code';

export default function Reauthentication({ email, code, expiresIn = '1 hour' }: ReauthenticationProps) {
  return (
    <Layout
      preview="Enter this code in Curatit to confirm a change to your account."
      footer={<Footer reason={<>You're getting this because a change was requested on the Curatit account for {email}.</>} />}
    >
      <H1>Confirm it's you</H1>
      <Body2 style={{ marginTop: '12px' }}>Enter this code in Curatit to confirm a change to your account.</Body2>

      <Block pt={24}>
        <Code code={code} />
      </Block>

      <Caption style={{ marginTop: '28px' }}>
        The code works for {expiresIn}. Didn't ask for it? Ignore this email and nothing changes.
      </Caption>
    </Layout>
  );
}

Reauthentication.PreviewProps = {
  email: 'sara@studio.co',
  code: '730154',
} satisfies ReauthenticationProps;
