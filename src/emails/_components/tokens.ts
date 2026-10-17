// Curatit Design System tokens, translated for email clients.
// Source: Curatit Design System (tokens.json v3). Email needs solid hex values,
// web-safe font fallbacks and slightly larger reading sizes than the app UI.

export const color = {
  light: {
    background: '#fafafa', // surface-1
    surface: '#ffffff', // surface-3
    foreground: '#171717',
    muted: '#737373', // muted-foreground, 4.5:1 on background
    fill: '#f4f4f5', // muted
    border: '#e5e5e5', // ring / input
    brand: '#c54120', // terracotta, symbol only
  },
  dark: {
    background: '#171717',
    surface: '#252525',
    foreground: '#f5f5f5',
    muted: '#a3a3a3',
    fill: '#1e1e1e',
    border: '#404040',
    brand: '#dc5431',
  },
} as const;

const c = color.light;

export const font = {
  // Hedvig loads in Apple Mail and iOS Mail. Gmail and Outlook use the fallbacks.
  serif: "'Hedvig Letters Serif', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
} as const;

export const fontsHref =
  'https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif:opsz@12..24&family=Inter:opsz,wght@14..32,400..700&display=swap';

export const radius = { image: '2px', code: '4px', item: '8px', container: '12px', full: '9999px' } as const;

// Type roles. Serif is for headings only; everything else is Inter.
export const type = {
  display: {
    fontFamily: font.serif,
    fontSize: '28px',
    lineHeight: '34px',
    fontWeight: 400,
    letterSpacing: '-0.01em',
    color: c.foreground,
    margin: '0',
  },
  lead: { fontFamily: font.sans, fontSize: '16px', lineHeight: '26px', color: c.foreground, margin: '0' },
  body: { fontFamily: font.sans, fontSize: '15px', lineHeight: '24px', color: c.muted, margin: '0' },
  title: { fontFamily: font.sans, fontSize: '16px', lineHeight: '24px', fontWeight: 600, color: c.foreground, margin: '0' },
  caption: { fontFamily: font.sans, fontSize: '13px', lineHeight: '20px', color: c.muted, margin: '0' },
  eyebrow: {
    fontFamily: font.sans,
    fontSize: '12px',
    lineHeight: '16px',
    fontWeight: 600,
    letterSpacing: '0.025em',
    textTransform: 'uppercase' as const,
    color: c.muted,
    margin: '0',
  },
} as const;

// Where the PNG and JPG assets in /public/email are served from.
// Links and images always point at the deployed site (CURATIT_PUBLIC_BASE_URL, else the canonical
// www.curatit.app, docs/domain.md), never at the request's origin: an inbox can't reach localhost
// or a protected preview build.
const site = process.env.CURATIT_PUBLIC_BASE_URL || 'https://www.curatit.app';
export const assetBase = (process.env.EMAIL_ASSET_URL || site).replace(/\/$/, '');
export const appUrl = site.replace(/\/$/, '');
export const asset = (file: string) => `${assetBase}/email/${file}`;
