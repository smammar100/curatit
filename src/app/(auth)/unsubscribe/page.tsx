import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/auth/UnsubscribeForm";
import { readUnsubscribeToken } from "@/lib/unsubscribe";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

// Where the Unsubscribe link in the optional emails' footers lands (src/lib/unsubscribe.ts):
// the address from the signed link, an optional reason, and one button. Rendered per request,
// since the page has to check the link's signature before it names an address.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; s?: string }>;
}) {
  const { t, s } = await searchParams;
  const email = readUnsubscribeToken(t);
  return <UnsubscribeForm email={email} token={email ? t! : ""} source={s?.slice(0, 64) ?? ""} />;
}
