import type { Metadata } from "next";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import Card from "@/components/fundations/molecules/Card";
import { Lifeline, type LifelineEvent, type LifelineMarker } from "@/components/lifeline";
import { CHANGELOG, EARLIER, ROADMAP, type RoadmapStage } from "@/content/roadmap";
import { fontWeights } from "@/lib/font-weight";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Roadmap | Curatit",
  description: "What Curatit has shipped, what's being built now and what's next, with a changelog of every update.",
};

export const revalidate = 3600;

const REPO = "https://github.com/smammar100/curatit/commit/";

const semibold = { fontVariationSettings: fontWeights.semibold };

const STAGES: { stage: RoadmapStage; when: string; note: string }[] = [
  { stage: "Now", when: "In progress", note: "Being built or rolled out" },
  { stage: "Next", when: "Up next", note: "Up after that" },
  { stage: "Later", when: "On the list", note: "On the list" },
];

// Real library covers on the updates they belong to, shown by the lifeline as a hover image that
// follows the cursor: the first real posts and a newly added brand. (The lifeline's floating photo cards need empty track after a day's text, and these days
// sit side by side, so the cards covered the next day's updates.)
const PICTURED: Record<string, string> = {
  "Real posts from thirty brands across seven categories": "DdNIWqQPrFM",
  "Bolt and Public join the library": "DeMn8pplKb2",
};

const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
// "9–11 Oct", or "30 Sep – 2 Oct" across a month
const dateRange = (from: string, to: string) =>
  from === to ? shortDate(from) : from.slice(0, 7) === to.slice(0, 7) ? `${Number(from.slice(8))}–${shortDate(to)}` : `${shortDate(from)} – ${shortDate(to)}`;

// The Roadmap (2026-10-12). The lifeline (vendored from evilrabbit/lifeline, components/lifeline)
// carries the whole story on one rail: the days before the newest in a few lines, then each day
// since in full, every update linked to the commit behind it, then Now, Next and Later. Below it, what's
// coming in detail. Both come from src/content/roadmap.ts, written from this repo's history (npm
// run changelog:draft lists the commits since the newest day). Since 2026-10-23 the three stage
// columns are the system's Cards on the grey mat, each item a white tile on the surface ladder's
// first step, the words on the tokens at the library's semibold where they were medium.
export default async function RoadmapPage() {
  const posts = await getPublishedPosts();
  const updates = CHANGELOG.reduce((n, day) => n + day.entries.length, 0);
  const days = [...CHANGELOG].sort((a, b) => a.date.localeCompare(b.date));
  const earlier = days.filter((day) => day.date <= EARLIER.through);
  const since = days.filter((day) => day.date > EARLIER.through);

  // One update on the rail: its title linked to the commit behind it, with a real post on hover
  // when it has one; an update with no commit yet (this page) sets off the lifeline's fireworks
  // The three brands added to the library most recently, as a small cluster of their marks
  const brands = [...new Map(posts.toSorted((a, b) => b.addedAt.localeCompare(a.addedAt)).filter((post) => post.brand.logo).map((post) => [post.brand.slug, post.brand])).values()];
  const shown = brands.slice(0, 3);
  const brandGallery = shown.length
    ? { images: shown.map((brand) => ({ src: brand.logo!, alt: brand.name })), label: `The newest brands in the library: ${shown.map((brand) => brand.name).join(", ")}` }
    : null;

  const update = (title: string, commit?: string): LifelineEvent => {
    if (!commit) return { text: `${title} 🎆`, effect: "fireworks" };
    const text = [{ type: "link" as const, value: title, href: `${REPO}${commit}` }];
    const post = posts.find((candidate) => candidate.shortCode === PICTURED[title]);
    return post ? { text, image: { src: post.images[0], alt: `${post.brand.name} on Instagram` } } : text;
  };

  const markers: LifelineMarker[] = [
    ...(earlier.length
      ? [
          {
            id: "earlier",
            year: 0,
            age: earlier.length > 1 ? `Days 1–${earlier.length}` : "Day 1",
            label: dateRange(earlier[0].date, earlier[earlier.length - 1].date),
            events: EARLIER.items.map(({ title, commit }) => update(title, commit)),
          },
        ]
      : []),
    ...since.map(
      (day, i): LifelineMarker => ({
        id: day.date,
        year: i + 1,
        age: `Day ${earlier.length + i + 1}`,
        label: shortDate(day.date),
        events: day.entries.map((entry) => update(entry.title, entry.commits[0])),
      }),
    ),
    ...STAGES.map(
      ({ stage, when }, i): LifelineMarker => ({
        id: `stage-${stage}`,
        year: since.length + 1 + i,
        age: stage,
        label: when,
        // What's in progress reads bright, as if hovered; Next and Later stay quiet until pointed at
        current: stage === "Now",
        // An item to celebrate (the closed beta launch) sets off the fireworks, like this page's own
        // entry; More brands shows the library's brand marks under it
        events: ROADMAP.filter((item) => item.stage === stage).map((item): LifelineEvent =>
          item.celebrate ? { text: `${item.title} 🎆`, effect: "fireworks" } : item.brands && brandGallery ? { text: item.title, gallery: brandGallery } : item.title,
        ),
      }),
    ),
  ];

  return (
    <>
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="max-w-2xl">
            <Text tag="h1" variant="h1" className="text-balance text-foreground">
              Roadmap
            </Text>
            <Text className="mt-6 text-pretty text-muted-foreground">
              What&apos;s been built, what&apos;s being built and what&apos;s next, on one line. Curatit is built in the open: every update links to the
              change that made it.
            </Text>
            <Text variant="bodySM" className="mt-4 text-muted-foreground">
              {updates} updates across {days.length} days of building. Scroll over the line to travel along it.
            </Text>
          </div>
        </Wrapper>
      </section>

      <section aria-label="Curatit's lifeline">
        <Wrapper variant="standard" className="section-y">
          <div className="h-[580px] w-full overflow-hidden">
            <Lifeline mode="embed" markers={markers} birthYear={0} title="Curatit's lifeline" labels={{ age: "Stage", year: "When" }} className="h-full" />
          </div>
        </Wrapper>
      </section>

      <section aria-labelledby="coming">
        <Wrapper variant="standard" className="section-y">
          <Text tag="h2" id="coming" variant="h3" className="text-foreground">
            What&apos;s coming
          </Text>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STAGES.map(({ stage, note }) => (
              <section key={stage} aria-labelledby={`stage-${stage}`}>
                <Card variant="mat" padding="lg" className="h-full">
                  <div className="flex items-baseline justify-between gap-3">
                    <Text tag="h3" id={`stage-${stage}`} className="text-foreground" style={semibold}>
                      {stage}
                    </Text>
                    <Text variant="captionLG" className="text-muted-foreground">
                      {note}
                    </Text>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {ROADMAP.filter((item) => item.stage === stage).map((item) => (
                      <li key={item.title} className="rounded-[12px] bg-surface-3 p-4 shadow-surface-1">
                        <Text variant="captionLG" className="text-muted-foreground" style={semibold}>
                          {item.area}
                        </Text>
                        <Text variant="bodySM" className="mt-1 text-foreground" style={semibold}>
                          {item.title}
                        </Text>
                        <Text variant="bodySM" className="mt-1 text-pretty text-muted-foreground">
                          {item.detail}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
