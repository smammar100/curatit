import * as React from 'react';
import { Body, Button, Container, Head, Html, Img, Link, Preview, Text } from '@react-email/components';
import { appUrl, asset, color, font, fontsHref, radius } from './_components/tokens';

// Welcome email laid out like a classic editorial welcome: an ink hero band, a
// signed letter, a feature card, and an ink footer with the wordmark set large.

const l = color.light;
const d = color.dark;
const ink = '#171717';
const onInk = '#f5f5f5';
const onInkMuted = '#a3a3a3';
const onInkSoft = '#d4d4d4';
const edge = '#ebebeb';

export type WelcomeEditorialProps = {
  email: string;
  firstName?: string;
  /** Used as the signature's alt text, so it reads when images are off. */
  founderName?: string;
  founderRole?: string;
  /** Transparent PNG of your signature in ink, about 3x its 140px display width. */
  signatureUrl?: string;
  /** The same signature in a light colour, for dark mode in Apple Mail and iOS Mail. */
  signatureDarkUrl?: string;
  signOff?: string;
  /** The fanned posts illustration, 1036 x 464 JPG shown at 518px. */
  featureImageUrl?: string;
  ctaUrl?: string;
  libraryUrl?: string;
  /** Only if you host a web copy of this email. */
  viewInBrowserUrl?: string;
  /** Shown when this person is also on a list, like the weekly edition. */
  unsubscribeUrl?: string;
  address?: string;
};

export const subject = "You're in. Welcome to Curatit.";

const css = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  a { text-decoration-thickness: 1px; text-underline-offset: 2px; }
  .we-sig-dark { display: none; max-height: 0; overflow: hidden; mso-hide: all; }
  @media (prefers-color-scheme: dark) {
    .we-page { background-color: ${d.background} !important; }
    .we-surface { background-color: ${d.fill} !important; border-color: #2c2c2c !important; }
    .we-fill { background-color: ${d.background} !important; border-color: #2c2c2c !important; }
    .we-card { background-color: ${d.surface} !important; border-color: ${d.border} !important; }
    .we-fg { color: ${d.foreground} !important; }
    .we-muted { color: ${d.muted} !important; }
    .we-ink { background-color: ${d.foreground} !important; color: ${d.background} !important; }
    .we-rule { border-color: ${d.border} !important; }
    .we-chip { background-color: #2c2c2c !important; color: ${d.foreground} !important; }
    .we-sig-light { display: none !important; max-height: 0 !important; }
    .we-sig-dark { display: block !important; max-height: none !important; overflow: visible !important; }
  }
  [data-ogsc] .we-fg { color: ${d.foreground} !important; }
  [data-ogsc] .we-muted { color: ${d.muted} !important; }
  [data-ogsb] .we-page { background-color: ${d.background} !important; }
  [data-ogsb] .we-surface { background-color: ${d.fill} !important; }
  @media only screen and (max-width: 620px) {
    .we-outer { padding: 0 !important; }
    .we-pad { padding-left: 24px !important; padding-right: 24px !important; }
    .we-stack { display: block !important; width: 100% !important; max-width: 100% !important; }
    .we-mark { padding: 0 0 24px 0 !important; }
    .we-mark img { width: 48px !important; height: 48px !important; }
    .we-h1 { font-size: 30px !important; line-height: 36px !important; }
    .we-card-pad { padding: 16px !important; }
  }
`;

const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <Text
    className="we-fg"
    style={{ margin: '0 0 16px', fontFamily: font.sans, fontSize: '15px', lineHeight: '24px', color: l.foreground, ...style }}
  >
    {children}
  </Text>
);

const Row = ({
  children,
  className,
  style,
  cellClass,
  cellStyle,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  cellClass?: string;
  cellStyle?: React.CSSProperties;
}) => (
  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} className={className} style={style}>
    <tbody>
      <tr>
        <td className={cellClass} style={cellStyle}>
          {children}
        </td>
      </tr>
    </tbody>
  </table>
);

export default function WelcomeEditorial({
  email,
  firstName,
  founderName = 'Ammar',
  founderRole = 'Founder, Curatit',
  signatureUrl = asset('signature.png'),
  signatureDarkUrl = asset('signature-dark.png'),
  signOff = 'Warmly,',
  featureImageUrl = asset('welcome/categories-fan.jpg'),
  ctaUrl = `${appUrl}/library`,
  libraryUrl = `${appUrl}/library`,
  viewInBrowserUrl,
  unsubscribeUrl,
  address,
}: WelcomeEditorialProps) {
  const sides = { borderLeft: `1px solid ${edge}`, borderRight: `1px solid ${edge}` };
  const footLink = { color: onInkSoft, textDecoration: 'underline' };

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <link rel="stylesheet" href={fontsHref} />
        <style>{css}</style>
      </Head>
      <Body className="we-page" style={{ margin: 0, padding: 0, backgroundColor: l.background }}>
        <Preview>I'm so glad you're here. Here's where to start.</Preview>
        <Row className="we-page" style={{ backgroundColor: l.background }} cellClass="we-page we-outer" cellStyle={{ backgroundColor: l.background, padding: '32px 0' }}>
          <Container style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
            {/* Hero band */}
            <Row style={{ backgroundColor: ink }} cellClass="we-pad" cellStyle={{ backgroundColor: ink, padding: '28px 40px 44px' }}>
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Link href={appUrl} style={{ textDecoration: 'none' }}>
                        <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                          <tbody>
                            <tr>
                              <td style={{ verticalAlign: 'middle', paddingRight: '8px', width: '18px' }}>
                                <Img src={asset('curatit-symbol-dark.png')} width="18" height="18" alt="" style={{ display: 'block' }} />
                              </td>
                              <td style={{ verticalAlign: 'middle' }}>
                                <span style={{ fontFamily: font.serif, fontSize: '22px', lineHeight: '28px', letterSpacing: '-0.01em', color: onInk }}>
                                  Curatit
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Link>
                    </td>
                    {viewInBrowserUrl ? (
                      <td align="right" style={{ verticalAlign: 'middle' }}>
                        <Link href={viewInBrowserUrl} style={{ fontFamily: font.sans, fontSize: '12px', lineHeight: '16px', fontWeight: 600, color: onInkSoft, textDecoration: 'underline' }}>
                          View in browser
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                </tbody>
              </table>

              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: '48px' }}>
                <tbody>
                  <tr>
                    <td className="we-stack we-mark" width="35%" style={{ width: '35%', verticalAlign: 'top', paddingRight: '16px' }}>
                      <Img src={asset('hero-symbol.png')} width="120" height="120" alt="" style={{ display: 'block' }} />
                    </td>
                    <td className="we-stack" width="65%" style={{ width: '65%', verticalAlign: 'top' }}>
                      <Text
                        style={{
                          margin: 0,
                          fontFamily: font.sans,
                          fontSize: '12px',
                          lineHeight: '16px',
                          fontWeight: 600,
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase',
                          color: onInkMuted,
                        }}
                      >
                        You're in
                      </Text>
                      <Text
                        className="we-h1"
                        style={{
                          margin: '12px 0 0',
                          fontFamily: font.serif,
                          fontSize: '36px',
                          lineHeight: '42px',
                          fontWeight: 400,
                          letterSpacing: '-0.02em',
                          color: onInk,
                        }}
                      >
                        {firstName ? `Welcome to Curatit, ${firstName}.` : 'Welcome to Curatit.'}
                      </Text>
                      <Button
                        href={ctaUrl}
                        style={{
                          marginTop: '24px',
                          backgroundColor: onInk,
                          color: ink,
                          fontFamily: font.sans,
                          fontSize: '15px',
                          lineHeight: '20px',
                          fontWeight: 600,
                          borderRadius: radius.item,
                          padding: '12px 20px',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Start with a brief
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Row>

            {/* Letter */}
            <Row className="we-surface" style={{ backgroundColor: l.surface, ...sides }} cellClass="we-pad" cellStyle={{ padding: '40px 40px 36px' }}>
              <P>{firstName ? `Hi ${firstName},` : 'Hi there,'}</P>
              <P>I'm so glad you're here.</P>
              <P>
                Curatit is built for the moment a brief lands and your best reference is buried in{' '}
                <span
                  className="we-chip"
                  style={{ fontFamily: font.mono, fontSize: '13px', backgroundColor: l.fill, borderRadius: radius.code, padding: '1px 5px', whiteSpace: 'nowrap' }}
                >
                  inspo_final_v3
                </span>{' '}
                again. <b>Type the brief the way you'd say it,</b> and Curatit finds the posts that fit.
              </P>
              <P style={{ marginBottom: 0 }}>
                What are you working on this week? <b>Hit reply and tell me.</b>
              </P>

              {/* Sign-off: handwritten signature and title */}
              <P style={{ margin: '28px 0 0' }}>{signOff}</P>
              <Img
                className="we-sig-light"
                src={signatureUrl}
                width="140"
                alt={founderName}
                style={{ display: 'block', width: '140px', height: 'auto', margin: '6px 0 0 -4px' }}
              />
              <Img
                className="we-sig-dark"
                src={signatureDarkUrl}
                width="140"
                alt={founderName}
                style={{ display: 'none', maxHeight: 0, overflow: 'hidden', msoHide: 'all', width: '140px', height: 'auto', margin: '6px 0 0 -4px' } as React.CSSProperties}
              />
              <Text className="we-muted" style={{ margin: '6px 0 0', fontFamily: font.sans, fontSize: '13px', lineHeight: '20px', color: l.muted }}>
                {founderRole}
              </Text>
            </Row>

            {/* Feature card: the posts bring the colour */}
            <Row className="we-fill" style={{ backgroundColor: l.fill, ...sides }} cellClass="we-pad" cellStyle={{ padding: '32px 40px' }}>
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                className="we-card"
                style={{ backgroundColor: l.surface, border: `1px solid ${l.border}`, borderRadius: radius.container, borderCollapse: 'separate' }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: 0, borderRadius: `${radius.container} ${radius.container} 0 0`, overflow: 'hidden', backgroundColor: ink }}>
                      <Link href={libraryUrl} style={{ textDecoration: 'none' }}>
                        <Img
                          src={featureImageUrl}
                          width="518"
                          alt="7 library posts fanned out, one from each category: travel, e-commerce, sportswear, food and drink, fashion, fintech and technology"
                          style={{ display: 'block', width: '100%', maxWidth: '518px', height: 'auto', borderRadius: '11px 11px 0 0' }}
                        />
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="we-card-pad" style={{ padding: '24px' }}>
                      <Text
                        className="we-fg"
                        style={{ margin: 0, fontFamily: font.serif, fontSize: '26px', lineHeight: '32px', fontWeight: 400, letterSpacing: '-0.01em', color: l.foreground }}
                      >
                        7 categories, studied closely.
                      </Text>
                      <Button
                        href={libraryUrl}
                        className="we-ink"
                        style={{
                          marginTop: '20px',
                          backgroundColor: ink,
                          color: l.background,
                          fontFamily: font.sans,
                          fontSize: '15px',
                          lineHeight: '20px',
                          fontWeight: 600,
                          borderRadius: radius.item,
                          padding: '12px 20px',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Explore the library
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Row>

            {/* Unsubscribe line */}
            {unsubscribeUrl ? (
              <Row className="we-surface" style={{ backgroundColor: l.surface, ...sides }} cellClass="we-pad" cellStyle={{ padding: '20px 40px', textAlign: 'center' }}>
                <Text className="we-muted" style={{ margin: 0, fontFamily: font.sans, fontSize: '13px', lineHeight: '20px', color: l.muted, textAlign: 'center' }}>
                  Changed your mind? You can{' '}
                  <Link href={unsubscribeUrl} className="we-muted" style={{ color: l.muted, textDecoration: 'underline' }}>
                    unsubscribe
                  </Link>{' '}
                  at any time.
                </Text>
              </Row>
            ) : null}

            {/* Footer band */}
            <Row style={{ backgroundColor: ink }} cellStyle={{ backgroundColor: ink, padding: '32px 0 0' }}>
              <Row cellClass="we-pad" cellStyle={{ padding: '0 40px', textAlign: 'center' }}>
                <Text style={{ margin: 0, fontFamily: font.sans, fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: onInkSoft, textAlign: 'center' }}>
                  <Link href={`${appUrl}/library`} style={footLink}>Library</Link>
                  <span style={{ color: '#737373' }}>{'   ·   '}</span>
                  <Link href={`${appUrl}/roadmap`} style={footLink}>Roadmap</Link>
                  <span style={{ color: '#737373' }}>{'   ·   '}</span>
                  <Link href={`${appUrl}/blog`} style={footLink}>Blog</Link>
                </Text>
                <Text style={{ margin: '20px 0 0', fontFamily: font.sans, fontSize: '12px', lineHeight: '18px', color: onInkMuted, textAlign: 'center' }}>
                  You're getting this because you signed up for Curatit with {email}.
                </Text>
                <Text style={{ margin: '6px 0 0', fontFamily: font.sans, fontSize: '12px', lineHeight: '18px', color: onInkMuted, textAlign: 'center' }}>
                  <Link href={`${appUrl}/legal/privacy`} style={{ color: onInkMuted, textDecoration: 'underline' }}>Privacy</Link>
                  {' · '}
                  <Link href={`${appUrl}/legal/terms`} style={{ color: onInkMuted, textDecoration: 'underline' }}>Terms</Link>
                  {' · '}© {new Date().getFullYear()} Curatit
                </Text>
                {address ? (
                  <Text style={{ margin: '6px 0 0', fontFamily: font.sans, fontSize: '12px', lineHeight: '18px', color: onInkMuted, textAlign: 'center' }}>
                    {address}
                  </Text>
                ) : null}
              </Row>
              <Img
                src={asset('footer-wordmark.png')}
                width="600"
                alt="Curatit"
                style={{ display: 'block', width: '100%', maxWidth: '600px', height: 'auto', marginTop: '28px' }}
              />
            </Row>
          </Container>
        </Row>
      </Body>
    </Html>
  );
}

WelcomeEditorial.PreviewProps = {
  email: 'sara@studio.co',
  firstName: 'Sara',
  unsubscribeUrl: 'https://curatit.vercel.app/unsubscribe',
} satisfies WelcomeEditorialProps;
