import * as React from 'react';
import { Body, Button, Container, Head, Html, Img, Link, Preview, Text } from '@react-email/components';
import { appUrl, asset, color, font, fontsHref, radius } from './_components/tokens';

// A short, image-led welcome note: a scatter of library posts with the Curatit
// symbol, a few lines in large type, a divider, and a signed sign-off. No buttons.

const l = color.light;
const d = color.dark;
const page = '#f5f5f5';

// The hero illustrations to choose from. Each is a 1120 x 700 PNG with a transparent
// background, shown at 560px, so it sits on the email's own colour in light and dark mode.
export const heroes = {
  scatter: { file: 'welcome/hero-scatter.png', alt: 'Brand posts from the Curatit library scattered across the top, with the Curatit symbol on the first card' },
  grid: { file: 'welcome/hero-grid.png', alt: 'A grid of brand posts from the Curatit library, with the Curatit symbol in the middle' },
  board: { file: 'welcome/hero-board.png', alt: 'A Curatit board called Payments app launch with saved posts from Wise, Revolut and Airbnb' },
  carousel: { file: 'welcome/hero-carousel.png', alt: 'A Wise carousel from the Curatit library, laid out slide by slide' },
} as const;

export type WelcomeNoteProps = {
  email: string;
  firstName?: string;
  /** Which illustration sits at the top. */
  hero?: keyof typeof heroes;
  /** Your own image instead, 1120 x 700, ideally a transparent PNG. */
  heroImageUrl?: string;
  heroAlt?: string;
  libraryUrl?: string;
  founderName?: string;
  founderRole?: string;
  signatureUrl?: string;
  signatureDarkUrl?: string;
  unsubscribeUrl?: string;
  address?: string;
};

export const subject = 'Welcome to Curatit';

const css = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  a { text-decoration-thickness: 1px; text-underline-offset: 3px; }
  .wn-sig-dark { display: none; max-height: 0; overflow: hidden; mso-hide: all; }
  @media (prefers-color-scheme: dark) {
    .wn-page { background-color: ${d.background} !important; }
    .wn-surface { background-color: ${d.fill} !important; }
    .wn-fg { color: ${d.foreground} !important; }
    .wn-muted { color: ${d.muted} !important; }
    .wn-rule { border-color: #2c2c2c !important; }
    .wn-ink { background-color: ${d.foreground} !important; color: ${d.background} !important; }
    .wn-sig-light { display: none !important; max-height: 0 !important; }
    .wn-sig-dark { display: block !important; max-height: none !important; overflow: visible !important; }
  }
  [data-ogsc] .wn-fg { color: ${d.foreground} !important; }
  [data-ogsc] .wn-muted { color: ${d.muted} !important; }
  [data-ogsb] .wn-page { background-color: ${d.background} !important; }
  [data-ogsb] .wn-surface { background-color: ${d.fill} !important; }
  @media only screen and (max-width: 600px) {
    .wn-pad { padding-left: 24px !important; padding-right: 24px !important; }
    .wn-h1 { font-size: 30px !important; line-height: 36px !important; }
    .wn-body { font-size: 17px !important; line-height: 28px !important; }
  }
`;

const Row = ({ children, className, style, cellClass, cellStyle }: {
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

const bodyText: React.CSSProperties = {
  margin: '0 0 18px',
  fontFamily: font.sans,
  fontSize: '18px',
  lineHeight: '29px',
  color: l.foreground,
};

export default function WelcomeNote({
  email,
  firstName,
  hero = 'scatter',
  heroImageUrl,
  heroAlt,
  libraryUrl = `${appUrl}/library`,
  founderName = 'Ammar',
  founderRole = 'Founder, Curatit',
  signatureUrl = asset('signature.png'),
  signatureDarkUrl = asset('signature-dark.png'),
  unsubscribeUrl,
  address,
}: WelcomeNoteProps) {
  const footLink = { color: l.muted, textDecoration: 'underline' };
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <link rel="stylesheet" href={fontsHref} />
        <style>{css}</style>
      </Head>
      <Body className="wn-page" style={{ margin: 0, padding: 0, backgroundColor: page }}>
        <Preview>We're so glad you're here. Here's where to start.</Preview>
        <Row className="wn-page" style={{ backgroundColor: page }} cellClass="wn-page" cellStyle={{ backgroundColor: page, padding: '0 0 20px' }}>
          <Container style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>
            {/* Hero: transparent, so it sits on the note's background in light and dark mode */}
            <Row className="wn-surface" style={{ backgroundColor: l.surface }} cellClass="wn-surface" cellStyle={{ backgroundColor: l.surface, padding: 0, lineHeight: 0 }}>
              <Link href={libraryUrl} style={{ textDecoration: 'none' }}>
                <Img
                  src={heroImageUrl ?? asset(heroes[hero].file)}
                  width="560"
                  alt={heroAlt ?? heroes[hero].alt}
                  style={{ display: 'block', width: '100%', maxWidth: '560px', height: 'auto' }}
                />
              </Link>
            </Row>

            {/* The note */}
            <Row className="wn-surface" style={{ backgroundColor: l.surface }} cellClass="wn-pad wn-surface" cellStyle={{ backgroundColor: l.surface, padding: '8px 40px 36px' }}>
              <Text
                className="wn-fg wn-h1"
                style={{ margin: '0 0 24px', fontFamily: font.serif, fontSize: '36px', lineHeight: '42px', fontWeight: 400, letterSpacing: '-0.02em', color: l.foreground }}
              >
                {firstName ? `Welcome to Curatit, ${firstName}.` : 'Welcome to Curatit.'}
              </Text>
              <Text className="wn-fg wn-body" style={bodyText}>
                <b>Every brief starts with a hunt.</b> The posts you remember are buried in screenshots, saved folders and 38
                open tabs, and when you finally find one, you still have to explain why it works.
              </Text>
              <Text className="wn-fg wn-body" style={bodyText}>
                <b>Curatit puts them in one library.</b> Real brand posts, each reviewed and tagged by an editor. Search by
                brief the way you'd say it, and see why each result matched.
              </Text>
              <Text className="wn-fg wn-body" style={bodyText}>
                <b>So you hunt less and make more.</b> Save the best to a board, send your client one link, and walk into every
                review with references you can explain.
              </Text>

              <Button
                href={libraryUrl}
                className="wn-ink"
                style={{
                  marginTop: '6px',
                  backgroundColor: l.foreground,
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
                Search the library
              </Button>

            </Row>

            {/* Divider */}
            <Row className="wn-surface" style={{ backgroundColor: l.surface }} cellClass="wn-pad wn-surface" cellStyle={{ backgroundColor: l.surface, padding: '10px 40px' }}>
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                <tbody>
                  <tr>
                    <td className="wn-rule" style={{ borderTop: '1px solid #eeeeee', fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </Row>

            {/* Sign-off */}
            <Row className="wn-surface" style={{ backgroundColor: l.surface }} cellClass="wn-pad wn-surface" cellStyle={{ backgroundColor: l.surface, padding: '22px 40px 40px' }}>
              <Text className="wn-fg wn-body" style={{ ...bodyText, margin: 0, fontWeight: 600 }}>
                See you in the library.
              </Text>
              <Img
                className="wn-sig-light"
                src={signatureUrl}
                width="140"
                alt={founderName}
                style={{ display: 'block', width: '140px', height: 'auto', margin: '14px 0 0 -4px' }}
              />
              <Img
                className="wn-sig-dark"
                src={signatureDarkUrl}
                width="140"
                alt={founderName}
                style={{ display: 'none', maxHeight: 0, overflow: 'hidden', msoHide: 'all', width: '140px', height: 'auto', margin: '14px 0 0 -4px' } as React.CSSProperties}
              />
              <Text className="wn-muted" style={{ margin: '6px 0 0', fontFamily: font.sans, fontSize: '14px', lineHeight: '20px', color: l.muted }}>
                {founderRole}
              </Text>
            </Row>

            {/* Footer */}
            <Row cellClass="wn-pad" cellStyle={{ padding: '24px 40px 8px', textAlign: 'center' }}>
              <Text className="wn-muted" style={{ margin: 0, fontFamily: font.sans, fontSize: '12px', lineHeight: '24px', fontWeight: 500, color: l.muted, textAlign: 'center' }}>
                Sent from Curatit{address ? ` · ${address}` : ''}
                <br />
                You're getting this because you signed up for Curatit with {email}.
                <br />
                {unsubscribeUrl ? (
                  <>
                    <Link href={unsubscribeUrl} className="wn-muted" style={footLink}>
                      Unsubscribe
                    </Link>
                    {' · '}
                  </>
                ) : null}
                <Link href={`${appUrl}/legal/privacy`} className="wn-muted" style={footLink}>
                  Privacy
                </Link>
                {' · '}
                <Link href={`${appUrl}/legal/terms`} className="wn-muted" style={footLink}>
                  Terms
                </Link>
              </Text>
            </Row>
          </Container>
        </Row>
      </Body>
    </Html>
  );
}

WelcomeNote.PreviewProps = {
  email: 'sara@studio.co',
  firstName: 'Sara',
  unsubscribeUrl: 'https://curatit.vercel.app/unsubscribe',
} satisfies WelcomeNoteProps;
