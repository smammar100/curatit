import type { Metadata } from "next";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Button from "@/components/fundations/elements/Button";
import Text from "@/components/fundations/elements/Text";
import LinkedinLogo from "@/components/fundations/icons/LinkedinLogo";
import SelectionGraph from "@/components/vision/SelectionGraph";
import Signature from "@/components/vision/Signature";
import { getPublishedPosts, type LibraryPost } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Vision | Curatit",
  description: "Taste you can learn from: why Curatit keeps real brand posts and names the decisions behind them.",
};

export const revalidate = 3600;

const FOUNDER = {
  name: "Syed Mohammad Ammar",
  title: "Founder, Curatit",
  linkedin: "https://www.linkedin.com/in/syedmammar/",
};

// Five posts for the graph: the newest from each category, so the frames don't repeat a look
function byCategory(posts: LibraryPost[], count: number) {
  const seen = new Set<string>();
  const picked: LibraryPost[] = [];
  for (const post of posts) {
    if (seen.has(post.category.slug)) continue;
    seen.add(post.category.slug);
    picked.push(post);
    if (picked.length === count) break;
  }
  return picked;
}

// The Vision page, the "Night" direction (chosen 2026-10-12 from a five-way prototype): one panel
// inset from the window edges, dark on the light site and paper on the dark one (like the
// footer), holding the statement, the founder's note in his own voice with his signature, and
// the animated post graph; then the library's counts and the ways in, back on the page itself
export default async function VisionPage() {
  // Like the homepage, a failed fetch throws, so a failed revalidation keeps the last good page
  const posts = await getPublishedPosts();
  const brands = new Set(posts.map((post) => post.brand.slug)).size;
  const graph = byCategory(posts, 5);

  return (
    <>
      <section className="px-4 pt-20">
        <div className="vision-night overflow-clip rounded-[1.5rem] sm:rounded-[2rem]">
          <Wrapper variant="standard" className="pt-24 pb-20 lg:pt-32 lg:pb-28">
            <div className="mx-auto max-w-2xl text-center">
              <Text tag="h1" variant="displayLG" className="font-display font-light text-base-900 text-balance">
                Taste you can learn from.
              </Text>
              {/* A note from the founder, in his own voice, signed below */}
              <div className="mt-10 space-y-5">
                <Text className="text-pretty text-base-600">
                  I learn design the way most of us do: by studying work that&apos;s better than mine. A crop that holds a face. A headline that gives the verdict before the
                  chart. A colour saved for the last slide.
                </Text>
                <Text className="text-pretty text-base-600">
                  Mine lived in screenshots and saved posts I could never find again, with no note on why they worked. So I built Curatit: real posts from real brands, kept
                  in one place, with the decisions behind them named, so you can find the move you need and see why it lands.
                </Text>
                <Text className="text-pretty text-base-600">
                  Next, I want the same library open to the AI tools you brief, so they can search by technique, point at the slide and follow the principle, without
                  copying the post.
                </Text>
                <Text className="text-pretty text-base-900">Good taste is learnable. I&apos;m building the place to learn it.</Text>
              </div>
            </div>

            {/* The founder's sign-off: signature written out once, then who wrote this */}
            <div className="mx-auto mt-14 flex max-w-md flex-col items-center text-center">
              <Signature className="w-64 text-base-900 sm:w-80" />
              <div className="mt-8 flex items-center gap-3 text-left">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-base-900">{FOUNDER.name}</p>
                  <p className="text-sm text-base-600">{FOUNDER.title}</p>
                </div>
                <a
                  href={FOUNDER.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${FOUNDER.name} on LinkedIn (opens in a new tab)`}
                  className="ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-base-500 ring-1 ring-base-200 transition-[color,background-color] duration-150 hover:bg-base-100 hover:text-base-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-base-500"
                >
                  <LinkedinLogo className="size-4" />
                </a>
              </div>
            </div>

            {graph.length >= 3 && (
              <div className="mx-auto mt-20 max-w-5xl">
                <SelectionGraph posts={graph} />
              </div>
            )}
          </Wrapper>
        </div>
      </section>

      <section>
        <Wrapper variant="standard" className="pt-24 pb-32">
          <div className="mx-auto max-w-2xl text-center">
            {posts.length > 0 && (
              <Text tag="h2" variant="displaySM" className="font-display font-thin text-balance text-base-900">
                {posts.length} posts from {brands} brands so far, and more every week.
              </Text>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button isLink size="base" variant="default" href="/signup">
                Start your swipe file
              </Button>
              <Button isLink size="base" variant="muted" href="/#how-it-works">
                See how it works
              </Button>
            </div>
          </div>
        </Wrapper>
      </section>
    </>
  );
}
