// /system/radius: Glaze's radius scale (tokens.css), drawn as each shape it belongs to
import { Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";
import { cn } from "@/lib/glaze/utils";

const RADII = [
  { token: "rounded-pill", value: "999px", use: "Every one-line control: buttons, fields, selects, chips, the segmented control", shape: "h-(--control) w-32 rounded-pill" },
  { token: "rounded-shell", value: "14px", use: "A card's grey shell", shape: "h-20 w-32 rounded-shell" },
  { token: "rounded-panel", value: "11px", use: "The paper panel 3px inside the shell, so the corners stay concentric", shape: "h-20 w-32 rounded-panel" },
  { token: "rounded-overlay", value: "10px", use: "Boxes that hold lines of text: menus, popovers, dialogs, text areas, code blocks", shape: "h-20 w-32 rounded-overlay" },
  { token: "rounded-tag", value: "6px", use: "A box inside a row or an overlay: a menu item, a badge, a thumbnail, a key", shape: "h-8 w-20 rounded-tag" },
] as const;

export default function Radius() {
  return (
    <SheetBody>
      <SheetHeader title="Radius">
        Five corners, each tied to a kind of thing. A one-line control is a pill; a card is a 14px shell with an 11px
        panel inside it; anything that holds lines of text is 10px; a small box inside a row is 6px.
      </SheetHeader>

      <SheetSection title="Scale">
        <Sheet split>
          {() => (
            <ul className="grid gap-5">
              {RADII.map((r) => (
                <li key={r.token} className="flex items-center gap-4">
                  <span className="flex w-36 shrink-0 justify-center">
                    <span aria-hidden className={cn("block border border-line bg-paper", r.shape)} />
                  </span>
                  <span className="min-w-0">
                    <Mono>{r.token}</Mono> <span className="type-caption text-text-2">{r.value}</span>
                    <span className="block type-caption text-text-2">{r.use}</span>
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-4">
                <span className="flex w-36 shrink-0 justify-center">
                  <span aria-hidden className="block rounded-shell bg-shell p-(--shell-inset)">
                    <span className="block h-14 w-28 rounded-panel border border-line-faint bg-paper" />
                  </span>
                </span>
                <span className="min-w-0 type-caption text-text-2">
                  Shell and panel together: <Mono>--shell-inset</Mono> (3px) apart
                </span>
              </li>
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Let the component draw its own corner; pick a radius only for a box you build, by what it holds." },
            { kind: "dont", text: "Square off a one-line control, or round a Badge or a Textarea into a pill." },
            { kind: "dont", text: "Use Tailwind's rounded-sm to rounded-3xl; the five above are the whole set." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
