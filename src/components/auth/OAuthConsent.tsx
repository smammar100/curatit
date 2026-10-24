"use client";

// The consent screen Supabase Auth's OAuth 2.1 server sends people to (Authorization Path
// /oauth/consent, docs/mcp/security.md): an MCP client has asked for access to their Curatit
// account, and they allow or deny it here, signed in. After GitHub's authorize screen (Mobbin
// references: Laravel Cloud, Cursor and fal on GitHub, 2026-10-12): the two marks joined by a
// line, what allowing lets the app do and what it can't, who's signed in, where the browser
// goes next. The details come from Supabase by the authorization id in the address; allowing
// or denying returns the address to send the browser on to. Signed-out visitors go to sign-in
// and come back. Since 2026-10-24 on Glaze: the marks on the grey field with the faint line, the
// check on the ink, the permissions on the grey shell (Glaze's panel corners, no shadow), each
// allowed thing with a Check glyph and each never with a Close glyph, the headings text-2 labels,
// the error a fail Alert, Allow the primary Button and Deny the secondary, each pending with its
// -ing verb.

import { useEffect, useState } from "react";
import Symbol from "@/components/assets/Symbol";
import Text from "@/components/fundations/elements/Text";
import { Button } from "@/components/glaze/ui/button";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
import { Check, Close, Icon, Plugs } from "@/components/glaze/icon";
import { createClient } from "@/utils/supabase/client";
import { AuthNotice } from "./AuthParts";

type Details = {
  authorization_id: string;
  redirect_uri: string;
  client: {
    client_id?: string;
    client_name?: string;
    client_uri?: string;
    logo_uri?: string;
  };
  user: { id: string; email?: string };
  scope: string;
};

const ALLOWS = [
  "Search the library and read posts, slides and images",
  "Read the published creative analyses",
  "Build creative briefs from references",
  "See the email address of your account",
];
const NEVER = [
  "Post, comment or change anything on your account",
  "See your boards or notes",
];

export default function OAuthConsent() {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(
      "authorization_id",
    );
    if (!id)
      return setError(
        "This link is missing its authorization id. Start again from the app that asked for access.",
      );
    const supabase = createClient();
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        window.location.replace(
          `/signin?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`,
        );
        return;
      }
      const { data, error } =
        await supabase.auth.oauth.getAuthorizationDetails(id);
      if (error || !data)
        return setError(
          "This request can't be found. It may have expired; start again from the app.",
        );
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
    const { data, error } =
      choice === "approve"
        ? await supabase.auth.oauth.approveAuthorization(
            details.authorization_id,
          )
        : await supabase.auth.oauth.denyAuthorization(details.authorization_id);
    if (error || !data?.redirect_url) {
      setBusy(null);
      return setError(
        "That didn't go through. Try again, or start over from the app.",
      );
    }
    window.location.replace(data.redirect_url);
  };

  const app = details?.client.client_name?.trim() || "An app";
  const appHost = details?.client.client_uri
    ? safeHost(details.client.client_uri)
    : null;

  return (
    <div>
      {/* The app's mark and Curatit's, joined: who is asking, who is asked */}
      <div className="mb-6 flex items-center justify-center gap-3" aria-hidden="true">
        <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-field ring-1 ring-line-faint">
          {details?.client.logo_uri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={details.client.logo_uri} alt="" className="size-full object-cover" />
          ) : (
            <Icon icon={Plugs} size={20} className="text-text-2" />
          )}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-px w-5 bg-line" />
          <span className="flex size-5 items-center justify-center rounded-full bg-ink text-text-inverse">
            <Icon icon={Check} size={12} />
          </span>
          <span className="h-px w-5 bg-line" />
        </span>
        <span className="flex size-12 items-center justify-center rounded-full bg-field ring-1 ring-line-faint">
          <Symbol className="size-6 text-text-1" aria-hidden="true" />
        </span>
      </div>

      {/* The auth card's title, the same size as the sign-in and sign-up pages' */}
      <Text tag="h1" variant="h5" className="text-center text-balance text-text-1">
        {details ? `${app} wants to use Curatit as you` : "Allow access to Curatit?"}
      </Text>

      {error && (
        <div className="mt-4">
          <AuthNotice>{error}</AuthNotice>
        </div>
      )}
      {!details && !error && (
        <Text tag="p" variant="bodySM" className="mt-4 text-center text-text-2">
          Checking the request…
        </Text>
      )}

      {details && (
        <>
          <div className="mt-6 rounded-panel bg-shell p-4">
            <p className="type-label-sm text-text-2">Allowing lets it</p>
            <ul className="mt-2 space-y-1.5">
              {ALLOWS.map((line) => (
                <li key={line} className="flex items-start gap-2 type-body-sm text-text-1">
                  <Icon icon={Check} className="mt-0.75 text-text-2" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 type-label-sm text-text-2">It can never</p>
            <ul className="mt-2 space-y-1.5">
              {NEVER.map((line) => (
                <li key={line} className="flex items-start gap-2 type-body-sm text-text-2">
                  <Icon icon={Close} className="mt-0.75 text-text-3" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => decide("approve")}
              pending={busy === "approve"}
              pendingLabel="Allowing…"
              disabled={busy === "deny"}
            >
              {`Allow ${app}`}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => decide("deny")}
              pending={busy === "deny"}
              pendingLabel="Denying…"
              disabled={busy === "approve"}
            >
              Deny
            </Button>
          </div>

          <DataList className="mt-5">
            <DataListItem>
              <DataListLabel>Signed in as</DataListLabel>
              <DataListValue>{details.user.email ?? "you"}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Then goes to</DataListLabel>
              <DataListValue>{safeHost(details.redirect_uri)}</DataListValue>
            </DataListItem>
            {appHost && (
              <DataListItem>
                <DataListLabel>App website</DataListLabel>
                <DataListValue>{appHost}</DataListValue>
              </DataListItem>
            )}
          </DataList>
          <Text
            tag="p"
            variant="captionLG"
            className="mt-4 text-center text-pretty text-text-2"
          >
            Access lasts until you revoke it from your account. Curatit never
            shares your password with the app.
          </Text>
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
