"use client";

// /system/tabs: Glaze's Tabs (src/components/glaze/ui/tabs). Rules from glaze-docs/tabs.md
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/glaze/ui/tabs";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const SIZES = ["sm", "default"] as const;

export default function TabsSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Tabs"
        importLine={`import {Tabs, TabsList, TabsTrigger, TabsContent, TabsCount} from '@/components/glaze/ui/tabs'`}
      >
        Switches between panels of one view, all about the same object. The selected tab is a pill that slides to its
        place; there is no track. A few views of the same content are a segmented control.
      </SheetHeader>

      <SheetSection title="Sizes and states" description="Arrow keys select the tab they land on; the third tab is disabled.">
        <Sheet>
          {(theme) => (
            <Matrix
              align="start"
              columns={["Tabs with a panel"]}
              rows={SIZES.map((size) => ({
                label: <Mono>{size}</Mono>,
                sub: size === "sm" ? "26px" : "32px",
                cells: [
                  <Tabs key="t" defaultValue="breakdown" className="w-full">
                    <TabsList size={size} aria-label={`Post, ${size}, ${theme}`}>
                      <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                      <TabsTrigger value="visual">
                        Visual DNA<TabsCount>6</TabsCount>
                      </TabsTrigger>
                      <TabsTrigger value="slides" disabled>
                        Slides
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="breakdown" className="pt-3 type-body-sm text-text-2">
                      A launch told as a before and after, with the product as the turn.
                    </TabsContent>
                    <TabsContent value="visual" className="pt-3 type-body-sm text-text-2">
                      Composition, typography, colour, imagery, devices and branding.
                    </TabsContent>
                    <TabsContent value="slides" className="pt-3 type-body-sm text-text-2">
                      One row per slide.
                    </TabsContent>
                  </Tabs>,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<Tabs defaultValue="breakdown">
  <TabsList aria-label="Post">
    <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
    <TabsTrigger value="visual">Visual DNA<TabsCount>6</TabsCount></TabsTrigger>
  </TabsList>
  <TabsContent value="breakdown">…</TabsContent>
  <TabsContent value="visual">…</TabsContent>
</Tabs>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Give every TabsList an aria-label naming the object, and pass value or defaultValue." },
            { kind: "do", text: "Keep two to seven tabs, each a noun of one or two words; put a number in TabsCount." },
            { kind: "do", text: "Pass keepMounted to a panel that holds typed or scrolled state." },
            { kind: "dont", text: "Put tabs on a grey track or darken the selected pill; a track is the segmented control." },
            { kind: "dont", text: "Add an icon to some tabs and not others." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
