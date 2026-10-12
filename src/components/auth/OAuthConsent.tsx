"use client";

// The consent screen Supabase Auth's OAuth 2.1 server sends people to (Authorization Path
// /oauth/consent, docs/mcp/security.md): an MCP client has asked for access to their Curatit
// account, and they approve or deny it here, signed in. The details come from Supabase by the
// authorization id in the address; approving or denying returns the address to send the
// browser on to. Signed-out visitors go to sign-in and come back.

import { useEffect, useState } from "react";
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";
import { createClient } from "@/utils/supabase/client";
import { AuthNotice } from "./AuthParts";

type Details = { authorization_id: string; redirect_uri: string; client: { client_id?: string; client_name?: string; client_uri?: string; logo_uri?: string }; user: { id: string; email?: string }; scope: string };

const SCOPE_WORDS: Record<string, string> = {
  email: "see the email address of your account",
  profile: "see your name and avatar",
  openid: "confirm who you are",
  offline_access: "stay connected without asking again",
};

export default function OAuthConsent() {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("authorization_id");
    if (!id) return setError("This link is missing its authorization id. Start again from the app that asked for access.");
    const supabase = createClient();
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        window.location.replace(`/signin?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
        return;
      }
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
      if (error || !data) return setError("This request can't be found. It may have expired; start again from the app.");
      // Consent already given: Supabase hands back the address to continue to
      if ("redirect_url" in data && data.redirect_url) {
        window.location.replace(data.redirect_url);
        return;
      }
      setDetails(data as unknown as Details);
    })();
  }, []);

  const decide = async (choice: "approve" | "deny") => {
    if (!details) return;
    setBusy(choice);
    const supabase = createClient();
    const { data, error } = choice === "approve" ? await supabase.auth.oauth.approveAuthorization(details.authorization_id) : await supabase.auth.oauth.denyAuthorization(details.authorization_id);
    if (error || !data?.redirect_url) {
      setBusy(null);
      return setError("That didn't go through. Try again, or start over from the app.");
    }
    window.location.replace(data.redirect_url);
  };

  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);
  const app = details?.client.client_name ?? details?.client.client_id ?? "An app";

  return (
    <div>
      <Text tag="h1" variant="displaySM" className="font-display font-light text-base-900">
        Allow access to Curatit?
      </Text>
      {error && (
        <div className="mt-4">
          <AuthNotice>{error}</AuthNotice>
        </div>
      )}
      {!details && !error && <p className="mt-4 text-sm text-base-600">Checking the request…</p>}
      {details && (
        <>
          <p className="mt-4 text-sm text-pretty text-base-600">
            <span className="font-medium text-base-900">{app}</span> wants to use the Curatit library as {details.user.email ?? "you"}: search posts, read analyses and build briefs, with what you can see.
          </p>
          {scopes.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-base-600">
              {scopes.map((s) => (
                <li key={s}>{SCOPE_WORDS[s] ?? s}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-base-500">
            After approving you&apos;ll go back to <span className="break-all">{safeHost(details.redirect_uri)}</span>. You can revoke access later from your account.
          </p>
          <div className="mt-6 flex gap-3">
            <Button type="button" size="sm" variant="default" className="flex-1" onClick={() => decide("approve")} disabled={busy !== null}>
              {busy === "approve" ? "Allowing…" : "Allow"}
            </Button>
            <Button type="button" size="sm" variant="muted" className="flex-1" onClick={() => decide("deny")} disabled={busy !== null}>
              {busy === "deny" ? "Denying…" : "Deny"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function safeHost(uri: string) {
  try {
    const u = new URL(uri);
    return u.protocol === "http:" || u.protocol === "https:" ? u.host : uri;
  } catch {
    return uri;
  }
}
