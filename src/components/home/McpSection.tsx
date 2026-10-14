// Fundation
import Text from "@/components/fundations/elements/Text";
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
            <span className="inline-flex items-center gap-2 rounded-md bg-base-50 px-2.5 py-1 text-xs font-medium text-base-900 ring-1 ring-base-200">
              <span className="size-1.5 rounded-full bg-base-400" aria-hidden="true" />
              Beta
            </span>
            <Text tag="h2" variant="displayLG" className="text-base-900 font-display font-light mt-6">
              Give your AI agents access to Curatit.
            </Text>
            <Text tag="p" variant="textBase" className="text-base-600 mt-4">
              Curatit&apos;s MCP server is in beta. Search the library by brief, pull a post&apos;s analysis
              and draft a brief without leaving your agent.
            </Text>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button isLink size="base" variant="default" href="/agents">
                Learn more
              </Button>
              <Text tag="p" variant="textSM" className="text-base-500">
                Works with any MCP client
              </Text>
            </div>
            <ul className="mt-12 flex flex-wrap items-center gap-8" aria-label="Clients it works with">
              {clientMarks.map((mark) => (
                <li key={mark.name} className="text-base-900">
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
