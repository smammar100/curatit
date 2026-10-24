// /system/data-list: Glaze's DataList (src/components/glaze/ui/data-list). Rules from glaze-docs/data-list.md
import { Card, CardContent, CardHeader, CardTitle } from "@/components/glaze/ui/card";
import { DataList, DataListItem, DataListLabel, DataListValue } from "@/components/glaze/ui/data-list";
import { Example, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection, Specimen } from "../SheetParts";

const PAIRS = [
  { label: "Brand", value: "Revolut" },
  { label: "Posted", value: "12 October 2026" },
  { label: "Short code", value: "C9xk2LmQ", mono: true },
  { label: "Location", value: null },
];

function Pairs() {
  return (
    <>
      {PAIRS.map((p) => (
        <DataListItem key={p.label}>
          <DataListLabel>{p.label}</DataListLabel>
          <DataListValue mono={p.mono}>{p.value}</DataListValue>
        </DataListItem>
      ))}
    </>
  );
}

export default function DataListSheet() {
  return (
    <SheetBody>
      <SheetHeader
        title="Data list"
        importLine={`import {DataList, DataListItem, DataListLabel, DataListValue} from '@/components/glaze/ui/data-list'`}
      >
        Label and value pairs about one thing: side by side from 24rem, stacked below it. An empty value reads None, in
        the quiet text, so a blank never looks like a bug.
      </SheetHeader>

      <SheetSection title="Variants">
        <Sheet>
          {() => (
            <div className="grid gap-6 lg:grid-cols-3">
              <Specimen label={<Mono>panel</Mono>}>
                <DataList variant="panel" className="w-full">
                  <Pairs />
                </DataList>
              </Specimen>
              <Specimen label={<Mono>plain, inside a card</Mono>}>
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Post</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataList>
                      <Pairs />
                    </DataList>
                  </CardContent>
                </Card>
              </Specimen>
              <Specimen label={<Mono>vertical</Mono>}>
                <DataList orientation="vertical" className="w-full">
                  <Pairs />
                </DataList>
              </Specimen>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example
          code={`<DataList variant="panel">
  <DataListItem><DataListLabel>Brand</DataListLabel><DataListValue>Revolut</DataListValue></DataListItem>
  <DataListItem><DataListLabel>Short code</DataListLabel><DataListValue mono>C9xk2LmQ</DataListValue></DataListItem>
  <DataListItem><DataListLabel>Location</DataListLabel><DataListValue>{null}</DataListValue></DataListItem>
</DataList>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Use plain inside a Card or a Panel, and panel only on its own." },
            { kind: "do", text: "Put each label and value in its own DataListItem; keep labels to one to three words, no colon." },
            { kind: "do", text: "Set mono on a value that is an ID, a key, a hash or a path, and on nothing else." },
            { kind: "dont", text: "Write a dash or leave a value blank by hand; pass null and it reads None." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
