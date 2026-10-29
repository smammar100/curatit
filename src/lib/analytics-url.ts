// What page-view analytics may see of an address: the path, with a shared board's token replaced by
// its route, and of the query only the campaign parameters (`utm_…`, `ref`); never the hash. Some of
// Curatit's addresses carry a credential or a person's details: a shared board's link
// (/s/<token>, the token is the credential), a sign-in link's one-time token
// (/auth/confirm?token_hash=…), the code the verification email hands over (/code#…), an unsubscribe
// link (signed, naming the address it's for) and a dashboard search (the words typed).
const CAMPAIGN = /^(utm_[a-z]+|ref)$/;

export function analyticsUrl(href: string): string {
  const url = new URL(href);
  const path = url.pathname.replace(/^\/s\/[^/]+/, "/s/[token]");
  const campaign = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (CAMPAIGN.test(key)) campaign.append(key, value);
  }
  const query = campaign.toString();
  return `${url.origin}${path}${query ? `?${query}` : ""}`;
}
