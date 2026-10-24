"use client";

// /system/skeleton: Glaze's Skeleton, SkeletonText and SkeletonSwap (src/components/glaze/ui/skeleton).
// Rules from glaze-docs/skeleton.md
import { useState } from "react";
import { Button } from "@/components/glaze/ui/button";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/glaze/ui/item";
import { Avatar } from "@/components/glaze/ui/avatar";
import { Skeleton, SkeletonSwap, SkeletonText } from "@/components/glaze/ui/skeleton";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const EDITORS = [
  { name: "Syed Ammar", note: "Approved 162 analyses" },
  { name: "Maya Chen", note: "Approved 20 analyses" },
];

function Rows({ loading, label }: { loading: boolean; label: string }) {
  return (
    <ItemGroup aria-label={label} className="w-full">
      {EDITORS.map((e) => (
        <Item key={e.name}>
          <ItemMedia>
            {loading ? <Skeleton className="size-6 rounded-pill" /> : <Avatar name={e.name} decorative />}
          </ItemMedia>
          <ItemContent>
            {loading ? (
              <>
                <SkeletonText type="label" last={0.5} />
                <SkeletonText type="body-sm" last={0.7} />
              </>
            ) : (
              <>
                <ItemTitle>{e.name}</ItemTitle>
                <ItemDescription>{e.note}</ItemDescription>
              </>
            )}
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}

function SwapDemo({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="grid w-full gap-3">
      <div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 1200);
          }}
        >
          Load the editors
        </Button>
      </div>
      <SkeletonSwap loading={loading} fallback={<Rows loading label={label} />} label="Loading editors">
        <Rows loading={false} label={label} />
      </SkeletonSwap>
    </div>
  );
}

export default function SkeletonSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Skeleton"
        importLine={`import {Skeleton, SkeletonText, SkeletonSwap} from '@/components/glaze/ui/skeleton'`}
      >
        Holds the shape of content while it loads: still grey blocks the size of the real thing, shown only if the load
        takes longer than 150ms and kept for at least 400ms, so a fast answer never flashes.
      </SheetHeader>

      <SheetSection title="Parts" description="Still, never a pulse or a sweep.">
        <Sheet>
          {() => (
            <div className="grid gap-6 lg:grid-cols-3">
              <Specimen label={<Mono>Skeleton</Mono>}>
                <Skeleton className="size-6 rounded-pill" />
                <Skeleton className="h-(--control) w-24 rounded-pill" />
                <Skeleton className="size-16" />
              </Specimen>
              <Specimen label={<Mono>SkeletonText, by type role</Mono>} stretch>
                <div className="grid gap-2">
                  <SkeletonText type="heading" last={0.5} />
                  <SkeletonText type="body" lines={3} />
                  <SkeletonText type="caption" last={0.3} />
                </div>
              </Specimen>
              <Specimen label="The same rows, loading" stretch>
                <Rows loading label="Editors, loading" />
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Swapping" description="Load the editors: the skeleton waits 150ms, then holds for at least 400ms.">
        <Sheet split>{(theme) => <SwapDemo label={`Editors, ${theme}`} />}</Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<SkeletonSwap loading={loading} fallback={<EditorRows loading/>} label="Loading editors">
  <EditorRows/>
</SkeletonSwap>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Show a skeleton through SkeletonSwap with a label naming what loads." },
            { kind: "do", text: "Shape it like the content: the same component, sizes and SkeletonText type roles." },
            { kind: "dont", text: "Animate it, or swap content someone is reading for a skeleton on a refresh." },
            { kind: "dont", text: "Write loading ? <Skeleton/> : content by hand." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
