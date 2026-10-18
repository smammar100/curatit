"use client";

// The consent screen Supabase Auth's OAuth 2.1 server sends people to (Authorization Path
// /oauth/consent, docs/mcp/security.md): an MCP client has asked for access to their Curatit
// account, and they allow or deny it here, signed in. After GitHub's authorize screen (Mobbin
// references: Laravel Cloud, Cursor and fal on GitHub, 2026-10-12): the two marks joined by a
// line, what allowing lets the app do and what it can't, who's signed in, where the browser
// goes next. The details come from Supabase by the authorization id in the address; allowing
// or denying returns the address to send the browser on to. Signed-out visitors go to sign-in
// and come back.

import { useEffect, useState } from "react";
import Symbol from "@/components/assets/Symbol";
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";
import Check from "@/components/fundations/icons/Check";
import Plugs from "@/components/fundations/icons/Plugs";
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
      <div
        className="mb-6 flex items-center justify-center gap-3"
        aria-hidden="true"
      >
        <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-component ring-1 ring-edge">
          {details?.client.logo_uri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={details.client.logo_uri}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Plugs className="size-5 text-tertiary-foreground" />
          )}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-px w-5 bg-border-strong" />
          <span className="flex size-5 items-center justify-center rounded-full bg-inverted-solid text-on-inverted-foreground">
            <Check className="size-3" />
          </span>
          <span className="h-px w-5 bg-border-strong" />
        </span>
        <span className="flex size-12 items-center justify-center rounded-full bg-component ring-1 ring-edge">
          <Symbol
            className="size-6 text-primary-foreground"
            aria-hidden="true"
          />
        </span>
      </div>

      {/* The auth card's title, the same size as the sign-in and sign-up pages' */}
      <Text
        tag="h1"
        variant="h5"
        className="text-center text-balance text-primary-foreground"
      >
        {details
          ? `${app} wants to use Curatit as you`
          : "Allow access to Curatit?"}
      </Text>

      {error && (
        <div className="mt-4">
          <AuthNotice>{error}</AuthNotice>
        </div>
      )}
      {!details && !error && (
        <Text
          tag="p"
          variant="bodySM"
          className="mt-4 text-center text-secondary-foreground"
        >
          Checking the request…
        </Text>
      )}

      {details && (
        <>
          <div className="mt-6 rounded-xl bg-card p-4 shadow-xs">
            <Text
              tag="p"
              variant="captionLG"
              className="font-medium tracking-wider text-secondary-foreground uppercase"
            >
              Allowing lets it
            </Text>
            <ul className="mt-2 space-y-1.5">
              {ALLOWS.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 text-body-sm text-primary-foreground"
                >
                  <Check className="mt-1 size-3.5 shrink-0 text-tertiary-foreground" />
                  {line}
                </li>
              ))}
            </ul>
            <Text
              tag="p"
              variant="captionLG"
              className="mt-4 font-medium tracking-wider text-secondary-foreground uppercase"
            >
              It can never
            </Text>
            <ul className="mt-2 space-y-1.5">
              {NEVER.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2 text-body-sm text-secondary-foreground"
                >
                  <span
                    className="mt-2 size-1 shrink-0 rounded-full bg-tertiary-foreground"
                    aria-hidden="true"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => decide("approve")}
              loading={busy === "approve"}
              disabled={busy === "deny"}
            >
              {busy === "approve" ? "Allowing…" : `Allow ${app}`}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="muted"
              className="flex-1"
              onClick={() => decide("deny")}
              loading={busy === "deny"}
              disabled={busy === "approve"}
            >
              {busy === "deny" ? "Denying…" : "Deny"}
            </Button>
          </div>

          <dl className="mt-5 space-y-1 text-caption-lg text-secondary-foreground">
            <div className="flex justify-between gap-4">
              <dt>Signed in as</dt>
              <dd className="truncate text-primary-foreground">
                {details.user.email ?? "you"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Then goes to</dt>
              <dd className="truncate text-primary-foreground">
                {safeHost(details.redirect_uri)}
              </dd>
            </div>
            {appHost && (
              <div className="flex justify-between gap-4">
                <dt>App website</dt>
                <dd className="truncate text-primary-foreground">{appHost}</dd>
              </div>
            )}
          </dl>
          <Text
            tag="p"
            variant="captionLG"
            className="mt-4 text-center text-pretty text-secondary-foreground"
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
