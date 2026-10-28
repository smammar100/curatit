import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Glaze
import { Badge } from "@/components/glaze/ui/badge";
import { Button } from "@/components/glaze/ui/button";
// Assets
import ClientMark, { MARKS } from "@/components/assets/ClientMarks";
// Components
import { McpDemo } from "./islands";

// The clients /agents has steps for, in its tabs' order (2026-10-28, from a QA run: the row showed
// Windsurf and Gemini, which have no steps, and left out ChatGPT)
const CLIENTS = [
  { name: "Claude", path: MARKS.claude },
  { name: "ChatGPT", path: MARKS.chatgpt },
  { name: "Cursor", path: MARKS.cursor },
  { name: "VS Code", path: MARKS.vscode },
];

// Since 2026-10-24 on Glaze: the action is its Button rendered as a link, and the Beta label is its
// Badge beside it (Glaze puts no small label above a title).
export default function McpSection() {
  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="text-balance lg:col-span-5">
            <Text tag="h2" variant="h1" className="text-text-1">
              Find references in your AI assistant.
            </Text>
            <Text tag="p" variant="body" className="mt-4 text-text-2">
              Search Curatit and read post breakdowns from Claude, ChatGPT,
              Cursor or VS Code.
            </Text>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button render={<Link href="/agents" />} nativeButton={false}>
                Explore the AI integration
              </Button>
              <Badge>Beta</Badge>
            </div>
            <ul className="mt-12 flex flex-wrap items-center gap-8" aria-label="Clients it works with">
              {CLIENTS.map((mark) => (
                <li key={mark.name} className="text-text-1">
                  <ClientMark path={mark.path} className="size-9" role="img" aria-label={mark.name} />
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <McpDemo />
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
