import type { Metadata } from "next";
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";

export const metadata: Metadata = {
  title: "About",
  description: "Curatit helps creative teams find, understand, and use the best organic brand content.",
};

const notList = [
  "A generic moodboard or Pinterest replacement.",
  "A paid-ad spy tool.",
  "A feed of automatically scraped posts — editors review everything.",
  "An AI image generator, or a way to clone another brand’s design.",
];

export default function AboutPage() {
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <Wrapper variant="narrow">
          <Text tag="h1" variant="displayLG" className="text-base-900 font-display font-thin">
            Creative intelligence for organic social
          </Text>
          <Wrapper variant="prose" className="mt-12">
            <p>
              Curatit helps creative teams find, understand, and use the best organic brand content. Social and brand
              agencies spend hours scrolling feeds, screenshotting posts, and rebuilding the same reference boards. We
              think that research deserves a proper tool.
            </p>
            <p>
              We collect strong posts from real brand feeds on a disclosed schedule, have editors review every one, and
              describe each with a controlled vocabulary — objective, format, narrative structure, visual style — so you
              can search by the brief you actually have.
            </p>
            <h2>What Curatit is not</h2>
            <ul>
              {notList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2>How we handle content</h2>
            <p>
              Every post credits its brand and links to the original. We show when it was published and when we last
              checked it. If you own content on Curatit and want it removed, we stop showing it immediately while we
              review the request.
            </p>
          </Wrapper>
        </Wrapper>
      </Wrapper>
    </section>
  );
}
