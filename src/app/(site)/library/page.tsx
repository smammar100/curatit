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
  description: "A preview of the library: real brand posts, newest first. Create an account to search it and read the breakdowns.",
};

export default function LibraryPage() {
  const posts = getLibrary();
  return (
    <section>
      <Wrapper variant="standard" className="page-start">
        <div className="text-balance max-w-3xl mx-auto text-center">
          <Text tag="h1" variant="h1" className="text-primary-foreground">
            The library
          </Text>
          <Text tag="p" variant="body" className="text-secondary-foreground mt-4 max-w-xl mx-auto">
            A preview of the library: real brand posts, newest first, each linking back to the original.
            Create an account to search the whole library and read the breakdowns.
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
