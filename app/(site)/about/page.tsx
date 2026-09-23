import type { Metadata } from "next";
import Wrapper from "@/components/fundations/containers/Wrapper";
import PageHeader from "@/components/fundations/containers/PageHeader";

export const metadata: Metadata = {
  title: "About",
  description: "Curatit helps creative teams find, understand, and use the best organic brand content.",
};

const notList = [
  "A generic moodboard or Pinterest replacement.",
  "A paid-ad spy tool.",
  "A feed of automatically scraped posts. Editors review everything.",
  "An AI image generator, or a way to clone another brand’s design.",
];

export default function AboutPage() {
  return (
    <Wrapper variant="standard" className="pb-24">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Creative intelligence for organic social"
          description="Curatit helps creative teams find, understand, and use the best organic brand content."
        />
        <Wrapper variant="prose">
          <p>
            Social and brand agencies spend hours scrolling feeds, screenshotting posts, and rebuilding the same
            reference boards. We think that research deserves a proper tool.
          </p>
          <p>
            We collect strong posts from real brand feeds on a disclosed schedule, have editors review every one, and
            describe each with a controlled vocabulary: objective, format, narrative structure, and visual style. That
            way you can search by the brief you actually have.
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
      </div>
    </Wrapper>
  );
}
