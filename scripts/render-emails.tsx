// Renders the six Supabase Auth emails from src/emails into supabase/templates/, for pasting into
// the Supabase dashboard (Authentication → Emails; docs/emails.md has the subjects). Supabase
// fills the {{ .Placeholders }} when it sends. The HTML is left unformatted on purpose, so no
// placeholder is split across lines. Links and images point at CURATIT_PUBLIC_BASE_URL (the
// production site unless set), so render again if the domain changes.
//
//   npm run email:render
import fs from "node:fs";
import path from "node:path";
import { render } from "@react-email/render";
import { supabaseTemplates } from "../src/emails/_components/supabase";

const outDir = path.resolve("supabase/templates");

fs.mkdirSync(outDir, { recursive: true });
for (const [name, element] of supabaseTemplates) {
  const file = path.join(outDir, `${name}.html`);
  fs.writeFileSync(file, await render(element));
  console.log("wrote", path.relative(process.cwd(), file));
}
