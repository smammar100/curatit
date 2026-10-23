// Fundation
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import { DnaDemo } from "./islands";
import { fontWeights } from "@/lib/font-weight";

// The two things a post's page gives you beyond the post itself, laid out like the MCP section:
// the words on the left, a looping illustration on a grey panel on the right. The two rows are
// ruled with the one stroke; their titles take the library's semibold (2026-10-23).
const features = [
  {
    title: "Creative DNA",
    text: "What each part of a post does, and the colours measured from its pixels.",
  },
  {
    title: "Copy brief",
    text: "One tap copies a Markdown prompt to rebuild the post, every slide linked.",
  },
];

export default function CreativeDnaSection() {
  return (
    <section>
      <Wrapper variant="standard" className="section-y">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="text-balance lg:col-span-5">
            <Text tag="h2" variant="h1" className="text-foreground">
              Every post, taken apart.
            </Text>
            <Text tag="p" variant="body" className="mt-4 text-muted-foreground">
              See the hook, layout and colours of a post, then hand them to your
              AI as a brief.
            </Text>
            <dl className="mt-8 divide-y divide-border border-y border-border">
              {features.map((feature) => (
                <div key={feature.title} className="py-4">
                  <dt className="text-body-sm text-foreground" style={{ fontVariationSettings: fontWeights.semibold }}>{feature.title}</dt>
                  <dd className="mt-1 text-body-sm text-muted-foreground">{feature.text}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8">
              <Button isLink size="base" variant="default" href="/signup" className="w-fit">
                Create account
              </Button>
            </div>
          </div>
          <div className="lg:col-span-7">
            <DnaDemo />
          </div>
        </div>
      </Wrapper>
    </section>
  );
}
