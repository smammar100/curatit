import Link from "next/link";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Glaze
import { Button } from "@/components/glaze/ui/button";
// Components
import { DnaDemo } from "./islands";

// The two things a post's page gives you beyond the post itself, laid out like the MCP section:
// the words on the left, a looping illustration on a grey panel on the right. The two rows are
// ruled with Glaze's faint hairline, their titles in its label role (2026-10-24).
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
            <Text tag="h2" variant="h1" className="text-text-1">
              Every post, taken apart.
            </Text>
            <Text tag="p" variant="body" className="mt-4 text-text-2">
              See the hook, layout and colours of a post, then hand them to your
              AI as a brief.
            </Text>
            <dl className="mt-8 divide-y divide-line-faint border-y border-line-faint">
              {features.map((feature) => (
                <div key={feature.title} className="py-4">
                  <dt className="type-label text-text-1">{feature.title}</dt>
                  <dd className="mt-1 type-body-sm text-text-2">{feature.text}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8">
              <Button render={<Link href="/signup" />} nativeButton={false} className="w-fit">
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
