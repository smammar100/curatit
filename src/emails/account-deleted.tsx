import * as React from 'react';
import { appUrl } from './_components/tokens';
import { Block, Body2, Caption, Details, Footer, H1, InlineLink, Layout } from './_components/layout';

// Sent from your app through Resend after the account and its data are removed.
export type AccountDeletedProps = {
  email: string;
  deletedOn?: string;
  boards?: number;
  savedPosts?: number;
};

export const subject = 'Your Curatit account is deleted';

export default function AccountDeleted({ email, deletedOn, boards, savedPosts }: AccountDeletedProps) {
  const rows = [
    { label: 'Account', value: email },
    ...(typeof boards === 'number' ? [{ label: 'Boards removed', value: String(boards) }] : []),
    ...(typeof savedPosts === 'number' ? [{ label: 'Saved posts removed', value: String(savedPosts) }] : []),
    ...(deletedOn ? [{ label: 'Deleted', value: deletedOn }] : []),
  ];
  return (
    <Layout
      preview="Your account, boards and share links are gone."
      footer={<Footer reason={<>You're getting this because the Curatit account for {email} was deleted. This is the last email about it.</>} />}
    >
      <H1>Your account is deleted</H1>
      <Body2 style={{ marginTop: '12px' }}>
        We've deleted your Curatit account with its boards, notes and saved posts. Share links you made have stopped working
        too.
      </Body2>

      <Block pt={24}>
        <Details rows={rows} />
      </Block>

      <Body2 style={{ marginTop: '28px' }}>
        Thanks for giving Curatit a try. You can <InlineLink href={`${appUrl}/signup`}>sign up again</InlineLink> with this
        email any time.
      </Body2>

      <Caption style={{ marginTop: '20px' }}>
        Didn't delete your account? Reply to this email straight away.
      </Caption>
    </Layout>
  );
}

AccountDeleted.PreviewProps = {
  email: 'sara@studio.co',
  boards: 4,
  savedPosts: 37,
  deletedOn: '14 Oct 2026',
} satisfies AccountDeletedProps;
