import * as React from 'react';
import { Block, Body2, Button, Caption, FallbackLink, Footer, H1, Layout } from './_components/layout';

export type ResetPasswordProps = {
  email: string;
  resetUrl: string;
  /** Match Supabase Auth > Email OTP expiration. */
  expiresIn?: string;
};

export const subject = 'Reset your Curatit password';

export default function ResetPassword({ email, resetUrl, expiresIn = '1 hour' }: ResetPasswordProps) {
  return (
    <Layout
      preview={`Choose a new password. The link works for ${expiresIn}.`}
      footer={
        <Footer reason={<>You're getting this because a password reset was requested for {email} on Curatit.</>} />
      }
    >
      <H1>Reset your password</H1>
      <Body2 style={{ marginTop: '12px' }}>
        Someone asked to reset the password for {email}. If it was you, choose a new one.
      </Body2>

      <Block pt={28}>
        <Button href={resetUrl}>Choose a new password</Button>
      </Block>

      <Caption style={{ marginTop: '28px' }}>
        The link works for {expiresIn} and only once. Didn't ask for this? Ignore this email and your password stays
        the same.
      </Caption>

      <FallbackLink href={resetUrl} />
    </Layout>
  );
}

ResetPassword.PreviewProps = {
  email: 'ammar@studio.co',
  resetUrl: 'https://www.curatit.app/auth/callback?token_hash=pkce_3a91d0&type=recovery&next=/reset-password',
} satisfies ResetPasswordProps;
