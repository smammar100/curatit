// Every template, rendered the way it's sent: it renders to HTML and plain text, every image it
// asks for is a file in public/email that every inbox can show, it stays under Gmail's clipping
// size, and the Supabase files in supabase/templates still match the templates.
import fs from "node:fs";
import path from "node:path";
import { createElement, type FunctionComponent } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { supabaseTemplates } from "./_components/supabase";
import { appUrl, assetBase } from "./_components/tokens";

type Template = FunctionComponent<Record<string, unknown>> & { PreviewProps?: Record<string, unknown> };

const dir = path.resolve("src/emails");
const names = fs
  .readdirSync(dir)
  .filter((file) => file.endsWith(".tsx") && !file.includes(".test."))
  .map((file) => file.replace(/\.tsx$/, ""));

// Each template with its preview props, plus the variants that change what's drawn
const extra: Record<string, Record<string, unknown>[]> = {
  "brand-submission": [{ status: "received" }],
  onboarding: [{ done: {} }, { done: { search: true, save: true, share: true } }],
  "welcome-note": [{ hero: "grid" }, { hero: "board" }, { hero: "carousel" }],
};

const cases = await Promise.all(
  names.map(async (name) => {
    const { default: Template } = (await import(/* @vite-ignore */ `./${name}.tsx`)) as { default: Template };
    const base = Template.PreviewProps ?? {};
    return [{ ...base }, ...(extra[name] ?? []).map((props) => ({ ...base, ...props }))].map((props, i) => ({
      label: i ? `${name} (${JSON.stringify(extra[name][i - 1])})` : name,
      element: createElement(Template, props),
    }));
  }),
).then((all) => all.flat());

const attr = (html: string, tag: string, name: string) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map((m) => m[0].match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]);

describe("every email", () => {
  it("is all here", () => {
    expect(names).toHaveLength(17);
  });

  it.each(cases)("$label renders, with images every inbox can show", async ({ element }) => {
    const html = await render(element);
    const text = await render(element, { plainText: true });

    // Gmail clips anything over 102 KB behind "View entire message"
    expect(Buffer.byteLength(html)).toBeLessThan(102 * 1024);
    expect(text).not.toMatch(/undefined|NaN|\[object Object\]/);
    expect(html).not.toMatch(/>\s*undefined\s*</);

    const sources = attr(html, "img", "src");
    const alts = attr(html, "img", "alt");
    expect(alts.every((alt) => alt !== undefined)).toBe(true);
    for (const src of sources) {
      expect(src).toBeDefined();
      expect(src!.startsWith(`${assetBase}/email/`)).toBe(true);
      // Outlook for Windows can't show WebP
      expect(src).toMatch(/\.(png|jpe?g)$/);
      expect(fs.existsSync(path.join("public", decodeURIComponent(src!.slice(assetBase.length))))).toBe(true);
    }

    for (const href of attr(html, "a", "href")) {
      expect(href).toMatch(/^(https:\/\/|mailto:)/);
    }
  });
});

describe("the Supabase Auth templates", () => {
  it.each(supabaseTemplates.map(([file, element]) => ({ file, element })))(
    "$file: the saved HTML in supabase/templates matches its template (run npm run email:render if not)",
    async ({ file, element }) => {
      const saved = fs.readFileSync(`supabase/templates/${file}.html`, "utf8").replace(/\r\n/g, "\n");
      const html = await render(element);
      expect(saved).toBe(html);
      // No placeholder escaped or split, so Supabase can fill every one
      expect(html).not.toMatch(/\{\{[^}]*&|\{\{\s*$/);
      for (const placeholder of html.match(/\{\{[^}]*\}\}/g) ?? []) expect(placeholder).toMatch(/^\{\{ \.[A-Za-z]+ \}\}$/);
    },
  );

  it("send links through /auth/confirm, so a mail scanner can't use the token up", async () => {
    const links: Record<string, string> = { "confirm-signup": "email", "reset-password": "recovery", "change-email": "email_change" };
    for (const [name, element] of supabaseTemplates) {
      const html = await render(element);
      expect(html).not.toContain("{{ .ConfirmationURL }}");
      if (links[name]) {
        const hrefs = attr(html, "a", "href").map((href) => href!.replace(/&amp;/g, "&"));
        expect(hrefs).toContain(`${appUrl}/auth/confirm?token_hash={{ .TokenHash }}&type=${links[name]}&next={{ .RedirectTo }}`);
      }
    }
    // Nowhere in Curatit takes a typed sign-up code, so the email doesn't offer one
    expect(await render(supabaseTemplates.find(([name]) => name === "confirm-signup")![1])).not.toContain("{{ .Token }}");
  });
});
