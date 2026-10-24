// /system/icons: the one Icon entry (src/components/glaze/icon.tsx) and every glyph registered in it,
// read from the module itself so a new glyph shows up here without an edit
import * as Glyphs from "@/components/glaze/icon";
import { Icon, type GlazeIcon } from "@/components/glaze/icon";
import { Example, Matrix, Mono, Rules, Sheet, SheetBody, SheetHeader, SheetSection } from "../SheetParts";

const GLYPHS = Object.entries(Glyphs)
  .filter(([name]) => name !== "Icon" && /^[A-Z]/.test(name))
  .map(([name, glyph]) => ({ name, glyph: glyph as GlazeIcon }))
  .sort((a, b) => a.name.localeCompare(b.name));

const SIZES = [12, 14, 16, 20, 24] as const;
const WEIGHTS = ["light", "regular", "bold", "fill"] as const;

export default function Icons() {
  return (
    <SheetBody>
      <SheetHeader title="Icons" importLine={`import {Icon, Bookmark} from '@/components/glaze/icon'`}>
        Phosphor at regular weight, imported only through Glaze&rsquo;s Icon. Every glyph the site uses is registered in
        icon.tsx under one name; to use another, add it there first. An icon without a label is decorative and hidden
        from screen readers.
      </SheetHeader>

      <SheetSection title="Sizes and weights" description="Regular in controls; light in dense rows and tables; bold rarely; fill only for an icon toggle that is on.">
        <Sheet>
          {() => (
            <Matrix
              columns={SIZES.map((s) => `${s}px`)}
              rows={WEIGHTS.map((w) => ({
                label: <Mono>{`weight="${w}"`}</Mono>,
                cells: SIZES.map((s) => <Icon key={s} icon={Glyphs.Bookmark} size={s} weight={w} />),
              }))}
            />
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title={`Glyphs (${GLYPHS.length})`} description="Glaze's own names first came with its components (Add, Close, ChevronDown); Curatit's glyphs keep the names the site used.">
        <Sheet>
          {() => (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {GLYPHS.map(({ name, glyph }) => (
                <li key={name} className="flex min-w-0 items-center gap-2">
                  <Icon icon={glyph} size={16} className="text-text-1" />
                  <span className="truncate type-caption text-text-2">{name}</span>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </SheetSection>

      <SheetSection title="Usage">
        <Example
          code={`<Button variant="secondary"><Icon icon={Bookmark}/>Save</Button>
<Button size="icon-sm" variant="ghost" aria-label="More for this board"><Icon icon={More}/></Button>
<Icon icon={SealCheck} size={16} label="Verified"/>`}
        />
      </SheetSection>

      <SheetSection title="Rules">
        <Rules
          items={[
            { kind: "do", text: "Put an icon before the words inside a control, at the control's size." },
            { kind: "do", text: "Name an icon that stands alone in a control with the control's aria-label, or pass label." },
            { kind: "dont", text: "Import from @phosphor-icons/react or another icon set in a screen." },
            { kind: "dont", text: "Put an icon in a tinted tile or circle beside a heading, or use an emoji as an icon." },
            { kind: "dont", text: "Add an icon to some tabs or menu rows and not others." },
          ]}
        />
      </SheetSection>
    </SheetBody>
  );
}
