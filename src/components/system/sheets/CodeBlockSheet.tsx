// /system/code-block: Glaze's CodeBlock (src/components/glaze/ui/code-block). Rules from
// glaze-docs/code-block.md
import { CodeBlock } from "@/components/glaze/ui/code-block";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const CONFIG = `{
  "mcpServers": {
    "curatit": {
      "url": "https://www.curatit.app/mcp",
      "headers": { "Authorization": "Bearer \${CURATIT_ACCESS_TOKEN}" }
    }
  }
}`;

const TS = `import { getPublishedPosts } from "@/lib/posts";

export async function newest(limit = 5) {
  const posts = await getPublishedPosts();
  return posts.slice(0, limit);
}`;

export default function CodeBlockSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Code block" importLine={`import {CodeBlock} from '@/components/glaze/ui/code-block'`}>
        Shows code or commands to copy, in mono at 12/20 on the code surface, with a header that names the file and
        holds Wrap and Copy. Syntax is shades of ink, never hues.
      </SheetHeader>

      <SheetSection title="Variants">
        <Sheet>
          {() => (
            <div className="grid gap-6">
              <Specimen label={<Mono>block, with a filename and highlighted lines</Mono>} stretch>
                <CodeBlock code={TS} language="ts" filename="src/lib/newest.ts" highlight={[4, 5]} />
              </Specimen>
              <Specimen label={<Mono>block, json, line numbers</Mono>} stretch>
                <CodeBlock code={CONFIG} language="json" lineNumbers />
              </Specimen>
              <Specimen label={<Mono>command, with a secret</Mono>} stretch>
                <CodeBlock
                  variant="command"
                  code={`$ export CURATIT_ACCESS_TOKEN=curatit_pat_8f2a91c4\n$ npm run mcp:smoke -- --server https://www.curatit.app`}
                  secret="curatit_pat_8f2a91c4"
                />
              </Specimen>
              <Specimen label={<Mono>header=false</Mono>} stretch>
                <CodeBlock code="npm run creative -- work" language="bash" header={false} />
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<CodeBlock code={source} language="ts" filename="src/lib/newest.ts"/>
<CodeBlock variant="command" code="$ npm run mcp:smoke" secret={token}/>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Show shell commands with variant command and their prompt; pass a key inside one as secret." },
            { kind: "do", text: "Give a file its filename, highlight the lines the text talks about, and set maxLines past about 30." },
            { kind: "dont", text: "Colour syntax with hues or another library's theme, or restyle the block's type." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
