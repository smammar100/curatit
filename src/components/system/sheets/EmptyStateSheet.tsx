"use client";

// /system/empty-state: Glaze's Empty (src/components/glaze/ui/empty-state). Rules from
// glaze-docs/empty-state.md
import { Button } from "@/components/glaze/ui/button";
import {
  Empty,
  EmptyCode,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyRetry,
  EmptyTitle,
} from "@/components/glaze/ui/empty-state";
import { Bookmark } from "@/components/glaze/icon";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const failAgain = () => new Promise((_, reject) => window.setTimeout(() => reject(new Error("offline")), 800));

export default function EmptyStateSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Empty state"
        importLine={`import {Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent} from '@/components/glaze/ui/empty-state'`}
      >
        Explains why a region is empty and offers the one way forward: the reason&rsquo;s glyph, a title, one line and
        at most one action, centred in one column.
      </SheetHeader>

      <SheetSection title="Reasons" description="The reason picks the glyph; error adds the failure colour and announces itself.">
        <Sheet>
          {() => (
            <div className="grid gap-6 lg:grid-cols-2">
              <Specimen label={<Mono>empty, with its own glyph</Mono>} stretch>
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle icon={Bookmark}>Your swipe file is empty</EmptyTitle>
                    <EmptyDescription>Save a post and it waits here for your next brief.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button size="sm" variant="secondary">
                      Browse the feed
                    </Button>
                  </EmptyContent>
                </Empty>
              </Specimen>
              <Specimen label={<Mono>no-results</Mono>} stretch>
                <Empty reason="no-results">
                  <EmptyHeader>
                    <EmptyTitle>
                      No posts match <EmptyCode>price slide fintech</EmptyCode>
                    </EmptyTitle>
                    <EmptyDescription>Try fewer words, or a brand or category name.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button size="sm" variant="secondary">
                      Clear search
                    </Button>
                  </EmptyContent>
                </Empty>
              </Specimen>
              <Specimen label={<Mono>no-access</Mono>} stretch>
                <Empty reason="no-access">
                  <EmptyHeader>
                    <EmptyTitle>Editors only</EmptyTitle>
                    <EmptyDescription>Ask an admin to make you an editor to review analyses.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Specimen>
              <Specimen label={<Mono>error, with a retry that fails again</Mono>} stretch>
                <Empty reason="error">
                  <EmptyHeader>
                    <EmptyTitle>Couldn&rsquo;t load your boards</EmptyTitle>
                    <EmptyDescription>Check your connection, then retry.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <EmptyRetry onRetry={failAgain} />
                  </EmptyContent>
                </Empty>
              </Specimen>
              <Specimen label={<Mono>plain, size sm</Mono>} stretch>
                <Empty variant="plain" size="sm">
                  <EmptyHeader>
                    <EmptyTitle>No boards yet</EmptyTitle>
                    <EmptyDescription>Make one from the Save menu.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Empty reason="no-results">
  <EmptyHeader>
    <EmptyTitle>No posts match <EmptyCode>{query}</EmptyCode></EmptyTitle>
    <EmptyDescription>Try fewer words, or a brand or category name.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent><Button size="sm" variant="secondary" onClick={clear}>Clear search</Button></EmptyContent>
</Empty>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Set reason to why it is empty, and write a search back into a no-results title, with a way to clear it." },
            { kind: "do", text: "Offer at most one action, secondary unless it is the only way forward; retry a failed load with EmptyRetry." },
            { kind: "do", text: "Use plain inside a card, a list or a table; panel only on its own." },
            { kind: "dont", text: "Add an illustration, a second glyph or an icon tile; pass EmptyTitle icon to change the glyph." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
