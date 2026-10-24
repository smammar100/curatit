// /system/radius: the corner scale (glaze-bridge.css, Corners), drawn as the shapes it belongs to, and the nesting
// rule, outer corner less the gap, drawn as the pairs the site uses
import { Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";
import { cn } from "@/lib/glaze/utils";

const STEPS = [
  { token: "rounded-pill", value: "999px", use: "Every one-line control: buttons, fields, selects, chips, tabs, the segmented control", shape: "h-(--control) w-32 rounded-pill" },
  { token: "rounded-(--corner-m)", value: "24px", use: "M. What floats or holds a page's worth: menus, popovers, toasts, dialogs, the post's stage, big panels (rounded-(--radius-float))", shape: "h-24 w-36 rounded-(--corner-m)" },
  { token: "rounded-(--corner-s)", value: "16px", use: "S. Boxes of content: a card's panel, a post's tile, a text field, an alert, a code block (rounded-panel, rounded-overlay)", shape: "h-20 w-32 rounded-(--corner-s)" },
  { token: "rounded-(--corner-xs)", value: "12px", use: "XS. Row-sized boxes, about 32 to 56px: menu rows, list rows, thumbnails, a brand's tile", shape: "h-12 w-24 rounded-(--corner-xs)" },
  { token: "rounded-(--corner-2xs)", value: "6px", use: "2XS. The smallest parts, 24px or less: a checkbox, a key, a brand's mark, a swatch, a badge, a tooltip (rounded-tag)", shape: "h-6 w-14 rounded-(--corner-2xs)" },
] as const;

const NESTED = [
  { outer: "rounded-(--corner-m) p-3", inner: "h-8 w-28 rounded-(--corner-xs)", sum: "24 − 12 = 12", use: "A menu's row inside its 12px padding" },
  { outer: "rounded-(--corner-m) p-4", inner: "h-12 w-24 rounded-(--radius-nested)", sum: "24 − 16 = 8", use: "The post's image on its stage" },
  { outer: "rounded-(--corner-s) p-2", inner: "h-6 w-16 rounded-(--radius-nested)", sum: "16 − 8 = 8", use: "A label on a post's tile" },
  { outer: "rounded-shell bg-shell p-(--shell-inset)", inner: "h-12 w-28 rounded-panel", sum: "19 − 3 = 16", use: "A card: the grey shell and its panel" },
] as const;

export default function Radius() {
  return (
    <SheetBody>
      <SheetHeader title="Radius">
        The corner grows with the size of the thing, so everything keeps the same softness: a one-line control is a
        pill, and every box takes the step for its size. A corner inside another is the outer corner less the gap
        between them, so the two run parallel.
      </SheetHeader>

      <SheetSection title="Scale">
        <Sheet split>
          {() => (
            <ul className="grid gap-5">
              {STEPS.map((r) => (
                <li key={r.token} className="flex items-center gap-4">
                  <span className="flex w-40 shrink-0 justify-center">
                    <span aria-hidden className={cn("block border border-line bg-paper", r.shape)} />
                  </span>
                  <span className="min-w-0">
                    <Mono>{r.token}</Mono> <span className="type-caption text-text-2">{r.value}</span>
                    <span className="block type-caption text-text-2">{r.use}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Nested: outer less the gap">
        <Sheet split>
          {() => (
            <ul className="grid gap-5">
              {NESTED.map((n) => (
                <li key={n.sum} className="flex items-center gap-4">
                  <span className="flex w-40 shrink-0 justify-center">
                    <span aria-hidden className={cn("block border border-line bg-field", n.outer)}>
                      <span className={cn("block border border-line-faint bg-paper", n.inner)} />
                    </span>
                  </span>
                  <span className="min-w-0">
                    <Mono>{n.sum}</Mono>
                    <span className="block type-caption text-text-2">{n.use}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Pick a box's step by its size, and a box inside another by the outer corner less the gap." },
            { kind: "do", text: "Where the gap is as wide as the outer corner or wider, give the inner box its own step: it no longer reads as nested." },
            { kind: "do", text: "Let a component draw its own corner; choose one only for a box you build." },
            { kind: "dont", text: "Square off a one-line control, or round a Badge or a Textarea into a pill." },
            { kind: "dont", text: "Use Tailwind's rounded-sm to rounded-3xl or a pixel value; the steps above and the nested tokens are the whole set." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
