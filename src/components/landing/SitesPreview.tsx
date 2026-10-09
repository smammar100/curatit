// Fundation
import Button from "@/components/fundations/elements/Button";
import Wrapper from "@/components/fundations/containers/Wrapper";
// Components
import SiteCard from "@/components/sites/SiteCard";
import SponsorCard from "@/components/sites/SponsorCard";
import SitesPreviewGrid from "./SitesPreviewGrid";
// Content
import { getCollection } from "@/lib/content";

export default function SitesPreview() {
  const alltools = getCollection("sites");
  const allTags = [...new Set(alltools.flatMap((post) => post.data.tags || []))];
  const sortedTags = allTags.sort((a, b) => a.localeCompare(b));
  return (
    <section>
      <Wrapper variant="standard" className="py-24">
        <div className=" relative flex snap-x snap-proximity gap-1 py-2 overflow-x-scroll scrollbar-hide">
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
        <SitesPreviewGrid
          cards={alltools.map((post) => (
            <SiteCard key={post.id} post={post} />
          ))}
          sponsor={<SponsorCard />}
        />
      </Wrapper>
    </section>
  );
}
