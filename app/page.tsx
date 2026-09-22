import Link from "next/link";
import Text from "@/components/fundations/elements/Text";
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import SlideArt from "@/components/product/SlideArt";
import { getViewer } from "@/lib/auth";
import { searchCreatives } from "@/lib/services/creatives";
import { categories, termName } from "@/lib/taxonomy";

const steps = [
  {
    title: "Search by brief",
    body: "Describe the campaign in plain words — “finance carousels explaining a feature” — then narrow by objective, format, style, and structure.",
  },
  {
    title: "Understand the pattern",
    body: "Every post comes with an editor-reviewed breakdown: the hook, the narrative across slides, composition, and why it earned a place.",
  },
  {
    title: "Build the board",
    body: "Save references to private boards, note what to adapt, and share a read-only link with your client when you’re ready.",
  },
];

export default async function HomePage() {
  const viewer = await getViewer();

  // One published reference per launch category, as a signed-out preview.
  const previews = categories
    .map((category) => searchCreatives({ filters: { category: [category.id] }, limit: 1 }).items[0])
    .filter(Boolean);

  return (
    <>
      <section>
        <Wrapper variant="standard" className="pt-32 lg:pt-48">
          <div className="text-balance max-w-3xl mx-auto text-center">
            <Text tag="h1" variant="displayXL" className="text-base-900 font-display font-light">
              Find the brand posts worth studying.
            </Text>
            <Text tag="p" variant="textLG" className="text-base-600 mt-6">
              Curatit is a curated, searchable library of real organic brand posts — analysed by editors, so creative
              teams can find, understand, and build on what works.
            </Text>
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {viewer ? (
                <Button isLink href="/library" size="md" variant="default">
                  Open the library
                </Button>
              ) : (
                <>
                  <Button isLink href="/signup" size="md" variant="default">
                    Get access
                  </Button>
                  <Button isLink href="/signin" size="md" variant="muted">
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </div>
        </Wrapper>
      </section>

      <section aria-label="From the library">
        <Wrapper variant="standard" className="py-24">
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {previews.map((creative) => (
              <li key={creative.id}>
                <div className="p-3 bg-base-50 rounded-lg">
                  <div className="rounded overflow-hidden shadow">
                    <SlideArt art={creative.cover} alt={creative.coverAlt} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-base-500">
                  {creative.brand.name} · {termName("category", creative.categoryId)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-base-400">
            Preview uses Curatit&rsquo;s demo library of fictional brands while launch sources are approved.
          </p>
        </Wrapper>
      </section>

      <section>
        <Wrapper variant="standard" className="py-24">
          <Text tag="h2" variant="displayMD" className="text-base-900 font-display font-thin max-w-xl">
            From brief to board in one place
          </Text>
          <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t border-base-200 pt-6">
                <p className="text-xs font-medium text-accent-600">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-medium text-base-900">{step.title}</h3>
                <p className="mt-2 text-sm text-base-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </Wrapper>
      </section>

      <section>
        <Wrapper variant="standard" className="py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <Text tag="h2" variant="displayMD" className="text-base-900 font-display font-thin">
                Six categories at launch
              </Text>
              <p className="mt-4 text-base-600">
                We&rsquo;re starting narrow and deep: recognisable brands in six mainstream categories, with Instagram
                statics and carousels. More categories open only once they&rsquo;re properly covered.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <li key={category.id} className="rounded-lg bg-base-50 px-5 py-4 text-base-900">
                  {category.name}
                </li>
              ))}
            </ul>
          </div>
        </Wrapper>
      </section>

      <section>
        <Wrapper variant="standard" className="py-24">
          <div className="rounded-lg bg-base-900 px-8 py-16 text-center text-white">
            <Text tag="h2" variant="displayMD" className="font-display font-thin">
              Reference, not copying.
            </Text>
            <p className="mx-auto mt-4 max-w-xl text-sm text-base-300">
              Every post links to its source and credits the brand. Curatit helps you understand why work is effective —
              the result should be your own.
            </p>
            {!viewer && (
              <Link href="/signup" className="mt-8 inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-medium text-base-900 hover:bg-base-100">
                Get access
              </Link>
            )}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
