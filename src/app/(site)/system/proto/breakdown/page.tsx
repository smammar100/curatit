// Prototype (2026-10-23): five directions for the post panel's creative breakdown, on the fixture
// analysis, so it renders without a session. Deleted once a direction is chosen.
import BreakdownProto from "@/components/proto/BreakdownProto";
import Text from "@/components/fundations/elements/Text";
import { galleryFixture } from "@/lib/creative/fixtures";
import { toPublicAnalysis, type SlideRecord } from "@/lib/creative/publicAnalysis";

export default async function BreakdownProtoPage({ searchParams }: { searchParams: Promise<{ direction?: string; tab?: string }> }) {
  const params = await searchParams;
  const { dna, slides } = galleryFixture();
  const rows: SlideRecord[] = slides.map((observation) => ({ version_id: "v", position: observation.position, observation }));
  const analysis = toPublicAnalysis({ creative_dna: dna, current_version_id: "v", image_analysis_complete: true, expected_slides: 7, processed_slides: 7 }, rows, 7)!;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Text tag="h2" variant="displaySM">
          Breakdown directions
        </Text>
        <Text className="mt-2 text-secondary-foreground">
          Five ways to set the post panel&rsquo;s Breakdown and Visual DNA tabs, on one analysis. Pick a direction and a tab; the stage on the left follows the slide links.
        </Text>
      </div>
      <BreakdownProto analysis={analysis} initial={{ direction: params.direction, view: params.tab }} />
    </div>
  );
}
