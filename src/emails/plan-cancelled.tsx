import * as React from 'react';
import { Text } from '@react-email/components';
import { appUrl, color, font, radius } from './_components/tokens';
import { Block, Body2, Caption, Footer, H1, Layout, SecondaryButton } from './_components/layout';

const l = color.light;

// Sent from your app through Resend when someone cancels the Team plan.
// Match the Free plan rows to your real limits.
export type PlanCancelledProps = {
  email: string;
  endsOn?: string;
  resumeUrl?: string;
};

export const subject = 'Your Team plan is cancelled';

const rows: [string, string, string][] = [
  ['Saved posts', 'Unlimited', 'Up to 5'],
  ['Shared workspace', 'Included', 'Not included'],
  ['Saved searches', 'Included', 'Not included'],
  ['CSV and Notion exports', 'Included', 'Not included'],
];

export default function PlanCancelled({ email, endsOn = '14 Nov 2026', resumeUrl = `${appUrl}/settings/billing` }: PlanCancelledProps) {
  const cell: React.CSSProperties = { fontFamily: font.sans, fontSize: '14px', lineHeight: '20px', padding: '11px 0', verticalAlign: 'top' };
  return (
    <Layout
      preview={`You keep everything on Team until ${endsOn}.`}
      footer={<Footer reason={<>You're getting this because {email} cancelled a Team plan on Curatit.</>} />}
    >
      <H1>Your Team plan is cancelled</H1>
      <Body2 style={{ marginTop: '12px' }}>
        Your plan won't renew. You keep everything on Team until {endsOn}, then your workspace moves to the Free plan.
      </Body2>

      <Block pt={24}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          className="c-fill"
          style={{ backgroundColor: l.fill, borderRadius: radius.container, borderCollapse: 'separate' }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '4px 16px' }}>
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                  <tbody>
                    <tr>
                      <td style={cell}>&nbsp;</td>
                      <td className="c-muted" align="right" style={{ ...cell, color: l.muted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.025em', textTransform: 'uppercase', width: '26%' }}>
                        Until {endsOn.split(' ').slice(0, 2).join(' ')}
                      </td>
                      <td className="c-muted" align="right" style={{ ...cell, color: l.muted, fontSize: '12px', fontWeight: 600, letterSpacing: '0.025em', textTransform: 'uppercase', width: '26%' }}>
                        After
                      </td>
                    </tr>
                    {rows.map(([label, team, free]) => (
                      <tr key={label}>
                        <td className="c-muted c-rule" style={{ ...cell, color: l.muted, borderTop: `1px solid ${l.border}` }}>
                          {label}
                        </td>
                        <td className="c-fg c-rule" align="right" style={{ ...cell, color: l.foreground, borderTop: `1px solid ${l.border}` }}>
                          {team}
                        </td>
                        <td className="c-fg c-rule" align="right" style={{ ...cell, color: l.foreground, fontWeight: 600, borderTop: `1px solid ${l.border}` }}>
                          {free}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Block>

      <Text className="c-fg" style={{ margin: '24px 0 0', fontFamily: font.sans, fontSize: '15px', lineHeight: '24px', color: l.foreground }}>
        Your boards and notes stay put.
      </Text>

      <Block pt={20}>
        <SecondaryButton href={resumeUrl}>Keep the Team plan</SecondaryButton>
      </Block>

      <Caption style={{ marginTop: '28px' }}>Changed your mind? Resume any time before {endsOn} and nothing changes.</Caption>
    </Layout>
  );
}

PlanCancelled.PreviewProps = {
  email: 'sara@rhombus.studio',
} satisfies PlanCancelledProps;
