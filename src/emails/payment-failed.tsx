import * as React from 'react';
import { appUrl } from './_components/tokens';
import { Block, Body2, Button, Caption, Details, Footer, H1, Layout } from './_components/layout';

// Sent from your app through Resend when a Team renewal can't be charged.
// Match the downgrade line to your real retry and downgrade rules.
export type PaymentFailedProps = {
  email: string;
  amount?: string;
  card?: string;
  retryOn?: string;
  downgradeOn?: string;
  updateUrl?: string;
};

export const subject = "Your Curatit payment didn't go through";

export default function PaymentFailed({
  email,
  amount = '$9.00',
  card = 'Visa ending 4242',
  retryOn = '17 Oct 2026',
  downgradeOn = '28 Oct 2026',
  updateUrl = `${appUrl}/settings/billing`,
}: PaymentFailedProps) {
  return (
    <Layout
      preview={`We couldn't charge ${amount} for your Team plan. Update your card to keep it.`}
      footer={<Footer reason={<>You're getting this because {email} pays for a Team plan on Curatit.</>} />}
    >
      <H1>Your payment didn't go through</H1>
      <Body2 style={{ marginTop: '12px' }}>
        We couldn't charge {amount} to your {card} for the Team plan. Update your card to keep unlimited bookmarks and your
        team's shared workspace.
      </Body2>

      <Block pt={24}>
        <Details
          rows={[
            { label: 'Amount', value: amount },
            { label: 'Card', value: card },
            { label: 'Next try', value: retryOn },
          ]}
        />
      </Block>

      <Block pt={28}>
        <Button href={updateUrl}>Update payment method</Button>
      </Block>

      <Caption style={{ marginTop: '28px' }}>
        If the payment still fails by {downgradeOn}, your workspace moves to the Free plan. Your boards and notes stay put.
      </Caption>
    </Layout>
  );
}

PaymentFailed.PreviewProps = {
  email: 'sara@rhombus.studio',
} satisfies PaymentFailedProps;
