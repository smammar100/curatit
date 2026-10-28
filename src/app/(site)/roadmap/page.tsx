import type { Metadata } from "next";
import Wrapper from "@/components/fundations/containers/Wrapper";
import Text from "@/components/fundations/elements/Text";
import { Badge } from "@/components/glaze/ui/badge";
import { Panel } from "@/components/glaze/ui/panel";
import { Lifeline, type LifelineEvent, type LifelineMarker } from "@/components/lifeline";
import { CHANGELOG, ROADMAP, type ChangelogEntry, type RoadmapStage } from "@/content/roadmap";
import { getBrandsJoined, getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "What Curatit has shipped, what's being built now and what's next, with a changelog of every update.",
};

export const revalidate = 3600;

const REPO = "https://github.com/smammar100/curatit/commit/";

const STAGES: { stage: RoadmapStage; note: string }[] = [
  { stage: "Now", note: "Being built or rolled out" },
  { stage: "Next", note: "Up after that" },
  { stage: "Later", note: "On the list" },
];

// Real library covers on the updates they belong to, shown by the lifeline as a hover image that
// follows the cursor: the first real posts and a newly added brand. (The lifeline's floating photo cards need empty track after a day's text, and these days
// sit side by side, so the cards covered the next day's updates.)
const PICTURED: Record<string, string> = {
  "Real brand posts replace the demo": "DdNIWqQPrFM",
  "Bolt and Public join the library": "DeMn8pplKb2",
};

// The changelog's days are its commits' days, dated in Pakistan (+05:00), so a brand's day is read
// there too: the first thirty went live just after midnight on 10 Oct, still 9 Oct in UTC
const dayOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
// "Bolt", "Bolt and Public", "Duolingo, Headspace and Canva"
const names = (list: string[]) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}` : list[0]);

// The Roadmap (2026-10-12). The lifeline (vendored from evilrabbit/lifeline, components/lifeline)
// carries what's been built on one rail of dates, every day in its own column (since 2026-10-25, at
// the owner's request: the first days were one summary column and Now, Next and Later ended the
// rail), every update linked to the commit behind it and each day's new brands as their marks.
// Below it, what's coming. Both come from src/content/roadmap.ts, written from this repo's history (npm
// run changelog:draft lists the commits since the newest day). Since 2026-10-24 on Glaze: each
// stage column is a heading over one Panel of rows split by hairlines (no grey mat, no tile per
// item), each item's area a Badge after its title rather than a label above it, and the fireworks
// entries lose their emoji (Glaze has none in copy; the fireworks still go off).
export default async function RoadmapPage() {
  const [posts, joined] = await Promise.all([getPublishedPosts(), getBrandsJoined()]);
  const updates = CHANGELOG.reduce((n, day) => n + day.entries.length, 0);
  const days = [...CHANGELOG].sort((a, b) => a.date.localeCompare(b.date));

  // The marks of the brands whose first posts went live on a day, if any
  const brandsOn = Map.groupBy(
    joined.filter(({ brand }) => brand.logo),
    ({ joinedAt }) => dayOf(joinedAt),
  );
  const marksOn = (date: string) => {
    const brands = brandsOn.get(date)?.map(({ brand }) => brand) ?? [];
    return brands.length ? { images: brands.map((brand) => ({ src: brand.logo!, alt: brand.name })), label: `New in the library: ${names(brands.map((brand) => brand.name))}` } : undefined;
  };

  // One update on the rail: its title linked to the commit behind it, with a real post on hover
  // when it has one and, on the update about new brands, their marks; an update with no commit yet
  // (this page) sets off the lifeline's fireworks
  const update = (entry: ChangelogEntry, date: string): LifelineEvent => {
    const commit = entry.commits[0];
    if (!commit) return { text: entry.title, effect: "fireworks" };
    const text = [{ type: "link" as const, value: entry.title, href: `${REPO}${commit}` }];
    const post = posts.find((candidate) => candidate.shortCode === PICTURED[entry.title]);
    const gallery = entry.brands ? marksOn(date) : undefined;
    if (!post && !gallery) return text;
    return { text, ...(post && { image: { src: post.images[0], alt: `${post.brand.name} on Instagram` } }), ...(gallery && { gallery }) };
  };

  // Every day the changelog covers or a brand joined on, oldest first. A day whose new brands no
  // update names (the changelog is written by hand, often a day or two later) gets a line of its own
  const dates = [...new Set([...days.map((day) => day.date), ...brandsOn.keys()])].sort();
  const markers: LifelineMarker[] = dates.map((date, i) => {
    const entries = days.find((day) => day.date === date)?.entries ?? [];
    const events = entries.map((entry) => update(entry, date));
    const marks = marksOn(date);
    if (marks && !entries.some((entry) => entry.brands)) {
      events.push({ text: `${names(marks.images.map((image) => image.alt))} ${marks.images.length > 1 ? "join" : "joins"} the library`, gallery: marks });
    }
    return { id: date, year: i, age: i + 1, label: shortDate(date), events };
  });

  return (
    <>
      <section>
        <Wrapper variant="standard" className="page-start">
          <div className="max-w-2xl">
            <Text tag="h1" variant="h1" className="text-balance text-text-1">
              Roadmap
            </Text>
            <Text className="mt-6 text-pretty text-text-2">
              What&apos;s been built, day by day on one line, and what&apos;s coming after it. Every update links to the change that made it.
            </Text>
            <Text variant="bodySM" className="mt-4 text-text-2">
              {updates} updates across {days.length} days of building. Scroll the timeline to see more days.
            </Text>
          </div>
        </Wrapper>
      </section>

      <section aria-label="Curatit's lifeline">
        <Wrapper variant="standard" className="section-y">
          <div className="h-145 w-full overflow-hidden">
            <Lifeline mode="embed" markers={markers} birthYear={0} title="Curatit's lifeline" labels={{ age: "Day", year: "Date" }} className="h-full" />
          </div>
        </Wrapper>
      </section>

      <section aria-labelledby="coming">
        <Wrapper variant="standard" className="section-y">
          <Text tag="h2" id="coming" variant="h3" className="text-text-1">
            What&apos;s coming
          </Text>
          <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-4">
            {STAGES.map(({ stage, note }) => (
              <section key={stage} aria-labelledby={`stage-${stage}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 id={`stage-${stage}`} className="type-heading text-text-1">
                    {stage}
                  </h3>
                  <p className="type-caption text-text-2">{note}</p>
                </div>
                <Panel padding="none" className="mt-3">
                  <ul>
                    {ROADMAP.filter((item) => item.stage === stage).map((item) => (
                      <li key={item.title} className="rule-row p-4">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="type-label text-text-1">{item.title}</p>
                          <Badge>{item.area}</Badge>
                        </div>
                        <p className="mt-1 type-body-sm text-pretty text-text-2">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </section>
            ))}
          </div>
        </Wrapper>
      </section>
    </>
  );
}
