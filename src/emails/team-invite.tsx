import * as React from 'react';
import { Text } from '@react-email/components';
import { color, font } from './_components/tokens';
import { Avatar, Block, Body2, Button, Caption, FallbackLink, Footer, H1, Layout, Panel } from './_components/layout';

const l = color.light;

// Sent from your app through Resend when someone on the Team plan invites a teammate.
export type TeamInviteProps = {
  email: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  acceptUrl: string;
  members?: number;
  boards?: number;
  expiresIn?: string;
};

export const getSubject = (p: Pick<TeamInviteProps, 'inviterName' | 'workspaceName'>) =>
  `${p.inviterName} invited you to ${p.workspaceName} on Curatit`;

export default function TeamInvite({
  email,
  inviterName,
  inviterEmail,
  workspaceName,
  acceptUrl,
  members,
  boards,
  expiresIn = '7 days',
}: TeamInviteProps) {
  const meta = [
    typeof members === 'number' ? `${members} ${members === 1 ? 'member' : 'members'}` : null,
    typeof boards === 'number' ? `${boards} ${boards === 1 ? 'board' : 'boards'}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Layout
      preview={`${inviterName} wants you on the ${workspaceName} workspace.`}
      footer={<Footer reason={<>You're getting this because {inviterName} invited {email} to a Curatit workspace.</>} />}
    >
      <H1>Join {workspaceName} on Curatit</H1>
      <Body2 style={{ marginTop: '12px' }}>
        {inviterName} ({inviterEmail}) invited you to the {workspaceName} workspace. You'll share boards, saved searches and
        notes with the team.
      </Body2>

      <Block pt={24}>
        <Panel>
          <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
            <tbody>
              <tr>
                <td style={{ width: '40px', verticalAlign: 'middle' }}>
                  <Avatar name={workspaceName} size={40} />
                </td>
                <td style={{ paddingLeft: '12px', verticalAlign: 'middle' }}>
                  <Text className="c-fg" style={{ margin: 0, fontFamily: font.sans, fontSize: '16px', lineHeight: '22px', fontWeight: 600, color: l.foreground }}>
                    {workspaceName}
                  </Text>
                  {meta ? (
                    <Text className="c-muted" style={{ margin: 0, fontFamily: font.sans, fontSize: '13px', lineHeight: '18px', color: l.muted }}>
                      {meta}
                    </Text>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>
        </Panel>
      </Block>

      <Block pt={28}>
        <Button href={acceptUrl}>Accept invite</Button>
      </Block>

      <Caption style={{ marginTop: '28px' }}>
        The invite works for {expiresIn}. Not expecting it? Ignore this email and nothing changes.
      </Caption>

      <FallbackLink href={acceptUrl} />
    </Layout>
  );
}

TeamInvite.PreviewProps = {
  email: 'omar@rhombus.studio',
  inviterName: 'Sara Malik',
  inviterEmail: 'sara@rhombus.studio',
  workspaceName: 'Rhombus Studio',
  acceptUrl: 'https://www.curatit.app/invite/7f3k9q',
  members: 4,
  boards: 12,
} satisfies TeamInviteProps;
