import * as React from 'react';
import { Img, Link, Text } from '@react-email/components';
import { appUrl, asset, color, font, radius } from './_components/tokens';
import { Block, Button, Eyebrow, Footer, H1, Icon, Layout, Lead, Rule } from './_components/layout';

const l = color.light;

// The weekly edition, sent with Resend Broadcasts. Laid out like the Mobbin weekly drop:
// 3 featured posts, a short list of more, one button, then a few notes from Curatit.

export type FeaturedPost = {
  brand: string;
  logoUrl: string;
  imageUrl: string;
  /** Category and format, e.g. "Fashion · Carousel". */
  meta: string;
  /** One line on why it works. */
  why: string;
  href: string;
};

export type ListedPost = { brand: string; logoUrl: string; meta: string; href: string };

export type WeeklyEditionProps = {
  email: string;
  issueDate?: string;
  count?: number;
  featured?: FeaturedPost[];
  more?: ListedPost[];
  allUrl?: string;
  /** Resend Broadcasts: "{{{RESEND_UNSUBSCRIBE_URL}}}" */
  unsubscribeUrl?: string;
  address?: string;
};

// Point these at each post's page once the library has per-post URLs.
const post = (_slug: string) => `${appUrl}/library`;

const defaultFeatured: FeaturedPost[] = [
  {
    brand: 'Nike',
    logoUrl: asset('logos/nike.png'),
    imageUrl: asset('welcome/nike.jpg'),
    meta: 'Sportswear · Carousel',
    why: 'A studio portrait and one serif word. Closer to a fashion house than a sports brand.',
    href: post('nike'),
  },
  {
    brand: 'Uber Eats',
    logoUrl: asset('logos/uber-eats.png'),
    imageUrl: asset('welcome/ubereats.jpg'),
    meta: 'Food & drink · Static',
    why: 'A seasonal produce chart on flat yellow, made to be saved and shared.',
    href: post('uber-eats'),
  },
  {
    brand: 'Zara',
    logoUrl: asset('logos/zara.png'),
    imageUrl: asset('welcome/zara.jpg'),
    meta: 'Fashion · Carousel',
    why: 'Two models mid-stride on a gravel street, framed like a magazine spread.',
    href: post('zara'),
  },
];

const defaultMore: ListedPost[] = [
  { brand: 'Wise', logoUrl: asset('logos/wise.png'), meta: 'Product launch · Carousel', href: post('wise') },
  { brand: 'Airbnb', logoUrl: asset('logos/airbnb.png'), meta: 'Feature roundup · Carousel', href: post('airbnb') },
  { brand: 'Amazon', logoUrl: asset('logos/amazon.png'), meta: 'Community question · Carousel', href: post('amazon') },
  { brand: 'Tripadvisor', logoUrl: asset('logos/tripadvisor.png'), meta: 'Comparison · Carousel', href: post('tripadvisor') },
  { brand: 'Claude', logoUrl: asset('logos/claude.png'), meta: 'Customer story · Carousel', href: post('claude') },
];

const notes = [
  {
    icon: 'icon-plus',
    title: 'Missing a brand?',
    body: "Tell us which one and an editor will take a look.",
    link: 'Submit a brand',
    href: `${appUrl}/submit`,
  },
  {
    icon: 'icon-sparkle',
    title: 'Curatit MCP is on the way',
    body: 'Search the library by brief from your AI agent.',
    link: 'See the roadmap',
    href: `${appUrl}/roadmap`,
  },
  {
    icon: 'icon-users',
    title: 'Working with a team?',
    body: 'Share boards, saved searches and notes on the Team plan.',
    link: 'See plans',
    href: `${appUrl}/pricing`,
  },
];

const names = (list: { brand: string }[]) => {
  const b = list.map((x) => x.brand);
  return b.length < 2 ? b.join('') : `${b.slice(0, -1).join(', ')} and ${b[b.length - 1]}`;
};

export const getSubject = (count = 24, featured: { brand: string }[] = defaultFeatured) => `${count} new posts: ${names(featured)}`;

export default function WeeklyEdition({
  email,
  issueDate = '14 Oct 2026',
  count = 24,
  featured = defaultFeatured,
  more = defaultMore,
  allUrl = `${appUrl}/library`,
  unsubscribeUrl,
  address,
}: WeeklyEditionProps) {
  const top = featured.slice(0, 3);
  return (
    <Layout
      preview={`Featuring ${names(top)}.`}
      footer={
        <Footer
          reason={<>You're getting this because you get the Curatit weekly edition at {email}.</>}
          unsubscribeUrl={unsubscribeUrl}
          address={address}
        />
      }
    >
      <Eyebrow>Weekly edition · {issueDate}</Eyebrow>
      <Block pt={10}>
        <H1>{count} new posts this week</H1>
      </Block>
      <Lead style={{ marginTop: '8px' }}>Featuring {names(top)}.</Lead>

      {/* Featured: image left, why it works right */}
      <Block pt={28}>
        {top.map((p, i) => (
          <table
            key={p.brand}
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            style={{ marginTop: i ? '20px' : 0, tableLayout: 'fixed' }}
          >
            <tbody>
              <tr>
                <td width="36%" style={{ width: '36%', verticalAlign: 'top' }}>
                  <Link href={p.href} style={{ textDecoration: 'none' }}>
                    <Img
                      src={p.imageUrl}
                      width="184"
                      alt={`${p.brand} post`}
                      className="c-rule"
                      style={{
                        display: 'block',
                        width: '100%',
                        maxWidth: '184px',
                        height: 'auto',
                        boxSizing: 'border-box',
                        border: `1px solid ${l.border}`,
                        borderRadius: radius.image,
                      }}
                    />
                  </Link>
                </td>
                <td width="64%" style={{ width: '64%', verticalAlign: 'middle', paddingLeft: '20px' }}>
                  <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                    <tbody>
                      <tr>
                        <td style={{ width: '20px', paddingRight: '8px', verticalAlign: 'middle' }}>
                          <Img src={p.logoUrl} width="20" height="20" alt="" style={{ display: 'block', borderRadius: radius.full }} />
                        </td>
                        <td style={{ verticalAlign: 'middle' }}>
                          <Text className="c-fg" style={{ margin: 0, fontFamily: font.sans, fontSize: '15px', lineHeight: '20px', fontWeight: 600, color: l.foreground }}>
                            {p.brand}
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <Text className="c-muted" style={{ margin: '4px 0 0', fontFamily: font.sans, fontSize: '12px', lineHeight: '16px', color: l.muted }}>
                    {p.meta}
                  </Text>
                  <Text
                    className="c-fg"
                    style={{ margin: '10px 0 0', fontFamily: font.serif, fontSize: '19px', lineHeight: '25px', letterSpacing: '-0.01em', color: l.foreground }}
                  >
                    {p.why}
                  </Text>
                  <Text style={{ margin: '12px 0 0', fontFamily: font.sans, fontSize: '14px', lineHeight: '20px', fontWeight: 600 }}>
                    <Link href={p.href} className="c-fg" style={{ color: l.foreground, textDecoration: 'underline' }}>
                      View post
                    </Link>
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        ))}
      </Block>

      {/* More this week: compact rows */}
      <Block pt={36}>
        <Eyebrow style={{ marginBottom: '6px' }}>Also new</Eyebrow>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
          <tbody>
            {more.slice(0, 5).map((m, i) => (
              <tr key={m.brand}>
                <td className="c-rule" style={{ width: '32px', padding: '12px 12px 12px 0', borderTop: i ? `1px solid ${l.border}` : 'none', verticalAlign: 'middle' }}>
                  <Link href={m.href}>
                    <Img src={m.logoUrl} width="32" height="32" alt="" style={{ display: 'block', borderRadius: radius.full }} />
                  </Link>
                </td>
                <td className="c-rule" style={{ padding: '12px 0', borderTop: i ? `1px solid ${l.border}` : 'none', verticalAlign: 'middle' }}>
                  <Link href={m.href} style={{ textDecoration: 'none' }}>
                    <Text className="c-fg" style={{ margin: 0, fontFamily: font.sans, fontSize: '15px', lineHeight: '20px', fontWeight: 600, color: l.foreground }}>
                      {m.brand}
                    </Text>
                    <Text className="c-muted" style={{ margin: 0, fontFamily: font.sans, fontSize: '13px', lineHeight: '18px', color: l.muted }}>
                      {m.meta}
                    </Text>
                  </Link>
                </td>
                <td className="c-rule" align="right" style={{ width: '16px', padding: '12px 0', borderTop: i ? `1px solid ${l.border}` : 'none', verticalAlign: 'middle' }}>
                  <Link href={m.href}>
                    <Icon name="icon-chevron" size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>

      <Block pt={24}>
        <Button href={allUrl}>See all {count} posts</Button>
      </Block>

      <Rule style={{ margin: '40px 0 8px' }} />

      {/* Notes from Curatit */}
      {notes.map((n) => (
        <table key={n.title} role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: '20px' }}>
          <tbody>
            <tr>
              <td style={{ width: '20px', verticalAlign: 'top', paddingTop: '2px' }}>
                <Icon name={n.icon} size={20} />
              </td>
              <td style={{ paddingLeft: '14px', verticalAlign: 'top' }}>
                <Text className="c-fg" style={{ margin: 0, fontFamily: font.sans, fontSize: '15px', lineHeight: '22px', fontWeight: 600, color: l.foreground }}>
                  {n.title}
                </Text>
                <Text className="c-muted" style={{ margin: '2px 0 0', fontFamily: font.sans, fontSize: '14px', lineHeight: '20px', color: l.muted }}>
                  {n.body}{' '}
                  <Link href={n.href} className="c-fg" style={{ color: l.foreground, fontWeight: 600, textDecoration: 'underline' }}>
                    {n.link}
                  </Link>
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      ))}
    </Layout>
  );
}

WeeklyEdition.PreviewProps = {
  email: 'sara@studio.co',
  unsubscribeUrl: 'https://www.curatit.app/unsubscribe',
} satisfies WeeklyEditionProps;
