// Fundation
import Text from "@/components/fundations/elements/Text";
import Badge from "@/components/fundations/elements/Badge";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Assets
import ClientMark, { clientMarks } from "@/components/assets/ClientMarks";
// Components
import { McpDemo } from "./islands";

export default function McpSection() {
  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="text-balance lg:col-span-5">
            <Badge>Beta</Badge>
            <Text tag="h2" variant="displayLG" className="text-base-900 mt-6">
              Find references in your AI assistant.
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Search Curatit and read post breakdowns from Claude, Cursor, VS
              Code or ChatGPT.
            </Text>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button isLink size="base" variant="default" href="/agents">
                Explore the AI integration
              </Button>
            </div>
            <ul
              className="mt-12 flex flex-wrap items-center gap-8"
              aria-label="Clients it works with"
            >
              {clientMarks.map((mark) => (
                <li key={mark.name} className="text-base-900">
                  <ClientMark
                    path={mark.path}
                    className="size-9"
                    role="img"
                    aria-label={mark.name}
                  />
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
