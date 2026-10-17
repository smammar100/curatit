import * as React from 'react';
import { Img, Text } from '@react-email/components';
import { appUrl, asset, color, font, radius } from './_components/tokens';
import { Block, Body2, Button, Caption, Details, Footer, H1, InlineLink, Layout, SecondaryButton, Thumbs, type Thumb } from './_components/layout';

const l = color.light;

// Sent from your app through Resend after someone uses Submit a brand.
// status "received" goes out straight away; "added" goes out once an editor approves it.
export type BrandSubmissionProps = {
  email: string;
  status: 'received' | 'added';
  brand?: string;
  handle?: string;
  category?: string;
  logoUrl?: string;
  submittedOn?: string;
  postCount?: number;
  posts?: Thumb[];
  brandUrl?: string;
};

export const getSubject = (status: 'received' | 'added', brand = 'Deliveroo') =>
  status === 'added' ? `${brand} is now in the Curatit library` : `Thanks for suggesting ${brand}`;

const defaultPosts: Thumb[] = [
  { src: asset('posts/deliveroo-DeMJVogov2Z.jpg'), alt: 'Deliveroo post' },
  { src: asset('posts/deliveroo-DeRlksnIK-o.jpg'), alt: 'Deliveroo post' },
  { src: asset('posts/deliveroo-DePkq41oxyR.jpg'), alt: 'Deliveroo post' },
];

export default function BrandSubmission({
  email,
  status,
  brand = 'Deliveroo',
  handle = '@deliveroo',
  category = 'Food & drink',
  logoUrl = asset('logos/deliveroo.png'),
  submittedOn = '14 Oct 2026',
  postCount = 12,
  posts = defaultPosts,
  brandUrl = `${appUrl}/library`,
}: BrandSubmissionProps) {
  const footer = <Footer reason={<>You're getting this because {email} suggested a brand for the Curatit library.</>} />;

  if (status === 'received') {
    return (
      <Layout preview="An editor will review it. We'll email you when there's news." footer={footer}>
        <H1>Thanks for suggesting {brand}</H1>
        <Body2 style={{ marginTop: '12px' }}>
          An editor reviews every account and every post before anything goes into the library. We'll email you when there's
          news.
        </Body2>
        <Block pt={24}>
          <Details
            rows={[
              { label: 'Brand', value: brand, strong: true },
              { label: 'Instagram', value: handle },
              { label: 'Submitted', value: submittedOn },
              { label: 'Status', value: 'In review' },
            ]}
          />
        </Block>
        <Block pt={28}>
          <SecondaryButton href={`${appUrl}/library`}>Browse the library</SecondaryButton>
        </Block>
      </Layout>
    );
  }

  return (
    <Layout preview={`You suggested it, an editor approved it. ${postCount} posts are live.`} footer={footer}>
      <H1>{brand} is now in the library</H1>
      <Body2 style={{ marginTop: '12px' }}>
        You suggested it and an editor approved it. {postCount} of its posts are live, each one reviewed and tagged.
      </Body2>

      <Block pt={24}>
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ marginBottom: '14px' }}>
          <tbody>
            <tr>
              <td style={{ width: '28px', paddingRight: '10px', verticalAlign: 'middle' }}>
                <Img src={logoUrl} width="28" height="28" alt="" style={{ display: 'block', borderRadius: radius.full }} />
              </td>
              <td style={{ verticalAlign: 'middle' }}>
                <Text className="c-fg" style={{ margin: 0, fontFamily: font.sans, fontSize: '15px', lineHeight: '20px', fontWeight: 600, color: l.foreground }}>
                  {brand}
                </Text>
                <Text className="c-muted" style={{ margin: 0, fontFamily: font.sans, fontSize: '12px', lineHeight: '16px', color: l.muted }}>
                  {category} · {postCount} posts
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
        <Thumbs items={posts.slice(0, 3).map((p) => ({ ...p, href: brandUrl }))} max={160} />
      </Block>

      <Block pt={28}>
        <Button href={brandUrl}>See {brand}'s posts</Button>
      </Block>

      <Caption style={{ marginTop: '28px' }}>
        Know another brand worth studying? <InlineLink href={`${appUrl}/submit`}>Submit it</InlineLink>.
      </Caption>
    </Layout>
  );
}

BrandSubmission.PreviewProps = {
  email: 'sara@studio.co',
  status: 'added',
} satisfies BrandSubmissionProps;
