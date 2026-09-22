import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "Who we are",
  description: "Curatit is a community-driven platform for designers, developers and makers.",
};

export default function AboutPage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Wrapper variant="narrow">
          <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
            Who we are
          </Text>
          <Wrapper variant="prose" className="mt-12">
            <p>
              Curatit is a community-driven platform for designers, developers, and creative
              professionals who take their craft seriously. It’s a place to stay current — from
              design systems and typography to modern front-end tools and workflows.
            </p>
            <p>
              Beyond resources, Curatit functions as a living creative index. Members share work,
              exchange ideas, and learn from real-world experience. Curated collections, focused
              articles, tutorials, and trend breakdowns are built to improve decision-making, not
              just inspire it.
            </p>
            <p>
              Good work doesn’t happen in isolation. Curatit is designed to connect forward-thinking
              creatives, encourage critical thinking, and push standards higher. Join the community
              and use it to sharpen your skills, expand your perspective, and build better work.
            </p>
          </Wrapper>
          <div className="mt-12">
            <Text className="text-base-600 italic">
              &ldquo;Innovation is born from connection. Together, we create the future of
              design.&rdquo;
            </Text>
            <Text tag="p" variant="textBase" className="text-base-900 mt-2 font-semibold">
              — Jordan Miller, Founder of Curatit
            </Text>
          </div>
        </Wrapper>
      </Wrapper>
    </section>
  );
}
