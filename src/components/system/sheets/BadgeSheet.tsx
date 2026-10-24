// /system/badge: Glaze's Badge (src/components/glaze/ui/badge). Rules from glaze-docs/badge.md
import { Badge } from "@/components/glaze/ui/badge";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const VARIANTS = [
  { variant: "neutral", label: "Carousel", sub: "What something is, the default" },
  { variant: "outline", label: "Beta", sub: "A quieter label" },
  { variant: "ok", label: "Published", sub: "An outcome: done" },
  { variant: "warn", label: "Needs review", sub: "An outcome: a risk" },
  { variant: "fail", label: "Failed", sub: "An outcome: a failure" },
] as const;

const SIZES = ["default", "sm"] as const;

export default function BadgeSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Badge" importLine={`import {Badge} from '@/components/glaze/ui/badge'`}>
        Labels what something is or how it stands, in one or two words on a 6px tag. Never pressable: a filter is a
        chip, an action a button.
      </SheetHeader>

      <SheetSection title="Variants and sizes" description="20 and 16px tall, 12px type.">
        <Sheet>
          {() => (
            <Matrix
              columns={[...SIZES, "count"]}
              rows={VARIANTS.map((v) => ({
                label: <Mono>{v.variant}</Mono>,
                sub: v.sub,
                cells: [
                  ...SIZES.map((size) => (
                    <Badge key={size} variant={v.variant} size={size}>
                      {v.label}
                    </Badge>
                  )),
                  <Badge key="c" variant={v.variant} count={128} />,
                ],
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example code={`<Badge>Carousel</Badge>
<Badge variant="ok">Published</Badge>
<Badge count={unread} max={99}/>`} />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Use ok, warn or fail only for an outcome, and write the outcome as the word." },
            { kind: "do", text: "Pass a number as count, so it caps at max; keep a label to one or two words." },
            { kind: "dont", text: "Make a Badge pressable with onClick or a link." },
            { kind: "dont", text: "Round a Badge to a pill or restyle its fill, height or type." },
            { kind: "dont", text: "Give a row more than one status badge." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
