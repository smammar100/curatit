// Renders the six Supabase Auth emails from src/emails into supabase/templates/, for pasting into
// the Supabase dashboard (Authentication → Emails; docs/emails.md has the subjects). Supabase
// fills the {{ .Placeholders }} when it sends. The HTML is left unformatted on purpose, so no
// placeholder is split across lines. Links and images point at CURATIT_PUBLIC_BASE_URL (the
// production site unless set), so render again if the domain changes.
//
//   npm run email:render
import fs from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import ChangeEmail from "../src/emails/change-email";
import ConfirmEmail from "../src/emails/confirm-email";
import EmailChanged from "../src/emails/email-changed";
import PasswordChanged from "../src/emails/password-changed";
import Reauthentication from "../src/emails/reauthentication";
import ResetPassword from "../src/emails/reset-password";

const outDir = path.resolve("supabase/templates");

const templates: [string, ReactElement][] = [
  ["confirm-signup", <ConfirmEmail email="{{ .Email }}" confirmUrl="{{ .ConfirmationURL }}" code="{{ .Token }}" />],
  ["reset-password", <ResetPassword email="{{ .Email }}" resetUrl="{{ .ConfirmationURL }}" />],
  ["change-email", <ChangeEmail email="{{ .Email }}" newEmail="{{ .NewEmail }}" confirmUrl="{{ .ConfirmationURL }}" />],
  ["reauthentication", <Reauthentication email="{{ .Email }}" code="{{ .Token }}" />],
  ["email-changed", <EmailChanged oldEmail="{{ .OldEmail }}" newEmail="{{ .Email }}" />],
  ["password-changed", <PasswordChanged email="{{ .Email }}" />],
];

fs.mkdirSync(outDir, { recursive: true });
for (const [name, element] of templates) {
  const file = path.join(outDir, `${name}.html`);
  fs.writeFileSync(file, await render(element));
  console.log("wrote", path.relative(process.cwd(), file));
}
