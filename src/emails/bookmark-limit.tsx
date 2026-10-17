import * as React from 'react';
import { Text } from '@react-email/components';
import { appUrl, asset, color, font, radius } from './_components/tokens';
import { Block, Body2, Button, Caption, CheckList, Footer, H1, Layout, Panel, Thumbs, type Thumb } from './_components/layout';

const l = color.light;

// Sent from your app through Resend when a Free account saves its last allowed post.
export type BookmarkLimitProps = {
  email: string;
  limit?: number;
  saved?: Thumb[];
  price?: string;
  upgradeUrl?: string;
};

export const getSubject = (limit = 5) => `You've saved ${limit} of ${limit} posts`;

const defaultSaved: Thumb[] = [
  { src: asset('welcome/nike.jpg'), alt: 'Nike post' },
  { src: asset('welcome/ubereats.jpg'), alt: 'Uber Eats post' },
  { src: asset('welcome/zara.jpg'), alt: 'Zara post' },
  { src: asset('welcome/wise.jpg'), alt: 'Wise post' },
  { src: asset('welcome/claude.jpg'), alt: 'Claude post' },
];

export default function BookmarkLimit({
  email,
  limit = 5,
  saved = defaultSaved,
  price = '$9 a month',
  upgradeUrl = `${appUrl}/pricing`,
}: BookmarkLimitProps) {
  return (
    <Layout
      preview="That's the Free plan limit. Your saved posts stay put."
      footer={<Footer reason={<>You're getting this because {email} is on the Curatit Free plan.</>} />}
    >
      <H1>You've saved {limit} of {limit} posts</H1>
      <Body2 style={{ marginTop: '12px' }}>
        That's the limit on the Free plan. Your saved posts stay put. To keep saving, move to Team.
      </Body2>

      <Block pt={24}>
        <Thumbs items={saved.slice(0, limit)} max={100} />
        {/* Full meter, one segment per saved post */}
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: '12px' }}>
          <tbody>
            <tr>
              {Array.from({ length: limit }).map((_, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? <td style={{ width: '4px', fontSize: 0, lineHeight: 0 }}>&nbsp;</td> : null}
                  <td className="c-ink" style={{ height: '4px', fontSize: 0, lineHeight: 0, borderRadius: radius.full, backgroundColor: l.foreground }}>
                    &nbsp;
                  </td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
        <Caption style={{ marginTop: '8px' }}>
          {limit} of {limit} saved
        </Caption>
      </Block>

      <Block pt={24}>
        <Panel pad={20}>
          <Text className="c-fg" style={{ margin: '0 0 12px', fontFamily: font.sans, fontSize: '16px', lineHeight: '22px', fontWeight: 600, color: l.foreground }}>
            Team · {price}
          </Text>
          <CheckList items={['Unlimited bookmarks and boards', 'A shared workspace for your team', 'CSV and Notion exports']} />
          <Block pt={8}>
            <Button href={upgradeUrl}>Upgrade to Team</Button>
          </Block>
        </Panel>
      </Block>

      <Caption style={{ marginTop: '24px' }}>Or remove a saved post to make room for a new one.</Caption>
    </Layout>
  );
}

BookmarkLimit.PreviewProps = {
  email: 'sara@studio.co',
} satisfies BookmarkLimitProps;
