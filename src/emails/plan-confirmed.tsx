import * as React from 'react';
import { appUrl } from './_components/tokens';
import { Block, Button, Caption, CheckList, Details, Eyebrow, Footer, H1, InlineLink, Layout, Lead } from './_components/layout';

// Sent from your app through Resend when a workspace moves to the Team plan.
// If your payment provider already sends receipts, drop the receipt block.
export type PlanConfirmedProps = {
  email: string;
  plan?: string;
  price?: string;
  tax?: string;
  total?: string;
  paidOn?: string;
  nextCharge?: string;
  card?: string;
  receiptNumber?: string;
  invoiceUrl?: string;
  inviteUrl?: string;
  billingUrl?: string;
  showReceipt?: boolean;
};

export const subject = "You're on the Team plan";

export default function PlanConfirmed({
  email,
  plan = 'Team',
  price = '$9.00',
  tax = '$0.00',
  total = '$9.00',
  paidOn = '14 Oct 2026',
  nextCharge = '14 Nov 2026',
  card = 'Visa ending 4242',
  receiptNumber = 'CUR-1042',
  invoiceUrl = `${appUrl}/settings/billing`,
  inviteUrl = `${appUrl}/settings/team`,
  billingUrl = `${appUrl}/settings/billing`,
  showReceipt = true,
}: PlanConfirmedProps) {
  return (
    <Layout
      preview={`Unlimited bookmarks and a shared workspace are on. Receipt ${receiptNumber} inside.`}
      footer={<Footer reason={<>You're getting this because {email} upgraded to the {plan} plan on Curatit.</>} />}
    >
      <H1>You're on {plan}</H1>
      <Lead style={{ marginTop: '12px' }}>Thanks for upgrading. All of this is on for your workspace now.</Lead>

      <Block pt={20}>
        <CheckList
          items={[
            'Unlimited bookmarks and boards',
            'A shared workspace for your team',
            'Advanced filters and saved searches',
            'CSV and Notion exports',
          ]}
        />
      </Block>

      <Block pt={16}>
        <Button href={inviteUrl}>Invite your team</Button>
      </Block>

      {showReceipt ? (
        <Block pt={36}>
          <Eyebrow style={{ marginBottom: '10px' }}>Receipt</Eyebrow>
          <Details
            rows={[
              { label: `${plan} plan, monthly`, value: price },
              { label: 'Tax', value: tax },
              { label: 'Total paid', value: total, strong: true },
              { label: 'Paid with', value: card },
              { label: 'Date', value: paidOn },
              { label: 'Receipt', value: receiptNumber },
            ]}
          />
          <Caption style={{ marginTop: '14px' }}>
            Your next charge is {price} on {nextCharge}. <InlineLink href={invoiceUrl}>Download the invoice</InlineLink> or
            cancel any time from <InlineLink href={billingUrl}>billing settings</InlineLink>.
          </Caption>
        </Block>
      ) : null}
    </Layout>
  );
}

PlanConfirmed.PreviewProps = {
  email: 'sara@rhombus.studio',
} satisfies PlanConfirmedProps;
