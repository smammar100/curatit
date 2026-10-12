import type { Metadata } from "next";
// Fundation
import Text from "@/components/fundations/elements/Text";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import LibraryCard from "@/components/library/LibraryCard";
// Content
import { getLibrary } from "@/lib/library";

export const metadata: Metadata = {
  title: { absolute: "Library · Curatit" },
  description: "Organic brand posts worth studying, newest first. Static posts and carousels.",
};

export default function LibraryPage() {
  const posts = getLibrary();
  return (
    <section>
      <Wrapper variant="standard" className="py-24 lg:pt-48">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900">
            The library
          </Text>
          <Text tag="p" variant="textBase" className="text-base-600 mt-4 max-w-xl mx-auto">
            Organic brand posts worth studying, newest first. Static posts and carousels; each one links
            back to the original.
          </Text>
        </div>
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {posts.map((post) => (
            <li key={post.shortCode}>
              <LibraryCard post={post} />
            </li>
          ))}
        </ul>
      </Wrapper>
    </section>
  );
}
