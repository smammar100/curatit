// Canonical site URL, used for absolute links in metadata, the sitemap and RSS. Vercel serves the
// site here and redirects the bare curatit.app to it; curatit.vercel.app still serves it too.
export const SITE_URL = "https://www.curatit.app";

// Where people write to us: Contact us in the account menu, and sign-up when an email is taken.
// SUPPORT_MAILTO opens a new email to it with the subject filled in.
export const SUPPORT_EMAIL = "syed.m.ammar@hotmail.com";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Curatit Help")}`;
