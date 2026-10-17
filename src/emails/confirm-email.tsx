import * as React from 'react';
import { Block, Body2, Button, Caption, Code, FallbackLink, Footer, H1, Layout } from './_components/layout';

export type ConfirmEmailProps = {
  email: string;
  confirmUrl: string;
  /** Supabase {{ .Token }}. Leave out to hide the code block. */
  code?: string;
  /** Match Supabase Auth > Email OTP expiration. */
  expiresIn?: string;
};

export const subject = 'Confirm your email for Curatit';

export default function ConfirmEmail({ email, confirmUrl, code, expiresIn = '1 hour' }: ConfirmEmailProps) {
  return (
    <Layout
      preview="Confirm your email to finish setting up Curatit."
      footer={<Footer reason={<>You're getting this because someone signed up for Curatit with {email}.</>} />}
    >
      <H1>Confirm your email</H1>
      <Body2 style={{ marginTop: '12px' }}>
        Confirm {email} to finish setting up your Curatit account.
      </Body2>

      <Block pt={28}>
        <Button href={confirmUrl}>Confirm email</Button>
      </Block>

      {code ? (
        <Block pt={28}>
          <Caption style={{ marginBottom: '8px' }}>Or enter this code on the sign-up screen:</Caption>
          <Code code={code} />
        </Block>
      ) : null}

      <Caption style={{ marginTop: '28px' }}>
        {code ? `The link and code work for ${expiresIn}.` : `The link works for ${expiresIn}.`} Didn't sign up? Ignore
        this email.
      </Caption>

      <FallbackLink href={confirmUrl} />
    </Layout>
  );
}

ConfirmEmail.PreviewProps = {
  email: 'ammar@studio.co',
  confirmUrl: 'https://curatit.vercel.app/auth/callback?token_hash=pkce_8f2c1e&type=signup',
  code: '482913',
} satisfies ConfirmEmailProps;
