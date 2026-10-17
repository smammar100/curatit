import * as React from 'react';
import { Img, Link, Text } from '@react-email/components';
import { Block, Body2, Button, Caption, Eyebrow, Footer, H1, Layout, Lead, Rule } from './_components/layout';
import { appUrl, asset, color, font, radius } from './_components/tokens';

const l = color.light;

export type WelcomePost = {
  brand: string;
  /** 4:5 JPG or PNG. WebP fails in Outlook for Windows. */
  imageUrl: string;
  logoUrl: string;
  href: string;
};

export type WelcomeProps = {
  email: string;
  firstName?: string;
  brief?: string;
  /** Up to 3 posts that answer the brief. */
  posts?: WelcomePost[];
  searchUrl?: string;
  founderName?: string;
  postMeta?: string;
};

export const subject = 'Welcome to Curatit';

const defaultPosts: WelcomePost[] = [
  { brand: 'Wise', imageUrl: asset('welcome/wise.jpg'), logoUrl: asset('welcome/wise-logo.png'), href: `${appUrl}/library` },
  { brand: 'Airbnb', imageUrl: asset('welcome/airbnb.jpg'), logoUrl: asset('welcome/airbnb-logo.png'), href: `${appUrl}/library` },
  { brand: 'Claude', imageUrl: asset('welcome/claude.jpg'), logoUrl: asset('welcome/claude-logo.png'), href: `${appUrl}/library` },
];

export default function Welcome({
  email,
  firstName,
  brief = 'launch carousel that shows the product',
  posts = defaultPosts,
  searchUrl = `${appUrl}/library`,
  founderName = 'Ammar',
  postMeta = 'Product launch · Carousel',
}: WelcomeProps) {
  const shown = posts.slice(0, 3);
  return (
    <Layout
      preview="Real brand posts, reviewed by editors. Start with a brief."
      footer={<Footer reason={<>You're getting this because you signed up for Curatit with {email}.</>} />}
    >
      <H1>{firstName ? `Welcome to Curatit, ${firstName}.` : 'Welcome to Curatit.'}</H1>
      <Lead style={{ marginTop: '12px' }}>
        Real organic brand posts, reviewed by editors. Search by brief, save the best to a board, and share it with
        your client.
      </Lead>

      <Block pt={32}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          className="c-surface"
          style={{
            backgroundColor: l.surface,
            border: `1px solid ${l.border}`,
            borderRadius: radius.container,
            borderCollapse: 'separate',
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '16px' }}>
                <Eyebrow>Try a brief</Eyebrow>

                {/* The search field, as it looks in the app */}
                <table
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  className="c-rule"
                  style={{
                    marginTop: '12px',
                    border: `1px solid ${l.border}`,
                    borderRadius: radius.item,
                    borderCollapse: 'separate',
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ width: '16px', padding: '10px 0 10px 12px', verticalAlign: 'middle' }}>
                        <Img src={asset('icon-search.png')} width="16" height="16" alt="" style={{ display: 'block' }} />
                      </td>
                      <td style={{ padding: '10px 12px 10px 8px', verticalAlign: 'middle' }}>
                        <Text
                          className="c-fg"
                          style={{ margin: 0, fontFamily: font.sans, fontSize: '15px', lineHeight: '20px', color: l.foreground }}
                        >
                          {brief}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <Caption style={{ marginTop: '12px' }}>
                  {shown.length} posts · {postMeta}
                </Caption>

                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: '12px', tableLayout: 'fixed' }}>
                  <tbody>
                    <tr>
                      {shown.map((p, i) => (
                        <React.Fragment key={p.brand}>
                        {/* Percent gutters keep all 3 posts the same size at every width */}
                        {i > 0 ? <td width="2%" style={{ width: '2%', fontSize: 0, lineHeight: 0 }}>&nbsp;</td> : null}
                        <td width="32%" style={{ width: '32%', verticalAlign: 'top' }}>
                          <Link href={p.href} style={{ textDecoration: 'none' }}>
                            <Img
                              src={p.imageUrl}
                              width="152"
                              alt={`${p.brand} post`}
                              className="c-rule"
                              style={{
                                display: 'block',
                                width: '100%',
                                maxWidth: '152px',
                                height: 'auto',
                                boxSizing: 'border-box',
                                border: `1px solid ${l.border}`,
                                borderRadius: radius.image,
                              }}
                            />
                          </Link>
                          <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: '8px' }}>
                            <tbody>
                              <tr>
                                <td style={{ width: '16px', paddingRight: '6px', verticalAlign: 'middle' }}>
                                  <Img
                                    src={p.logoUrl}
                                    width="16"
                                    height="16"
                                    alt=""
                                    style={{ display: 'block', borderRadius: radius.full }}
                                  />
                                </td>
                                <td style={{ verticalAlign: 'middle' }}>
                                  <Text
                                    className="c-fg"
                                    style={{
                                      margin: 0,
                                      fontFamily: font.sans,
                                      fontSize: '13px',
                                      lineHeight: '16px',
                                      fontWeight: 600,
                                      color: l.foreground,
                                    }}
                                  >
                                    {p.brand}
                                  </Text>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Block>

      <Block pt={28}>
        <Button href={searchUrl}>Search the library</Button>
      </Block>

      <Body2 style={{ marginTop: '20px' }}>
        Write a brief the way you'd say it. Curatit reads it into objectives, formats and styles, and shows why each post
        matched.
      </Body2>

      <Rule />

      <Body2>Reply to this email if a brand or category you need is missing. It comes straight to me.</Body2>
      <Text
        className="c-fg"
        style={{ margin: '12px 0 0', fontFamily: font.sans, fontSize: '15px', lineHeight: '24px', fontWeight: 600, color: l.foreground }}
      >
        {founderName}
      </Text>
      <Caption>Founder, Curatit</Caption>
    </Layout>
  );
}

Welcome.PreviewProps = {
  email: 'ammar@studio.co',
  firstName: 'Sara',
} satisfies WelcomeProps;
