import type { Metadata } from "next";
// Components
import OAuthConsent from "@/components/auth/OAuthConsent";

export const metadata: Metadata = { title: "Allow access · Curatit", robots: { index: false, follow: false } };

// Where Supabase Auth's OAuth server sends people to approve an MCP client's access (the project's
// Authorization Path). Static: the request's id is read from the address in the browser.
export default function OAuthConsentPage() {
  return <OAuthConsent />;
}
