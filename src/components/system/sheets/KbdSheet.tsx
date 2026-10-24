// /system/kbd: Glaze's Kbd (src/components/glaze/ui/kbd). Rules from glaze-docs/kbd.md
import { Kbd, KbdGroup } from "@/components/glaze/ui/kbd";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const KEYS = [
  { keys: "/", use: "Focus the search" },
  { keys: "escape", use: "Close the post" },
  { keys: "j", use: "Next post in the review queue" },
  { keys: "mod+k", use: "A combination, written for the reader's platform" },
  { keys: "shift+enter", use: "A combination with a named key" },
];

export default function KbdSheet() {
  return (
    <SheetBody>
      <SheetHeader title="Kbd" importLine={`import {Kbd} from '@/components/glaze/ui/kbd'`}>
        Shows a key or a shortcut, one cap per key, written for the reader&rsquo;s platform: Command on a Mac, Ctrl
        elsewhere.
      </SheetHeader>

      <SheetSection title="Keys">
        <Sheet>
          {() => (
            <Matrix
              columns={["Specimen", "Use"]}
              rows={[
                ...KEYS.map((k) => ({
                  label: <Mono>{`keys="${k.keys}"`}</Mono>,
                  cells: [
                    <Kbd key="k" keys={k.keys} />,
                    <span key="u" className="type-body-sm text-text-2">
                      {k.use}
                    </span>,
                  ],
                })),
                {
                  label: <Mono>KbdGroup</Mono>,
                  cells: [
                    <KbdGroup key="g">
                      <Kbd>←</Kbd>
                      <Kbd>→</Kbd>
                    </KbdGroup>,
                    <span key="u" className="type-body-sm text-text-2">
                      Keys written by hand, 4px apart
                    </span>,
                  ],
                },
              ]}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="In a line" description="A hint sits inside a caption or a body line.">
        <Sheet split>
          {() => (
            <p className="type-body-sm text-text-2">
              Press <Kbd keys="/" /> to search the library, <Kbd keys="j" /> and <Kbd keys="k" /> to step through the
              queue.
            </p>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Example">
        <Example code={`<p>Press <Kbd keys="/"/> to search the library.</p>`} />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: <>Write a shortcut as <Mono>keys=&quot;mod+k&quot;</Mono>, never as a symbol typed by hand.</> },
            { kind: "do", text: "Put aria-keyshortcuts on the control the shortcut triggers." },
            { kind: "dont", text: "Use Kbd for an ID, a path or a value, or set a font, size or fill on it." },
            { kind: "dont", text: "Show more than three keys in a hint." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
