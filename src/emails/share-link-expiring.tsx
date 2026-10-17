import * as React from 'react';
import { Text } from '@react-email/components';
import { appUrl, asset, color, font } from './_components/tokens';
import { Block, Body2, Button, Caption, Footer, H1, Icon, Layout, Panel, Thumbs, type Thumb } from './_components/layout';

const l = color.light;

// Sent from your app through Resend a few days before a board's share link expires.
export type ShareLinkExpiringProps = {
  email: string;
  boardName?: string;
  posts?: Thumb[];
  postCount?: number;
  daysLeft?: number;
  expiresOn?: string;
  newLinkUrl?: string;
  /** sendEmail's unsubscribe link (an optional email: sent with `optional`) */
  unsubscribeUrl?: string;
};

export const getSubject = (boardName = 'Q4 launch references', daysLeft = 3) =>
  `Your share link for ${boardName} expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;

const defaultPosts: Thumb[] = [
  { src: asset('welcome/wise.jpg'), alt: 'Wise post' },
  { src: asset('welcome/airbnb.jpg'), alt: 'Airbnb post' },
  { src: asset('welcome/claude.jpg'), alt: 'Claude post' },
];

export default function ShareLinkExpiring({
  email,
  boardName = 'Q4 launch references',
  posts = defaultPosts,
  postCount,
  daysLeft = 3,
  expiresOn = '17 Oct 2026',
  newLinkUrl = `${appUrl}/library`,
  unsubscribeUrl,
}: ShareLinkExpiringProps) {
  const total = postCount ?? posts.length;
  const days = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`;
  return (
    <Layout
      preview={`The read-only link to ${boardName} stops working on ${expiresOn}.`}
      footer={<Footer reason={<>You're getting this because {email} made a share link for a Curatit board.</>} unsubscribeUrl={unsubscribeUrl} />}
    >
      <H1>Your share link expires in {days}</H1>
      <Body2 style={{ marginTop: '12px' }}>
        The read-only link to {boardName} stops working on {expiresOn}. Anyone you sent it to, like your client, won't be able
        to open the board after that.
      </Body2>

      <Block pt={24}>
        <Panel>
          <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
            <tbody>
              <tr>
                <td style={{ width: '16px', verticalAlign: 'middle', paddingRight: '8px' }}>
                  <Icon name="icon-folder" size={16} />
                </td>
                <td style={{ verticalAlign: 'middle' }}>
                  <Text className="c-fg" style={{ margin: 0, fontFamily: font.sans, fontSize: '15px', lineHeight: '20px', fontWeight: 600, color: l.foreground }}>
                    {boardName}
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
          <Text className="c-muted" style={{ margin: '4px 0 14px', fontFamily: font.sans, fontSize: '13px', lineHeight: '18px', color: l.muted }}>
            {total} {total === 1 ? 'post' : 'posts'} · Read-only link · Expires {expiresOn}
          </Text>
          <Thumbs items={posts.slice(0, 3)} max={160} />
        </Panel>
      </Block>

      <Block pt={28}>
        <Button href={newLinkUrl}>Make a new link</Button>
      </Block>

      <Caption style={{ marginTop: '28px' }}>New links work for 30 days. Your board and notes aren't affected.</Caption>
    </Layout>
  );
}

ShareLinkExpiring.PreviewProps = {
  email: 'sara@studio.co',
  unsubscribeUrl: 'https://www.curatit.app/unsubscribe',
} satisfies ShareLinkExpiringProps;
