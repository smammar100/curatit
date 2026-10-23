import { readUnsubscribeToken, saveUnsubscribe } from "@/lib/unsubscribe";

// One-click unsubscribe (RFC 8058): the List-Unsubscribe-Post header sendEmail() adds to the
// optional emails points here, and Gmail's and Yahoo's own Unsubscribe buttons POST to it with
// no page in between, so there's no reason to ask for. The footer link goes to /unsubscribe.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const email = readUnsubscribeToken(url.searchParams.get("t"));
  if (!email) return new Response("This link isn't complete.", { status: 400 });
  const saved = await saveUnsubscribe({ email, source: url.searchParams.get("s") });
  return new Response(saved ? "Unsubscribed." : "Try again in a moment.", { status: saved ? 200 : 503 });
}
