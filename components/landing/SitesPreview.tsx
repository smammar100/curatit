import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
import SiteCard from "@/components/sites/SiteCard";
import SponsorCard from "@/components/sites/SponsorCard";
import SitesGrid from "./SitesGrid";
import { getCollection, uniqueTags } from "@/lib/content";

export default async function SitesPreview() {
  const sites = await getCollection("sites");
  const sortedTags = uniqueTags(sites);

  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        <div className="relative flex snap-x snap-proximity gap-1 py-2 overflow-x-scroll scrollbar-hide">
          {sortedTags.map((tag) => (
            <Button
              key={tag}
              isLink
              size="xs"
              variant="muted"
              title={tag}
              aria-label={tag}
              href={`/sites/tags/${tag}`}
              className="capitalize"
            >
              {tag}
            </Button>
          ))}
        </div>
        <SitesGrid
          cards={sites.map((site) => (
            <SiteCard key={site.id} post={site} />
          ))}
          sponsor={<SponsorCard key="sponsor" />}
        />
      </Wrapper>
    </section>
  );
}
