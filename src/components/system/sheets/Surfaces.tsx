// /system/surfaces: Fluid Functionalism's eight-step surface ladder (global.css) and where Glaze's card,
// overlays and dialogs sit on it through the bridge (src/styles/glaze-bridge.css)
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardMeta, CardTitle } from "@/components/glaze/ui/card";
import { Button } from "@/components/glaze/ui/button";
import { Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";
import { cn } from "@/lib/glaze/utils";

const STEPS = [
  { n: 1, cls: "bg-surface-1 shadow-surface-1", use: "The page" },
  { n: 2, cls: "bg-surface-2 shadow-surface-2", use: "A card's shell lifts here" },
  { n: 3, cls: "bg-surface-3 shadow-surface-3", use: "Paper: a panel, a field" },
  { n: 4, cls: "bg-surface-4 shadow-surface-4", use: "A raised tile in an illustration" },
  { n: 5, cls: "bg-surface-5 shadow-surface-5", use: "A floating panel no recipe covers" },
  { n: 6, cls: "bg-surface-6 shadow-surface-6", use: "Menus, popovers, selects, toasts" },
  { n: 7, cls: "bg-surface-7 shadow-surface-7", use: "Spare, between overlays and dialogs" },
  { n: 8, cls: "bg-surface-8 shadow-surface-8", use: "Dialogs and sheets" },
] as const;

const PLACES = [
  { what: "Page", where: <Mono>--page</Mono>, step: "1" },
  { what: "Card shell", where: <Mono>.shell</Mono>, step: "2, with a wash of ink" },
  { what: "Card panel, field, code", where: <Mono>--paper</Mono>, step: "3" },
  { what: "Menu, popover, select, toast", where: <Mono>.overlay</Mono>, step: "6, its ring in place of a border" },
  { what: "Dialog, sheet", where: <Mono>{`[role="dialog"].shell`}</Mono>, step: "8" },
];

export default function Surfaces() {
  return (
    <SheetBody>
      <SheetHeader title="Surfaces">
        Depth is Fluid Functionalism&rsquo;s eight-step ladder: each step a surface and the ring and drops that lift it.
        In light the surfaces are white and the shadow does the work; in dark each step is a little lighter and the
        shadows turn to rings and highlights. Glaze&rsquo;s card, overlays and dialogs already sit on it, so a component
        never needs a surface class.
      </SheetHeader>

      <SheetSection title="The ladder" description="bg-surface-N with shadow-surface-N, always as a pair.">
        <Sheet>
          {() => (
            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n} className="flex flex-col gap-2">
                  <span aria-hidden className={cn("h-20 rounded-panel", s.cls)} />
                  <span className="type-label text-text-1">Step {s.n}</span>
                  <span className="type-caption text-text-2">{s.use}</span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Where Glaze sits" description="The bridge maps Glaze's surfaces onto the ladder.">
        <Sheet>
          {() => (
            <div className="grid gap-6">
              <Matrix
                columns={["Token or recipe", "Step"]}
                rows={PLACES.map((p) => ({
                  label: p.what,
                  cells: [
                    p.where,
                    <span key="s" className="type-body-sm text-text-2">
                      {p.step}
                    </span>,
                  ],
                }))}
              />
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle>Spring launch</CardTitle>
                  <CardDescription>A card: the grey shell on step 2, the paper panel on step 3 inside it.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="type-body-sm text-text-2">12 posts from 7 brands</p>
                </CardContent>
                <CardFooter>
                  <CardMeta>Edited 2h ago</CardMeta>
                  <Button size="sm" variant="secondary">
                    Share board
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Group with space first; reach for a Card only around one thing a person acts on." },
            { kind: "do", text: <>Lift something no Glaze recipe covers (a drawn illustration&rsquo;s card) with the ladder&rsquo;s pair, <Mono>bg-surface-N shadow-surface-N</Mono>.</> },
            { kind: "dont", text: "Use any other shadow class; Glaze draws them as nothing." },
            { kind: "dont", text: "Put a card in a card, or a blur, a gradient or a glow on a surface." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
