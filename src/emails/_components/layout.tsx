import * as React from 'react';
import {
  Body,
  Button as REButton,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import { appUrl, asset, color, font, fontsHref, radius, type } from './tokens';

const l = color.light;
const d = color.dark;

// Dark mode for Apple Mail, iOS Mail and Outlook.com. Gmail apps invert colours on
// their own, so every colour pairing here also survives a forced inversion.
const css = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  a { text-decoration-thickness: 1px; text-underline-offset: 2px; }
  .img-dark { display: none; max-height: 0; overflow: hidden; mso-hide: all; }
  @media (prefers-color-scheme: dark) {
    .c-bg { background-color: ${d.background} !important; }
    .c-fg { color: ${d.foreground} !important; }
    .c-muted { color: ${d.muted} !important; }
    .c-surface { background-color: ${d.surface} !important; border-color: ${d.border} !important; }
    .c-fill { background-color: ${d.fill} !important; }
    .c-rule { border-color: ${d.border} !important; }
    .c-btn { background-color: ${d.foreground} !important; color: ${d.background} !important; }
    .c-ink { background-color: ${d.foreground} !important; }
    .c-track { background-color: ${d.border} !important; }
    .img-light { display: none !important; max-height: 0 !important; }
    .img-dark { display: block !important; max-height: none !important; overflow: visible !important; }
  }
  [data-ogsc] .c-fg { color: ${d.foreground} !important; }
  [data-ogsc] .c-muted { color: ${d.muted} !important; }
  [data-ogsb] .c-bg { background-color: ${d.background} !important; }
  [data-ogsb] .c-surface { background-color: ${d.surface} !important; }
  @media only screen and (max-width: 600px) {
    .c-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .c-h1 { font-size: 24px !important; line-height: 30px !important; }
  }
`;

// Hidden inline too, so clients that drop <style> never show both images.
export const hiddenDarkImg: React.CSSProperties = { display: 'none', maxHeight: 0, overflow: 'hidden', msoHide: 'all' } as React.CSSProperties;

type LayoutProps = {
  preview: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function Layout({ preview, children, footer }: LayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <link rel="stylesheet" href={fontsHref} />
        <style>{css}</style>
      </Head>
      {/* Body copies its style onto an inner cell but not its class, so the page colour
          lives on our own full-width cell, where the dark-mode class can reach it. */}
      <Body className="c-bg" style={{ margin: 0, padding: 0, backgroundColor: l.background }}>
        <Preview>{preview}</Preview>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} className="c-bg" style={{ backgroundColor: l.background }}>
          <tbody>
            <tr>
              <td className="c-bg" style={{ backgroundColor: l.background, fontFamily: font.sans }}>
                <Container style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>
                  <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
                    <tbody>
                      <tr>
                        <td className="c-pad" style={{ padding: '40px 24px 48px' }}>
                          <Lockup />
                          <Block pt={40}>{children}</Block>
                          <Block pt={40}>{footer}</Block>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Container>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

// A full-width row whose padding sits on the cell, where every client honours it.
export function Block({
  pt = 0,
  pb = 0,
  children,
  className,
  style,
}: {
  pt?: number;
  pb?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
      <tbody>
        <tr>
          <td className={className} style={{ paddingTop: `${pt}px`, paddingBottom: `${pb}px`, ...style }}>
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// The Curatit lockup: the eight-ray symbol beside the wordmark. The symbol uses
// terracotta so it reads in light, dark and force-inverted inboxes. The wordmark
// is live text, so it flips with dark mode instead of disappearing.
export function Lockup() {
  return (
    <Link href={appUrl} style={{ textDecoration: 'none' }}>
      <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'middle', paddingRight: '8px', width: '18px' }}>
              <Img className="img-light" src={asset('curatit-symbol.png')} width="18" height="18" alt="" style={{ display: 'block' }} />
              <Img
                className="img-dark"
                src={asset('curatit-symbol-dark.png')}
                width="18"
                height="18"
                alt=""
                style={hiddenDarkImg}
              />
            </td>
            <td style={{ verticalAlign: 'middle' }}>
              <span
                className="c-fg"
                style={{
                  fontFamily: font.serif,
                  fontSize: '22px',
                  lineHeight: '28px',
                  letterSpacing: '-0.01em',
                  color: l.foreground,
                }}
              >
                Curatit
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Link>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return (
    <Text className="c-fg c-h1" style={type.display}>
      {children}
    </Text>
  );
}

export function Lead({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Text className="c-fg" style={{ ...type.lead, ...style }}>
      {children}
    </Text>
  );
}

export function Body2({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Text className="c-muted" style={{ ...type.body, ...style }}>
      {children}
    </Text>
  );
}

export function Caption({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Text className="c-muted" style={{ ...type.caption, ...style }}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Text className="c-muted" style={{ ...type.eyebrow, ...style }}>
      {children}
    </Text>
  );
}

// Monochrome primary button, like the app: ink fill, light label. 44px tall for touch.
export function Button({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <REButton
      href={href}
      className="c-btn"
      style={{
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
      {children}
    </REButton>
  );
}

export function Rule({ style }: { style?: React.CSSProperties }) {
  return (
    <Hr
      className="c-rule"
      style={{ border: 'none', borderTop: `1px solid ${l.border}`, margin: '32px 0', width: '100%', ...style }}
    />
  );
}

export function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="c-fg" style={{ color: l.foreground, textDecoration: 'underline' }}>
      {children}
    </Link>
  );
}

// For clients that block buttons or strip links.
export function FallbackLink({ href }: { href: string }) {
  return (
    <Block pt={24}>
      <Caption>Button not working? Paste this link into your browser:</Caption>
      <Text className="c-muted" style={{ ...type.caption, wordBreak: 'break-all', marginTop: '4px' }}>
        <Link href={href} className="c-muted" style={{ color: l.muted, textDecoration: 'underline' }}>
          {href}
        </Link>
      </Text>
    </Block>
  );
}

// The 6-digit code, for people confirming on another device. No inbox runs scripts, so a
// button can't copy it from inside the email: `copyUrl` adds a Copy code button that opens
// /code on the site, which copies it there (the code rides in the #fragment, so it never
// reaches a server or its logs). The code itself selects whole on one tap where the client
// supports user-select (Apple Mail, iOS Mail).
export function Code({ code, copyUrl }: { code: string; copyUrl?: string }) {
  const chip = (
    <Text
      className="c-fill c-fg"
      style={{
        display: 'inline-block',
        margin: '0',
        padding: '10px 16px',
        backgroundColor: l.fill,
        borderRadius: radius.item,
        fontFamily: font.mono,
        fontSize: '24px',
        lineHeight: '32px',
        letterSpacing: '0.2em',
        color: l.foreground,
        fontVariantNumeric: 'tabular-nums',
        userSelect: 'all',
        WebkitUserSelect: 'all',
      }}
    >
      {code}
    </Text>
  );
  if (!copyUrl) return chip;
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
      <tbody>
        <tr>
          <td style={{ verticalAlign: 'middle', paddingRight: '12px' }}>{chip}</td>
          <td style={{ verticalAlign: 'middle' }}>
            <SecondaryButton href={copyUrl}>Copy code</SecondaryButton>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

type FooterProps = {
  reason: React.ReactNode;
  unsubscribeUrl?: string;
  address?: string;
};

export function Footer({ reason, unsubscribeUrl, address }: FooterProps) {
  const link = { color: l.muted, textDecoration: 'underline' };
  return (
    <>
      <Rule style={{ margin: '0 0 24px' }} />
      <Caption>{reason}</Caption>
      <Caption style={{ marginTop: '8px' }}>
        <Link href={`${appUrl}/legal/privacy`} className="c-muted" style={link}>
          Privacy
        </Link>
        {' · '}
        <Link href={`${appUrl}/legal/terms`} className="c-muted" style={link}>
          Terms
        </Link>
        {unsubscribeUrl ? (
          <>
            {' · '}
            <Link href={unsubscribeUrl} className="c-muted" style={link}>
              Unsubscribe
            </Link>
          </>
        ) : null}
      </Caption>
      {address ? <Caption style={{ marginTop: '8px' }}>{address}</Caption> : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Building blocks for the account, billing and product emails
// ---------------------------------------------------------------------------

// A grey Lucide icon with a lighter copy for dark mode.
export function Icon({ name, size = 16, alt = '' }: { name: string; size?: number; alt?: string }) {
  return (
    <>
      <Img className="img-light" src={asset(`${name}.png`)} width={size} height={size} alt={alt} style={{ display: 'block' }} />
      <Img className="img-dark" src={asset(`${name}-dark.png`)} width={size} height={size} alt="" style={hiddenDarkImg} />
    </>
  );
}

export type DetailRow = { label: React.ReactNode; value: React.ReactNode; strong?: boolean };

// Label and value rows on a quiet fill: receipts, before-and-after, submission status.
export function Details({ rows }: { rows: DetailRow[] }) {
  return (
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
                {rows.map((r, i) => {
                  const edge = i ? `1px solid ${l.border}` : 'none';
                  const cell: React.CSSProperties = {
                    padding: '11px 0',
                    borderTop: edge,
                    fontFamily: font.sans,
                    fontSize: '14px',
                    lineHeight: '20px',
                    verticalAlign: 'top',
                  };
                  return (
                    <tr key={i}>
                      <td className="c-muted c-rule" style={{ ...cell, paddingRight: '12px', color: l.muted, whiteSpace: 'nowrap' }}>
                        {r.label}
                      </td>
                      <td
                        className="c-fg c-rule"
                        align="right"
                        style={{
                          ...cell,
                          textAlign: 'right',
                          color: l.foreground,
                          fontWeight: r.strong ? 600 : 400,
                          fontVariantNumeric: 'tabular-nums',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {r.value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// A white card with a hairline edge, for a board, a workspace or a plan.
export function Panel({ children, pad = 16, style }: { children: React.ReactNode; pad?: number; style?: React.CSSProperties }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      className="c-surface"
      style={{ backgroundColor: l.surface, border: `1px solid ${l.border}`, borderRadius: radius.container, borderCollapse: 'separate', ...style }}
    >
      <tbody>
        <tr>
          <td style={{ padding: `${pad}px` }}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}

export type Thumb = { src: string; alt: string; href?: string };

// A row of 4:5 post thumbnails that keeps equal sizes at every width.
export function Thumbs({ items, max = 160 }: { items: Thumb[]; max?: number }) {
  const n = items.length;
  const gap = n > 3 ? 2 : 3;
  const w = (100 - gap * (n - 1)) / n;
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ tableLayout: 'fixed' }}>
      <tbody>
        <tr>
          {items.map((t, i) => {
            const img = (
              <Img
                src={t.src}
                width={String(max)}
                alt={t.alt}
                className="c-rule"
                style={{
                  display: 'block',
                  width: '100%',
                  maxWidth: `${max}px`,
                  height: 'auto',
                  boxSizing: 'border-box',
                  border: `1px solid ${l.border}`,
                  borderRadius: radius.image,
                }}
              />
            );
            return (
              <React.Fragment key={i}>
                {i > 0 ? <td width={`${gap}%`} style={{ width: `${gap}%`, fontSize: 0, lineHeight: 0 }}>&nbsp;</td> : null}
                <td width={`${w}%`} style={{ width: `${w}%`, verticalAlign: 'top' }}>
                  {t.href ? (
                    <Link href={t.href} style={{ textDecoration: 'none' }}>
                      {img}
                    </Link>
                  ) : (
                    img
                  )}
                </td>
              </React.Fragment>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}

// An outline button for the second-most-important action.
export function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <REButton
      href={href}
      className="c-fg c-rule"
      style={{
        backgroundColor: 'transparent',
        color: l.foreground,
        border: `1px solid ${l.border}`,
        fontFamily: font.sans,
        fontSize: '15px',
        lineHeight: '20px',
        fontWeight: 600,
        borderRadius: radius.item,
        padding: '11px 19px',
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </REButton>
  );
}

// A round initial in ink, for a workspace or a person without a photo.
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: 'separate' }}>
      <tbody>
        <tr>
          <td
            className="c-btn"
            align="center"
            valign="middle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: radius.full,
              backgroundColor: l.foreground,
              color: l.background,
              fontFamily: font.serif,
              fontSize: `${Math.round(size * 0.48)}px`,
              lineHeight: `${size}px`,
            }}
          >
            {name.trim().charAt(0).toUpperCase()}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// A short list with a check before each line, for what a plan includes.
export function CheckList({ items }: { items: React.ReactNode[] }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
      <tbody>
        {items.map((it, i) => (
          <tr key={i}>
            <td style={{ width: '16px', verticalAlign: 'top', padding: '3px 10px 8px 0' }}>
              <Icon name="icon-check-muted" size={16} />
            </td>
            <td style={{ verticalAlign: 'top', paddingBottom: '8px' }}>
              <Text className="c-fg" style={{ margin: 0, fontFamily: font.sans, fontSize: '15px', lineHeight: '22px', color: l.foreground }}>
                {it}
              </Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Body copy in the foreground colour, for the main sentence of a notice.
export function Para({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Text className="c-fg" style={{ ...type.body, color: l.foreground, ...style }}>
      {children}
    </Text>
  );
}
