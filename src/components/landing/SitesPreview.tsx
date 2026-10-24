import Link from "next/link";
// Fundation
import { Button } from "@/components/glaze/ui/button";
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
      <Wrapper variant="standard" className="section-y">
        <div className=" relative flex snap-x snap-proximity gap-1 py-2 overflow-x-scroll scrollbar-hide">
          {sortedTags.map((tag) => (
            <Button key={tag} size="sm" variant="secondary" title={tag} aria-label={tag} render={<Link href={`/sites/tags/${tag}`} />} nativeButton={false}>
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
